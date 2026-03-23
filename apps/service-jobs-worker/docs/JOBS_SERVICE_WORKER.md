# Jobs Service Worker

This document describes what `service-jobs-worker` does in production and how each job behaves in the current code. File references are included so you can cross-check the implementation.

## Runtime Flow

Source: `src/main.ts`

1. Load environment and configuration.
2. Start a health server on `INFRA_CONFIG.HEALTH_PORT`.
3. Read `JOB_QUEUE_URL` from the environment and abort if missing.
4. Begin polling SQS via `pollSQS`, parsing each message with `parseAndUnwrap`.
5. Route each parsed job to `routeJob`.
6. On shutdown, abort the poller and close the health server.

## Job Routing

Source: `src/routers/job.router.ts`

The worker accepts SQS messages with this shape:

- `type` (string)
- `shopId` (string, optional)
- `jobId` (string, optional)
- `force` (boolean, optional)

Routing behavior:

1. `TRENDING` requires `shopId` and runs `handleTrendingJob`.
2. `BEST_SELLER` requires `shopId` and runs `handleBestSellerJob`.
3. `GRAPH_WEIGHTS_DAILY` requires `shopId` and runs `handleGraphWeightsJob`.
4. `CURRENCY` is global and runs `handleCurrencyJob`.
5. `NEW_ARRIVALS` is deprecated and is skipped.
6. `BUNDLE_GENERATE` runs per shop if `shopId` is provided, otherwise it runs for all active shops.

If a job has `jobId`, the worker updates the `Job` table status to `SUCCESS` or `FAILED`.

## Job Details

### Trending (per shop)

Source: `src/handlers/trending.handler.ts`

1. Loads all `ProductFeature` records for the shop.
2. Computes a raw score per product based on views and clicks only.
3. Applies recency and persistence ratios, time decay, new product boost, and low traffic jitter.
4. Normalizes scores to 0–1 per shop and updates `ProductFeature.trendingScore` in batches.

### Best Seller (per shop)

Source: `src/handlers/best-sellers.handler.sqs.ts`

1. Loads all active products for the shop.
2. Aggregates order counts and revenue from `OrderLineItem` for 7d and 30d windows.
3. Loads any existing engagement data from `ProductFeature`.
4. Computes a best-seller score from orders and revenue, adds a small engagement boost when orders are missing, then applies age-based decay.
5. Normalizes scores and upserts into `ProductFeature`, including order and revenue rollups.

### Graph Weights (per shop)

Source: `src/handlers/graph.weights.ts`

1. Builds `ProductGraph` edges (type `BUNDLE`) from co-purchase pairs in orders.
2. Normalizes weights per source product and keeps the top K targets.
3. Builds `CategoryGraph` edges from co-purchase category pairs.
4. Upserts both graphs in a transaction.

### Currency (global)

Source: `src/handlers/currency.handler.ts`

1. Fetches USD exchange rates from the API Layer endpoint.
2. Writes `latest.json` to S3 (overwrites) with 24h cache control.
3. Writes a timestamped archive JSON file to S3.

## Bundle Generation (as implemented)

Source: `src/handlers/bundles.generator.ts`

The bundle generator produces `ComputedBundle` rows for each active product. It runs per shop and uses two sources: ProductGraph co-purchases and a category-embeddings discovery service.

### High-level flow

1. Load all active products for the shop (including category, root, gender, age, vendor, and the first variant price).
1. Load ProductGraph edges for the shop (type `BUNDLE`, weight >= `GRAPH_MIN_WEIGHT`).
1. Load CategoryGraph edges for the shop.
1. Load category density (count of active products per category).
1. Process products in batches of `BUNDLE_CONFIG.BATCH_SIZE`.
1. For each batch, generate bundles for each product in parallel.
1. Archive existing ACTIVE bundles for those products.
1. Insert newly generated bundles with `createMany`.
1. Update a global usage map for candidate products (used as a penalty in later batches).
1. After all batches, delete ARCHIVED bundles older than `BUNDLE_CONFIG.CLEANUP.ARCHIVE_DELETE_DAYS`.

### Variant types

The code creates at most two variants:

1. `control`
2. `explore`

### Control variant (ProductGraph)

