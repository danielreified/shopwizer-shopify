// services/recommendations/helpers.server/reviewsMetafields.ts

import { unauthenticated } from "../../../shopify.server";
import { fetchActiveIntegrations } from "./integrations";

// Default values for products without reviews
const DEFAULT_REVIEWS: ReviewsData = {
    avgRating: "0",
    numReviews: "0",
};

// Provider-specific GraphQL queries
const LOOX_METAFIELDS_QUERY = `#graphql
  query getLooxMetafields($query: String!) {
    products(first: 50, query: $query) {
      nodes {
        handle
        avgRating: metafield(namespace: "loox", key: "avg_rating") { value }
        numReviews: metafield(namespace: "loox", key: "num_reviews") { value }
      }
    }
  }
`;

// Future: Add more provider queries here
// const JUDGEME_METAFIELDS_QUERY = ...
// const YOTPO_METAFIELDS_QUERY = ...

export interface ReviewsData {
    avgRating: string;
    numReviews: string;
}

/**
 * Fetch review metafields for a list of product handles.
 * Supports multiple review providers (Loox, Judge.me, etc.)
 * Returns defaults for products without reviews.
 * 
 * @param shop - Shop domain (e.g., "store.myshopify.com")
 * @param handles - Array of product handles to fetch metafields for
 * @returns Map of handle → { avgRating, numReviews }
 */
export async function fetchReviewsMetafields(
    shop: string,
    handles: string[]
): Promise<Map<string, ReviewsData>> {
    const result = new Map<string, ReviewsData>();

    if (!handles.length) {
        return result;
    }

    // Initialize all handles with defaults
    for (const handle of handles) {
        result.set(handle, { ...DEFAULT_REVIEWS });
    }

    try {
        const integrations = await fetchActiveIntegrations(shop);

        // Route to the appropriate provider
        if (integrations.reviews === "LOOX") {
            await fetchLooxMetafields(shop, handles, result);
        }
        // Future: Add more providers
        // else if (integrations.reviews === "JUDGE_ME") {
        //     await fetchJudgeMeMetafields(shop, handles, result);
        // }

    } catch (err) {
        console.error("[Reviews] Failed to fetch metafields:", err);
        // Return defaults on error - don't block recommendations
    }

    return result;
}

/**
 * Fetch Loox-specific metafields
 */
async function fetchLooxMetafields(
    shop: string,
    handles: string[],
    result: Map<string, ReviewsData>
): Promise<void> {
    const { admin } = await unauthenticated.admin(shop);

    // Build query string: handle:value OR handle:value2
    const handleQuery = handles.map((h) => `handle:${h}`).join(" OR ");

    const response = await admin.graphql(LOOX_METAFIELDS_QUERY, {
        variables: { query: handleQuery },
    });

    const json = await response.json();
    const products = json?.data?.products?.nodes ?? [];

    for (const product of products) {
        const existing = result.get(product.handle) ?? { ...DEFAULT_REVIEWS };
        result.set(product.handle, {
            avgRating: product.avgRating?.value ?? existing.avgRating,
            numReviews: product.numReviews?.value ?? existing.numReviews,
        });
    }

    console.log(`[Reviews:Loox] Fetched for ${products.length}/${handles.length} products`);
}
