// services/recommendations/bundles.server.ts
// 
// Bundle recommendations - finds complementary products from related categories.
// Uses the category embeddings service (Word2Vec trained on Amazon co-purchase data)
// to find categories that are frequently bought together.

import prisma from "../../db.server";
import { Prisma } from "@prisma/client";
import { packPayload } from "./payload.server";
import {
    TOP_K,
    MAX_RESULTS,
    createLogger,
    generateSlateId,
    enrichProducts,
    buildEmptyResponse,
    loadOriginProduct,
    fetchActiveIntegrations,
    fetchReviewsMetafields,
    deduplicateByTitle,
    loadExclusionRules,
    shouldSuppressForOrigin,
    getSlotIndex,
} from "./helpers.server/index";

const log = createLogger("bundles", "blue");

// ============================================================
// FETCH BUNDLE PRODUCTS
// ============================================================

interface ProductRow {
    id: bigint;
    handle: string;
    title: string;
    categoryId: string | null;
    tags: string[];
    gender: string[] | null;
    ageBucket: string[] | null;
    rootId: string | null;
}

const CATEGORY_EMBEDDINGS_URL = process.env.CATEGORY_EMBEDDINGS_URL || "http://localhost:8003";

/**
 * Fetch similar categories from the embeddings service.
 * If the exact category isn't in the model, tries parent categories.
 * Returns category IDs that are frequently bought together with the input category.
 */
