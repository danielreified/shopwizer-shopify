import { MAX_RESULTS } from "./constants";
import { ProductRow } from "./types";

export interface AdminResult {
    id: bigint | string;
    handle: string;
    title: string;
    imageUrl: string | null;
    price: number | null;
    categoryId: string | null;
    merchandisingBasket: string | null;
    enabled: boolean;
}

export interface PublicResult {
    handle: string;
    reviews: { avgRating: string; numReviews: string };
}

/** Maps enriched products to admin response shape. Accepts loosely-typed arrays (enrichment fields default gracefully). */
export function mapAdminResults(
    results: Array<{ id: bigint | string; handle: string; title?: string | null; imageUrl?: string | null; price?: number | null; categoryId?: string | null; merchandisingBasket?: string | null; enabled?: boolean }>,
): AdminResult[] {
    return results.slice(0, MAX_RESULTS).map((r) => ({
        id: r.id,
        handle: r.handle,
        title: r.title ?? r.handle,
        imageUrl: r.imageUrl ?? null,
        price: r.price ?? null,
        categoryId: r.categoryId ?? null,
        merchandisingBasket: r.merchandisingBasket ?? null,
        enabled: r.enabled ?? true,
    }));
}

export function mapPublicResults(
    results: Array<{ handle: string }>,
    reviewsMap: Map<string, { avgRating: string; numReviews: string }>,
): PublicResult[] {
    return results.slice(0, MAX_RESULTS).map((r) => ({
        handle: r.handle,
        reviews: reviewsMap.get(r.handle) || { avgRating: "0", numReviews: "0" },
    }));
}

export interface RecommendationResponse {
    shop: string;
    productId?: string;
    variantId?: string;
    mode: "public" | "admin";
    slate_id: string;
    p?: string;
    count: number;
    results: Array<{ handle: string }>;
    integrations?: { wishlist?: string; reviews?: string };
    error?: string;
}

export function buildEmptyResponse(opts: {
    shop: string;
    productId?: string;
    variantId?: string;
    mode: "public" | "admin";
    slateId: string;
    error?: string;
}): RecommendationResponse {
    return {
        shop: opts.shop,
        ...(opts.productId && { productId: opts.productId }),
        ...(opts.variantId && { variantId: opts.variantId }),
        mode: opts.mode,
        slate_id: opts.slateId,
        count: 0,
        results: [],
        ...(opts.error && { error: opts.error }),
    };
}

export function buildSuccessResponse(opts: {
    shop: string;
    productId?: string;
    mode: "public" | "admin";
    slateId: string;
    results: ProductRow[];
    p?: string;
    integrations?: { wishlist?: string; reviews?: string };
}): RecommendationResponse {
    return {
        shop: opts.shop,
        ...(opts.productId && { productId: opts.productId }),
        mode: opts.mode,
        slate_id: opts.slateId,
        ...(opts.p && { p: opts.p }),
        count: opts.results.length,
        results: opts.results.slice(0, MAX_RESULTS).map((r) => ({ handle: r.handle })),
        ...(opts.integrations && { integrations: opts.integrations }),
    };
}
