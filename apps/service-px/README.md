# service-px

Web pixel and CloudFront log processing service. Ingests raw CDN access logs from S3, parses pixel event payloads, writes Parquet files to the analytics data lake, and updates real-time counters in the database.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Storage**: S3 (raw logs, processed Parquet, archive)
- **Format**: Parquet (via `parquets`)
- **Messaging**: SQS (long-polling consumer via `@repo/event-toolkit`)
- **Database**: PostgreSQL via Prisma
- **Compression**: LZ-String (pixel payload decompression)
- **Build**: esbuild
- **Deploy**: Docker (multi-stage) on ECS

## What It Does

1. **S3 Event Consumption** -- Receives SQS notifications when new CloudFront log files land in S3.
2. **Log Parsing** -- Downloads and parses CloudFront access logs, extracting pixel event payloads (page views, product clicks, cart additions, recommendation clicks).
3. **Parquet Conversion** -- Converts parsed events into Parquet format and writes to the processed bucket for Athena querying.
4. **Archival** -- Moves processed raw logs to an archive bucket.

## Project Structure

```
src/
├── main.ts               # Entry point: SQS polling + health server
├── config/               # S3 buckets, batch sizes, processing limits
├── handlers/
│   └── px-log.sqs.ts     # CloudFront log processing handler
└── db/                   # Prisma client
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
| `PX_QUEUE_URL` | SQS URL for S3 event notifications |
| `PROCESSED_BUCKET` | S3 bucket for processed Parquet files |
| `ARCHIVE_BUCKET` | S3 bucket for archived raw logs |
| `AWS_REGION` | AWS region (default: `us-east-1`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Health check port (default: `3000`) |
| `DEBUG` | Enable debug logging (`1` to enable) |

## Deployment

Deploys as a Docker container to **AWS ECS**. The container runs as a non-root user and exposes a `/health` endpoint for ALB health checks. Polls a single SQS queue triggered by S3 event notifications.