1. Load all ProductGraph edges for the current product and keep only targets with the same category root as the product.
2. Skip targets that are out of stock (filtered when loading ProductGraph).
3. If at least `ITEMS_PER_BUNDLE` targets remain, take the top 3 by graph weight.
4. Insert a bundle with `variant = "control"` and `weight = 0.5`.

### Explore variant (Embeddings discovery)

1. Call the category embeddings service at `CATEGORY_EMBEDDINGS_URL`.
1. If the base URL points to port 8003, it is rewritten to 8004.
1. If the base URL is localhost or 127.0.0.1 with a different port, it is rewritten to 8004.
1. Use `TOP_N` categories from the response.
1. Take the top `HIGH_CONFIDENCE_COUNT` categories.
1. Randomly sample `RANDOM_DISCOVERY_COUNT` from the remaining categories.
1. Fetch candidate products from the database using those categories with guardrails.
1. Must be active and enabled.
1. Must be in stock.
1. Must be in the same root category as the source product.
1. Must be within price guardrails (min/max multipliers).
1. Demographic tier (gender and age) is used for ordering.
1. Limit to 15 candidates.
1. Score each candidate using price similarity, sticker shock penalty, CategoryGraph affinity weight, category density bonus, usage penalty, ML similarity, and jitter.
1. The gender and age tier SQL is based on the first value in `product.gender` and `product.ageBucket`.
1. If `product.categoryId` or `product.rootId` is missing, the discovery path returns no candidates.
1. Remove any candidate already used in the control variant.
1. If fewer than `ITEMS_PER_BUNDLE` candidates remain, add vendor best-sellers (same root, in stock, price 0.5–2.0x) with a low score.
1. Deduplicate by title using a lowercase base title (strips trailing ` - ...` or `( ... )`).
1. Diversify by leaf category so the top candidates are not all the same type.
1. The diversification step first keeps unique categories in score order, then fills up to 10 items with the remaining top-scored candidates.
1. Take the top 3 and insert a bundle with `variant = "explore"`.

### Discovery scoring formula (exact)

Score components are computed in `fetchDiscoveryCandidates`:

1. `price_score = 1 / (1 + abs(log(NULLIF(priceUsd, 0) / product.price)))`
1. `sticker_shock_penalty = 0.1` if `priceUsd > product.price * STICKER_SHOCK_THRESHOLD`, else `1.0`.
1. `demo_tier = max(gender_tier, age_tier)` where each tier is 1 or 2.
1. `density_bonus = 1 + log10(category_density)` where density is the count of active products in the category.
1. `usage_penalty = usage > MAX_BUNDLES_PER_ITEM ? max(0.1, 1.0 - usage / PENALTY_SLOPE) : 1.0`
1. `graph_weight = CategoryGraph weight for (product.categoryId -> candidate.categoryId)`, default 0.
1. `ml_similarity = score from embeddings`, default 0.5.
1. `organic_jitter = 0.9 + (random * 0.2)`.
1. `boost = ml_similarity * (1 + graph_weight * 2) * density_bonus * usage_penalty * organic_jitter`
1. `final_score = (price_score * sticker_shock_penalty / (demo_tier + 0.1)) * boost`

### Weights

1. `control` starts at 0.5.
2. `explore` starts at 0.5 if control exists, otherwise 1.0.
3. Weights are normalized to sum to 1.0 and rounded to 2 decimals.

### Archival behavior

1. Before inserting new bundles for a batch, all previous ACTIVE bundles for those products are set to ARCHIVED.
2. After the job finishes, ARCHIVED bundles older than the configured retention window are deleted.

### Output tables

Bundles are written to `ComputedBundle` with:

- `shopId`
- `productId`
- `candidateIds` (string array of product IDs)
- `variant`
- `status` (ACTIVE or ARCHIVED)
- `weight`

## Configuration Reference

Source: `src/config/service.config.ts`

- `INFRA_CONFIG` for SQS and API endpoints
- `TRENDING_CONFIG` for scoring weights and batch sizes
- `BEST_SELLER_CONFIG` for scoring weights and windows
- `GRAPH_CONFIG` for graph generation settings
- `BUNDLE_CONFIG` for bundle sizes, guardrails, and discovery settings
