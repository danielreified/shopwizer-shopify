import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { BEST_SELLER_CONFIG } from '../config/service.config';
import { batchProcess } from '../utils/batchProcess';

/**
 * 🏆 handleBestSellerJob (Per-Shop)
 *
 * Computes best-seller scores using:
 * - Order/revenue data directly from Order tables (always accurate)
 * - Engagement data (views/clicks/carts) from ProductFeature if available
 */
export async function handleBestSellerJob(shopId: string) {
  const now = new Date();
  const days7ago = new Date(
    now.getTime() - BEST_SELLER_CONFIG.WINDOWS.SHORT_TERM_DAYS * 24 * 60 * 60 * 1000,
  );
  const days30ago = new Date(
    now.getTime() - BEST_SELLER_CONFIG.WINDOWS.LONG_TERM_DAYS * 24 * 60 * 60 * 1000,
  );

  // 1. Get ALL products for this shop
  const products = await prisma.product.findMany({
    where: { shopId, status: 'ACTIVE' },
    select: { id: true, createdAt: true },
  });

  if (!products.length) {
    logger.warn({ shopId }, 'No products for shop');
    return;
  }

  // 2. Aggregate order stats directly from OrderLineItem (30d)
  const orderStats30d = await prisma.orderLineItem.groupBy({
    by: ['productId'],
    where: {
      shopId,
      productId: { not: null },
      order: {
        processedAt: { gte: days30ago },
      },
    },
    _sum: {
      quantity: true,
      price: true,
    },
  });

  // 3. Get 7-day order stats for freshness
  const orderStats7d = await prisma.orderLineItem.groupBy({
    by: ['productId'],
    where: {
      shopId,
      productId: { not: null },
      order: {
        processedAt: { gte: days7ago },
      },
    },
    _sum: {
      quantity: true,
      price: true,
    },
  });

  // ... (rest of the gathering logic same as before)
  // 4. Get existing ProductFeature records for engagement data (if any)
  const existingFeatures = await prisma.productFeature.findMany({
    where: { shopId },
    select: {
      productId: true,
      views7d: true,
      clicks7d: true,
      carts7d: true,
    },
  });

  // Build lookup maps
  const orders30Map = new Map<bigint, { orders: number; revenue: number }>();
  for (const s of orderStats30d) {
    if (s.productId) {
      orders30Map.set(s.productId, {
        orders: s._sum.quantity || 0,
        revenue: s._sum.price || 0,
      });
    }
  }

  const orders7Map = new Map<bigint, { orders: number; revenue: number }>();
  for (const s of orderStats7d) {
    if (s.productId) {
      orders7Map.set(s.productId, {
        orders: s._sum.quantity || 0,
        revenue: s._sum.price || 0,
      });
    }
  }

  const featuresMap = new Map<bigint, { views7d: number; clicks7d: number; carts7d: number }>();
  for (const f of existingFeatures) {
    featuresMap.set(f.productId, {
      views7d: f.views7d || 0,
      clicks7d: f.clicks7d || 0,
      carts7d: f.carts7d || 0,
    });
  }

  const hasEngagementData = existingFeatures.length > 0;

  logger.info(
    {
      shopId,
      productCount: products.length,
      productsWithOrders: orders30Map.size,
      hasEngagementData,
      engagementRecords: existingFeatures.length,
    },
    'Computing best-seller scores',
  );

  // Pre-calc max values for normalization (avoid divide by zero)
  const allOrders30 = Array.from(orders30Map.values());
  const allOrders7 = Array.from(orders7Map.values());

  const maxOrders30 = Math.max(...allOrders30.map((s) => s.orders), 1);
  const maxOrders7 = Math.max(...allOrders7.map((s) => s.orders), 1);
  const maxRev30 = Math.max(...allOrders30.map((s) => s.revenue), 1);
  const maxRev7 = Math.max(...allOrders7.map((s) => s.revenue), 1);

  // Engagement max values (only if we have data)
  const maxViews7 = hasEngagementData
    ? Math.max(...Array.from(featuresMap.values()).map((f) => f.views7d), 1)
    : 1;
  const maxClicks7 = hasEngagementData
    ? Math.max(...Array.from(featuresMap.values()).map((f) => f.clicks7d), 1)
    : 1;

  // 5. Compute scores for all products
  const scored = products.map((p) => {
    const o30 = orders30Map.get(p.id) || { orders: 0, revenue: 0 };
    const o7 = orders7Map.get(p.id) || { orders: 0, revenue: 0 };
    const engagement = featuresMap.get(p.id) || { views7d: 0, clicks7d: 0, carts7d: 0 };

    const {
      POPULARITY_ORDER_WEIGHT,
      POPULARITY_REVENUE_WEIGHT,
      BASE_POPULARITY_WEIGHT,
      BASE_FRESHNESS_WEIGHT,
      ENGAGEMENT_BOOST,
      DECAY_DAYS,
    } = BEST_SELLER_CONFIG.SCORING;

    // Normalize order metrics
    const nO30 = o30.orders / maxOrders30;
    const nR30 = o30.revenue / maxRev30;
    const nO7 = o7.orders / maxOrders7;
    const nR7 = o7.revenue / maxRev7;

    // Popularity logic
    const popularity =
      POPULARITY_ORDER_WEIGHT * Math.sqrt(nO30) + POPULARITY_REVENUE_WEIGHT * Math.sqrt(nR30);

    // Freshness: recent 7d activity bonus
    const freshness = (1 - BASE_POPULARITY_WEIGHT) * 2 * Math.sqrt(nO7 + nR7); // Simplified but keeping intent

    const base = popularity * BASE_POPULARITY_WEIGHT + freshness * BASE_FRESHNESS_WEIGHT;

    // Engagement boost for products with no orders (use views/clicks as fallback)
    let boost = 0;
    if (o30.orders === 0 && o30.revenue === 0 && hasEngagementData) {
      const nViews = engagement.views7d / maxViews7;
      const nClicks = engagement.clicks7d / maxClicks7;
      boost = ENGAGEMENT_BOOST * (0.5 * nViews + 0.5 * nClicks);
    }

    // Time decay
    const ageDays = (now.getTime() - p.createdAt.getTime()) / 86400000;
    const decay = Math.exp(-ageDays / DECAY_DAYS);

    const raw = (base + boost) * decay;
    return { productId: p.id, raw };
  });

  // 6. Normalize scores to 0-1 and prepare updates
  const min = Math.min(...scored.map((s) => s.raw));
  const max = Math.max(...scored.map((s) => s.raw));
  const range = max - min || 1;

  const updates = scored.map((s) => {
    const o30 = orders30Map.get(s.productId) || { orders: 0, revenue: 0 };
    const o7 = orders7Map.get(s.productId) || { orders: 0, revenue: 0 };

    return {
      productId: s.productId,
      bestSellerScore: Math.pow(
        (s.raw - min) / range,
        BEST_SELLER_CONFIG.SCORING.NORMALIZATION_POWER,
      ),
      orders7d: o7.orders,
      orders30d: o30.orders,
      revenue7d: o7.revenue,
      revenue30d: o30.revenue,
    };
  });

  // 7. Upsert into ProductFeature (parallel batches for performance)
  const { updated } = await batchProcess(updates, BEST_SELLER_CONFIG.BATCH_SIZE, (item) =>
    prisma.productFeature
      .upsert({
        where: { productId: item.productId },
        create: {
          shopId,
          productId: item.productId,
          bestSellerScore: item.bestSellerScore,
          orders7d: item.orders7d,
          orders30d: item.orders30d,
          revenue7d: item.revenue7d,
          revenue30d: item.revenue30d,
          // Initialize other fields to 0
          views24h: 0,
          views7d: 0,
          views30d: 0,
          clicks24h: 0,
          clicks7d: 0,
          clicks30d: 0,
          carts24h: 0,
          carts7d: 0,
          carts30d: 0,
        },
        update: {
          bestSellerScore: item.bestSellerScore,
          orders7d: item.orders7d,
          orders30d: item.orders30d,
          revenue7d: item.revenue7d,
          revenue30d: item.revenue30d,
        },
      })
      .then(() => {}),
  );

  logger.info(
    { shopId, updated, total: products.length, hasEngagementData },
    'Best-seller job complete',
  );
}
