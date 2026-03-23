// fn-bulk-products/src/index.ts
import 'dotenv/config';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { S3Event, Context } from 'aws-lambda';

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { createGunzip } from 'zlib';

import { SHOP_SYNC_EVENT_TYPE, Sources, DetailTypes, publish } from '@repo/event-contracts';
import { logger, timer } from '@repo/logger';

import { INFRA_CONFIG, RUNTIME_CONFIG, PROCESSING_CONFIG } from './config/service.config';

const s3 = new S3Client({ region: INFRA_CONFIG.S3.REGION });

// boot probe (sanitize long values)
logger.info(
  {
    IS_LOCAL: RUNTIME_CONFIG.IS_LOCAL,
    IS_OFFLINE: RUNTIME_CONFIG.IS_OFFLINE,
    IS_AWS_SAM_LOCAL: RUNTIME_CONFIG.IS_AWS_SAM_LOCAL,
    DEBUG: RUNTIME_CONFIG.DEBUG ? 'on' : 'off',
  },
  '[boot] Environment',
);

logger.debug(
  {
    EVENT_BUS_NAME: INFRA_CONFIG.EVENT_BUS.NAME || '(unset)',
    PRODUCT_BUCKET: INFRA_CONFIG.S3.PRODUCT_BUCKET,
    LOCAL_FILE: PROCESSING_CONFIG.LOCAL_FILE || '(unset)',
  },
  '[boot] Config',
);

// Only require EVENT_BUS_NAME in non-local runs
if (!INFRA_CONFIG.EVENT_BUS.NAME && !RUNTIME_CONFIG.IS_LOCAL) {
  throw new Error('EVENT_BUS_NAME env var is required (non-local run)');
}

// ——— helpers ———
function looksLikeShopDomain(s?: string) {
  return !!s && /\.myshopify\.com$/i.test(s);
}

function requireDomain(domain: string | null | undefined) {
  if (!domain || !looksLikeShopDomain(domain)) {
    throw new Error(`Shop domain missing or invalid: "${domain ?? ''}"`);
  }
  return domain.toLowerCase();
}

async function resolveDomainFromS3(bucket: string, key: string): Promise<string> {
  logger.debug({ bucket, key }, '[s3] resolveDomainFromS3');
  const firstSeg = decodeURIComponent(key).split('/')[0];
  if (looksLikeShopDomain(firstSeg)) {
    logger.debug({ firstSeg }, '[s3] domain from key segment');
    return firstSeg.toLowerCase();
  }

  const t = timer();
  const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  t.done('s3.head_object', 'HeadObject completed');

  const md = head.Metadata || {};
  logger.debug(
    {
      ContentType: head.ContentType,
      ContentEncoding: head.ContentEncoding,
      meta: md,
    },
    '[s3] Head response',
  );

  const metaDomain = (md['shop-domain'] ||
    md['x-shopify-shop-domain'] ||
    md['shop'] ||
    '') as string;
  return requireDomain(metaDomain);
}

function resolveDomainFromLocal(relPathFromData: string): string {
  const seg = relPathFromData.split(path.sep)[0];
  logger.debug({ relPathFromData, seg }, '[local] resolve domain');
  return requireDomain(seg);
}

type SemiProduct = { product: any; images: any[]; variants: any[] };

function makeEnvelope(domain: string, topic: string, payload: any) {
  return {
    detail: {
      payload,
      metadata: {
        'X-Shopify-Shop-Domain': domain,
        'X-Shopify-Topic': topic,
      },
    },
  };
}

function classifyNode(
  node: any,
): 'Product' | 'ProductImage' | 'ProductVariant' | 'Aggregate' | null {
  if (node && typeof node === 'object') {
    if (node.product && (Array.isArray(node.images) || Array.isArray(node.variants))) {
      return 'Aggregate';
    }
    const t = (node.__typename || node.kind || node.type) as string | undefined;
    if (t === 'Product' || t === 'ProductImage' || t === 'ProductVariant') return t;

    const id = typeof node.id === 'string' ? node.id : '';
    if (id.includes('/ProductVariant/')) return 'ProductVariant';
    if (id.includes('/ProductImage/')) return 'ProductImage';
    if (id.includes('/Product/')) return 'Product';
  }
  return null;
}

function safeName(s: string) {
  return s.replace(/[^\w.\-]+/g, '__');
}

// ---------- EventBridge batching (lambda mode) ----------
const BATCH_MAX = PROCESSING_CONFIG.BATCH_MAX; // PutEvents supports max 10 entries per call

class EventBridgeBatcher {
  private entries: any[] = [];
  public totalPublished = 0;

