/**
 * Leaky Bucket Algorithm
 *
 * A token bucket that refills at a constant rate.
 * Used for distributed rate limiting.
 */

import type { BucketConfig, BucketState, ConsumeResult } from './types';

/**
 * Calculate current tokens after applying refill based on elapsed time.
 */
export function calculateCurrentTokens(state: BucketState, config: BucketConfig): number {
  const now = Date.now();
  const elapsed = (now - state.lastRefill) / 1000; // seconds
  const refilled = elapsed * config.refillRate;
  return Math.min(state.tokens + refilled, config.maxTokens);
}

/**
 * Get wait time in ms until enough tokens are available.
 * Returns 0 if request can proceed immediately.
 */
export function getWaitTime(
  state: BucketState,
  config: BucketConfig,
  cost: number = config.tokensPerRequest ?? 1,
): number {
  const currentTokens = calculateCurrentTokens(state, config);

  if (currentTokens >= cost) {
    return 0; // Can proceed immediately
  }

  // Calculate how long to wait for enough tokens
  const tokensNeeded = cost - currentTokens;
  const waitSeconds = tokensNeeded / config.refillRate;
  return Math.ceil(waitSeconds * 1000); // Convert to ms
}

/**
 * Consume tokens from the bucket.
 * Returns new state with updated tokens and lastRefill.
 */
export function consume(
  state: BucketState,
  config: BucketConfig,
  cost: number = config.tokensPerRequest ?? 1,
): BucketState {
  const now = Date.now();
  const elapsed = (now - state.lastRefill) / 1000;
  const refilled = elapsed * config.refillRate;
  const currentTokens = Math.min(state.tokens + refilled, config.maxTokens);

  console.log(
    `[leaky-bucket] 🔄 Refill: stored=${state.tokens.toFixed(0)}, elapsed=${elapsed.toFixed(2)}s, refilled=${refilled.toFixed(0)}, current=${currentTokens.toFixed(0)}, cost=${cost}`,
  );

  return {
    tokens: Math.max(0, currentTokens - cost),
    lastRefill: now,
  };
}

/**
 * Try to consume tokens, returning whether allowed and wait time if not.
 */
export function tryConsume(
  state: BucketState,
  config: BucketConfig,
  cost: number = config.tokensPerRequest ?? 1,
): ConsumeResult {
  const waitMs = getWaitTime(state, config, cost);

  if (waitMs > 0) {
    return {
      allowed: false,
      waitMs,
      newState: state,
    };
  }

  return {
    allowed: true,
    waitMs: 0,
    newState: consume(state, config, cost),
  };
}

/**
 * Create initial bucket state at full capacity.
 */
export function createInitialState(config: BucketConfig): BucketState {
  return {
    tokens: config.maxTokens,
    lastRefill: Date.now(),
  };
}

/**
 * Sleep for the specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until tokens are available, then consume.
 */
export async function acquireTokens(
  state: BucketState,
  config: BucketConfig,
  cost: number = config.tokensPerRequest ?? 1,
): Promise<BucketState> {
  const waitMs = getWaitTime(state, config, cost);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  return consume(state, config, cost);
}
