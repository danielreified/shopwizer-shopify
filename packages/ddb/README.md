# @repo/ddb

DynamoDB document client helpers for managing product enrichment state. Tracks per-field hashes so the enrichment pipeline can skip reprocessing unchanged products.

## Table Structure

- **Partition key**: `<shop>#<productId>`
- **Sort key**: `enrich#v<version>`
- TTL-enabled, on-demand billing

## Exports

- `makeKeys(shop, productId, version?)` — generate DynamoDB key pair
- `getEnrichState(args)` — fetch enrichment state (hashes, timestamps)
- `updateEnrichState(args)` — write hash map after enrichment
- `deleteEnrichStates(args)` — delete all versions of enrichment state for a product
- `shouldComputeEmbedding(args)` — check if embedding hash has changed (legacy)
- `EnrichState` — type for the state record

## Usage

```ts
import { getEnrichState, updateEnrichState } from '@repo/ddb';

const state = await getEnrichState({ shop: 'example.myshopify.com', productId: '123' });

await updateEnrichState({
  shop: 'example.myshopify.com',
  productId: '123',
  hashes: { embedding: 'abc123', attributes: 'def456' },
});
```

## Configuration

Requires the `ENRICH_STATE_TABLE_NAME` environment variable.

## Scripts

```bash
pnpm build  # Compile TypeScript
pnpm dev    # Watch mode
pnpm lint   # Run ESLint
```
