/**
 * Shopify Rate Limiter
 *
 * Per-shop rate limiting using the leaky bucket algorithm.
 */

import type { BucketConfig, BucketState } from '../lib/types';
import type { ShopifyThrottleStatus } from './types';
import { SHOPIFY_BUCKET_CONFIG } from './types';
import { consume, getWaitTime, createInitialState, sleep } from '../lib/leaky-bucket';

export interface ShopifyRateLimiter {
  /** Check if request can proceed, wait if necessary */
  acquire(shop: string, estimatedCost?: number): Promise<void>;

  /** Update state after request completes (use actual cost from response) */
  release(shop: string, actualCost: number, throttleStatus?: ShopifyThrottleStatus): Promise<void>;

  /** Sync with Shopify's reported state */
  sync(shop: string, throttleStatus: ShopifyThrottleStatus): Promise<void>;
}

/**
 * Create a rate limiter for Shopify.
 * Only supports in-memory state with header syncing.
 */
export function createShopifyRateLimiter(): ShopifyRateLimiter {
  // In-memory store: shop domain -> bucket state
  const localStore = new Map<string, BucketState>();

  // Per-shop mutex to serialize concurrent acquire calls
  const shopLocks = new Map<string, Promise<void>>();

  const getBucketState = (shop: string): { state: BucketState; config: BucketConfig } => {
    let stored = localStore.get(shop);
    if (!stored) {
      stored = createInitialState(SHOPIFY_BUCKET_CONFIG);
      localStore.set(shop, stored);
    }
    return { state: stored, config: SHOPIFY_BUCKET_CONFIG };
  };

  const setBucketState = (shop: string, state: BucketState): void => {
    localStore.set(shop, state);
  };

  // Acquire the per-shop lock
  const withLock = async <T>(shop: string, fn: () => Promise<T>): Promise<T> => {
    // Wait for any existing lock on this shop
    const existingLock = shopLocks.get(shop);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    shopLocks.set(shop, lockPromise);

    try {
      return await fn();
    } finally {
      releaseLock!();
      // Clean up if this is still our lock
      if (shopLocks.get(shop) === lockPromise) {
        shopLocks.delete(shop);
      }
    }
  };

  return {
    async acquire(shop: string, estimatedCost: number = SHOPIFY_BUCKET_CONFIG.tokensPerRequest!) {
      // Use mutex to serialize parallel requests for the same shop
      await withLock(shop, async () => {
        let { state, config } = getBucketState(shop);
        const waitMs = getWaitTime(state, config, estimatedCost);

        // Wait if bucket is low
        if (waitMs > 0) {
          console.log(
            `[shopify-ratelimit] ⏳ ${shop}: Bucket low, waiting ${waitMs}ms before request`,
          );
          await sleep(waitMs);
          // Re-read state after waiting (may have refilled)
          const updated = getBucketState(shop);
          state = updated.state;
          config = updated.config;
        }

        // Pre-consume estimated cost
        const newState = consume(state, config, estimatedCost);
        setBucketState(shop, newState);

        console.log(
          `[shopify-ratelimit] 🪣 ${shop}: Bucket ${Math.floor(newState.tokens)}/${config.maxTokens} points (cost: ${estimatedCost})`,
        );
      });
    },

    async release(shop: string, actualCost: number, throttleStatus?: ShopifyThrottleStatus) {
      // If we have throttle status from the response, sync with Shopify's actual state
      if (throttleStatus) {
        await this.sync(shop, throttleStatus);
      }
    },

    async sync(shop: string, status: ShopifyThrottleStatus) {
      // Update local state directly with authoritative values from Shopify
      // Note: We use the max(current, status) for tokens if we wanted to be conservative,
      // but status.currentlyAvailable IS the truth effectively.

      // However, to prevent race conditions where a parallel request might have consumed
      // while we were waiting, we should be careful.
      // But since we are replacing "Local + Sync", overwriting is the intended behavior
      // to correct drift.

      const newState: BucketState = {
        tokens: status.currentlyAvailable,
        lastRefill: Date.now(),
      };

      setBucketState(shop, newState);

      // Also update config if it changed (e.g. 4000 limit)
      if (status.maximumAvailable !== SHOPIFY_BUCKET_CONFIG.maxTokens) {
        SHOPIFY_BUCKET_CONFIG.maxTokens = status.maximumAvailable;
        SHOPIFY_BUCKET_CONFIG.refillRate = status.restoreRate;
      }
    },
  };
}
