/**
 * 🧠 GRAPH_WEIGHTS_DAILY
 *
 * Updates ProductGraph and CategoryGraph based on:
 * 1. Bundle CTR data from Athena (px_events)
 * 2. Order co-purchase data from Postgres (OrderLineItem)
 *
 * This job runs daily at 2am and provides the "knowledge base"
 * for the bundle generator to use when creating ComputedBundles.
 */

import { prisma } from '../db/prisma';
import { runAthenaQuery } from '../utils/athena';
import { batchProcess } from '../utils/batchProcess';
import { logger } from '@repo/logger';
import { DATA_CONFIG, GRAPH_CONFIG } from '../config/service.config';

const WEIGHT_DECAY = GRAPH_CONFIG.WEIGHT_DECAY;
const MIN_CLICKS_FOR_WEIGHT = GRAPH_CONFIG.MIN_CLICKS_FOR_WEIGHT;

export async function handleGraphWeightsDailyJob(shopId?: string) {
  const shops = shopId
    ? [{ id: shopId }]
    : await prisma.shop.findMany({ where: { isActive: true }, select: { id: true } });

  logger.info({ shopCount: shops.length }, 'Starting GRAPH_WEIGHTS_DAILY');

  for (const shop of shops) {
    try {
      await processShopGraphWeights(shop.id);
    } catch (err) {
      logger.error({ shopId: shop.id, err }, 'Failed to process shop graph weights');
    }
  }

  logger.info('GRAPH_WEIGHTS_DAILY complete');
}

async function processShopGraphWeights(shopId: string) {
  logger.info({ shopId }, 'Processing graph weights for shop');

  // 1. Apply weight decay to all existing ProductGraph entries
  await applyWeightDecay(shopId);

  // 2. Update ProductGraph from bundle CTR data (Athena)
  await updateProductGraphFromCTR(shopId);

  // 3. CategoryGraph updates are handled by CATEGORY_GRAPH_REBUILD_90D
  logger.info({ shopId }, 'Skipping CategoryGraph update (use CATEGORY_GRAPH_REBUILD_90D)');

  logger.info({ shopId }, 'Graph weights processing complete');
}

/**
 * Apply 5% decay to all ProductGraph weights.
 * This prevents stale "winners" from dominating forever.
 */
async function applyWeightDecay(shopId: string) {
  const result = await prisma.productGraph.updateMany({
    where: { shopId, type: 'BUNDLE' },
    data: { weight: { multiply: WEIGHT_DECAY } },
  });

  logger.info({ shopId, decayedCount: result.count }, 'Weight decay applied');
}

/**
 * Query Athena for bundle click-through rates and update ProductGraph.
 *
 * Logic:
 * - High CTR (>5%) → increase weight toward 1.0
 * - Low CTR (<1%) → decrease weight toward 0.0
 * - New pairs with clicks → insert with weight 0.5
 */
async function updateProductGraphFromCTR(shopId: string) {
  // Get bundle interaction data based on lookback window
  const endDate = new Date();
  const startDate = new Date(
    endDate.getTime() - DATA_CONFIG.WINDOWS.CTR_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  const query = `
    WITH bundle_events AS (
      SELECT
        shop,
        src_pid,
        CAST(pid AS BIGINT) as target_pid,
        event,
        COUNT(*) as cnt
      FROM px_events
      WHERE shop = '${shopId}'
        AND year >= '${startDate.getUTCFullYear()}'
        AND event IN ('reco_view', 'reco_click')
        AND rail = 'bundles'
        AND src_pid IS NOT NULL
        AND pid IS NOT NULL
      GROUP BY shop, src_pid, pid, event
    )
    SELECT
      src_pid,
      target_pid,
      COALESCE(SUM(CASE WHEN event = 'reco_view' THEN cnt ELSE 0 END), 0) AS views,
      COALESCE(SUM(CASE WHEN event = 'reco_click' THEN cnt ELSE 0 END), 0) AS clicks
    FROM bundle_events
    GROUP BY src_pid, target_pid
    HAVING SUM(CASE WHEN event = 'reco_click' THEN cnt ELSE 0 END) >= ${GRAPH_CONFIG.MIN_CLICKS_FOR_WEIGHT}
  `;

  const rows = await runAthenaQuery<{
    src_pid: string;
    target_pid: string;
    views: number;
    clicks: number;
  }>(query);

  if (rows.length === 0) {
    logger.info({ shopId }, 'No bundle CTR data found');
    return;
  }

  logger.info({ shopId, pairCount: rows.length }, 'Updating ProductGraph from CTR');

  const { updated } = await batchProcess(rows, GRAPH_CONFIG.BATCH_SIZE, async (row) => {
    const sourceId = BigInt(row.src_pid);
    const targetId = BigInt(row.target_pid);
    const views = Number(row.views) || 1;
    const clicks = Number(row.clicks) || 0;
    const ctr = clicks / views;

    // Calculate new weight based on CTR using config thresholds/weights
    let newWeight = GRAPH_CONFIG.SCORING.WEIGHTS.LOW_MID;
    const { SCORING } = GRAPH_CONFIG;
    if (ctr > SCORING.HIGH_CTR_THRESHOLD) newWeight = SCORING.WEIGHTS.HIGH;
    else if (ctr > SCORING.MEDIUM_CTR_THRESHOLD) newWeight = SCORING.WEIGHTS.MEDIUM;
    else if (ctr > SCORING.LOW_CTR_THRESHOLD) newWeight = SCORING.WEIGHTS.LOW_MID;
    else newWeight = SCORING.WEIGHTS.LOW;

    await prisma.productGraph.upsert({
      where: {
        shopId_sourceId_targetId_type: {
          shopId,
          sourceId,
          targetId,
          type: 'BUNDLE',
        },
      },
      update: { weight: newWeight },
      create: {
        shopId,
        sourceId,
        targetId,
        type: 'BUNDLE',
        weight: newWeight,
      },
    });
  });

  logger.info({ shopId, updated }, 'ProductGraph CTR update complete');
}
