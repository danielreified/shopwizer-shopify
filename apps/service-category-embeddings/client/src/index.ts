/**
 * Category Recommender Client
 *
 * TypeScript client for the Word2Vec category recommendation service.
 *
 * @example
 * import { getSimilarCategories, getSimilarForCart } from '@repo/recommender-client';
 *
 * // Get categories similar to one category
 * const similar = await getSimilarCategories('aa-1-1-1', { topN: 5 });
 *
 * // Get categories similar to a cart (multiple categories)
 * const cartRecs = await getSimilarForCart(['aa-1-1-1', 'el-5-2'], 10);
 */

const RECOMMENDER_URL = process.env.RECOMMENDER_URL || 'http://localhost:8000';

export interface CategoryScore {
  category_id: string;
  score: number;
}

export interface HealthCheckResult {
  status: string;
  vocab_size: number;
}

export interface SimilarOptions {
  topN?: number;
  filterCategories?: string[];
}

/**
 * Get categories similar to a single category.
 *
 * @param categoryId - The category to find similar categories for
 * @param options - Optional configuration
 * @returns Array of similar categories with scores
 */
export async function getSimilarCategories(
  categoryId: string,
  options: SimilarOptions = {},
): Promise<CategoryScore[]> {
  const { topN = 10, filterCategories = [] } = options;

  try {
    const response = await fetch(`${RECOMMENDER_URL}/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: categoryId,
        top_n: topN,
        filter_categories: filterCategories,
      }),
    });

    if (!response.ok) {
      console.error(`[Recommender] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('[Recommender] Request failed:', error);
    return [];
  }
}

/**
 * Get categories similar to multiple input categories (e.g., a shopping cart).
 *
 * Combines the embeddings of all input categories to find
 * categories that go well with the entire cart.
 *
 * @param categoryIds - Array of category IDs in the cart
 * @param topN - Number of recommendations to return
 * @returns Array of recommended categories with scores
 */
export async function getSimilarForCart(
  categoryIds: string[],
  topN: number = 10,
): Promise<CategoryScore[]> {
  if (!categoryIds.length) {
    return [];
  }

  try {
    const response = await fetch(`${RECOMMENDER_URL}/similar-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_ids: categoryIds,
        top_n: topN,
      }),
    });

    if (!response.ok) {
      console.error(`[Recommender] Error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('[Recommender] Request failed:', error);
    return [];
  }
}

/**
 * Check if the recommender service is healthy.
 *
 * @returns Health status including vocab size
 */
export async function healthCheck(): Promise<HealthCheckResult | null> {
  try {
    const response = await fetch(`${RECOMMENDER_URL}/health`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Recommender] Health check failed:', error);
    return null;
  }
}