  async push(payload: any) {
    if (this.entries.length >= BATCH_MAX) {
      await this.flush();
    }
    this.entries.push(payload);
  }

  async flush() {
    if (this.entries.length === 0) return;
    const toSend = this.entries;
    this.entries = [];

    // Send each entry individually using publish
    // (EventBridge PutEvents supports batching, but our publish helper sends one at a time)
    for (const payload of toSend) {
      await publish({
        source: Sources.SERVICE_BULK_PRODUCTS,
        detailType: DetailTypes.PRODUCT_BULK,
        detail: payload,
      });
    }

    this.totalPublished += toSend.length;
    logger.debug(
      { count: toSend.length, total: this.totalPublished },
      '[eventbridge] Batch published',
    );
  }
}

// Send to EventBridge in AWS; write ONE envelope JSON per input file when local
async function deliverEnvelope(
  envelope: any,
  source: { bucket?: string; key: string; domain: string },
) {
  logger.debug(
    {
      mode: RUNTIME_CONFIG.IS_LOCAL ? 'local' : 'eventbridge',
      key: source.key,
      domain: source.domain,
      productCount: Array.isArray(envelope?.data) ? envelope.data.length : -1,
    },
    '[deliver] deliverEnvelope',
  );

  if (RUNTIME_CONFIG.IS_LOCAL) {
    await fsp.mkdir(PROCESSING_CONFIG.LOCAL_OUTPUT_DIR, { recursive: true });
    const baseKey = source.key.replace(/(\.jsonl\.gz|\.jsonl)$/i, '');
    const fileName = `${safeName(source.domain)}__${safeName(baseKey)}.message.json`;
    const outPath = path.join(PROCESSING_CONFIG.LOCAL_OUTPUT_DIR, fileName);
    await fsp.writeFile(outPath, JSON.stringify(envelope, null, 2), 'utf8');
    logger.info({ outPath }, '[local] Envelope written');
    return;
  }

  // In lambda mode, publish to EventBridge
  const t = timer();
  await publish({
    source: Sources.SERVICE_EVENTS,
    detailType: DetailTypes.PRODUCT_BULK,
    detail: envelope,
  });
  t.done('eventbridge.publish', 'Envelope published');
}

async function deliverSingleProduct(
  domain: string,
  topic: string,
  node: SemiProduct,
  source: { bucket?: string; key: string; domain: string; forceEnrich?: boolean },
  batcher: EventBridgeBatcher,
) {
  const payload = {
    meta: {
      shop: domain,
      topic,
      forceEnrich: source.forceEnrich ?? false,
    },
    source,
    stats: { products: 1 },
    data: [node], // keep adapter shape the same
  };
  await batcher.push(payload);
}

