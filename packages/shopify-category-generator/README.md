# @repo/shopify-category-generator

Tooling for generating, ingesting, and embedding the Shopify product category taxonomy. Uses OpenAI to create embeddings for category matching during product enrichment.

## Scripts

```bash
pnpm generate            # Generate category taxonomy data
pnpm ingest              # Ingest categories into the database
pnpm embed:categories    # Create OpenAI embeddings for all categories
pnpm update:attributes   # Update category attribute metadata
pnpm lint                # Run ESLint
```

## Dependencies

- `@repo/prisma` — database access for Category model
- `openai` — embedding generation
- `js-yaml` — YAML taxonomy file parsing
- `fast-glob` — file discovery

## Configuration

Requires `DATABASE_URL` and `OPENAI_API_KEY` environment variables.
