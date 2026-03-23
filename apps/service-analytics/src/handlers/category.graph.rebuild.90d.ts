/**
 * 📊 CATEGORY_GRAPH_REBUILD_90D
 *
 * Rebuilds CategoryGraph counts from the last 90 days of orders.
 * - Can run for a single shop (shopId) or all active shops.
 * - Deletes existing CategoryGraph rows per shop, then inserts new counts.
 */

import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { CATEGORY_GRAPH_REBUILD_CONFIG } from '../config/service.config';

export async function handleCategoryGraphRebuild90d(shopId?: string) {
  const shops = shopId
    ? [{ id: shopId }]
    : await prisma.shop.findMany({ where: { isActive: true }, select: { id: true } });

  logger.info({ shopCount: shops.length }, 'Starting CATEGORY_GRAPH_REBUILD_90D');

  for (const shop of shops) {
    try {
      await rebuildCategoryGraphForShop(shop.id);
    } catch (err) {
      logger.error({ shopId: shop.id, err }, 'Failed CATEGORY_GRAPH_REBUILD_90D for shop');
    }
  }

  logger.info('CATEGORY_GRAPH_REBUILD_90D complete');
}

async function rebuildCategoryGraphForShop(shopId: string) {
  const lookbackDate = new Date(
    Date.now() - CATEGORY_GRAPH_REBUILD_CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  logger.info(
    { shopId, lookbackDays: CATEGORY_GRAPH_REBUILD_CONFIG.LOOKBACK_DAYS },
    'Rebuilding CategoryGraph',
  );

  await prisma.$transaction(
    async (tx) => {
      const deleted = await tx.categoryGraph.deleteMany({ where: { shopId } });

      const inserted = await tx.$executeRaw`
      WITH order_categories AS (
        SELECT
          oli."orderId",
          p."categoryId" AS "categoryId"
        FROM "OrderLineItem" oli
        JOIN "Order" ord ON ord."id" = oli."orderId"
        JOIN "Product" p ON p."id" = oli."productId"
        WHERE ord."shopId" = ${shopId}
          AND ord."processedAt" >= ${lookbackDate}
          AND p."categoryId" IS NOT NULL
        GROUP BY oli."orderId", p."categoryId"
      ),
      cat_pair_counts AS (
        SELECT
          c1."categoryId" AS "sourceCategory",
          c2."categoryId" AS "targetCategory",
          COUNT(DISTINCT c1."orderId")::int AS "orderCount"
        FROM order_categories c1
        JOIN order_categories c2
          ON c1."orderId" = c2."orderId"
         AND c1."categoryId" <> c2."categoryId"
        GROUP BY c1."categoryId", c2."categoryId"
      )
      INSERT INTO "CategoryGraph" (
        "id",
        "shopId",
        "sourceCategory",
        "targetCategory",
        "count",
        "updatedAt"
      )
      SELECT
        gen_random_uuid()::text,
        ${shopId},
        c."sourceCategory",
        c."targetCategory",
        c."orderCount",
        NOW()
      FROM cat_pair_counts c
      WHERE c."orderCount" >= ${CATEGORY_GRAPH_REBUILD_CONFIG.MIN_CO_PURCHASE_FREQ};
    `;

      logger.info(
        {
          shopId,
          deleted: deleted.count,
          inserted: Number(inserted) || 0,
        },
        'CategoryGraph rebuild complete',
      );
    },
    { timeout: CATEGORY_GRAPH_REBUILD_CONFIG.TRANSACTION_TIMEOUT_MS },
  );
}