// generic processor for a line-async-iterable
async function processLinesToEnvelope(
  getLines: () => AsyncIterable<string>,
  source: { bucket?: string; key: string; domain: string; forceEnrich?: boolean },
) {
  const t = timer();
  logger.debug({ source }, '[bulk] process file begin');

  let state: SemiProduct = { product: {}, images: [], variants: [] };
  const products: SemiProduct[] = []; // used only for local aggregate
  let countProducts = 0;

  // stats
  let totalLines = 0;
  let badJson = 0;
  let unknown = 0;
  let cProd = 0,
    cImg = 0,
    cVar = 0,
    cAgg = 0;

  const topic = 'products/bulk'; // your current topic
  const usePerProduct = !RUNTIME_CONFIG.IS_LOCAL; // lambda: per-product; local: aggregate
  const batcher = usePerProduct ? new EventBridgeBatcher() : null;

  const flush = async () => {
    if (!state.product || Object.keys(state.product).length === 0) return;
    const node = {
      product: state.product,
      images: state.images,
      variants: state.variants,
    };
    state = { product: {}, images: [], variants: [] };
    countProducts++;

    if (usePerProduct && batcher) {
      await deliverSingleProduct(source.domain, topic, node, source, batcher);
    } else {
      products.push(node);
    }
  };

  try {
    for await (const line of getLines()) {
      totalLines++;
      if (RUNTIME_CONFIG.DEBUG && totalLines % PROCESSING_CONFIG.PROGRESS_LOG_STEP === 0)
        logger.debug({ totalLines, countProducts }, '[bulk] progress');
      if (!line || !line.trim()) continue;

      let node: any;
      try {
        node = JSON.parse(line);
      } catch {
        badJson++;
        if (badJson <= 3)
          logger.warn(
            { event: 'bulk.invalid_json' },
            'Skipping invalid JSON line (showing first few only)',
          );
        continue;
      }

      const kind = classifyNode(node);

      if (kind === 'Aggregate') {
        cAgg++;
        await flush();
        const aggNode: SemiProduct = {
          product: node.product ?? {},
          images: Array.isArray(node.images) ? node.images : [],
          variants: Array.isArray(node.variants) ? node.variants : [],
        };
        countProducts++;
        if (usePerProduct && batcher) {
          await deliverSingleProduct(source.domain, topic, aggNode, source, batcher);
        } else {
          products.push(aggNode);
        }
        continue;
      }
      if (kind === 'Product') {
        cProd++;
        await flush();
        state.product = node;
        continue;
      }
      if (kind === 'ProductImage') {
        cImg++;
        state.images.push(node);
        continue;
      }
      if (kind === 'ProductVariant') {
        cVar++;
        state.variants.push(node);
        continue;
      }

      unknown++;
    }
  } catch (e) {
    logger.error(
      {
        event: 'bulk.failed',
        key: source.key,
        error: (e as Error).message,
        stack: (e as Error).stack,
      },
      '[bulk] read/iterate failed',
    );
    throw e;
  }
  await flush();

  logger.debug(
    {
      totalLines,
      badJson,
      unknown,
      kinds: { Product: cProd, Image: cImg, Variant: cVar, Aggregate: cAgg },
    },
    '[bulk] stats',
  );

  if (usePerProduct && batcher) {
    await batcher.flush();

    // Send SHOP_SYNC_COMPLETE via EventBridge
    const syncPayload = {
      type: SHOP_SYNC_EVENT_TYPE,
      meta: {
        shop: source.domain,
        topic: 'shop/sync-complete',
        completedAt: new Date().toISOString(),
      },
    };

    logger.info(
      {
        event: 'shop_sync.publishing',
        shopId: source.domain,
        data: {
          detailType: DetailTypes.SHOP_SYNC_COMPLETE,
        },
      },
      'Publishing SHOP_SYNC_COMPLETE to EventBridge',
    );

    await publish({
      source: Sources.SERVICE_BULK_PRODUCTS,
      detailType: DetailTypes.SHOP_SYNC_COMPLETE, // Separate routing - goes to products-bulk queue only
      detail: syncPayload,
    });

    logger.info(
      {
        event: 'shop_sync.complete',
        shopId: source.domain,
        data: {
          key: source.key,
          bucket: source.bucket,
          products: countProducts,
          published: batcher.totalPublished,
        },
      },
      'SHOP_SYNC_COMPLETE published successfully',
    );
  } else {
    const payload = {
      source,
      stats: {
        products: countProducts,
        lines: totalLines,
        badJson,
        unknown,
        counts: {
          Product: cProd,
          ProductImage: cImg,
          ProductVariant: cVar,
          Aggregate: cAgg,
        },
      },
      data: products,
    };
    const envelope = makeEnvelope(source.domain, topic, payload);
    await deliverEnvelope(envelope, source);
    logger.info(
      {
        event: 'bulk.completed_local',
        data: {
          products: countProducts,
          key: source.key,
        },
      },
      'Completed local processing',
    );
  }

  t.done('bulk.process_file', `Processed ${source.key}`);
}

// ——— S3 path ———
async function processS3Object(bucket: string, key: string) {
  logger.debug({ bucket, key }, '[s3] process object');
  const t = timer();
  const domain = await resolveDomainFromS3(bucket, key);

  // Detect forceEnrich flag from key name
  const forceEnrich = key.includes('-force');
  if (forceEnrich) {
    logger.info({ key }, '[s3] forceEnrich=true detected');
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const isGz = key.endsWith('.gz');
  logger.debug({ isGz }, '[s3] stream detected');

  const stream = isGz ? (obj.Body as any).pipe(createGunzip()) : (obj.Body as any);

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const getLines = async function* () {
    for await (const line of rl) yield line as string;
  };

  await processLinesToEnvelope(getLines, { bucket, key, domain, forceEnrich });
  t.done('s3.process_total', 'Total S3 object processing complete');
}

// ——— Local path ———
async function processLocalFile(absPath: string, relFromDataDir: string) {
  logger.debug({ absPath, relFromDataDir }, '[local] process file');
  const t = timer();
  const domain = resolveDomainFromLocal(relFromDataDir);
  const isGz = absPath.endsWith('.gz');
  logger.debug({ isGz }, '[local] isGz');

  const base = fs.createReadStream(absPath);
  const stream = isGz ? base.pipe(createGunzip()) : base;

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const getLines = async function* () {
    for await (const line of rl) yield line as string;
  };

  await processLinesToEnvelope(getLines, { key: relFromDataDir, domain });
  t.done('local.process_total', 'Total local file processing complete');
}

async function* walkDataFiles(dir: string): AsyncGenerator<string> {
  logger.debug({ dir }, '[walk] entering');
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      logger.debug({ full }, '[walk] dir');
      yield* walkDataFiles(full);
    } else if (e.isFile()) {
      if (e.name.endsWith('.jsonl') || e.name.endsWith('.jsonl.gz')) {
        logger.debug({ full }, '[walk] file');
        yield full;
      } else {
        logger.debug({ full }, '[walk] skip(non-jsonl)');
      }
    }
  }
}

