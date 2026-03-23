/**
 * Shared Shopify Rate Limit Wrapper
 *
 * Provides a unified rate-limited fetch wrapper for Shopify GraphQL requests.
 * Syncs with Shopify's actual throttleStatus from response.
 */

import { createShopifyRateLimiter, type ShopifyRateLimiter } from './rate-limiter';
import { SHOPIFY_BUCKET_CONFIG } from './types';

// --------------------------------------------------------
// Singleton Rate Limiter
// --------------------------------------------------------

let rateLimiter: ShopifyRateLimiter | null = null;

export interface ShopifyRateLimitConfig {
  /** DynamoDB table for distributed rate limiting (optional) */
  tableName?: string;
  /** AWS region for DynamoDB */
  region?: string;
}

/**
 * Initialize the Shopify rate limiter singleton.
 * Call this at app startup with your config.
 */
export function initShopifyRateLimiter(_config?: ShopifyRateLimitConfig): ShopifyRateLimiter {
  if (!rateLimiter) {
    // DynamoDB distributed mode removed - now uses in-memory with header sync only
    rateLimiter = createShopifyRateLimiter();

    console.log(`[shopify] Rate limiter initialized:`, {
      mode: 'in-memory',
      maxPoints: SHOPIFY_BUCKET_CONFIG.maxTokens,
      refillRate: SHOPIFY_BUCKET_CONFIG.refillRate,
    });
  }
  return rateLimiter;
}

/**
 * Get the rate limiter singleton (auto-inits with in-memory if not initialized).
 */
function getRateLimiter(): ShopifyRateLimiter {
  if (!rateLimiter) {
    // Auto-init with env vars if available
    // Auto-init with in-memory (Local + Sync strategy)
    // We skip DynamoDB to avoid race conditions; synchronization happens via response headers.
    return initShopifyRateLimiter();
  }
  return rateLimiter;
}

/**
 * Parse throttleStatus from GraphQL response extensions.
 */
function parseThrottleStatus(
  json: any,
): { currentlyAvailable: number; maximumAvailable: number; restoreRate: number } | null {
  try {
    const throttle = json?.extensions?.cost?.throttleStatus;
    if (throttle && typeof throttle.currentlyAvailable === 'number') {
      return {
        currentlyAvailable: throttle.currentlyAvailable,
        maximumAvailable: throttle.maximumAvailable ?? 1000,
        restoreRate: throttle.restoreRate ?? 50,
      };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

/**
 * Execute a Shopify GraphQL request with per-shop rate limiting.
 *
 * Features:
 * - Per-shop leaky bucket algorithm
 * - Syncs with Shopify's actual throttleStatus from response
 * - Waits automatically when bucket is low
 *
 * @param shop - Shop domain (e.g., "my-store.myshopify.com")
 * @param fn - Async function that returns a fetch Response
 * @param estimatedCost - Estimated query cost (default: 50)
 */
export async function withShopifyRateLimit<T extends Response>(
  shop: string,
  fn: () => Promise<T>,
  estimatedCost: number = SHOPIFY_BUCKET_CONFIG.tokensPerRequest ?? 50,
): Promise<T> {
  const limiter = getRateLimiter();
  const startTime = Date.now();

  // Consume tokens from the shop's bucket (waits if bucket is empty)
  await limiter.acquire(shop, estimatedCost);
  const waitTime = Date.now() - startTime;
  if (waitTime > 50) {
    console.log(`[shopify/ratelimit] ⏳ Waited ${waitTime}ms for ${shop} (bucket was low)`);
  }

  try {
    const response = await fn();
    const duration = Date.now() - startTime;

    // Clone response to read body without consuming it
    const cloned = response.clone();
    try {
      const json = await cloned.json();
      const throttle = parseThrottleStatus(json);

      if (throttle) {
        // Sync with Shopify's actual bucket state
        await limiter.sync(shop, {
          currentlyAvailable: throttle.currentlyAvailable,
          maximumAvailable: throttle.maximumAvailable,
          restoreRate: throttle.restoreRate,
        });
        console.log(
          `[shopify/ratelimit] 🔄 Synced: ${throttle.currentlyAvailable}/${throttle.maximumAvailable} points (${duration}ms)`,
        );
      } else {
        console.log(
          `[shopify/ratelimit] 📊 ${shop} completed in ${duration}ms (cost: ${estimatedCost})`,
        );
      }
    } catch (e) {
      // JSON parse failed, log without sync
      console.log(
        `[shopify/ratelimit] 📊 ${shop} completed in ${duration}ms (cost: ${estimatedCost})`,
      );
    }

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[shopify/ratelimit] ❌ ${shop} failed after ${duration}ms:`, {
      status: error?.status,
      message: error?.message?.slice(0, 100),
    });
    if (error?.status === 429) {
      console.error(`[shopify/ratelimit] ❌ Rate limit exceeded for ${shop} (429)`);
    }
    throw error;
  }
}
