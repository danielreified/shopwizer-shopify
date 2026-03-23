import { runAthenaQuery } from '../utils/athena';
import { prisma } from '../db/prisma';
import { batchProcess } from '../utils/batchProcess';
import { lastNDaysUTC } from '../utils/dates';
import { loadCheckpoint, shouldSkipWindow, saveCheckpoint } from '../utils/jobCheckpoint';
import { GlobalJobType } from '@prisma/client';
import { logger } from '@repo/logger';

import { resolveDailyWindow } from '../utils/jobWindow';
import { DATA_CONFIG } from '../config/service.config';

export async function handleFeatureValidateDailyJob() {
  logger.info('Validating 24h / 7d / 30d feature windows');

  const windows = [
    {
      job: GlobalJobType.FEATURE_VALIDATE_DAILY_24H,
      label: '24h',
      days: 1,
      fields: { views: 'views24h', clicks: 'clicks24h', carts: 'carts24h' },
    },
    {
      job: GlobalJobType.FEATURE_VALIDATE_DAILY_7D,
      label: '7d',
      days: 7,
      fields: { views: 'views7d', clicks: 'clicks7d', carts: 'carts7d' },
    },
    {
      job: GlobalJobType.FEATURE_VALIDATE_DAILY_30D,
      label: '30d',
      days: 30,
      fields: { views: 'views30d', clicks: 'clicks30d', carts: 'carts30d' },
    },
  ];

  for (const w of windows) {
    // --------------------------------------------------------------------
    // 1. Resolve processing window
    // --------------------------------------------------------------------
    const checkpoint = await loadCheckpoint(w.job);
    const { startDay, endDay } = resolveDailyWindow(checkpoint);

    logger.info(
      {
        window: w.label,
        startDay: startDay.toISOString(),
        endDay: endDay.toISOString(),
      },
      'Processing feature validation window',
    );

    // --------------------------------------------------------------------
    // 2. Double-run guard
    // --------------------------------------------------------------------
    if (shouldSkipWindow(checkpoint, startDay)) {
      continue;
    }

    // --------------------------------------------------------------------
    // 3. Build Athena query
    // --------------------------------------------------------------------
    const days = lastNDaysUTC(w.days);
    const dayClauses = days
      .map(({ y, m, d }) => `(year='${y}' AND month='${m}' AND day='${d}')`)
      .join(' OR ');

    const query = `
      SELECT
        shop,
        pid AS productid,
        COALESCE(COUNT_IF(event='view_prod'), 0)   AS views,
        COALESCE(COUNT_IF(event='reco_click'), 0)  AS clicks,
        COALESCE(COUNT_IF(event='add_cart'), 0)    AS carts
      FROM px_events
      WHERE (${dayClauses})
        AND event IN ('view_prod','reco_click','add_cart')
      GROUP BY 1,2;
    `;

    const rows = await runAthenaQuery<{
      shop: string;
      productid: string;
      views: number | null;
      clicks: number | null;
      carts: number | null;
    }>(query);

    if (rows.length === 0) {
      logger.info({ window: w.label }, 'No activity for window');
      await saveCheckpoint(w.job, startDay, endDay);
      continue;
    }

    // --------------------------------------------------------------------
    // 4. Batch upsert into productFeature
    // --------------------------------------------------------------------
    const { updated: inserted, skipped } = await batchProcess(
      rows,
      DATA_CONFIG.BATCH_SIZE,
      async (row) => {
        const productId = row.productid && row.productid !== 'null' ? BigInt(row.productid) : null;

        if (!productId) {
          throw Object.assign(new Error('null productId'), { code: 'P2025' });
        }

        const views = Number(row.views ?? 0);
        const clicks = Number(row.clicks ?? 0);
        const carts = Number(row.carts ?? 0);

        await prisma.productFeature.upsert({
          where: {
            productId,
          },
          update: {
            [w.fields.views]: views,
            [w.fields.clicks]: clicks,
            [w.fields.carts]: carts,
            updatedAt: new Date(),
          },
          create: {
            shopId: row.shop,
            productId,
            [w.fields.views]: views,
            [w.fields.clicks]: clicks,
            [w.fields.carts]: carts,
            updatedAt: new Date(),
          },
        });
      },
    );

    // --------------------------------------------------------------------
    // 5. Summary
    // --------------------------------------------------------------------
    logger.info({ window: w.label, inserted, skipped }, 'Feature window refreshed');

    // --------------------------------------------------------------------
    // 6. Save checkpoint
    // --------------------------------------------------------------------
    await saveCheckpoint(w.job, startDay, endDay);
  }

  logger.info('Daily Feature Validation Complete');
}
