// services/recommendations/order.server.ts
// 
// Order/Thank You page recommendations - finds complementary products
// for items in an order. Similar to cart but allows future divergence
// (e.g., exclude items customer already bought, different ranking).

import prisma from "../../db.server";
import { packPayload } from "./payload.server";
import {
    MAX_RESULTS,
    createLogger,
    generateSlateId,
    enrichProducts,
    deduplicateByTitle,
    loadExclusionRules,
    filterExcludedProducts,
    fetchMultiSimilarCategories,
    expandToParentCategories,
} from "./helpers.server/index";

const log = createLogger("order_recs", "blue");

// ============================================================
// MAIN ENTRY
// ============================================================

export async function getOrderRecommendations(shop: string, productIds: string[]) {
    const slateId = generateSlateId();
    log("🧾 getOrderRecommendations()", { shop, productIds: productIds.length });

    try {
        // 1. Load order products to get their categories
        const shopRecord = await prisma.shop.findUnique({
            where: { domain: shop },
            select: { id: true },
        });

        if (!shopRecord) {
            log("⚠️ Shop not found");
            return buildEmptyResponse({ shop, slateId });
        }

        const orderProducts = await prisma.product.findMany({
            where: {
                shopId: shopRecord.id,
                id: { in: productIds.map((id) => BigInt(id)) },
            },
            select: {
                id: true,
                categoryId: true,
                tags: true,
                gender: true,
                ageBucket: true,
            },
        });

        if (orderProducts.length === 0) {
            log("⚠️ No matching products found");
            return buildEmptyResponse({ shop, slateId });
        }

        // 2. Extract unique category IDs
        const categoryIds = [...new Set(
            orderProducts
                .map((p) => p.categoryId)
                .filter(Boolean) as string[]
        )];

        log("📦 Order categories:", categoryIds);

        if (categoryIds.length === 0) {
            log("⚠️ No categories found in order");
            return buildEmptyResponse({ shop, slateId });
        }

        // 3. Call embeddings service for complementary categories
        const complementaryCategories = await fetchMultiSimilarCategories(categoryIds);

        log("🔗 Embeddings returned categories:", complementaryCategories);

        if (complementaryCategories.length === 0) {
            log("⚠️ No complementary categories found");
            return buildEmptyResponse({ shop, slateId });
        }

        log("✅ Found complementary categories:", complementaryCategories.length);

        // 4. Collect demographics from order items (ALL unique genders/ages)
        const orderGenders = [...new Set(orderProducts.flatMap((p) => p.gender || []))];
        log("👤 Order genders:", orderGenders);

        // 5. Expand categories to include parent levels for broader matching
        const expandedCategories = expandToParentCategories(complementaryCategories);
        log("🔄 Expanded categories (with parents):", expandedCategories.length);

        // Build gender filter: match order genders + UNISEX
        const genderFilter = orderGenders.length > 0 ? [...orderGenders, "UNISEX"] : null;

        // 6. Fetch products that match expanded categories
        const candidates = await prisma.product.findMany({
            where: {
                shopId: shopRecord.id,
                status: "ACTIVE",
                enabled: true,
                OR: expandedCategories.map((cat: string) => ({
                    categoryId: { startsWith: cat },
                })),
                // Exclude products already in order (don't recommend what they bought!)
                id: { notIn: orderProducts.map((p) => p.id) },
                // Exclude order categories (want cross-sell, not same category)
                NOT: {
                    categoryId: { in: categoryIds },
                },
                // Gender filter
                ...(genderFilter && {
                    AND: [
                        {
                            OR: [
                                { gender: { hasSome: genderFilter as any } },
                                { gender: { isEmpty: true } },
                            ],
                        },
                    ],
                }),
            },
            select: {
                id: true,
                handle: true,
                title: true,
                categoryId: true,
                tags: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        log("📊 Raw candidates from DB:", candidates.length);

        // 7. Filter and deduplicate
        const validCandidates = candidates.filter((c): c is typeof c & { handle: string } => c.handle !== null);
        const dedupedProducts = deduplicateByTitle(validCandidates);
        const exclusionRules = await loadExclusionRules(shop);
        const filtered = await filterExcludedProducts(dedupedProducts as any, exclusionRules);
        if (!filtered.length) {
            return buildEmptyResponse({ shop, slateId });
        }

        log("📊 After deduplication:", dedupedProducts.length);

        // 8. Enrich with full product data
        const results = await enrichProducts(filtered.slice(0, MAX_RESULTS) as any);
        log("📊 Enriched results:", results.length);

        // 9. Build tracking payload
        const { p, ps } = await packPayload({
            slateId,
            rail: "thank_you_recs",
            source: {
                handle: `order:${productIds.join(",")}`,
                categoryId: categoryIds[0] || null,
            },
            items: results.map((r: any) => ({
                id: r.id,
                handle: r.handle,
                categoryId: r.categoryId || null,
            })),
        });

        log(`✅ Returning ${results.length} recommendations`);

        return {
            shop,
            rail: "thank_you_recs",
            slate_id: slateId,
            p,
            ps,
            count: results.length,
            results,
        };
    } catch (err) {
        log("❌ Error:", (err as Error).message);
        return buildEmptyResponse({ shop, slateId, error: (err as Error).message });
    }
}

function buildEmptyResponse({
    shop,
    slateId,
    error,
}: {
    shop: string;
    slateId: string;
    error?: string;
}) {
    return {
        shop,
        rail: "thank_you_recs",
        slate_id: slateId,
        p: null,
        ps: null,
        count: 0,
        results: [],
        ...(error && { error }),
    };
}
