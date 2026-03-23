import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { TRENDING_CONFIG } from '../config/service.config';
import { batchProcess } from '../utils/batchProcess';

/**
 * 🔥 handleTrendingJob (Per-Shop)
 *
 * Runs for a single shop, triggered by SQS message.
 * Computes trending scores for all products in the shop.
 */
export async function handleTrendingJob(shopId: string) {
  const features = await prisma.productFeature.findMany({
    where: { shopId },
  });

  if (!features.length) {
    logger.warn({ shopId }, 'No product features found for shop');
    return;
  }

  const totalEngagement = features.reduce(
    (acc, f) =>
      acc +
      (f.views7d || 0) +
      (f.clicks7d || 0) +
      (f.orders7d || 0) +
      (f.views24h || 0) +
      (f.clicks24h || 0),
    0,
  );

  const isLowTraffic = totalEngagement < TRENDING_CONFIG.LOW_TRAFFIC_THRESHOLD;
  const now = new Date();

  // Trending score calculation - focuses on views/clicks only (NOT orders)
  // Orders are handled by Best Sellers to avoid duplicate recommendations
  const scored = features.map((f) => {
    const v24 = f.views24h || 0;
    const v7 = f.views7d || 0;
    const v30 = f.views30d || 0;

    const c24 = f.clicks24h || 0;
    const c7 = f.clicks7d || 0;
    const c30 = f.clicks30d || 0;

    const {
      CLICK_WEIGHT,
      RECENCY_WEIGHT,
      PERSISTENCE_WEIGHT,
      DECAY_DAYS,
      NEW_PRODUCT_WINDOW_DAYS,
      NEW_PRODUCT_BOOST,
      JITTER_RANGE,
    } = TRENDING_CONFIG.SCORING;

    // Activity scoring WITHOUT orders (orders are for Best Sellers)
    const activity24 = v24 + CLICK_WEIGHT * c24;
    const activity7 = v7 + CLICK_WEIGHT * c7;
    const activity30 = v30 + CLICK_WEIGHT * c30;

    const recency = (activity24 + 0.5) / Math.max(activity7 + 1, 1);
    const persistence = (activity7 + 0.5) / Math.max(activity30 + 1, 1);

    let raw = RECENCY_WEIGHT * recency + PERSISTENCE_WEIGHT * persistence;

    const ageDays = (now.getTime() - (f.createdAt ?? now).getTime()) / (1000 * 60 * 60 * 24);

    raw *= Math.exp(-ageDays / DECAY_DAYS);
    if (ageDays < NEW_PRODUCT_WINDOW_DAYS) raw *= NEW_PRODUCT_BOOST;
    if (isLowTraffic) raw += Math.random() * JITTER_RANGE;

    return { id: f.id, raw };
  });

  // Normalize
  const min = Math.min(...scored.map((s) => s.raw));
  const max = Math.max(...scored.map((s) => s.raw));

  const normalized = scored.map((s) => ({
    id: s.id,
    trendingScore: max === min ? 0.5 : (s.raw - min) / (max - min),
  }));

  // Batch update using Promise.allSettled for resilience
  const { updated, skipped } = await batchProcess(normalized, TRENDING_CONFIG.BATCH_SIZE, (n) =>
    prisma.productFeature
      .update({
        where: { id: n.id },
        data: { trendingScore: n.trendingScore },
      })
      .then(() => {}),
  );

  logger.info(
    { shopId, updated, skipped, total: normalized.length, isLowTraffic },
    'Trending job complete',
  );
}
