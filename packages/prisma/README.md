# @repo/prisma

Prisma schema, generated client, and migrations for the Shopwise PostgreSQL database. Uses `pgvector` for embedding storage and `pgcrypto` for ID generation.

## Core Models

| Model | Description |
|-------|-------------|
| `Shop` | Shopify store with billing, preferences, and integrations |
| `Product` | Product catalog with variants, images, categories, and gender/age metadata |
| `ProductEmbedding` | 1536-dim vector embeddings for product similarity |
| `ProductAttributesEmbedding` | Category-attribute embeddings for clustering |
| `VendorEmbedding` | Shared vendor embeddings (global, not per-shop) |
| `ProductFeature` | Aggregated engagement metrics (views, clicks, carts, orders, revenue) |
| `ProductGraph` | Co-purchase and similarity edges between products |
| `CategoryGraph` | Category-level co-purchase relationships |
| `ComputedBundle` | Pre-computed product bundle recommendations with performance metrics |
| `BundleSlot` | Merchant-configurable bundle slot assignments |
| `Order` / `OrderLineItem` | Order history with attribution tracking |
| `RailMetric` | Hourly impression/click metrics per recommendation rail |
| `Job` | Per-shop scheduled job tracking (trending, best seller, bundles) |
| `WidgetConfig` | Per-shop widget design tokens and rail settings |
| `ExclusionRule` | Category/tag-based product exclusion and page suppression |
| `ShopOnboarding` | Onboarding step tracking |
| `ShopIntegration` | Third-party integration config (reviews, wishlists) |
| `Category` | Shopify product taxonomy with hierarchical structure and embeddings |

## Usage

```ts
import { PrismaClient } from '@repo/prisma';

const prisma = new PrismaClient();
const shop = await prisma.shop.findUnique({ where: { domain: 'example.myshopify.com' } });
```

## Scripts

```bash
pnpm generate          # Regenerate Prisma client
pnpm build             # Alias for generate
pnpm migrate:create    # Create a new migration (append name)
pnpm migrate:deploy    # Apply pending migrations
pnpm seed:plans        # Seed billing plans
pnpm seed:plans:custom # Seed custom billing plans
pnpm lint              # Run ESLint
```

## Configuration

Set `DATABASE_URL` in your environment to point at your PostgreSQL instance. The schema requires the `vector` and `pgcrypto` extensions.
