/**
 * Shopify-specific types
 */

export interface ShopifyClientConfig {
  /** Shop domain, e.g., "my-store.myshopify.com" */
  shop: string;
  /** Shopify Admin API access token */
  accessToken: string;
  /** API version (e.g., "2024-01") */
  apiVersion?: string;
  /** DynamoDB table name for rate limiting */
  dynamoTableName?: string;
  /** Enable rate limiting (default: true) */
  enableRateLimit?: boolean;
}

export interface ShopifyThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

export interface ShopifyQueryCost {
  requestedQueryCost: number;
  actualQueryCost: number;
  throttleStatus: ShopifyThrottleStatus;
}

export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, any>;
  }>;
  extensions?: {
    cost?: ShopifyQueryCost;
  };
}

export interface ShopifyClient {
  /** Execute GraphQL query with automatic rate limiting & retry */
  query<T = any>(query: string, variables?: Record<string, any>): Promise<T>;

  /** Execute GraphQL mutation with automatic rate limiting & retry */
  mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T>;
}

/**
 * Shopify rate limit bucket configuration.
 * Bucket: 1000 points max, restores 50 points/second.
 */
export const SHOPIFY_BUCKET_CONFIG = {
  maxTokens: 1000,
  refillRate: 50,
  tokensPerRequest: 50, // Estimated default cost
};
