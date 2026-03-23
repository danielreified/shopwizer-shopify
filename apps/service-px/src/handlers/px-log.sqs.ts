import {
  S3Client,
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { gunzipSync } from 'zlib';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { prisma } from '../db/prisma';
import * as parquet from 'parquets';
import LZStringModule from 'lz-string';
import { logger, timer } from '@repo/logger';

import { INFRA_CONFIG, LOG_PROCESSING_CONFIG, DEBUG_CONFIG } from '../config/service.config';

// Handle both ESM and CJS module formats
const LZString = (LZStringModule as any).default ?? LZStringModule;

const REGION = INFRA_CONFIG.AWS_REGION;
const PROCESSED_BUCKET = INFRA_CONFIG.S3.PROCESSED_BUCKET;
const ARCHIVE_BUCKET = INFRA_CONFIG.S3.ARCHIVE_BUCKET;
const MAX_BATCH = LOG_PROCESSING_CONFIG.MAX_PARQUET_BATCH;
const DEBUG = DEBUG_CONFIG.IS_DEBUG;
const CHUNK_SIZE = LOG_PROCESSING_CONFIG.CHUNK_SIZE;
const BATCH_SIZE_DB = LOG_PROCESSING_CONFIG.BATCH_SIZE_DB;

const s3 = new S3Client({ region: REGION });

interface CloudFrontRecord {
  date: string;
  time: string;
  method: string;
  query?: Record<string, string>;
}

export async function handlePxLogEvent({ bucket, key }: { bucket: string; key: string }) {
  const t = timer();

  try {
    // ------------------------------------------------------------
    // Step 1: Download + decompress CloudFront log
    // ------------------------------------------------------------
    const obj: GetObjectCommandOutput = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    const buffer = await streamToBuffer(obj.Body as Readable);
    logger.debug({ bytes: buffer.length }, 'Downloaded raw log');

    if (buffer.length < LOG_PROCESSING_CONFIG.MIN_LOG_SIZE_BYTES) {
      logger.warn({ bytes: buffer.length }, 'File too small, skipping');
      return;
    }

    const decompressed = gunzipSync(buffer).toString('utf-8');
    const lines = decompressed.split('\n').filter(Boolean);
    logger.debug({ lineCount: lines.length }, 'Decompressed log');

    // ------------------------------------------------------------
    // Step 2: Parse & validate log lines
    // ------------------------------------------------------------
    const parsedRecords: CloudFrontRecord[] = [];
    const badRows: any[] | null = DEBUG ? [] : null;

    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      const slice = lines.slice(i, i + CHUNK_SIZE);
      for (const line of slice) {
        const rec = parseCloudFrontLog(line);
        if (!rec) continue;
        if (rec.method !== 'GET' || !Object.keys(rec.query || {}).length) continue;

        if (!rec.query?.e || !rec.query?.shop) {
          if (badRows) badRows.push({ line, reason: 'missing e/shop' });
          continue;
        }

        parsedRecords.push(rec);
      }
    }

    if (parsedRecords.length === 0) {
      logger.warn('No valid GET+query records found, skipping file');
      return;
    }

    if (parsedRecords.length > LOG_PROCESSING_CONFIG.MAX_RECORDS_PER_LOG) {
      logger.warn({ count: parsedRecords.length }, 'Too many records, trimming');
      parsedRecords.length = LOG_PROCESSING_CONFIG.MAX_RECORDS_PER_LOG;
    }

    logger.info({ recordCount: parsedRecords.length }, 'Parsed records');

    // ------------------------------------------------------------
    // Step 3: Aggregate 30-min analytics for quick stats
    // ------------------------------------------------------------
    const analyticsMap = new Map<
      string,
      { shop: string; event: string; startTime: number; count: number }
    >();

    for (const rec of parsedRecords) {
      // Use original domain format for Prisma (to join with Shop table)
      const shop = normalizeShop(rec.query?.shop) ?? 'unknown';
      const event = rec.query?.e ?? 'unknown';
      const ts = new Date(`${rec.date}T${rec.time}Z`).getTime();

      const bucketStart =
        Math.floor(ts / LOG_PROCESSING_CONFIG.ANALYTICS.WINDOW_MS) *
        LOG_PROCESSING_CONFIG.ANALYTICS.WINDOW_MS;
      const keyAgg = `${shop}|${event}|${bucketStart}`;

      if (!analyticsMap.has(keyAgg)) {
        analyticsMap.set(keyAgg, {
          shop,
          event,
          startTime: bucketStart,
          count: 0,
        });
      }
      analyticsMap.get(keyAgg)!.count++;
    }

    logger.debug({ windowCount: analyticsMap.size }, 'Aggregated analytics windows');

    const analyticsArray = Array.from(analyticsMap.values());
    await batchSettled(analyticsArray, (a) =>
      prisma.pxAnalytics.upsert({
        where: {
          shop_event_window: {
            shop: a.shop,
            event: a.event,
            window: new Date(a.startTime),
          },
        },
        update: { count: { increment: a.count } },
        create: {
          shop: a.shop,
          event: a.event,
          window: new Date(a.startTime),
          count: a.count,
        },
      }),
    );

    logger.debug('Prisma analytics aggregation persisted');

    // ------------------------------------------------------------
    // Step 3.5: Bundle & Feature Aggregation (Real-Time)
    // ------------------------------------------------------------
    const bundleAggMap = new Map<string, { views: number; clicks: number }>();
    const featureAggMap = new Map<string, { shopId: string; views: number; clicks: number }>();

    for (const rec of parsedRecords) {
      const event = rec.query?.e;
      const rail = rec.query?.rail;
      const slateId = rec.query?.slate_id;
      const shop = normalizeShop(rec.query?.shop);

      // Only process bundle events (reco_view, reco_click with rail=bundles and cb: prefix)
      if (!shop || rail !== 'bundles' || !slateId?.startsWith('cb:')) continue;

      const bundleId = extractBundleId(slateId);
      if (!bundleId) continue;

      // Initialize bundle aggregation
      if (!bundleAggMap.has(bundleId)) {
        bundleAggMap.set(bundleId, { views: 0, clicks: 0 });
      }

      const bundleAgg = bundleAggMap.get(bundleId)!;
      if (event === 'reco_view') {
        bundleAgg.views++;
      } else if (event === 'reco_click') {
        bundleAgg.clicks++;

        // For clicks, also credit all products in the bundle globally
        const clickedPid = rec.query?.pid;
        if (clickedPid) {
          const featureKey = `${shop}|${clickedPid}`;
          if (!featureAggMap.has(featureKey)) {
            featureAggMap.set(featureKey, { shopId: shop, views: 0, clicks: 0 });
          }
          featureAggMap.get(featureKey)!.clicks++;
        }
      }
    }

    logger.debug(
      { bundleCount: bundleAggMap.size, featureCount: featureAggMap.size },
      'Aggregated bundle/feature metrics',
    );

    // Batch update ComputedBundle
    const bundleUpdates = Array.from(bundleAggMap.entries());
    await batchSettled(bundleUpdates, ([bundleId, agg]) =>
      prisma.computedBundle
        .update({
          where: { id: bundleId },
          data: {
            views24h: { increment: agg.views },
            clicks24h: { increment: agg.clicks },
          },
        })
        .catch((err: any) => {
          // Bundle might have been archived/deleted
          if (err.code !== 'P2025') {
            logger.warn({ bundleId, err: err.message }, 'Failed to update ComputedBundle');
          }
        }),
    );

    // Batch update ProductFeature (global clicks)
    const featureUpdates = Array.from(featureAggMap.entries());
    await batchSettled(featureUpdates, ([key, agg]) => {
      const [shopId, productIdStr] = key.split('|');
      const productId = BigInt(productIdStr);
      return prisma.productFeature
        .upsert({
          where: { productId },
          update: {
            clicks24h: { increment: agg.clicks },
            clicks7d: { increment: agg.clicks },
            clicks30d: { increment: agg.clicks },
          },
          create: {
            shopId,
            productId,
            clicks24h: agg.clicks,
            clicks7d: agg.clicks,
            clicks30d: agg.clicks,
          },
        })
        .catch((err: any) => {
          // Product might not exist (FK constraint)
          if (err.code !== 'P2003') {
            logger.warn(
              { productId: productIdStr, err: err.message },
              'Failed to update ProductFeature',
            );
          }
        });
    });

    logger.debug('Bundle and feature metrics persisted');

    // ------------------------------------------------------------
    // Step 4: Group by partition keys (year/month/day/hour/shop/event)
    // ------------------------------------------------------------
    const groups = new Map<string, CloudFrontRecord[]>();
    let missingShop = 0;

    for (const rec of parsedRecords) {
      const ts = new Date(`${rec.date}T${rec.time}Z`);
      const { year, month, day, hour } = formatDatePartition(ts);
      const shop = normalizeShop(rec.query?.shop);
      const event = rec.query?.e ?? 'unknown';

      if (!shop) missingShop++;

      // Use pipe delimiter to handle shop domains with hyphens (e.g., dev-recommender.myshopify.com)
      const keyStr = `${year}|${month}|${day}|${hour}|${shop ?? 'unknown'}|${event}`;
      if (!groups.has(keyStr)) groups.set(keyStr, []);
      groups.get(keyStr)!.push(rec);
    }

    logger.debug({ groupCount: groups.size, missingShop }, 'Grouped into buckets');

    // ------------------------------------------------------------
    // Step 5: Define clean Parquet schema
    // Note: 'event' is NOT included here - it's a partition column derived from S3 path
    // ------------------------------------------------------------
    const schema = new parquet.ParquetSchema({
      ts: { type: 'TIMESTAMP_MILLIS' },
      shop: { type: 'UTF8' },
      sid: { type: 'UTF8', optional: true },
      pid: { type: 'UTF8', optional: true },
      vid: { type: 'UTF8', optional: true },
      plc: { type: 'UTF8', optional: true },
      rail: { type: 'UTF8', optional: true },
      src_pid: { type: 'UTF8', optional: true },
      // Training fields (only for reco_click)
      slate_id: { type: 'UTF8', optional: true },
      p: { type: 'UTF8', optional: true }, // decompressed items payload JSON
      ps: { type: 'UTF8', optional: true }, // decompressed source payload JSON
    });

    // ------------------------------------------------------------
    // Step 6: Write + upload Parquet
    // ------------------------------------------------------------
    for (const [keyStr, recs] of groups) {
      const [year, month, day, hour, shop, eventType] = keyStr.split('|');
      let partIndex = 0;

      for (let i = 0; i < recs.length; i += MAX_BATCH) {
        const chunk = recs.slice(i, i + MAX_BATCH);
        partIndex++;

        const tsFile = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 13);
        const rand = Math.random().toString(36).slice(2, 6);
        const parquetPath = `/tmp/px-${tsFile}-${rand}-${String(partIndex).padStart(
          3,
          '0',
        )}.parquet`;

        const writer = await parquet.ParquetWriter.openFile(schema, parquetPath);

        for (const rec of chunk) {
          const row = normalizeEventRow(rec.query ?? {}, rec.date, rec.time);
          await writer.appendRow(row);
        }

        await writer.close();

        const safeEvent = eventType.replace(/[^\w\-.]/g, '_');
        const parquetKey = `parquet/year=${year}/month=${month}/day=${day}/hour=${hour}/event=${safeEvent}/px-${tsFile}-${String(
          partIndex,
        ).padStart(3, '0')}.parquet`;

        const parquetFile = await fs.readFile(parquetPath);

        await s3.send(
          new PutObjectCommand({
            Bucket: PROCESSED_BUCKET,
            Key: parquetKey,
            Body: parquetFile,
            ContentType: 'application/octet-stream',
          }),
        );

        logger.debug(
          { partIndex, rowCount: chunk.length, key: parquetKey },
          'Uploaded parquet batch',
        );

        try {
          await fs.unlink(parquetPath);
        } catch {}
      }
    }

    // ------------------------------------------------------------
    // Step 7: Archive original log
    // ------------------------------------------------------------
    const firstRec = parsedRecords[0];
    const ts = new Date(`${firstRec.date}T${firstRec.time}Z`);
    const { year, month, day } = formatDatePartition(ts);
    const archiveKey = `year=${year}/month=${month}/day=${day}/${key.split('/').pop()}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: ARCHIVE_BUCKET,
        CopySource: `${bucket}/${key}`,
        Key: archiveKey,
      }),
    );
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    logger.debug({ archiveKey }, 'Archived raw log');

    if (badRows?.length) {
      const badKey = `debug/bad/${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
      await s3.send(
        new PutObjectCommand({
          Bucket: PROCESSED_BUCKET,
          Key: badKey,
          Body: JSON.stringify(badRows.slice(0, 100), null, 2),
        }),
      );
      logger.debug({ badRowCount: badRows.length, badKey }, 'Uploaded bad rows');
    }

    t.done('px.log_processed', 'Pixel log processed', {
      data: { bucket, key, recordCount: parsedRecords.length },
    });
  } catch (err: any) {
    logger.error({ key, err: err.message }, 'Failed to process log');
  }
}

