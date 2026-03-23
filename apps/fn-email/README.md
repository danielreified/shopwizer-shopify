# fn-email

Lambda function for transactional email delivery. Sends emails using the Resend API with React Email templates from `@repo/react-email`.

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript
- **Email**: Resend API
- **Templates**: `@repo/react-email` (React Email components)
- **Database**: Prisma client (for looking up email context)
- **Build**: esbuild (via shared Lambda build script)

## What It Does

1. Receives an invocation with email job parameters (recipient, template, data).
2. Renders the appropriate React Email template.
3. Sends the email via the Resend API.

## Project Structure

```
fn-email/
├── src/
│   ├── index.ts          # Lambda handler
│   └── config/
│       └── service.config.ts  # Resend API config
├── scripts/
│   └── send-email-job.ts # Manual email sending script
└── package.json
```

## Scripts

```bash
pnpm build            # Build Lambda deployment package
pnpm clean            # Remove build artifacts
pnpm local            # Run locally with tsx
pnpm send:email       # Send a test email manually
pnpm lambda:upload    # Upload to S3
pnpm lambda:deploy    # Deploy Lambda function
pnpm test             # Run tests (vitest)
pnpm lint             # ESLint
```

## Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for email delivery |
| `EMAIL_FROM` | Sender address (default: `Shopwizer <updates@shopwizer.co.za>`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `IS_LOCAL` | Set to `true` for local development |

## Deployment

Deployed as an **AWS Lambda function**. Built with esbuild into a single-file bundle, uploaded to S3, and deployed via the shared Lambda deploy script.
