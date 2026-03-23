/**
 * OpenAI Rate Limiter - Reactive Backoff Strategy
 *
 * Instead of pre-emptive rate limiting, this fires requests immediately
 * and backs off with exponential delay + jitter only when 429 is received.
 */

export interface OpenAIRateLimiter {
  /** No-op for compatibility - fires immediately */
  acquire(): Promise<void>;

  /** No-op for compatibility */
  release(headers: { remainingRequests?: number }): Promise<void>;

  /** Execute a function with retry on 429 */
  withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Sleep with jitter (±25%)
 */
function sleepWithJitter(ms: number): Promise<void> {
  const jitter = ms * 0.25 * (Math.random() * 2 - 1); // ±25%
  const actual = Math.max(100, ms + jitter);
  return new Promise((resolve) => setTimeout(resolve, actual));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Create a simple reactive rate limiter.
 * Does NOT pre-limit requests - just handles 429s with backoff.
 */
export function createOpenAIRateLimiter(
  _rpm: number = 60, // Ignored, kept for API compatibility
): OpenAIRateLimiter {
  return {
    // No-op - fire immediately
    async acquire() {
      // Do nothing - let the request proceed
    },

    // No-op - we don't track state
    async release(_headers: { remainingRequests?: number }) {
      // Do nothing
    },

    // Retry with exponential backoff + jitter on 429
    async withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
      const opts = { ...DEFAULT_OPTIONS, ...options };
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          lastError = error;
          const status = error?.status;

          // Only retry on 429 (rate limit) or 5xx (server errors)
          const isRetryable = status === 429 || (status >= 500 && status < 600);

          if (!isRetryable || attempt === opts.maxRetries) {
            console.error(
              `[openai-ratelimit] ❌ Request failed (status=${status}, attempt=${attempt + 1}/${opts.maxRetries + 1})`,
            );
            throw error;
          }

          const delay = getBackoffDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
          console.warn(
            `[openai-ratelimit] ⚠️ ${status === 429 ? 'Rate limited' : 'Server error'}. Retrying in ~${Math.round(delay)}ms (attempt ${attempt + 1}/${opts.maxRetries})...`,
          );

          await sleepWithJitter(delay);
        }
      }

      throw lastError;
    },
  };
}
