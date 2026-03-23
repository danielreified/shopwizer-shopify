// -----------------------------------------------------------------------------
//  feature.daily-snapshot.sqs.ts
//  Generates daily ProductFeature snapshots → Parquet → S3
// -----------------------------------------------------------------------------

import { prisma } from '../db/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeParquet } from '../utils/parquet';
import { tableFromJSON } from 'apache-arrow';
import { getUtcDateParts } from '../utils/dates';
import { logger } from '@repo/logger';

const s3 = new S3Client({});
const SNAPSHOT_BUCKET =
  process.env.FEATURE_SNAPSHOT_BUCKET || 'dev-ue1-shopwizer-feature-snapshots';

// -----------------------------------------------------------------------------
// Load ProductFeature rows
// -----------------------------------------------------------------------------
async function loadFeatures(shopId: string) {
  return prisma.productFeature.findMany({
    where: { shopId },
    select: {
      id: true,
      shopId: true,
      productId: true,
      views24h: true,
      views7d: true,
      views30d: true,
      clicks24h: true,
      clicks7d: true,
      clicks30d: true,
      orders7d: true,
      orders30d: true,
      revenue7d: true,
      revenue30d: true,
      bestSellerScore: true,
      trendingScore: true,
      carts24h: true,
      carts7d: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// -----------------------------------------------------------------------------
// Convert rows → Arrow → Parquet
// -----------------------------------------------------------------------------
async function toParquetBuffer(rows: any[]) {
  const table = tableFromJSON(rows);
  return await writeParquet(table); // <-- FIXED
}

// -----------------------------------------------------------------------------
// Main Handler
// -----------------------------------------------------------------------------
export const handler = async (event: any) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    const shopId: string = body.shopId;
    if (!shopId) {
      logger.error('Missing shopId in message');
      continue;
    }

    logger.info({ shopId }, 'Generating daily snapshot');

    const rows = await loadFeatures(shopId);
    if (rows.length === 0) {
      logger.warn({ shopId }, 'No feature rows, skipping');
      continue;
    }

    const parquetBuffer = await toParquetBuffer(rows);

    const { year, month, day } = getUtcDateParts(new Date());

    const key = `parquet/year=${year}/month=${month}/day=${day}/shop=${shopId}/snapshot.parquet`;

    logger.info({ bucket: SNAPSHOT_BUCKET, key }, 'Uploading Parquet snapshot');

    await s3.send(
      new PutObjectCommand({
        Bucket: SNAPSHOT_BUCKET,
        Key: key,
        Body: parquetBuffer,
        ContentType: 'application/octet-stream',
      }),
    );

    logger.info({ shopId }, 'Snapshot uploaded successfully');
  }
};
