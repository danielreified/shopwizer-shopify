/**
 * Exponential Backoff with Jitter
 *
 * Retries failed requests with exponentially increasing delays.
 */

import type { BackoffConfig, BackoffResult } from './types';
import { MaxRetriesError } from './types';

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialDelayMs: 100,
  maxDelayMs: 30000,
  maxRetries: 5,
  multiplier: 2,
  jitter: true,
};

/**
 * Determine if an error is retryable.
 * Retries on: 429, 500, 502, 503, 504
 * No retry on: 400, 401, 403, 404
 */
export function isRetryableError(error: any): boolean {
  // Check for HTTP status code
  const status = error.status ?? error.statusCode ?? error.response?.status;

  if (typeof status === 'number') {
    // Rate limit
    if (status === 429) return true;
    // Server errors
    if (status >= 500 && status < 600) return true;
    // Client errors (do not retry)
    if (status >= 400 && status < 500) return false;
  }

  // Network errors are retryable
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Calculate delay for a given attempt.
 * delay = min(initialDelay * (multiplier ^ attempt), maxDelay)
 * With jitter: delay * (0.5 + random() * 0.5)
 */
export function calculateDelay(attempt: number, config: BackoffConfig): number {
  const baseDelay = config.initialDelayMs * Math.pow(config.multiplier, attempt);
  const cappedDelay = Math.min(baseDelay, config.maxDelayMs);

  if (config.jitter) {
    // Add jitter: 50-100% of the delay
    return Math.floor(cappedDelay * (0.5 + Math.random() * 0.5));
  }

  return cappedDelay;
}

/**
 * Extract Retry-After header value in ms.
 */
export function getRetryAfter(error: any): number | null {
  const retryAfter = error.headers?.['retry-after'] ?? error.response?.headers?.['retry-after'];

  if (!retryAfter) return null;

  // Could be seconds (number) or HTTP date
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as date
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
}

/**
 * Sleep for the specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry logic.
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<BackoffConfig> = {},
  shouldRetry?: (error: Error) => boolean,
): Promise<BackoffResult<T>> {
  const cfg = { ...DEFAULT_BACKOFF_CONFIG, ...config };
  const retryCheck = shouldRetry ?? isRetryableError;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!retryCheck(error as Error)) {
        return {
          success: false,
          error: lastError,
          attempts: attempt + 1,
        };
      }

      // Don't sleep after the last attempt
      if (attempt < cfg.maxRetries) {
        // Use Retry-After header if present, otherwise calculate delay
        const retryAfter = getRetryAfter(error);
        const delay = retryAfter ?? calculateDelay(attempt, cfg);

        console.log(`[backoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

        await sleep(delay);
      }
    }
  }

  // Max retries exceeded
  throw new MaxRetriesError(cfg.maxRetries + 1, lastError!);
}

/**
 * Create a backoff wrapper with preset config.
 */
export function createBackoff(config: Partial<BackoffConfig> = {}) {
  const cfg = { ...DEFAULT_BACKOFF_CONFIG, ...config };

  return <T>(fn: () => Promise<T>, shouldRetry?: (error: Error) => boolean) =>
    withBackoff(fn, cfg, shouldRetry);
}
