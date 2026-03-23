# @repo/event-contracts

Zod-validated event schemas for inter-service communication via EventBridge and SQS. Defines the typed contract between services so producers and consumers stay in sync.

## Exports

### Event Sources & Detail Types

- `Sources` — enum of service identifiers (`SERVICE_EVENTS`, `SERVICE_BULK_PRODUCTS`, `SERVICE_JOBS`, `SERVICE_APP`)
- `DetailTypes` — enum of event types (`PRODUCT_BULK`, `PRODUCT_ENRICH`, `SHOP_SYNC_COMPLETE`, `ANALYTICS_EVENT`, `EMAIL_SEND`, `JOB_SCHEDULE`)

### Event Schemas

- `EnrichPayloadSchema` — Zod schema for product enrichment events (includes product metadata, text fields, and category data)
- `safeParseEnrich(input)` — runtime validator that throws on invalid payloads
- `ShopSyncPayloadSchema` — Zod schema for shop sync completion events

### Publisher

- `publish(opts)` — publish an event to EventBridge with automatic correlation ID tracking

### Types

- `EnrichPayload`, `EnrichMeta`, `EnrichData`
- `ShopSyncPayload`
- `Source`, `DetailType`
- `EventMeta`

## Usage

```ts
import { publish, Sources, DetailTypes, EnrichPayloadSchema } from '@repo/event-contracts';

// Publish an event
await publish({
  source: Sources.SERVICE_EVENTS,
  detailType: DetailTypes.PRODUCT_ENRICH,
  detail: payload,
});

// Validate incoming event
const parsed = EnrichPayloadSchema.parse(rawEvent);
```

## Scripts

```bash
pnpm build  # Compile TypeScript
pnpm dev    # Watch mode
pnpm test   # Run vitest
pnpm lint   # Run ESLint
```