function isLocalRun() {
  return RUNTIME_CONFIG.IS_LOCAL || RUNTIME_CONFIG.IS_OFFLINE || RUNTIME_CONFIG.IS_AWS_SAM_LOCAL;
}

// ——— handler ———
export const handler = async (event: Partial<S3Event> = {} as any, _ctx: Context) => {
  logger.info({ eventKeys: Object.keys(event || {}) }, '[handler] Invoked');

  const hasS3Records =
    Array.isArray((event as any).Records) &&
    (event as any).Records.some((r: any) => r?.s3?.object?.key);

  logger.debug({ hasS3Records }, '[handler] event type check');

  // Prefer local mode when flagged OR when no S3 event was provided
  if (!hasS3Records && isLocalRun()) {
    const root = path.resolve(PROCESSING_CONFIG.LOCAL_DATA_DIR);
    logger.info(
      { root, LOCAL_FILE: PROCESSING_CONFIG.LOCAL_FILE },
      '[handler] Starting local branch',
    );

    if (!fs.existsSync(root))
      throw new Error(`IS_LOCAL run but directory "${root}" does not exist`);

    let processed = 0;

    try {
      if (PROCESSING_CONFIG.LOCAL_FILE) {
        const abs = path.isAbsolute(PROCESSING_CONFIG.LOCAL_FILE)
          ? PROCESSING_CONFIG.LOCAL_FILE
          : path.join(root, PROCESSING_CONFIG.LOCAL_FILE);
        logger.info({ abs }, '[handler] single file mode');

        if (!fs.existsSync(abs)) throw new Error(`LOCAL_FILE not found: ${abs}`);
        const rel = path.relative(root, abs);
        await processLocalFile(abs, rel);
        processed++;
        return {
          ok: true,
          mode: 'local',
          processed,
          outputDir: PROCESSING_CONFIG.LOCAL_OUTPUT_DIR,
        };
      }

      for await (const absFile of walkDataFiles(root)) {
        const rel = path.relative(root, absFile);
        await processLocalFile(absFile, rel);
        processed++;
      }
      return {
        ok: true,
        mode: 'local',
        processed,
        outputDir: PROCESSING_CONFIG.LOCAL_OUTPUT_DIR,
      };
    } catch (e) {
      logger.error({ event: 'handler.local_failed', error: e }, 'Local handler failed');
      throw e;
    }
  }

  // S3 event path (prod/dev or local test with an S3 event fixture)
  try {
    const records = (event as S3Event).Records ?? [];
    logger.info(
      { recordsCount: records.length, bucket: INFRA_CONFIG.S3.PRODUCT_BUCKET },
      '[handler] Starting S3 branch',
    );

    for (const rec of records) {
      const evtBucket = rec.s3?.bucket?.name;
      const keyRaw = rec.s3?.object?.key;
      const bucket = evtBucket || INFRA_CONFIG.S3.PRODUCT_BUCKET;
      if (!bucket)
        throw new Error('S3 bucket missing (no event bucket and PRODUCT_BUCKET not set)');
      if (!keyRaw) throw new Error('S3 event missing object key');

      const key = decodeURIComponent(keyRaw.replace(/\+/g, ' '));
      await processS3Object(bucket, key);
    }
    return { ok: true, mode: 's3', processed: records.length };
  } catch (e) {
    logger.error({ event: 'handler.s3_failed', error: e }, 'S3 handler failed');
    throw e;
  }
};

// Avoid double-run when using `serverless invoke local`
if (RUNTIME_CONFIG.IS_LOCAL && !RUNTIME_CONFIG.IS_INVOKE_LOCAL) {
  (async () => {
    try {
      logger.info('IS_LOCAL=true — processing now…');
      const res = await handler({} as any, {} as any);
      logger.info({ result: res }, 'Autorun completed');
    } catch (err) {
      logger.error({ err }, 'Autorun failed');
    }
  })();
}
