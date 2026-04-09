# Shopwise Platform

A Shopify analytics and recommendation platform that uses AI-powered product enrichment, ML ranking, and real-time event processing to deliver personalized product recommendations to Shopify stores. Built as a **pnpm + Turbo monorepo** deployed on AWS.

## Overview

For a full breakdown of the system architecture, AI/ML pipeline, data flow, and service design, see the [Platform Overview](https://client-reified-public.s3.eu-central-1.amazonaws.com/showpizer-doc.pdf).

## Prerequisites

| Dependency | Version | Install |
|---|---|---|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) |
| pnpm | 8.15.6 | [pnpm.io](https://pnpm.io) |
| Docker | Latest | [docker.com](https://docker.com) |
| Python | 3.13 (ML services only) | [python.org](https://python.org) |

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript 5 (strict) | Type safety across all Node.js packages |
| Python 3.13 | ML services (category embeddings, ranking) |
| React Router 7 / Remix | Shopify admin app (embedded in Shopify Admin) |
| Next.js 15 | Marketing website with static export |
| Shopify Polaris | Admin UI component system |
| PostgreSQL + pgvector | Primary database with vector similarity search |
| Prisma 6 | Type-safe ORM with migrations |
| DynamoDB | Low-latency key-value storage |
| Redis | Caching and session management |
| SQS + EventBridge | Async event-driven service communication |
| S3 + Athena | Analytics data lake with SQL queries over Parquet |
| OpenAI | Product enrichment and embedding generation |
| FastEmbed + ONNX | Local embedding inference |
| XGBoost | Product ranking model |
| Word2Vec | Category similarity embeddings |
| FastAPI | Python ML service API layer |
| esbuild | TypeScript service bundling |
| Turbo 2.5 | Monorepo build orchestration with caching |
| Docker | Multi-stage container builds for ECS |
| Terraform | Infrastructure as Code (29 AWS modules) |
| GitHub Actions | CI/CD: lint, typecheck, test, build, deploy |
| Semantic Release | Automated versioning and changelog |

## Monorepo Structure

```
shopwise-platform/
├── apps/
│   ├── app-remix/                    # Shopify admin app (React Router 7, Polaris)
│   │   ├── app/                      # Routes, components, hooks, services
│   │   └── extensions/               # Shopify extensions (checkout, theme, pixel)
│   ├── site-next/                    # Marketing website (Next.js 15, Radix UI)
│   ├── service-events/               # Shopify webhook processing, event ingestion
│   ├── service-enrich/               # AI product enrichment (OpenAI, FastEmbed)
│   ├── service-analytics/            # Analytics aggregation (Athena, S3, Parquet)
│   ├── service-px/                   # Web pixel / CloudFront log processing
│   ├── service-jobs-worker/          # Background job execution (trending, bundles)
│   ├── service-category-embeddings/  # ML category embeddings (Python, Word2Vec)
│   ├── service-ranker/               # ML product ranking (Python, XGBoost)
│   ├── fn-bulk-products/             # Lambda: bulk S3 product processing
│   ├── fn-email/                     # Lambda: email delivery via Resend
│   └── fn-job-scheduler/             # Lambda: job scheduling
├── packages/
│   ├── prisma/                       # @repo/prisma — Schema, client, migrations
│   ├── ui/                           # @repo/ui — Shared component library
│   ├── api-client/                   # @repo/api-client — Shopify + OpenAI clients
│   ├── event-contracts/              # @repo/event-contracts — Zod event schemas
│   ├── event-toolkit/                # @repo/event-toolkit — SQS event bus
│   ├── ddb/                          # @repo/ddb — DynamoDB helpers
│   ├── logger/                       # @repo/logger — Structured JSON logging
│   ├── ml-core/                      # @repo/ml-core — ML taxonomy utilities
│   ├── react-email/                  # @repo/react-email — Email templates
│   ├── shopify-category-generator/   # Category taxonomy tooling
│   ├── test-utils/                   # @repo/test-utils — Mock factories
│   ├── eslint-config/                # Shared ESLint rules
│   ├── typescript-config/            # Shared tsconfig presets
│   └── tailwind-config/              # Shared Tailwind configuration
├── terraform/                        # AWS infrastructure (Terraform + Terramate)
│   ├── modules/                      # 29 reusable modules (VPC, ECS, ALB, etc.)
│   ├── stacks/                       # Environment stacks (dev, prod)
│   └── scripts/                      # Infrastructure utilities
├── scripts/                          # Build, deploy, and development scripts
├── .github/workflows/                # CI/CD pipelines
├── docker-compose.yml                # Local development (PostgreSQL, Redis)
├── turbo.json                        # Turborepo task configuration
└── pnpm-workspace.yaml               # Workspace definitions
```

### Package Dependencies

```
apps/app-remix ──▶ @repo/prisma, @repo/ui
apps/site-next ──▶ @repo/ui, @repo/tailwind-config
apps/service-* ──▶ @repo/prisma, @repo/logger, @repo/event-toolkit, @repo/api-client
apps/fn-* ──▶ @repo/prisma, @repo/logger, @repo/event-contracts
packages/event-toolkit ──▶ @repo/event-contracts, @repo/logger
packages/api-client ──▶ (standalone — Shopify + OpenAI rate-limited clients)
```

## Architecture

```
                         ┌──────────────┐
                         │   Shopify    │
                         │   Webhooks   │
                         └──────┬───────┘
                                │
                                ▼
┌──────────┐           ┌────────────────┐           ┌──────────────┐
│  Admin   │           │ service-events │──SQS──▶   │service-enrich│
│(app-remix│◀──Prisma──│  (ingestion)   │           │ (AI enrich)  │
│ Polaris) │           └────────────────┘           └──────────────┘
└──────────┘                    │                          │
                           EventBridge                     │
                                │                          ▼
┌──────────┐           ┌───────┴────────┐           ┌──────────────┐
│site-next │           │  service-px    │           │service-jobs  │
│(Next.js) │           │ (pixel logs)   │           │  -worker     │
└──────────┘           └────────────────┘           └──────┬───────┘
                                                          │
                       ┌────────────────┐           ┌─────┴────────┐
                       │   service-     │           │  service-    │
                       │   analytics    │           │  ranker      │
                       │(Athena/Parquet)│           │ (XGBoost)    │
                       └────────────────┘           └──────────────┘
                                                          │
                                                    ┌─────┴────────┐
                                                    │  service-    │
                                                    │  category-   │
                                                    │  embeddings  │
                                                    └──────────────┘

Data Stores:
  PostgreSQL (pgvector) ◀── Prisma ORM
  DynamoDB ◀── Rate limiting, caching
  S3 + Athena ◀── Analytics data lake
  Redis ◀── Session, cache
  SQS ◀── Inter-service messaging
  EventBridge ◀── Event routing
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/danielreified/shopwizer-shopify.git
cd shopwizer-shopify

# Install dependencies
pnpm install

# Start local services (PostgreSQL + Redis)
docker compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start all services in dev mode
pnpm dev
```

### Focus Development

```bash
# Dev a single service
pnpm dev:focus --only service-events

# Dev everything except one service
pnpm dev:focus --except service-analytics
```

## Available Scripts

### Root (monorepo)

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all services in dev mode |
| `pnpm dev:focus --only <svc>` | Dev a single service |
| `pnpm dev:focus --except <svc>` | Dev all except one service |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | ESLint across all packages |
| `pnpm format` | Prettier format all files |
| `pnpm format:check` | Check formatting without writing |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run all test suites (Vitest) |
| `pnpm test:watch` | Watch mode testing |
| `pnpm test:coverage` | Test with coverage reporting |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Deploy pending migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Reset database |

### Database

| Command | Description |
|---|---|
| `pnpm db:tunnel:start <env>` | SSH tunnel to remote database |
| `pnpm db:tunnel:stop <env>` | Stop database tunnel |
| `pnpm db:tunnel:status <env>` | Check tunnel status |

## Environment Variables

Create a `.env` file at the project root:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shopwise

# Shopify
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# OpenAI (enrichment service)
OPENAI_API_KEY=your-openai-key
```

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

Tests use Vitest with `@repo/test-utils` providing mock factories for Prisma, SQS, and common fixtures.

## Deployment

### Infrastructure

All AWS infrastructure is defined in `terraform/` using Terraform with Terramate for stack orchestration. 29 reusable modules cover:

| Module Category | Modules |
|---|---|
| Networking | vpc, dns, dns_records, alb, alb_rule, alb_target |
| Compute | ecs_cluster, ecs_service, lambda, bastion |
| Storage | s3, dynamodb, aurora, elasticache |
| CDN | cloudfront, cloudfront_hmac, cloudfront_px, cloudfront_s3_oac |
| Messaging | sqs, event_bus, event_rule, eventbridge |
| CI/CD | ecr, codebuild |
| Observability | cloudwatch_log, betterstack_logs |
| Security | acm_certs |

### CI/CD Pipelines (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push / PR to main | Lint, typecheck, build, test |
| `deploy-ecs.yml` | Manual dispatch | Build Docker, push ECR, deploy ECS service |
| `deploy-lambda.yml` | Manual dispatch | Bundle, upload S3, deploy Lambda function |
| `deploy-site.yml` | Manual dispatch | Build Next.js, sync S3, invalidate CloudFront |
| `deploy-shopify.yml` | Manual dispatch | Deploy Shopify app extensions |
| `migrate.yml` | Manual dispatch | Run Prisma migrations via CodeBuild |

### Docker Build Pattern

All backend services use a consistent multi-stage Docker build:

```
Stage 1: deps     — pnpm fetch with frozen lockfile
Stage 2: builder  — pnpm install, generate Prisma, esbuild bundle
Stage 3: runner   — Node 20 slim, non-root user, health check on /health
```

### Release Strategy

Semantic Release automates versioning based on conventional commit messages:

```
feat: ...  → minor version bump
fix: ...   → patch version bump
BREAKING CHANGE: ... → major version bump
```

## Conventions

- TypeScript for all Node.js services; Python for ML services
- Zod schemas for runtime validation (see `@repo/event-contracts`)
- Event-driven communication between services via SQS + EventBridge
- Prisma for all PostgreSQL access — never raw SQL
- Structured JSON logging via `@repo/logger` (pino)
- Docker builds use multi-stage Dockerfiles with esbuild bundling
- ESLint + Prettier enforced across all packages

## License

Private — Shopwise Analytics Platform.
