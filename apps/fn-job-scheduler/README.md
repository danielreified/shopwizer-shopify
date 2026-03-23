# fn-job-scheduler

Lambda function for scheduling background jobs. Queries the database for active shops and enqueues job messages to SQS for processing by `service-jobs-worker`.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Trigger**: EventBridge scheduled rule (cron)
- **Output**: SQS (job queue messages)
- **Database**: PostgreSQL via Prisma
- **Secrets**: AWS Secrets Manager (database credentials)
- **Build**: esbuild (via shared Lambda build script)

## What It Does

1. Triggered on a schedule by an EventBridge cron rule.
2. Retrieves database credentials from AWS Secrets Manager.
3. Queries the database for active shops.
4. Publishes job messages to the SQS job queue for each shop/job-type combination.
5. `service-jobs-worker` picks up and executes the jobs.

## Project Structure

```
fn-job-scheduler/
├── src/
│   ├── index.ts          # Lambda handler
│   └── config/
│       └── service.config.ts  # SQS, DB, AWS config
└── package.json
```

## Scripts

```bash
pnpm build            # Build Lambda deployment package
pnpm clean            # Remove build artifacts
pnpm local            # Run locally with tsx
pnpm lambda:upload    # Upload to S3
pnpm lambda:deploy    # Deploy Lambda function
pnpm test             # Run tests (vitest)
pnpm lint             # ESLint
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JOB_QUEUE_URL` | SQS URL for the job queue |
| `AWS_REGION` | AWS region (default: `us-east-1`) |
| `IS_LOCAL` | Set to `true` for local development |

## Deployment

Deployed as an **AWS Lambda function**. Built with esbuild into a single-file bundle, uploaded to S3, and deployed via the shared Lambda deploy script. Triggered by an EventBridge scheduled rule.
