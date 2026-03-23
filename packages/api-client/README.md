# @repo/api-client

Rate-limited API clients for Shopify GraphQL and OpenAI. Uses a leaky bucket algorithm with in-memory state and header syncing to stay within provider rate limits.

## Exports

### Root (`@repo/api-client`)

- `LeakyBucket` — generic token bucket rate limiter
- `exponentialBackoff` — retry helper with jitter
- All Shopify and OpenAI exports below

### Shopify (`@repo/api-client/shopify`)

- `createShopifyClient(config)` — GraphQL client with automatic cost-based throttling
- `createShopifyRateLimiter()` — standalone rate limiter instance
- `withShopifyRateLimit(fn)` — wrapper that applies rate limiting to any function
- `initShopifyRateLimiter(config)` — initialize the shared rate limiter singleton
- Types: `ShopifyClient`, `ShopifyClientConfig`, `ShopifyThrottleStatus`, `ShopifyGraphQLResponse`

### OpenAI (`@repo/api-client/openai`)

- `createOpenAIClient(config)` — chat and embedding client with rate limiting
- `createOpenAIRateLimiter()` — standalone rate limiter instance
- Types: `OpenAIClient`, `OpenAIClientConfig`, `ChatMessage`, `ChatOptions`, `ChatCompletion`, `Embedding`

## Usage

```ts
import { createShopifyClient } from '@repo/api-client/shopify';
import { createOpenAIClient } from '@repo/api-client/openai';

const shopify = createShopifyClient({ shop: 'example.myshopify.com', accessToken: '...' });
const openai = createOpenAIClient({ apiKey: '...' });
```

## Scripts

```bash
pnpm build      # Build with tsup (CJS + ESM + types)
pnpm dev        # Watch mode
pnpm clean      # Remove dist/
pnpm typecheck  # Type-check without emitting
pnpm lint       # Run ESLint
```
