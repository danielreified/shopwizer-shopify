# service-events

Shopify webhook and event ingestion service. Receives product, order, and checkout events from EventBridge/SQS, processes them, and persists data to the database.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Messaging**: SQS (long-polling consumer via `@repo/event-toolkit`)
- **Database**: PostgreSQL via Prisma
- **APIs**: Shopify Admin API (GraphQL)
- **Build**: esbuild
- **Deploy**: Docker (multi-stage) on ECS

## What It Does

1. **Products** -- Receives product create/update/delete webhooks. Extracts attributes (colors, materials), resolves categories, converts currencies, and enriches product records.
2. **Products (Bulk)** -- Handles bulk product import events from S3 file processing.
3. **Orders** -- Processes order creation events. Updates order records, product sales data, and usage alerts.
4. **Checkouts** -- Processes checkout create/update events.

## Project Structure

```
src/
├── main.ts               # Entry point: SQS polling + health server
├── config/               # Service configuration
├── adapters/             # Webhook payload adapters (product, order, checkout)
├── handlers/             # SQS message handlers
│   ├── products.sqs.ts
│   ├── orders.sqs.ts
│   └── checkouts.sqs.ts
├── services/             # Business logic
│   ├── product.service.ts
│   ├── product.category.ts
│   ├── product.enrichment.ts
│   ├── shop.service.ts
│   └── usage.alerts.ts
├── transformers/         # Data transformation utilities
├── db/                   # Prisma client
└── utils/
```

## Scripts

```bash
pnpm dev              # Dev mode with hot reload (tsx watch)
pnpm build            # Production build (esbuild)
pnpm test             # Run tests (vitest)
pnpm lint             # ESLint

# Docker / ECS
pnpm docker:build     # Build Docker image
pnpm docker:push      # Push to ECR
pnpm docker:deploy    # Deploy to ECS
pnpm ecs:start        # Start ECS service
pnpm ecs:stop         # Stop ECS service
pnpm ecs:status       # Check status
pnpm ecs:logs         # Tail logs
```

## Environment Variables

| Variable | Description |
|---|---|
| `PRODUCTS_QUEUE_URL` | SQS URL for product webhooks |
| `PRODUCTS_BULK_QUEUE_URL` | SQS URL for bulk product imports |
| `CHECKOUTS_QUEUE_URL` | SQS URL for checkout events |
| `ORDERS_QUEUE_URL` | SQS URL for order events |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Health check port (default: `3000`) |

## Deployment

Deploys as a Docker container to **AWS ECS**. The container runs as a non-root user and exposes a `/health` endpoint for ALB health checks. All SQS queues are polled concurrently.
