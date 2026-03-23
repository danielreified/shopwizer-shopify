/**
 * Shared types for the api-client package
 */

// ============================================================
// Bucket Configuration & State
// ============================================================

export interface BucketConfig {
  /** Maximum tokens/points in the bucket */
  maxTokens: number;
  /** Tokens restored per second */
  refillRate: number;
  /** Cost per request (default 1) */
  tokensPerRequest?: number;
}

export interface BucketState {
  /** Current available tokens */
  tokens: number;
  /** Unix timestamp (ms) of last refill calculation */
  lastRefill: number;
}

// Backoff Configuration
// ============================================================

export interface BackoffConfig {
  /** Starting delay in ms (e.g., 100) */
  initialDelayMs: number;
  /** Maximum delay cap in ms (e.g., 30000) */
  maxDelayMs: number;
  /** Maximum retry attempts (e.g., 5) */
  maxRetries: number;
  /** Delay multiplier (e.g., 2) */
  multiplier: number;
  /** Add randomness to prevent thundering herd */
  jitter: boolean;
}

export interface BackoffResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

// ============================================================
// Errors
// ============================================================

export class RateLimitError extends Error {
  /** How long to wait before retry (ms) */
  waitMs: number;
  /** Service name */
  service: string;

  constructor(message: string, waitMs: number, service: string) {
    super(message);
    this.name = 'RateLimitError';
    this.waitMs = waitMs;
    this.service = service;
  }
}

export class MaxRetriesError extends Error {
  /** Number of attempts made */
  attempts: number;
  /** The last error that occurred */
  lastError: Error;

  constructor(attempts: number, lastError: Error) {
    super(`Max retries (${attempts}) exceeded: ${lastError.message}`);
    this.name = 'MaxRetriesError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

// ============================================================
// Consume Result
// ============================================================

export interface ConsumeResult {
  /** Whether the request is allowed to proceed */
  allowed: boolean;
  /** Time to wait in ms (0 if allowed) */
  waitMs: number;
  /** New bucket state after consume */
  newState: BucketState;
}
