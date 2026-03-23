// services/recommendations/cart.server.ts
// 
// Cart page recommendations - finds complementary products for an entire cart.
// Uses the category embeddings service /similar-multi endpoint to find
// categories that complement ALL items in the cart.

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

const log = createLogger("cart_recs", "magenta");

// ============================================================
// MAIN ENTRY
// ============================================================

export async function getCartRecommendations(shop: string, productIds: string[]) {
    const slateId = generateSlateId();
    log("🛒 getCartRecommendations()", { shop, productIds: productIds.length });

    try {
        // 1. Load cart products to get their categories
        const shopRecord = await prisma.shop.findUnique({
            where: { domain: shop },
            select: { id: true },
        });

        if (!shopRecord) {
            log("⚠️ Shop not found");
            return buildEmptyCartResponse({ shop, slateId });
        }

        const cartProducts = await prisma.product.findMany({
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

        if (cartProducts.length === 0) {
            log("⚠️ No matching products found");
            return buildEmptyCartResponse({ shop, slateId });
        }

        // 2. Extract unique category IDs
        const categoryIds = [...new Set(
            cartProducts
                .map((p) => p.categoryId)
                .filter(Boolean) as string[]
        )];

        log("📦 Cart categories:", categoryIds);

        if (categoryIds.length === 0) {
            log("⚠️ No categories found in cart");
            return buildEmptyCartResponse({ shop, slateId });
        }

        // 3. Call embeddings service for complementary categories
        const complementaryCategories = await fetchMultiSimilarCategories(categoryIds);

        log("🔗 Embeddings returned categories:", complementaryCategories);

        if (complementaryCategories.length === 0) {
            log("⚠️ No complementary categories found");
            return buildEmptyCartResponse({ shop, slateId });
        }

        log("✅ Found complementary categories:", complementaryCategories.length);

        // 4. Collect demographics from cart items (ALL unique genders/ages)
        const cartGenders = [...new Set(cartProducts.flatMap((p) => p.gender || []))];
        const cartAgeBuckets = [...new Set(cartProducts.flatMap((p) => p.ageBucket || []))];
        log("👤 Cart genders:", cartGenders);
        log("👤 Cart age buckets:", cartAgeBuckets);

        // 5. Expand categories to include parent levels for broader matching
        // aa-1-1-7-2 → aa-1-1-7 → aa-1-1 → aa-1 → aa
        const expandedCategories = expandToParentCategories(complementaryCategories);
        log("🔄 Expanded categories (with parents):", expandedCategories.length);

        // Build gender filter: match cart genders + UNISEX
        const genderFilter = cartGenders.length > 0 ? [...cartGenders, "UNISEX"] : null;

        // 6. Fetch products that match any of the expanded categories
        // Use startsWith matching so aa-1-13 matches aa-1-13-7, aa-1-13-1, etc.
        const candidates = await prisma.product.findMany({
            where: {
                shopId: shopRecord.id,
                status: "ACTIVE",
                enabled: true,
                // Match any category that STARTS WITH any of our expanded prefixes
                OR: expandedCategories.map((cat: string) => ({
                    categoryId: { startsWith: cat },
                })),
                // Exclude products already in cart
                id: { notIn: cartProducts.map((p) => p.id) },
                // Exclude cart categories (want complementary, not same)
                NOT: {
                    categoryId: { in: categoryIds },
                },
                // Gender filter: must match one of cart genders OR be UNISEX OR have no gender
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
        log("📊 Candidates:", candidates.map(c => ({ id: c.id.toString(), handle: c.handle, categoryId: c.categoryId })));

        // 6. Filter and deduplicate
        const validCandidates = candidates.filter((c): c is typeof c & { handle: string } => c.handle !== null);
        log("📊 Valid candidates (non-null handle):", validCandidates.length);

        const dedupedProducts = deduplicateByTitle(validCandidates);
        const exclusionRules = await loadExclusionRules(shop);
        const filtered = await filterExcludedProducts(dedupedProducts as any, exclusionRules);
        if (!filtered.length) {
            return buildEmptyCartResponse({ shop, slateId });
        }
        log("📊 After deduplication:", dedupedProducts.length);

        // 7. Enrich with full product data
        const results = await enrichProducts(filtered.slice(0, MAX_RESULTS) as any);
        log("📊 Enriched results:", results.length);

        // 8. Build tracking payload
        const { p, ps } = await packPayload({
            slateId,
            rail: "cart_recs",
            source: {
                handle: `cart:${productIds.join(",")}`,
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
            rail: "cart_recs",
            slate_id: slateId,
            p,
            ps,
            count: results.length,
            results: results.map((r: any) => ({
                handle: r.handle,
                reviews: r.reviews || { avgRating: "0", numReviews: "0" },
            })),
        };
    } catch (err) {
        log("❌ Error:", (err as Error).message);
        return buildEmptyCartResponse({ shop, slateId, error: (err as Error).message });
    }
}

function buildEmptyCartResponse({
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
        rail: "cart_recs",
        slate_id: slateId,
        p: null,
        ps: null,
        count: 0,
        results: [],
        ...(error && { error }),
    };
}
