import { runAthenaQuery } from '../utils/athena';
import { prisma } from '../db/prisma';
import { batchProcess } from '../utils/batchProcess';
import { loadCheckpoint, shouldSkipWindow, saveCheckpoint } from '../utils/jobCheckpoint';
import { GlobalJobType } from '@prisma/client';
import { logger } from '@repo/logger';
import { resolveHourlyWindow } from '../utils/jobWindow';
import { toPartitionStrings } from '../utils/dates';
import { DATA_CONFIG } from '../config/service.config';

export async function handleFeatureHourlyJob() {
  const now = new Date();

  // -------------------------------------------------------------
  // 1. Load checkpoint + resolve proper window
  // -------------------------------------------------------------
  const checkpoint = await loadCheckpoint(GlobalJobType.FEATURE_HOURLY);
  const { startHour, endHour } = resolveHourlyWindow(checkpoint);

  logger.info(
    {
      startHour: startHour.toISOString(),
      endHour: endHour.toISOString(),
    },
    'FEATURE_HOURLY window resolved',
  );

  // -------------------------------------------------------------
  // 2. Double-run guard
  // -------------------------------------------------------------
  if (shouldSkipWindow(checkpoint, startHour)) {
    return;
  }

  // -------------------------------------------------------------
  // Partition values (zero-padded strings for Hive partitions)
  // -------------------------------------------------------------
  const { year, month, day, hour } = toPartitionStrings(startHour);

  // -------------------------------------------------------------
  // 3. Athena Query
  // -------------------------------------------------------------
  const query = `
    SELECT
      shop,
      pid AS productId,
      COALESCE(COUNT_IF(event='view_prod'), 0)   AS views,
      COALESCE(COUNT_IF(event='reco_click'), 0)  AS clicks,
      COALESCE(COUNT_IF(event='add_cart'), 0)    AS carts
    FROM px_events
    WHERE year='${year}'
      AND month='${month}'
      AND day='${day}'
      AND hour='${hour}'
      AND event IN ('view_prod','reco_click','add_cart')
      AND pid IS NOT NULL
    GROUP BY 1, 2
  `;

  const rows = await runAthenaQuery<{
    shop: string;
    productId: string;
    views: number;
    clicks: number;
    carts: number;
  }>(query);

  if (rows.length === 0) {
    logger.info('No pixel activity for this hour');
  } else {
    logger.info({ rowCount: rows.length }, 'Processing feature metrics');

    // -------------------------------------------------------------
    // 4. Batch update DB (SAFE, NEVER FAILS)
    // -------------------------------------------------------------
    const { updated, skipped } = await batchProcess(rows, DATA_CONFIG.BATCH_SIZE, async (row) => {
      const shopId = row.shop;
      const productId = BigInt(row.productId);

      const newViews = Number(row.views);
      const newClicks = Number(row.clicks);
      const newCarts = Number(row.carts);

      const existing = await prisma.productFeature.findUnique({
        where: { productId },
        select: {
          views24h: true,
          clicks24h: true,
          carts24h: true,
          views7d: true,
          clicks7d: true,
          carts7d: true,
          views30d: true,
          clicks30d: true,
          carts30d: true,
        },
      });

      await prisma.productFeature.upsert({
        where: { productId },
        update: {
          // 24h
          views24h: (existing?.views24h ?? 0) + newViews,
          clicks24h: (existing?.clicks24h ?? 0) + newClicks,
          carts24h: (existing?.carts24h ?? 0) + newCarts,

          // 7d
          views7d: (existing?.views7d ?? 0) + newViews,
          clicks7d: (existing?.clicks7d ?? 0) + newClicks,
          carts7d: (existing?.carts7d ?? 0) + newCarts,

          // 30d
          views30d: (existing?.views30d ?? 0) + newViews,
          clicks30d: (existing?.clicks30d ?? 0) + newClicks,
          carts30d: (existing?.carts30d ?? 0) + newCarts,

          updatedAt: new Date(),
        },
        create: {
          shopId,
          productId,

          views24h: newViews,
          clicks24h: newClicks,
          carts24h: newCarts,

          views7d: newViews,
          clicks7d: newClicks,
          carts7d: newCarts,

          views30d: newViews,
          clicks30d: newClicks,
          carts30d: newCarts,

          updatedAt: new Date(),
        },
      });
    });

    logger.info({ updated, skipped }, 'Feature hourly metrics refreshed');
  }

  // -------------------------------------------------------------
  // 5. Save checkpoint AFTER SUCCESSFUL LOOP
  // -------------------------------------------------------------
  await saveCheckpoint(GlobalJobType.FEATURE_HOURLY, startHour, endHour);

  logger.info(
    {
      startHour: startHour.toISOString(),
      endHour: endHour.toISOString(),
    },
    'FEATURE_HOURLY checkpoint saved',
  );
}
