import { runAthenaQuery } from '../utils/athena';
import { prisma } from '../db/prisma';
import { batchProcess } from '../utils/batchProcess';
import { loadCheckpoint, saveCheckpoint } from '../utils/jobCheckpoint';
import { logger } from '@repo/logger';

import { getPendingHourlyWindows } from '../utils/jobWindow';
import { toPartitionStrings } from '../utils/dates';
import { mapRail } from '../utils/mapRail';
import { RecommendationRail, GlobalJobType } from '@prisma/client';
import { DATA_CONFIG } from '../config/service.config';

export async function handleRailHourlyMetricsJob() {
  // -------------------------------------------------------------
  // 1. Get all pending hourly windows to process (catch-up mode)
  // -------------------------------------------------------------
  const checkpoint = await loadCheckpoint(GlobalJobType.RAIL_HOURLY);
  const pendingWindows = getPendingHourlyWindows(checkpoint);

  logger.info(
    {
      windowCount: pendingWindows.length,
      firstWindow: pendingWindows[0]?.startHour.toISOString(),
      lastWindow: pendingWindows[pendingWindows.length - 1]?.startHour.toISOString(),
    },
    'RAIL_HOURLY pending windows resolved',
  );

  // -------------------------------------------------------------
  // 2. Process each pending hour sequentially
  // -------------------------------------------------------------
  for (const { startHour, endHour } of pendingWindows) {
    await processHour(startHour, endHour);
  }

  logger.info({ processedCount: pendingWindows.length }, 'RAIL_HOURLY catch-up complete');
}

async function processHour(startHour: Date, endHour: Date) {
  logger.info(
    {
      startHour: startHour.toISOString(),
      endHour: endHour.toISOString(),
    },
    'Processing RAIL_HOURLY window',
  );

  // Partition values (zero-padded strings for Hive partitions)
  const { year, month, day, hour } = toPartitionStrings(startHour);

  // Query Athena - aggregate by shop + rail
  const query = `
    SELECT
      shop,
      rail,
      COALESCE(COUNT_IF(event='reco_view'), 0) AS impressions,
      COALESCE(COUNT_IF(event='reco_click'), 0) AS clicks
    FROM px_events
    WHERE year='${year}'
      AND month='${month}'
      AND day='${day}'
      AND hour='${hour}'
      AND event IN ('reco_view','reco_click')
      AND rail IS NOT NULL
    GROUP BY 1, 2
  `;

  const rows = await runAthenaQuery<{
    shop: string;
    rail: string;
    impressions: number;
    clicks: number;
  }>(query);

  if (rows.length === 0) {
    logger.info({ hour: startHour.toISOString() }, 'No rail events for this hour');
  } else {
    logger.info(
      { rowCount: rows.length, hour: startHour.toISOString() },
      'Processing rail metrics',
    );

    const { updated, skipped } = await batchProcess(rows, DATA_CONFIG.BATCH_SIZE, async (row) => {
      const shopId = row.shop;

      const rail: RecommendationRail | null = mapRail(row.rail);
      if (!rail) {
        throw Object.assign(new Error('unmapped rail'), { code: 'P2025' });
      }

      const newImp = Number(row.impressions ?? 0);
      const newClicks = Number(row.clicks ?? 0);

      await prisma.railMetric.upsert({
        where: { shopId_rail_hour: { shopId, rail, hour: startHour } },
        update: {
          impressions: { increment: newImp },
          clicks: { increment: newClicks },
        },
        create: {
          shopId,
          rail,
          hour: startHour,
          impressions: newImp,
          clicks: newClicks,
        },
      });
    });

    logger.info({ updated, skipped }, 'Rail hourly metrics refreshed');
  }

  // Save checkpoint after EACH hour (so we don't re-process if interrupted)
  await saveCheckpoint(GlobalJobType.RAIL_HOURLY, startHour, endHour);

  logger.info(
    {
      startHour: startHour.toISOString(),
      endHour: endHour.toISOString(),
    },
    'RAIL_HOURLY checkpoint saved',
  );
}
