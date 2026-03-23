// Central OpenAI configuration for the enrich service
import OpenAI from 'openai';
import { createOpenAIRateLimiter, type OpenAIRateLimiter } from '@repo/api-client';
import { logger } from '@repo/logger';

import { AI_CONFIG } from './service.config';

/**
 * Default OpenAI model for LLM operations
 */
export const OPENAI_MODEL = AI_CONFIG.DEFAULT_MODEL;

// --------------------------------------------------------
// Clients (Singletons)
// --------------------------------------------------------

let rateLimiter: OpenAIRateLimiter | null = null;
let openaiClient: OpenAI | null = null;

/**
 * Get the rate limiter (singleton, lazy init)
 */
function getRateLimiter(): OpenAIRateLimiter {
  if (!rateLimiter) {
    rateLimiter = createOpenAIRateLimiter();
    logger.debug('OpenAI rate limiter initialized (reactive backoff mode)');
  }
  return rateLimiter;
}

/**
 * Get the OpenAI client (singleton)
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return openaiClient;
}

// --------------------------------------------------------
// Rate-Limited API Wrappers
// --------------------------------------------------------

/**
 * Execute an OpenAI request with automatic retry on 429/5xx
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const limiter = getRateLimiter();
  return limiter.withRetry(fn);
}

/**
 * Make a responses.create call with automatic retry on rate limit
 */
export async function rateLimitedResponses(
  options: Parameters<OpenAI['responses']['create']>[0],
): Promise<OpenAI.Responses.Response> {
  return withRetry(async () => {
    const client = getOpenAIClient();
    const result = await client.responses.create({ ...options, stream: false });
    return result as OpenAI.Responses.Response;
  });
}

/**
 * Make an embeddings.create call with automatic retry on rate limit
 */
export async function rateLimitedEmbeddings(
  options: Parameters<OpenAI['embeddings']['create']>[0],
): Promise<OpenAI.Embeddings.CreateEmbeddingResponse> {
  return withRetry(async () => {
    const client = getOpenAIClient();
    return await client.embeddings.create(options);
  });
}
