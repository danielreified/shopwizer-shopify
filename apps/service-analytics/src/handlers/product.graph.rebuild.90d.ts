/**
 * 📊 PRODUCT_GRAPH_REBUILD_90D
 *
 * Rebuilds ProductGraph counts from the last 90 days of orders.
 * - Can run for a single shop (shopId) or all active shops.
 * - Deletes existing ProductGraph rows per shop + type, then inserts new counts.
 */

import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { PRODUCT_GRAPH_REBUILD_CONFIG } from '../config/service.config';

const GRAPH_TYPE = 'BUNDLE';

export async function handleProductGraphRebuild90d(shopId?: string) {
  const shops = shopId
    ? [{ id: shopId }]
    : await prisma.shop.findMany({ where: { isActive: true }, select: { id: true } });

  logger.info({ shopCount: shops.length }, 'Starting PRODUCT_GRAPH_REBUILD_90D');

  for (const shop of shops) {
    try {
      await rebuildProductGraphForShop(shop.id);
    } catch (err) {
      logger.error({ shopId: shop.id, err }, 'Failed PRODUCT_GRAPH_REBUILD_90D for shop');
    }
  }

  logger.info('PRODUCT_GRAPH_REBUILD_90D complete');
}

async function rebuildProductGraphForShop(shopId: string) {
  const lookbackDate = new Date(
    Date.now() - PRODUCT_GRAPH_REBUILD_CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  logger.info(
    {
      shopId,
      lookbackDays: PRODUCT_GRAPH_REBUILD_CONFIG.LOOKBACK_DAYS,
      topK: PRODUCT_GRAPH_REBUILD_CONFIG.TOP_K_PER_SOURCE,
    },
    'Rebuilding ProductGraph',
  );

  await prisma.$transaction(
    async (tx) => {
      const deleted = await tx.productGraph.deleteMany({ where: { shopId, type: GRAPH_TYPE } });

      const inserted = await tx.$executeRaw`
      WITH order_products AS (
        SELECT
          oli."orderId",
          oli."productId"::bigint AS "productId"
        FROM "OrderLineItem" oli
        JOIN "Order" ord ON ord."id" = oli."orderId"
        JOIN "Product" p ON p."id" = oli."productId"
        WHERE ord."shopId" = ${shopId}
          AND ord."processedAt" >= ${lookbackDate}
          AND oli."productId" IS NOT NULL
        GROUP BY oli."orderId", oli."productId"
      ),
      pair_counts AS (
        SELECT
          p1."productId" AS "sourceId",
          p2."productId" AS "targetId",
          COUNT(DISTINCT p1."orderId")::int AS "orderCount"
        FROM order_products p1
        JOIN order_products p2
          ON p1."orderId" = p2."orderId"
         AND p1."productId" <> p2."productId"
        GROUP BY p1."productId", p2."productId"
      ),
      ranked AS (
        SELECT
          "sourceId",
          "targetId",
          "orderCount",
          ROW_NUMBER() OVER (
            PARTITION BY "sourceId"
            ORDER BY "orderCount" DESC, "targetId"
          ) AS rn
        FROM pair_counts
      )
      INSERT INTO "ProductGraph" (
        "id",
        "shopId",
        "sourceId",
        "targetId",
        "type",
        "count",
        "updatedAt"
      )
      SELECT
        gen_random_uuid()::text,
        ${shopId},
        r."sourceId",
        r."targetId",
        ${GRAPH_TYPE},
        r."orderCount",
        NOW()
      FROM ranked r
      WHERE r."orderCount" >= ${PRODUCT_GRAPH_REBUILD_CONFIG.MIN_CO_PURCHASE_FREQ}
        AND r.rn <= ${PRODUCT_GRAPH_REBUILD_CONFIG.TOP_K_PER_SOURCE};
    `;

      logger.info(
        {
          shopId,
          deleted: deleted.count,
          inserted: Number(inserted) || 0,
        },
        'ProductGraph rebuild complete',
      );
    },
    { timeout: PRODUCT_GRAPH_REBUILD_CONFIG.TRANSACTION_TIMEOUT_MS },
  );
}
