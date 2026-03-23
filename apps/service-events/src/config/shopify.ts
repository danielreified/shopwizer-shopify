/**
 * Shopify configuration - re-exports shared rate limit wrapper
 */

// Re-export from shared package
export { withShopifyRateLimit, initShopifyRateLimiter } from '@repo/api-client';
