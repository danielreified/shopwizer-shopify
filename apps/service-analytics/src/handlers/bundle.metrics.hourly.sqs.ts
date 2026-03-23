/**
 * 📊 BUNDLE_METRICS_HOURLY
 *
 * Aggregates bundle performance metrics from Athena (px_events)
 * and updates ComputedBundle records in Postgres.
 *
 * Tracks:
 * - views24h: impressions in last 24h
 * - clicks24h: clicks in last 24h
 * - conversions7d: purchases attributed via slate_id
 * - revenue7d: revenue from attributed purchases
 */

import { prisma } from '../db/prisma';
import { runAthenaQuery } from '../utils/athena';
import { logger } from '@repo/logger';
import { BUNDLE_CONFIG } from '../config/service.config';

export async function handleBundleMetricsHourlyJob() {
  logger.info('Starting BUNDLE_METRICS_HOURLY');

  // 1. Get all active shops
  const shops = await prisma.shop.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const shop of shops) {
    try {
      await processShopBundleMetrics(shop.id);
    } catch (err) {
      logger.error({ shopId: shop.id, err }, 'Failed to process bundle metrics for shop');
    }
  }

  logger.info('BUNDLE_METRICS_HOURLY complete');
}

function parseBundleIdFromSlate(slateId: string): string | null {
  const parts = slateId.split(':');
  return parts.length >= 2 ? parts[1] : null;
}

async function processShopBundleMetrics(shopId: string) {
  logger.info({ shopId }, 'Processing bundle metrics');

  // A. Get 24h Views & Clicks (by slate_id)
  const metrics24h = await fetch24hMetrics(shopId);

  // B. Get 7d Conversions & Revenue (by slate_id)
  const metrics7d = await fetch7dMetrics(shopId);

  // Combine metrics by bundleId
  const bundleIds = new Set([...metrics24h.keys(), ...metrics7d.keys()]);

  if (bundleIds.size === 0) {
    logger.info({ shopId }, 'No bundle metrics to update');
    return;
  }

  logger.info({ shopId, updateCount: bundleIds.size }, 'Updating ComputedBundle metrics');

  for (const bundleId of bundleIds) {
    const m24 = metrics24h.get(bundleId) || { views: 0, clicks: 0 };
    const m7 = metrics7d.get(bundleId) || { conversions: 0, revenue: 0 };

    try {
      const bundle = await prisma.computedBundle.update({
        where: { id: bundleId },
        data: {
          views24h: m24.views,
          clicks24h: m24.clicks,
          conversions7d: m7.conversions,
          revenue7d: m7.revenue,
        },
      });

      // 🧠 MEMORY LOOP: If this is a discovery variant and it's succeeding, promote it to ProductGraph
      if (
        bundle.status === 'ACTIVE' &&
        (bundle.variant === 'explore_a' || bundle.variant === 'explore_b')
      ) {
        await promoteSuccessfulDiscovery(shopId, bundle);
      }
    } catch (err: any) {
      // Record might have been deleted or archived
      if (err.code !== 'P2025') {
        logger.error({ bundleId, err }, 'Failed to update ComputedBundle metrics');
      }
    }
  }
}

/**
 * If an 'explore' bundle has good CTR, add its pairs to ProductGraph
 * so they become 'Proven Winners' (part of the Control variant).
 */
async function promoteSuccessfulDiscovery(shopId: string, bundle: any) {
  if (bundle.views24h < BUNDLE_CONFIG.MIN_VIEWS_FOR_PROMOTION) return;

  const ctr = bundle.clicks24h / bundle.views24h;
  if (ctr < BUNDLE_CONFIG.MIN_CTR_FOR_PROMOTION) return;

  logger.info(
    { shopId, bundleId: bundle.id, ctr, variant: bundle.variant },
    '🚀 Promoting discovery bundle to ProductGraph',
  );

  const candidateIds = bundle.candidateIds as string[];
  const sourceId = bundle.productId;

  for (const targetIdStr of candidateIds) {
    const targetId = BigInt(targetIdStr);
    await prisma.productGraph.upsert({
      where: {
        shopId_sourceId_targetId_type: {
          shopId,
          sourceId,
          targetId,
          type: 'BUNDLE',
        },
      },
      update: {
        // Boost weight to 0.7 (Proven)
        weight: { set: 0.7 },
      },
      create: {
        shopId,
        sourceId,
        targetId,
        type: 'BUNDLE',
        weight: 0.7,
      },
    });
  }
}

async function fetch24hMetrics(shopId: string) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const query = `
    SELECT
      slate_id,
      COALESCE(SUM(CASE WHEN event = 'reco_view' THEN 1 ELSE 0 END), 0) as views,
      COALESCE(SUM(CASE WHEN event = 'reco_click' THEN 1 ELSE 0 END), 0) as clicks
    FROM px_events
    WHERE shop = '${shopId}'
      AND year >= '${yesterday.getUTCFullYear()}'
      AND event IN ('reco_view', 'reco_click')
      AND rail = 'bundles'
      AND slate_id LIKE 'cb:%'
      AND t >= ${yesterday.getTime()}
    GROUP BY slate_id
  `;

  const rows = await runAthenaQuery<{ slate_id: string; views: number; clicks: number }>(query);
  const map = new Map<string, { views: number; clicks: number }>();
  for (const row of rows) {
    const bundleId = parseBundleIdFromSlate(row.slate_id);
    if (bundleId) {
      const existing = map.get(bundleId) || { views: 0, clicks: 0 };
      map.set(bundleId, {
        views: existing.views + Number(row.views),
        clicks: existing.clicks + Number(row.clicks),
      });
    }
  }
  return map;
}

async function fetch7dMetrics(shopId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const query = `
    WITH bundle_clicks AS (
      SELECT sid, slate_id, variant
      FROM px_events
      WHERE shop = '${shopId}'
        AND event = 'reco_click'
        AND rail = 'bundles'
        AND slate_id LIKE 'cb:%'
        AND t >= ${sevenDaysAgo.getTime()}
    ),
    checkouts AS (
      SELECT sid, SUM(total_price) as revenue, COUNT(*) as orders
      FROM px_events
      WHERE shop = '${shopId}'
        AND event = 'checkout_completed'
        AND t >= ${sevenDaysAgo.getTime()}
      GROUP BY sid
    )
    SELECT
      bc.slate_id,
      SUM(c.orders) as conversions,
      SUM(c.revenue) as revenue
    FROM bundle_clicks bc
    JOIN checkouts c ON bc.sid = c.sid
    GROUP BY bc.slate_id
  `;

  const rows = await runAthenaQuery<{ slate_id: string; conversions: number; revenue: number }>(
    query,
  );
  const map = new Map<string, { conversions: number; revenue: number }>();
  for (const row of rows) {
    const bundleId = parseBundleIdFromSlate(row.slate_id);
    if (bundleId) {
      const existing = map.get(bundleId) || { conversions: 0, revenue: 0 };
      map.set(bundleId, {
        conversions: existing.conversions + Number(row.conversions),
        revenue: existing.revenue + Number(row.revenue),
      });
    }
  }
  return map;
}
