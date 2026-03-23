# service-jobs-worker

Background job processing service for Shopwise. Executes scheduled and on-demand jobs for scoring, ranking, bundle generation, graph construction, and currency updates.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Messaging**: SQS (long-polling consumer via `@repo/event-toolkit`)
- **Database**: PostgreSQL via Prisma
- **External APIs**: Category embeddings service, currency exchange API
- **Build**: esbuild
- **Deploy**: Docker (multi-stage) on ECS

## Jobs

| Job Type | Schedule | Description |
|---|---|---|
| `TRENDING` | Hourly | Calculates trending scores based on engagement (clicks, recency, persistence) |
| `BEST_SELLER` | Hourly | Calculates best seller scores based on orders and revenue |
| `GRAPH_WEIGHTS_DAILY` | 2:00 AM | Populates ProductGraph and CategoryGraph from order data |
| `BUNDLE_GENERATE` | 3:00 AM | Generates product bundles for "Frequently Bought Together" recommendations |
| `CURRENCY` | Daily | Updates currency exchange rates |

## Documentation

- **[Bundle Generation System](./docs/BUNDLES.md)** -- Complete documentation of the self-optimizing bundle engine

## Project Structure

```
src/
├── main.ts               # Entry point: SQS polling + health server
├── config/               # Scoring weights, thresholds, batch sizes
├── routers/
│   └── job.router.ts     # Routes SQS messages to the correct handler
├── handlers/
│   ├── trending.handler.ts
│   ├── best-sellers.handler.sqs.ts
│   ├── graph.weights.ts
│   ├── bundles.generator.v2.ts
│   └── currency.handler.ts
├── utils/
│   ├── batchProcess.ts   # Batch DB write utility
│   ├── jobCheckpoint.ts  # Job progress checkpointing
│   └── jobWindow.ts      # Time window calculations
└── db/                   # Prisma client
```

## Scripts

```bash
pnpm dev              # Dev mode with hot reload (tsx watch)
pnpm build            # Production build (esbuild)
pnpm test             # Run tests (vitest)
pnpm lint             # ESLint

# Trigger jobs via SQS
pnpm trigger:trending
pnpm trigger:best-seller
pnpm trigger:currency

# Bundle tooling
pnpm bundle:v2                   # Run bundle generation (all shops)
pnpm bundle:v2:dev-recommender   # Run for dev store only
pnpm bundle:v2:preview           # Preview bundles without writing
pnpm bundle:v2:compare           # Compare v2 bundles vs current
pnpm bundle:v2:compare:html      # HTML comparison report

# Seed scripts
pnpm features:seed               # Seed product features
pnpm graphs:seed                 # Seed graph data

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
| `JOB_QUEUE_URL` | SQS URL for job messages |
| `CATEGORY_EMBEDDINGS_URL` | URL for category embeddings service (default: `http://localhost:8003`) |
| `CURRENCY_API_KEY` | API key for currency exchange rates |
| `CURRENCY_BUCKET` | S3 bucket for currency data |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Health check port (default: `3000`) |

## Deployment

Deploys as a Docker container to **AWS ECS**. The container runs as a non-root user and exposes a `/health` endpoint for ALB health checks. Polls a single SQS queue and routes messages to handlers based on job type.