async function fetchSimilarCategories(categoryId: string): Promise<string[]> {
    // Try the exact category first, then traverse up to parents
    // e.g., aa-1-19-3 → aa-1-19 → aa-1 → aa
    const categoriesToTry = buildCategoryHierarchy(categoryId);

    for (const catId of categoriesToTry) {
        try {
            log("🔍 Trying category:", catId);

            const response = await fetch(`${CATEGORY_EMBEDDINGS_URL}/similar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: catId, top_n: 10 }),
            });

            if (!response.ok) continue;

            const data = await response.json();
            const categories = data.categories?.map((c: any) => c.category_id) || [];

            if (categories.length > 0) {
                log(`✅ Found similar categories via: ${catId} → ${categories.length} results`);
                return categories;
            }
        } catch (error) {
            log(`⚠️ Error for ${catId}: ${(error as Error).message}`);
        }
    }

    log("⚠️ No similar categories found for any level");
    return [];
}

/**
 * Build category hierarchy from specific to general.
 * aa-1-19-3 → ["aa-1-19-3", "aa-1-19", "aa-1", "aa"]
 */
function buildCategoryHierarchy(categoryId: string): string[] {
    const parts = categoryId.split("-");
    const hierarchy: string[] = [];

    for (let i = parts.length; i >= 1; i--) {
        hierarchy.push(parts.slice(0, i).join("-"));
    }

    return hierarchy;
}

/**
 * Fetch products from recommended categories.
 * Excludes products in the SAME category as origin (bundles = complementary items).
 * Falls back to different-root-category products if no recommendations found.
 */
async function fetchBundleProducts(
    shop: string,
    originId: bigint,
    originCategoryId: string | null,
    originGender: string[] | null,
    similarCategoryIds: string[]
): Promise<ProductRow[]> {
    // Filter out the origin's own category - we want COMPLEMENTARY items
    const complementaryCategories = similarCategoryIds.filter(
        catId => catId !== originCategoryId
    );

    log("🎯 Complementary categories (excluding origin):", complementaryCategories.length);
    log("👤 Filtering by gender:", originGender || "ANY");

    // If we have recommendations, query them
    if (complementaryCategories.length > 0) {
        const rows = await prisma.$queryRaw<ProductRow[]>`
        SELECT 
          p."id", 
          p."handle", 
          p."title",
          p."categoryId",
          p."tags",
          p."gender",
          p."ageBucket",
          c."rootId"
        FROM "Product" p
        JOIN "Shop" s ON s."id" = p."shopId"
        LEFT JOIN "Category" c ON c."id" = p."categoryId"
        WHERE s."domain" = ${shop}
          AND p."enabled" = true
          AND p."id" <> ${originId}
          AND p."categoryId" IN (${Prisma.join(complementaryCategories)})
          AND p."categoryId" <> ${originCategoryId || ''}
          AND (${originGender}::"Gender"[] IS NULL OR p."gender" IS NULL OR p."gender" && ${originGender}::"Gender"[] OR 'UNISEX'::"Gender" = ANY(p."gender"))
        ORDER BY RANDOM()
        LIMIT 10;
      `;

        if (rows.length > 0) return rows;
    }

    // Fallback: Products from DIFFERENT subcategories within same root
    // (e.g., if viewing necklace, show bracelets/earrings from same jewelry root)
    if (originCategoryId) {
        const originRoot = originCategoryId.split("-")[0]; // "aa" from "aa-1-5"

        const rows = await prisma.$queryRaw<ProductRow[]>`
        SELECT 
          p."id", 
          p."handle", 
          p."title",
          p."categoryId",
          p."tags",
          p."gender",
          p."ageBucket",
          c."rootId"
        FROM "Product" p
        JOIN "Shop" s ON s."id" = p."shopId"
        LEFT JOIN "Category" c ON c."id" = p."categoryId"
        WHERE s."domain" = ${shop}
          AND p."enabled" = true
          AND p."id" <> ${originId}
          AND c."rootId" = ${originRoot}
          AND p."categoryId" <> ${originCategoryId}
          AND (${originGender}::"Gender"[] IS NULL OR p."gender" IS NULL OR p."gender" && ${originGender}::"Gender"[] OR 'UNISEX'::"Gender" = ANY(p."gender"))
        ORDER BY RANDOM()
        LIMIT 10;
      `;

        if (rows.length > 0) {
            log(`📦 Using same-root fallback: ${rows.length} products`);
            return rows;
        }
    }

    // Last fallback: Random products from ANY category (still respects gender)
    return await prisma.$queryRaw<ProductRow[]>`
    SELECT 
      p."id", 
      p."handle", 
      p."title",
      p."categoryId",
      p."tags",
      p."gender",
      p."ageBucket",
      c."rootId"
    FROM "Product" p
    JOIN "Shop" s ON s."id" = p."shopId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    WHERE s."domain" = ${shop}
      AND p."enabled" = true
      AND p."id" <> ${originId}
      AND p."categoryId" <> ${originCategoryId || ''}
      AND (${originGender}::"Gender"[] IS NULL OR p."gender" IS NULL OR p."gender" && ${originGender}::"Gender"[] OR 'UNISEX'::"Gender" = ANY(p."gender"))
    ORDER BY RANDOM()
    LIMIT 10;
  `;
}



// ============================================================
// MAIN ENTRY
// ============================================================

export async function getBundleProducts(
    shop: string,
    productId: string,
    mode: "public" | "admin" = "public"
) {
    const slateId = generateSlateId();
    log("🚀 getBundleProducts()", { shop, productId, mode });

    try {
        // Load origin product to get its category
        const origin = await loadOriginProduct(shop, productId);
        if (!origin) {
            log("⚠️ Origin product not found");
            return buildEmptyResponse({ shop, productId, mode, slateId });
        }

        log("📦 Origin product", {
            categoryId: origin.categoryId,
            gender: origin.gender,
            ageBucket: origin.ageBucket
        });

        const exclusionRules = await loadExclusionRules(shop);
        const suppress = await shouldSuppressForOrigin(
            { categoryId: origin.categoryId, tags: origin.tags },
            exclusionRules
        );
        if (suppress) {
            return buildEmptyResponse({ shop, productId, mode, slateId });
        }

        // 1. Check for pre-computed bundles (Banded Evolution)
        const computedBundleRows = await prisma.computedBundle.findMany({
            where: {
                shopId: (await prisma.shop.findUnique({ where: { domain: shop }, select: { id: true } }))?.id,
                productId: BigInt(productId),
                status: "ACTIVE",
            },
        });
        const computedBundles = computedBundleRows
            .filter((bundle: any) => bundle.enabled !== false)
            .sort((a: any, b: any) => {
                const aSlot = Number(a.slotIndex ?? getSlotIndex(a.variant));
                const bSlot = Number(b.slotIndex ?? getSlotIndex(b.variant));
                if (aSlot !== bSlot) return aSlot - bSlot;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .slice(0, 3);

        const integrations = await fetchActiveIntegrations(shop);

        if (computedBundles.length > 0) {
            log(`🎯 Found ${computedBundles.length} pre-computed bundle variants`);

            const variants = (await Promise.all(computedBundles.map(async (bundle) => {
                const variantSlateId = `cb:${bundle.id}:${slateId}`; // Encode bundle ID into slateId
                const candidateIds = bundle.candidateIds as string[];
                const productRows = await prisma.product.findMany({
                    where: { id: { in: candidateIds.map(id => BigInt(id)) } },
                    select: { id: true, handle: true, title: true, categoryId: true, tags: true },
                });

                // Maintain order from candidateIds
                const orderedProducts = candidateIds
                    .map(id => productRows.find(p => p.id.toString() === id))
                    .filter(Boolean);

                const results = mode === "admin" ? await enrichProducts(orderedProducts as any) : orderedProducts;
                const handles = results.map((r: any) => r.handle);

                // Fetch real reviews if enabled
                const reviewsMap = integrations.reviews
                    ? await fetchReviewsMetafields(shop, handles)
                    : new Map();

                const { p, ps } = await packPayload({
                    slateId: variantSlateId,
                    rail: "bundles",
                    source: {
                        handle: origin.handle,
                        categoryId: origin.categoryId,
                        productId: origin.id,
                    },
                    items: results.map((r: any) => ({
                        id: r.id,
                        handle: r.handle,
                        categoryId: r.categoryId,
                    })),
                });

                return {
                    variant: bundle.variant,
                    slotIndex: Number((bundle as any).slotIndex ?? getSlotIndex(bundle.variant)),
                    weight: bundle.weight,
                    slate_id: variantSlateId,
                    p,
                    ps,
                    results: results.slice(0, MAX_RESULTS).map((r: any) => ({
                        handle: r.handle,
                        reviews: reviewsMap.get(r.handle) || { avgRating: "0", numReviews: "0" },
                    })),
                };
            }))).filter(Boolean) as any[];

            if (variants.length === 0) {
                return buildEmptyResponse({ shop, productId, mode, slateId });
            }

            return {
                shop,
                productId,
                mode,
                rail: "bundles",
                variants,
                integrations,
            };
        }

        // 2. Fallback to on-the-fly generation (original logic)
        log("🔄 Falling back to on-the-fly bundle generation");

        // (Previous logic for on-the-fly generation...)
        const similarCategoryIds = origin.categoryId
            ? await fetchSimilarCategories(origin.categoryId)
            : [];

        const base = await fetchBundleProducts(shop, origin.id, origin.categoryId, origin.gender, similarCategoryIds);
        if (!base.length) return buildEmptyResponse({ shop, productId, mode, slateId });

        const dedupByTitle = deduplicateByTitle(base, log);
        const seenCategories = new Set<string>();
        const deduplicated = dedupByTitle.filter(p => {
            if (!p.categoryId) return true;
            if (seenCategories.has(p.categoryId)) return false;
            seenCategories.add(p.categoryId);
            return true;
        });

        const results = mode === "admin" ? await enrichProducts(deduplicated as any) : deduplicated;

        const { p, ps } = await packPayload({
            slateId,
            rail: "bundles",
            source: {
                handle: origin.handle,
                categoryId: origin.categoryId,
                productId: origin.id,
            },
            items: results.map((r) => ({
                id: r.id,
                handle: r.handle,
                categoryId: (r as any).categoryId,
            })),
        });

        const handles = results.slice(0, MAX_RESULTS).map((r) => r.handle);
        const reviewsMap = integrations.reviews
            ? await fetchReviewsMetafields(shop, handles)
            : new Map();

        return {
            shop,
            productId,
            mode,
            rail: "bundles",
            variants: [{
                variant: "bundle_1",
                slotIndex: 1,
                weight: 1.0,
                slate_id: slateId,
                p,
                ps,
                results: results.slice(0, MAX_RESULTS).map((r) => ({
                    handle: r.handle,
                    reviews: reviewsMap.get(r.handle) || { avgRating: "0", numReviews: "0" },
                })),
            }],
            integrations,
        };
    } catch (err) {
        log("❌ bundles.error", err);
        return buildEmptyResponse({ shop, productId, mode, slateId, error: (err as Error).message });
    }
}
