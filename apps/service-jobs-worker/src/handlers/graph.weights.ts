import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { GRAPH_CONFIG } from '../config/service.config';

/**
 * 📊 GRAPH_WEIGHTS_DAILY
 *
 * Analyzes historical order data to populate:
 * 1. ProductGraph (Type: BUNDLE) - Pairings frequently bought together.
 * 2. CategoryGraph - Category-level affinity scores.
 *
 * This ensures the bundle generator has "Proven Winners" to work with.
 */
export async function handleGraphWeightsJob(shopId: string) {
  logger.info({ shopId }, '🚀 Starting GRAPH_WEIGHTS_DAILY job');

  const TOP_K_PRODUCTS = GRAPH_CONFIG.TOP_K_PRODUCTS_PER_SOURCE;

  try {
    await prisma.$transaction(
      async (tx) => {
        // ... (SQL queries same as before)
        // 1. Populate ProductGraph (Product-to-Product co-purchases)
        logger.info({ shopId }, '🔗 Updating ProductGraph (BUNDLE edges)...');
        await tx.$executeRaw`
                WITH order_products AS (
                    SELECT
                        oli."orderId",
                        oli."productId"::bigint AS "productId"
                    FROM "OrderLineItem" oli
                    JOIN "Order" ord ON ord."id" = oli."orderId"
                    WHERE ord."shopId" = ${shopId}
                      AND oli."productId" IS NOT NULL
                    GROUP BY oli."orderId", oli."productId"
                ),
                pair_counts AS (
                    SELECT
                        p1."productId" AS "sourceId",
                        p2."productId" AS "targetId",
                        COUNT(DISTINCT p1."orderId") AS "orderCount"
                    FROM order_products p1
                    JOIN order_products p2 ON p1."orderId" = p2."orderId" AND p1."productId" <> p2."productId"
                    GROUP BY p1."productId", p2."productId"
                ),
                normalized AS (
                    SELECT
                        "sourceId",
                        "targetId",
                        "orderCount"::float / NULLIF(MAX("orderCount"::float) OVER (PARTITION BY "sourceId"), 0) AS "weight"
                    FROM pair_counts
                ),
                ranked AS (
                    SELECT
                        n.*,
                        ROW_NUMBER() OVER (PARTITION BY "sourceId" ORDER BY "weight" DESC, "targetId") AS rn
                    FROM normalized n
                )
                INSERT INTO "ProductGraph" ("id", "shopId", "sourceId", "targetId", "type", "weight", "updatedAt")
                SELECT
                    gen_random_uuid()::text,
                    ${shopId},
                    r."sourceId",
                    r."targetId",
                    'BUNDLE',
                    r."weight",
                    NOW()
                FROM ranked r
                WHERE r.rn <= ${TOP_K_PRODUCTS}
                ON CONFLICT ("shopId", "sourceId", "targetId", "type")
                DO UPDATE SET
                    "weight" = EXCLUDED."weight",
                    "updatedAt" = NOW();
            `;

        // 2. Populate CategoryGraph (Category-to-Category affinity)
        logger.info({ shopId }, '📂 Updating CategoryGraph...');
        await tx.$executeRaw`
                WITH order_categories AS (
                    SELECT
                        oli."orderId",
                        p."categoryId"
                    FROM "OrderLineItem" oli
                    JOIN "Order" ord ON ord."id" = oli."orderId"
                    JOIN "Product" p ON p."id" = oli."productId"
                    WHERE ord."shopId" = ${shopId}
                      AND p."categoryId" IS NOT NULL
                    GROUP BY oli."orderId", p."categoryId"
                ),
                cat_pair_counts AS (
                    SELECT
                        c1."categoryId" AS "sourceCategory",
                        c2."categoryId" AS "targetCategory",
                        COUNT(DISTINCT c1."orderId") AS "orderCount"
                    FROM order_categories c1
                    JOIN order_categories c2 ON c1."orderId" = c2."orderId" AND c1."categoryId" <> c2."categoryId"
                    GROUP BY c1."categoryId", c2."categoryId"
                ),
                INSERT INTO "CategoryGraph" ("id", "shopId", "sourceCategory", "targetCategory", "count", "updatedAt")
                SELECT
                    gen_random_uuid()::text,
                    ${shopId},
                    c."sourceCategory",
                    c."targetCategory",
                    c."orderCount"::int,
                    NOW()
                FROM cat_pair_counts c
                ON CONFLICT ("shopId", "sourceCategory", "targetCategory")
                DO UPDATE SET
                    "count" = EXCLUDED."count",
                    "updatedAt" = NOW();
            `;
      },
      { timeout: GRAPH_CONFIG.TRANSACTION_TIMEOUT_MS },
    );

    logger.info({ shopId }, '✅ GRAPH_WEIGHTS_DAILY complete');
    return { ok: true };
  } catch (err) {
    logger.error({ shopId, err }, '❌ GRAPH_WEIGHTS_DAILY failed');
    return { ok: false, error: err };
  }
}
