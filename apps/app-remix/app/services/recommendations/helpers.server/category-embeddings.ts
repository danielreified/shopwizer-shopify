import { createLogger } from "./logging";

const log = createLogger("category-embeddings", "cyan");

const CATEGORY_EMBEDDINGS_URL = process.env.CATEGORY_EMBEDDINGS_URL || "http://localhost:8003";

/**
 * Fetch complementary categories for multiple input categories using the
 * embeddings service /similar-multi endpoint.
 */
export async function fetchMultiSimilarCategories(categoryIds: string[]): Promise<string[]> {
    try {
        const response = await fetch(`${CATEGORY_EMBEDDINGS_URL}/similar-multi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_ids: categoryIds, top_n: 15 }),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            log("⚠️ Embeddings service error:", response.status);
            return [];
        }

        const data = await response.json();
        return (data.categories || []).map((c: any) => c.category_id);
    } catch (err) {
        log("⚠️ Failed to fetch similar categories:", (err as Error).message);
        return [];
    }
}

/**
 * Expand category IDs to include parent levels for broader matching.
 * Example: aa-1-1-7-2 → [aa-1-1-7-2, aa-1-1-7, aa-1-1, aa-1, aa]
 * Returns unique, deduplicated list sorted by specificity (longest first).
 */
export function expandToParentCategories(categoryIds: string[]): string[] {
    const allPrefixes = new Set<string>();

    for (const catId of categoryIds) {
        const parts = catId.split("-");
        for (let i = 1; i <= parts.length; i++) {
            allPrefixes.add(parts.slice(0, i).join("-"));
        }
    }

    return Array.from(allPrefixes).sort((a, b) => b.length - a.length);
}
