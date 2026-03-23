/**
 * @repo/api-client
 *
 * Rate-limited API clients for Shopify GraphQL and OpenAI.
 * Uses a leaky bucket algorithm with In-Memory state and Header Syncing.
 */

// Core library exports
export * from './lib/types';
export * from './lib/leaky-bucket';
export * from './lib/backoff';

// Shopify client
export { createShopifyClient } from './shopify';
export { createShopifyRateLimiter } from './shopify/rate-limiter';
export { SHOPIFY_BUCKET_CONFIG } from './shopify';
export type { ShopifyClient, ShopifyClientConfig, ShopifyRateLimiter } from './shopify';
export {
  withShopifyRateLimit,
  initShopifyRateLimiter,
  type ShopifyRateLimitConfig,
} from './shopify';

// OpenAI client
export { createOpenAIClient } from './openai';
export { createOpenAIRateLimiter } from './openai';
export type { OpenAIClient, OpenAIClientConfig, OpenAIRateLimiter } from './openai';