// -------------------------------
// Helpers
// -------------------------------
function formatDatePartition(ts: Date) {
  return {
    year: ts.getUTCFullYear(),
    month: String(ts.getUTCMonth() + 1).padStart(2, '0'),
    day: String(ts.getUTCDate()).padStart(2, '0'),
    hour: String(ts.getUTCHours()).padStart(2, '0'),
  };
}

function decompressLz(encoded: string, field: string): string | null {
  try {
    const decoded = decodeURIComponent(encoded);
    return LZString.decompressFromEncodedURIComponent(decoded);
  } catch (e) {
    logger.warn({ err: e }, `Failed to decompress ${field}`);
    return null;
  }
}

async function batchSettled<T>(items: T[], fn: (item: T) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE_DB) {
    const slice = items.slice(i, i + BATCH_SIZE_DB);
    await Promise.allSettled(slice.map(fn));
  }
}

function normalizeEventRow(query: Record<string, string>, date: string, time: string) {
  // Note: 'event' is NOT included in the output - it's derived from S3 partition path
  const eventType = query?.e ?? 'unknown';

  const base = {
    ts: new Date(`${date}T${time}Z`).getTime(),
    shop: query?.shop ?? 'unknown',
    sid: query?.sid ?? null,
  };

  switch (eventType) {
    case 'view_prod':
    case 'add_cart':
      return {
        ...base,
        pid: query?.pid ?? null,
        vid: query?.vid ?? null,
        plc: null,
        rail: null,
        src_pid: query?.src_pid ?? null,
        slate_id: null,
        p: null,
        ps: null,
      };
    case 'reco_load':
    case 'reco_view':
      return {
        ...base,
        pid: null,
        vid: null,
        plc: query?.plc ?? null,
        rail: query?.rail ?? null,
        src_pid: query?.src_pid ?? null,
        slate_id: query?.slate_id ?? null,
        p: null,
        ps: null,
      };
    case 'reco_click':
      const decompressedP = query?.p ? decompressLz(query.p, 'p') : null;
      const decompressedPs = query?.ps ? decompressLz(query.ps, 'ps') : null;

      return {
        ...base,
        pid: query?.pid ?? null,
        vid: query?.vid ?? null,
        plc: query?.plc ?? null,
        rail: query?.rail ?? null,
        src_pid: query?.src_pid ?? null,
        slate_id: query?.slate_id ?? null,
        p: decompressedP,
        ps: decompressedPs,
      };
    default:
      return {
        ...base,
        pid: null,
        vid: null,
        plc: null,
        rail: null,
        src_pid: null,
        slate_id: null,
        p: null,
        ps: null,
      };
  }
}

