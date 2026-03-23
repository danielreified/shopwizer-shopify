# service-enrich

AI-powered product enrichment service. Consumes SQS messages for new/updated products and enriches them with categories, attributes, demographics, and embeddings using OpenAI and vector search.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **AI**: OpenAI (GPT-4o-mini for classification, text-embedding-3-small for embeddings)
- **Messaging**: SQS (long-polling consumer via `@repo/event-toolkit`)
- **Database**: PostgreSQL via Prisma (pgvector for similarity search)
- **State**: DynamoDB (enrichment deduplication state)
- **Build**: esbuild
- **Deploy**: Docker (multi-stage) on ECS

## What It Does

1. **Category Resolution** -- Uses OpenAI to classify products into a 3-level category taxonomy, then validates against the database using vector similarity search.
2. **Attribute Extraction** -- Extracts product attributes (colors, materials, patterns) from metadata using LLM analysis.
3. **Demographic Classification** -- Determines target gender and age group for each product.
4. **Embedding Generation** -- Generates vector embeddings for semantic product similarity.
5. **Deduplication** -- Tracks enrichment state in DynamoDB to avoid redundant processing.

## Project Structure

```
src/
├── main.ts               # Entry point: SQS polling + health server
├── config/               # AI prompts, model config, thresholds
├── handlers/
│   └── enrich.sqs.ts     # SQS message handler
├── router/
│   └── enrich.router.ts  # Enrichment pipeline orchestration
├── steps/                # Individual enrichment steps
├── services/             # Business logic (OpenAI calls, embeddings)
├── repositories/         # Vector search / DB access
├── data/                 # Pre-computed data (demographic embeddings)
├── db/                   # Prisma client + DynamoDB state
├── scripts/              # Utility scripts
└── utils/
```

## Scripts

```bash
pnpm dev              # Dev mode with hot reload (tsx watch)
pnpm build            # Production build (esbuild)
pnpm build:demo       # Build demographic embeddings data
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
| `ENRICH_PRODUCTS_QUEUE_URL` | SQS URL for enrichment messages |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | LLM model override (default: `gpt-4o-mini`) |
| `ENRICH_STATE_TABLE_NAME` | DynamoDB table for enrichment state tracking |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Health check port (default: `3000`) |

## Deployment

Deploys as a Docker container to **AWS ECS**. The container runs as a non-root user and exposes a `/health` endpoint for ALB health checks. Polls a single SQS queue for enrichment work.
