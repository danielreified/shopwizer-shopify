/**
 * Rate-Limited OpenAI Client
 */

import OpenAI from 'openai';
import type {
  OpenAIClientConfig,
  OpenAIClient,
  ChatMessage,
  ChatOptions,
  ChatCompletion,
  Embedding,
} from './types';
import { createOpenAIRateLimiter } from './rate-limiter';
import { withBackoff } from '../lib/backoff';

const DEFAULT_MODEL = 'gpt-5-nano';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Create a rate-limited OpenAI client.
 */
export function createOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  const {
    apiKey,
    organization,
    rateLimitRPM = 60,
    dynamoTableName: _dynamoTableName,
    enableRateLimit = true,
  } = config;

  const openai = new OpenAI({
    apiKey,
    organization,
  });

  const rateLimiter = enableRateLimit ? createOpenAIRateLimiter(rateLimitRPM) : null;

  /**
   * Parse rate limit headers from response.
   */
  function parseRateLimitHeaders(response: any) {
    return {
      remainingRequests: response.headers?.['x-ratelimit-remaining-requests']
        ? parseInt(response.headers['x-ratelimit-remaining-requests'], 10)
        : undefined,
      remainingTokens: response.headers?.['x-ratelimit-remaining-tokens']
        ? parseInt(response.headers['x-ratelimit-remaining-tokens'], 10)
        : undefined,
      resetRequests: response.headers?.['x-ratelimit-reset-requests'],
      resetTokens: response.headers?.['x-ratelimit-reset-tokens'],
    };
  }

  return {
    async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatCompletion> {
      const result = await withBackoff(async () => {
        // Acquire rate limit slot
        if (rateLimiter) {
          await rateLimiter.acquire();
        }

        console.log('[options.model]: ', options.model);
        console.log('--------------------------------');
        console.log('--------------------------------');
        console.log('--------------------------------');

        const response = await openai.chat.completions.create({
          model: options.model ?? DEFAULT_MODEL,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.name ? { name: m.name } : {}),
          })) as OpenAI.ChatCompletionMessageParam[],
          ...(options.maxTokens !== undefined && {
            max_tokens: options.maxTokens,
          }),
          ...(options.topP !== undefined && { top_p: options.topP }),
          ...(options.frequencyPenalty !== undefined && {
            frequency_penalty: options.frequencyPenalty,
          }),
          ...(options.presencePenalty !== undefined && {
            presence_penalty: options.presencePenalty,
          }),
          ...(options.stop && { stop: options.stop }),
        });

        // Release rate limiter with headers
        if (rateLimiter) {
          await rateLimiter.release(parseRateLimitHeaders(response));
        }

        return {
          id: response.id,
          choices: response.choices.map((c) => ({
            index: c.index,
            message: {
              role: c.message.role,
              content: c.message.content ?? '',
            },
            finishReason: c.finish_reason ?? 'stop',
          })),
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
        };
      });

      if (!result.success) {
        throw result.error;
      }

      return result.data!;
    },

    async embed(input: string | string[]): Promise<Embedding[]> {
      const result = await withBackoff(async () => {
        // Acquire rate limit slot
        if (rateLimiter) {
          await rateLimiter.acquire();
        }

        const response = await openai.embeddings.create({
          model: DEFAULT_EMBEDDING_MODEL,
          input,
        });

        // Release rate limiter
        if (rateLimiter) {
          await rateLimiter.release(parseRateLimitHeaders(response));
        }

        return response.data.map((d) => ({
          index: d.index,
          embedding: d.embedding,
        }));
      });

      if (!result.success) {
        throw result.error;
      }

      return result.data!;
    },
  };
}
