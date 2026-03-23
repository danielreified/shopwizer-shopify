# fn-bulk-products

Lambda function for bulk product processing. Triggered by S3 events when Shopify bulk operation result files are uploaded. Parses the JSONL file and publishes individual product events to EventBridge for downstream processing.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Trigger**: S3 event notification
- **Output**: AWS EventBridge (product events)
- **Storage**: S3 (reads bulk JSONL files)
- **Build**: esbuild (via shared Lambda build script)

## What It Does

1. Receives an S3 event when a bulk product JSONL file lands in the product bucket.
2. Downloads and streams the file from S3.
3. Parses each line as a product record.
4. Publishes batches of product events to EventBridge (max 10 per `PutEvents` call).

## Project Structure

```
fn-bulk-products/
├── src/
│   ├── index.ts          # Lambda handler
│   └── config/
│       └── service.config.ts  # S3, EventBridge, runtime config
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
| `PRODUCT_BUCKET` | S3 bucket containing bulk product files |
| `EVENT_BUS_NAME` | EventBridge bus name for publishing events |
| `AWS_REGION` | AWS region (default: `us-east-1`) |
| `IS_LOCAL` | Set to `true` for local development |
| `DEBUG` | Set to `true` or `1` for debug logging |

## Deployment

Deployed as an **AWS Lambda function**. Built with esbuild into a single-file bundle, uploaded to S3, and deployed via the shared Lambda deploy script. Triggered by S3 event notifications on the product bucket.
