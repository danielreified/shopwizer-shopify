# app-remix

Shopify admin app for Shopwise -- embedded in the Shopify Admin panel. Manages product recommendations, analytics dashboards, merchandising controls, and onboarding.

## Tech Stack

- **Framework**: React Router 7 (Remix successor)
- **UI**: Shopify Polaris, Polaris Viz (charts)
- **Auth**: Shopify App Bridge, `@shopify/shopify-app-react-router`
- **Database**: PostgreSQL via Prisma (`@repo/prisma`)
- **State**: Zustand
- **Styling**: Tailwind CSS 3
- **Build**: Vite, React Router build
- **Runtime**: Node.js 20+

## Extensions

The app ships with four Shopify extensions:

| Extension | Description |
|---|---|
| `checkout-upsells` | Checkout UI extension for upsell recommendations |
| `my-theme-ext` | Theme app extension for storefront recommendation widgets |
| `my-web-pixel` | Web pixel for tracking page views, clicks, and cart events |
| `thank-you-recs` | Thank-you page recommendation widget |

## Project Structure

```
app-remix/
├── app/
│   ├── routes/           # React Router file-based routes
│   │   ├── app._index/   # Main dashboard
│   │   ├── app.analytics.$metric/  # Analytics views
│   │   ├── app.editor/   # Widget editor
│   │   ├── app.merchandising/  # Merchandising controls
│   │   ├── app.products/  # Product management
│   │   ├── app.plans/    # Billing / plan selection
│   │   ├── app.settings/ # App settings
│   │   ├── proxy/        # App proxy routes
│   │   └── webhooks.*/   # Webhook handlers
│   ├── components/       # React components
│   ├── services/         # Server-side business logic
│   ├── repositories/     # Data access layer
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities
│   ├── store/            # Zustand stores
│   ├── gql/              # GraphQL queries/mutations
│   ├── shopify.server.ts # Shopify app configuration
│   └── db.server.ts      # Prisma client
├── extensions/           # Shopify app extensions
├── prisma/               # Prisma schema (app-local session storage)
└── Dockerfile            # Multi-stage Docker build
```

## Scripts

```bash
pnpm dev              # Start local dev (Shopify CLI + Cloudflare tunnel)
pnpm build            # Production build (React Router)
pnpm start            # Start production server
pnpm typecheck        # Type-check with react-router typegen
pnpm lint             # ESLint
pnpm test             # Vitest
pnpm deploy           # Deploy extensions to Shopify
pnpm setup            # Generate Prisma client + run migrations

# Extensions
pnpm theme:ext:build  # Build theme extension
pnpm px:ext:build     # Build web pixel extension
pnpm ext:build:all    # Build all extensions

# Docker / ECS
pnpm docker:build     # Build Docker image
pnpm docker:push      # Push to ECR
pnpm docker:deploy    # Deploy to ECS
pnpm ecs:start        # Start ECS service
pnpm ecs:stop         # Stop ECS service
pnpm ecs:status       # Check ECS service status
pnpm ecs:logs         # Tail ECS logs
```

## Environment Variables

| Variable | Description |
|---|---|
| `SHOPIFY_API_KEY` | Shopify app API key |
| `SHOPIFY_API_SECRET` | Shopify app API secret |
| `SCOPES` | Shopify API scopes |
| `DATABASE_URL` | PostgreSQL connection string |
| `EVENT_BUS_NAME` | AWS EventBridge bus name |
| `BULK_UPLOAD_BUCKET` | S3 bucket for bulk product uploads |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution for cache invalidation |
| `OPENAI_API_KEY` | OpenAI API key |
| `CATEGORY_EMBEDDINGS_URL` | URL for category embeddings service |
| `LOGTAIL_SOURCE_TOKEN` | BetterStack logging token |
| `LOGTAIL_ENDPOINT` | BetterStack logging endpoint |
| `SERVICE_NAME` | Service identifier (default: `app-remix`) |

See `.env.example` for a full template.

## Deployment

Deploys as a Docker container to **AWS ECS**. The Dockerfile uses a multi-stage build with Node.js 20. Shopify extensions are deployed separately via `pnpm deploy` (Shopify CLI).

The app is embedded in the Shopify Admin and accessed at:
`https://admin.shopify.com/store/{store}/apps/{app-slug}/app`