function parseCloudFrontLog(line: string): CloudFrontRecord | null {
  if (line.startsWith('#')) return null;
  const parts = line.trim().split(/\s+/);
  if (parts.length < 12) return null;
  const query = parts[11] && parts[11] !== '-' ? parseQuery(parts[11]) : {};
  return {
    date: parts[0],
    time: parts[1],
    method: parts[5],
    query,
  };
}

function parseQuery(raw: string): Record<string, string> {
  try {
    const q = new URLSearchParams(raw);
    const obj: Record<string, string> = {};
    for (const [k, v] of q.entries()) obj[k] = v;
    return obj;
  } catch {
    logger.warn({ raw }, 'Failed to parse query');
    return {};
  }
}

/**
 * Normalize shop domain - preserves dots and dashes (for Prisma/database joins)
 * e.g., "dev-recommender.myshopify.com" stays as "dev-recommender.myshopify.com"
 */
function normalizeShop(shop?: string | null) {
  if (!shop) return null;
  shop = shop.replace(/^https?:\/\//, '');
  shop = shop.split(/[/?#]/)[0];
  return shop;
}

/**
 * Extract bundleId from slate_id format: "cb:BUNDLE_ID:RANDOM"
 */
function extractBundleId(slateId: string): string | null {
  const parts = slateId.split(':');
  if (parts.length >= 2 && parts[0] === 'cb') {
    return parts[1];
  }
  return null;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}
