# service-analytics

Analytics aggregation service. Queries the pixel event data lake (Athena/S3) to compute product features, recommendation rail metrics, and co-purchase graphs.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Query Engine**: AWS Athena (Parquet data lake on S3)
- **Messaging**: SQS (long-polling consumer via `@repo/event-toolkit`)
- **Database**: PostgreSQL via Prisma
- **Build**: esbuild
- **Deploy**: Docker (multi-stage) on ECS

## What It Does

| Job | Description |
|---|---|
| `FEATURE_HOURLY` | Compute hourly product engagement features (views, clicks, carts, orders) |
| `FEATURE_VALIDATE_DAILY` | Daily snapshot validation of product features |
| `RAIL_HOURLY` | Compute hourly CTR and engagement metrics per recommendation rail |
| `RAIL_VALIDATE_DAILY` | Daily validation of rail metrics |
| `GRAPH_WEIGHTS_DAILY` | Update co-purchase graph edge weights with decay |
| `BUNDLE_METRICS_HOURLY` | Compute hourly performance metrics for bundle recommendations |
| `CATEGORY_GRAPH_REBUILD_90D` | Rebuild 90-day category co-purchase graph from Athena |
| `PRODUCT_GRAPH_REBUILD_90D` | Rebuild 90-day product co-purchase graph from Athena |

## Project Structure

```
src/
├── main.ts               # Entry point: SQS polling + health server
├── config/               # Athena, graph, and batch configuration
├── handlers/             # One handler per analytics job
│   ├── feature.hourly.sqs.ts
│   ├── feature.daily.sqs.ts
│   ├── feature.daily-snapshot.sqs.ts
│   ├── rail.hourly.metrics.sqs.ts
│   ├── graph.weights.daily.ts
│   ├── bundle.metrics.hourly.sqs.ts
│   ├── category.graph.rebuild.90d.ts
│   └── product.graph.rebuild.90d.ts
├── utils/
│   ├── athena.ts         # Athena query execution helpers
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

# Trigger individual jobs via SQS
pnpm trigger:feature-hourly
pnpm trigger:feature-validate-daily
pnpm trigger:rail-hourly
pnpm trigger:rail-validate-daily
pnpm trigger:category-graph-90d
pnpm trigger:product-graph-90d

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
| `ANALYTICS_QUEUE_URL` | SQS URL for analytics job messages |
| `ATHENA_DB` | Athena database name (default: `shopwizer_px`) |
| `ATHENA_OUTPUT` | S3 path for Athena query results |
| `FEATURE_SNAPSHOT_BUCKET` | S3 bucket for feature snapshots |
| `AWS_REGION` | AWS region (default: `us-east-1`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Health check port (default: `3000`) |

## Deployment

Deploys as a Docker container to **AWS ECS**. The container runs as a non-root user and exposes a `/health` endpoint for ALB health checks. Polls a single SQS queue and routes messages to the appropriate handler by job type.
