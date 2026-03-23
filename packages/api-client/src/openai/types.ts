/**
 * OpenAI-specific types
 */

export interface OpenAIClientConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Organization ID (optional) */
  organization?: string;
  /** Requests per minute limit (default: 60) */
  rateLimitRPM?: number;
  /** Tokens per minute limit (optional, not enforced) */
  rateLimitTPM?: number;
  /** DynamoDB table name for rate limiting */
  dynamoTableName?: string;
  /** Enable rate limiting (default: true) */
  enableRateLimit?: boolean;
}

export interface OpenAIRateLimitHeaders {
  remainingRequests?: number;
  remainingTokens?: number;
  resetRequests?: string;
  resetTokens?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
}

export interface ChatCompletion {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Embedding {
  index: number;
  embedding: number[];
}

export interface OpenAIClient {
  /** Chat completion with rate limiting */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatCompletion>;

  /** Embeddings with rate limiting */
  embed(input: string | string[]): Promise<Embedding[]>;
}

/**
 * OpenAI rate limit bucket configuration (RPM-based).
 * Default: 60 requests per minute = 1 per second.
 */
export function createOpenAIBucketConfig(rpm: number = 60) {
  return {
    maxTokens: rpm,
    refillRate: rpm / 60, // tokens per second
    tokensPerRequest: 1,
  };
}
