/**
 * Rate-Limited Shopify GraphQL Client
 */

import type { ShopifyClientConfig, ShopifyClient, ShopifyGraphQLResponse } from './types';
import { SHOPIFY_BUCKET_CONFIG } from './types';
import { createShopifyRateLimiter } from './rate-limiter';
import { withBackoff } from '../lib/backoff';

const DEFAULT_API_VERSION = '2024-01';

/**
 * Create a rate-limited Shopify GraphQL client.
 */
export function createShopifyClient(config: ShopifyClientConfig): ShopifyClient {
  const {
    shop,
    accessToken,
    apiVersion = DEFAULT_API_VERSION,
    dynamoTableName: _dynamoTableName,
    enableRateLimit = true,
  } = config;

  const rateLimiter = enableRateLimit ? createShopifyRateLimiter() : null;

  const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

  async function executeRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
    // Acquire rate limit slot
    if (rateLimiter) {
      await rateLimiter.acquire(shop, SHOPIFY_BUCKET_CONFIG.tokensPerRequest);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    // Handle rate limit response
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const error = new Error('Shopify rate limit exceeded') as any;
      error.status = 429;
      error.headers = { 'retry-after': retryAfter };
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Shopify API error: ${response.status}`) as any;
      error.status = response.status;
      throw error;
    }

    const json: ShopifyGraphQLResponse<T> = await response.json();

    // Sync rate limit state from response
    if (rateLimiter && json.extensions?.cost?.throttleStatus) {
      await rateLimiter.release(
        shop,
        json.extensions.cost.actualQueryCost,
        json.extensions.cost.throttleStatus,
      );
    }

    // Check for GraphQL errors
    if (json.errors && json.errors.length > 0) {
      const error = new Error(json.errors[0].message) as any;
      error.graphqlErrors = json.errors;
      throw error;
    }

    return json.data as T;
  }

  return {
    async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
      const result = await withBackoff(() => executeRequest<T>(query, variables));

      if (!result.success) {
        throw result.error;
      }

      return result.data!;
    },

    async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
      // Same implementation as query - GraphQL doesn't differentiate
      const result = await withBackoff(() => executeRequest<T>(mutation, variables));

      if (!result.success) {
        throw result.error;
      }

      return result.data!;
    },
  };
}
