# 🎁 Bundle Generation System

This document describes the Self-Optimizing Bundle Engine in the `service-jobs-worker` service.

---

## Overview

The bundle system generates personalized product bundles for each product in a shop. It uses a **Hybrid Algorithm** that combines:

1. **Proven Winners** from historical order data (ProductGraph)
2. **Discovery Candidates** from ML-based category embeddings
3. **CategoryGraph** as a filter/boost for discovery

The system creates **multiple variants** per product to enable A/B testing:

- **`control`**: Best known bundle based on co-purchase data
- **`explore`**: Discovery bundles for testing new combinations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BUNDLE GENERATION PIPELINE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │ GRAPH_WEIGHTS_   │───▶│ BUNDLE_GENERATE  │───▶│ ComputedBundle │ │
│  │ DAILY (2am)      │    │ (3am)            │    │ Table          │ │
│  └──────────────────┘    └──────────────────┘    └────────────────┘ │
│         │                        │                       │          │
│         ▼                        ▼                       ▼          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │ ProductGraph     │    │ CategoryGraph    │    │ Frontend       │ │
│  │ (BUNDLE edges)   │    │ (affinity)       │    │ Selection      │ │
│  └──────────────────┘    └──────────────────┘    └────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Job Scheduling

| Job Name              | Schedule | Purpose                                                  |
| --------------------- | -------- | -------------------------------------------------------- |
| `GRAPH_WEIGHTS_DAILY` | 2:00 AM  | Populates ProductGraph and CategoryGraph from order data |
| `BUNDLE_GENERATE`     | 3:00 AM  | Generates ComputedBundle records for all products        |

---

## Data Models

### ProductGraph (BUNDLE type)

Stores product-to-product co-purchase relationships.

```prisma
model ProductGraph {
  id       String @id @default(cuid())
  shopId   String
  sourceId BigInt
  targetId BigInt
  type     String @default("FBT")  // "BUNDLE", "FBT", "SIMILAR"
  weight   Float  @default(0.5)    // 0.0 - 1.0 (normalized co-purchase frequency)
}
```

### CategoryGraph

Stores category-to-category affinity scores based on order data.

```prisma
model CategoryGraph {
  id             String @id @default(cuid())
  shopId         String
  sourceCategory String  // e.g., "aa-1-1"
  targetCategory String  // e.g., "aa-1-5"
  weight         Float   // Co-purchase frequency score (0.0 - 1.0)
}
```

### ComputedBundle

Stores generated bundle variants for each product.

```prisma
model ComputedBundle {
  id        String @id @default(cuid())
  shopId    String
  productId BigInt           // Origin product

  candidateIds Json          // [BigInt, BigInt, BigInt] - The 3 recommended product IDs
  variant      String        // "control", "explore"
  status       String        // "ACTIVE", "ARCHIVED"
  weight       Float         // Selection probability for frontend

  // Performance Metrics (Updated hourly by service-analytics)
  views24h      Int   @default(0)
  clicks24h     Int   @default(0)
  conversions7d Int   @default(0)
  revenue7d     Float @default(0)
}
```

---

## Algorithm Deep Dive

### Phase 1: GRAPH_WEIGHTS_DAILY

**File:** `src/handlers/graph.weights.ts`

This job runs first and populates the "Proven Winners" data:

#### ProductGraph Population

```sql
-- Analyzes order data to find products frequently bought together
WITH order_products AS (
    SELECT orderId, productId
    FROM OrderLineItem
    WHERE productId IS NOT NULL
),
pair_counts AS (
    SELECT
        p1.productId AS sourceId,
        p2.productId AS targetId,
        COUNT(DISTINCT orderId) AS orderCount
    FROM order_products p1
    JOIN order_products p2 ON p1.orderId = p2.orderId AND p1.productId <> p2.productId
    GROUP BY p1.productId, p2.productId
),
normalized AS (
    -- Normalize weights per source (0.0 - 1.0)
    SELECT sourceId, targetId,
           orderCount / MAX(orderCount) OVER (PARTITION BY sourceId) AS weight
    FROM pair_counts
)
-- Keep top K per source product
INSERT INTO ProductGraph (type='BUNDLE', ...)
FROM ranked WHERE rn <= TOP_K
```

#### CategoryGraph Population

```sql
-- Same logic but at category level
-- Finds which categories are frequently bought together
```

---

### Phase 2: BUNDLE_GENERATE

**File:** `src/handlers/bundles.generator.ts`

For each product in the shop, generates bundle variants:

#### Step 1: Load Pre-computed Data

```typescript
const productGraphMap = await loadProductGraph(shopId); // Co-purchase pairs
const categoryGraphMap = await loadCategoryGraph(shopId); // Category affinity
const categoryDensityMap = await loadCategoryDensity(shopId); // Items per category
```

#### Step 2: Generate Control Variant (Proven Winners)

```typescript
// Get co-purchased products from ProductGraph
const allWinners = productGraphMap.get(productId);

// STRICT ROOT LOCK: Only keep items from same root category
// e.g., Apparel products only bundle with other Apparel
const winners = allWinners.filter((w) => w.targetRootId === product.rootId);

if (winners.length >= ITEMS_PER_BUNDLE) {
  bundles.push({
    variant: 'control',
    candidateIds: winners.slice(0, 3),
    weight: 0.5,
  });
}
```

#### Step 3: Generate Explore Variant (ML Discovery)

```typescript
// 1. Query Category Embeddings Service (port 8004)
const response = await fetch(`${CATEGORY_EMBEDDINGS_URL}/similar`, {
  body: JSON.stringify({ category_id: product.categoryId, top_n: 12 }),
});

// 2. "1 up or 1 down" Neighborhood Exploration
const highConfidence = rawCategories.slice(0, 3); // Top matches
const discoveryPool = rawCategories
  .slice(3, 12) // Random from nearby
  .sort(() => Math.random() - 0.5)
  .slice(0, 3);

// 3. Query products in those categories with filters
const candidates = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.categoryId, p.title
    FROM Product p
    WHERE p.shopId = '${shopId}'
      AND p.status = 'ACTIVE'
      AND c.rootId = '${product.rootId}'  -- STRICT ROOT LOCK
      AND p.categoryId IN (${selectedCategoryIds})
      AND pv.inventoryQuantity > 0        -- Must be in stock
      AND price BETWEEN ${min} AND ${max} -- Price guardrails
    ORDER BY demo_tier ASC, bestSellerScore DESC
`);

// 4. Apply diversification and deduplication
const discoveryPool = diversifyByLeafCategory(candidates);
```

---

## Filters & Guardrails

### 1. Root Lock (Cross-Vertical Prevention)

Never mix products from different verticals:

- ✅ Jacket bundled with Pants (both Apparel)
- ❌ Jacket bundled with Sofa (Apparel vs Furniture)

```typescript
// Filter: c.rootId = '${product.rootId}'
```

### 2. Price Guardrails

Prevent sticker shock and irrelevant price ranges:

| Config                    | Value | Purpose                      |
| ------------------------- | ----- | ---------------------------- |
| `MIN_MULTIPLIER`          | 0.2x  | Min price relative to origin |
| `MAX_MULTIPLIER`          | 5.0x  | Max price relative to origin |
| `STICKER_SHOCK_THRESHOLD` | 3.0x  | Penalty threshold            |
| `STICKER_SHOCK_PENALTY`   | 0.1   | Score multiplier if exceeded |

### 3. Inventory Check

Only bundle products that are in stock:

```sql
AND pv.inventoryQuantity > 0
```

### 4. Demographic Filtering

Match gender and age group:

```typescript
// Gender priority: EXACT MATCH > UNISEX > FALLBACK
// Age priority: EXACT MATCH > ALL_AGE > FALLBACK
ORDER BY GREATEST(gender_tier, age_tier) ASC
```

### 5. Usage Limits (Anti-Spam)

Prevent the same item from appearing in too many bundles:

| Config                 | Value |
| ---------------------- | ----- |
| `MAX_BUNDLES_PER_ITEM` | 5     |
| `PENALTY_SLOPE`        | 20    |

```typescript
const usagePenalty =
  usage > MAX_BUNDLES_PER_ITEM ? Math.max(0.1, 1.0 - usage / PENALTY_SLOPE) : 1.0;
```

### 6. Title Deduplication

Prevents duplicate products with different colors/sizes:

```typescript
function deduplicateByTitle(products) {
  // "Blue Shirt - Small" and "Red Shirt - Medium" → keep only first
  const base = title
    .replace(/\s+-\s+.*$/, '') // Remove " - Color"
    .replace(/\s+\([^)]+\)$/, '') // Remove "(Size)"
    .trim();
  // Only keep first occurrence of each base title
}
```

### 7. Outfit Diversification

Ensures bundle variety (e.g., not 3 shirts):

```typescript
function diversifyByLeafCategory(candidates) {
  // Try to pick items from different leaf categories
  // e.g., Shirt + Pants + Shoes instead of 3 shirts
}
```

---

## Configuration

**File:** `src/config/service.config.ts`

```typescript
export const BUNDLE_CONFIG = {
  ITEMS_PER_BUNDLE: 3, // Products per bundle
  BATCH_SIZE: 50, // Products processed per batch
  MIN_IMPRESSIONS: 100, // (Reserved for future bandit)
  GRAPH_MIN_WEIGHT: 0.3, // Minimum co-purchase weight

  PRICE_GUARDRAILS: {
    MIN_MULTIPLIER: 0.2,
    MAX_MULTIPLIER: 5.0,
    STICKER_SHOCK_THRESHOLD: 3.0,
    STICKER_SHOCK_PENALTY: 0.1,
  },

  USAGE_LIMITS: {
    MAX_BUNDLES_PER_ITEM: 5,
    PENALTY_SLOPE: 20,
  },

  CLEANUP: {
    ARCHIVE_DELETE_DAYS: 30, // Delete archived bundles after 30 days
  },

  ML_DISCOVERY: {
    TOP_N: 12, // Categories from embeddings service
    HIGH_CONFIDENCE_COUNT: 3, // Top matches to use
    RANDOM_DISCOVERY_COUNT: 3, // Random from rest
  },
};
```

---

## Lifecycle Management

### Bundle Status

| Status     | Description                          |
| ---------- | ------------------------------------ |
| `ACTIVE`   | Currently served to frontend         |
| `ARCHIVED` | Previous version, kept for analytics |

### Archiving & Cleanup

```typescript
// 1. Archive old ACTIVE bundles before creating new ones
await archiveOldBundles(shopId, batchProductIds);

// 2. Delete ARCHIVED bundles older than 30 days
await prisma.computedBundle.deleteMany({
  where: {
    status: 'ARCHIVED',
    updatedAt: { lt: archiveDeleteWindow },
  },
});
```

---

## Weight Selection (Frontend)

Each bundle variant has a `weight` field that determines selection probability:

```typescript
// Example: 2 variants
{
    variant: "control",
    weight: 0.5  // 50% probability
},
{
    variant: "explore",
    weight: 0.5  // 50% probability
}

// Weights are normalized to sum to 1.0
const totalWeight = bundles.reduce((acc, b) => acc + b.weight, 0);
for (const b of bundles) {
    b.weight = b.weight / totalWeight;
}
```

---

## Scoring Formula (Discovery)

```typescript
const score =
  ((price_score * sticker_shock_penalty) / (demo_tier + 0.1)) *
  mlSimilarity *
  (1.0 + graphWeight * 2.0) * // Boost if in CategoryGraph
  densityBonus * // Boost for popular categories
  usagePenalty * // Reduce if overused
  organicJitter; // +/- 10% randomness
```

| Factor                  | Range   | Purpose                      |
| ----------------------- | ------- | ---------------------------- |
| `price_score`           | 0-1     | Price similarity to origin   |
| `sticker_shock_penalty` | 0.1-1   | Penalty for expensive items  |
| `demo_tier`             | 1-2     | Demographics match quality   |
| `mlSimilarity`          | 0-1     | Category embeddings score    |
| `graphWeight`           | 0-1     | CategoryGraph affinity       |
| `densityBonus`          | 1+      | Boost for popular categories |
| `usagePenalty`          | 0.1-1   | Reduce if overused           |
| `organicJitter`         | 0.9-1.1 | Natural variation            |

---

## Debugging & Monitoring

### Logs to Watch

```
🚀 Starting GRAPH_WEIGHTS_DAILY job
🔗 Updating ProductGraph (BUNDLE edges)...
📂 Updating CategoryGraph...
✅ GRAPH_WEIGHTS_DAILY complete

Starting BUNDLE_GENERATE job
Processing products (productCount: 1500)
BUNDLE_GENERATE job complete (created: 2500, archived: 2400, deleted: 100)
```

### Key Metrics

| Metric     | Description                           |
| ---------- | ------------------------------------- |
| `created`  | Number of new bundles created         |
| `archived` | Number of old bundles archived        |
| `deleted`  | Number of archived bundles cleaned up |

---

## Manual Testing

Trigger bundle generation for a specific shop:

```bash
# Via SQS message or API
{
    "type": "BUNDLE_GENERATE",
    "shopId": "shop_abc123"
}
```

Run for all active shops:

```bash
{
    "type": "BUNDLE_GENERATE"
    # No shopId → runs for all active shops
}
```

---

## Related Files

| File                                | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `src/handlers/bundles.generator.ts` | Main bundle generation logic            |
| `src/handlers/graph.weights.ts`     | ProductGraph & CategoryGraph population |
| `src/config/service.config.ts`      | Configuration constants                 |
| `src/routers/job.router.ts`         | Job routing and scheduling              |
| `packages/prisma/schema.prisma`     | Database models                         |

---

## Known Issues & Technical Debt

### 🔴 Critical: SQL Injection Vulnerability

**Location:** `fetchDiscoveryCandidates()` (lines 412-440)

The raw SQL query uses string interpolation without parameterization:

```typescript
// ⚠️ VULNERABLE
const query = `
    WHERE p."shopId" = '${shopId}'
      AND c."rootId" = '${product.rootId}'
      AND p."categoryId" IN (${selectedCategoryIds.map((cat) => `'${cat}'`).join(',')})
`;
```

**Risk:** If `categoryId` or `rootId` contains malicious input, SQL injection is possible.

**Fix:** Use Prisma's `$queryRaw` with tagged template literals:

```typescript
const query = Prisma.sql`
    WHERE p."shopId" = ${shopId}
      AND c."rootId" = ${product.rootId}
      AND p."categoryId" = ANY(${selectedCategoryIds})
`;
```

---

### 🟡 Race Condition: globalUsageMap

**Location:** `handleBundleGenerateJob()` (lines 84-110, 125-129)

The `globalUsageMap` is shared across concurrent `Promise.allSettled` calls within a batch:

```typescript
await Promise.allSettled(
    batch.map(async (product) => {
        // ⚠️ Multiple concurrent writes to globalUsageMap
        const bundles = await generateBundlesForProduct(..., globalUsageMap);
    })
);

// Usage map updated AFTER all promises settle
for (const bundle of batchBundles) {
    globalUsageMap.set(cid, ...);  // This happens too late
}
```

**Issue:** Products within the same batch don't see each other's usage counts. This means the usage penalty isn't applied within batches.

**Fix Options:**

1. Process products sequentially (slower but correct)
2. Use a different batching strategy where usage is pre-calculated
3. Accept the limitation (usage is approximate anyway)

---

### 🟡 Stale Comment: Variant Count

**Location:** File header (lines 10-13)

The comment says "Creates 3 variants per product" but the code only creates 2:

- `control` (from ProductGraph)
- `explore` (from embeddings)

The `explore_a` and `explore_b` variants mentioned in the comment don't exist.

---

### 🟡 Unused Configuration

**Location:** `service.config.ts` (line 65)

```typescript
MIN_IMPRESSIONS: 100, // (Reserved for future bandit)
```

This configuration is imported but never used in the bundle generation logic.

---

### 🟡 Missing Error Handling: Division by Zero

**Location:** `fetchDiscoveryCandidates()` (line 418)

```sql
1.0 / (1.0 + ABS(LOG(NULLIF(pv."priceUsd", 0) / ${product.price})))
```

If `product.price` is 0, this will cause a division by zero error.

**Fix:** Add guard in `generateBundlesForProduct`:

```typescript
if (product.price <= 0) {
  logger.warn({ productId: product.id }, 'Product has no price, skipping discovery');
  return []; // or use fallback
}
```

---

### 🟡 Inefficient Query: No Index Usage

**Location:** `fetchDiscoveryCandidates()` (line 423)

```sql
LEFT JOIN "ProductVariant" pv ON pv."productId" = p."id"
    AND (pv."position" = 1 OR pv."position" IS NULL)
```

This OR condition may prevent index usage. Consider using `COALESCE`:

```sql
AND COALESCE(pv."position", 1) = 1
```

---

### 🟡 Products Without Categories

**Location:** `generateBundlesForProduct()` (lines 271-273)

```typescript
let candidatesPool = product.categoryId
    ? await fetchDiscoveryCandidates(...)
    : [];
```

Products without a `categoryId` only get:

1. Vendor best-sellers as fallback

They never get a `control` variant from ProductGraph (which doesn't require category).

---

### 🟡 Inconsistent Root Filtering

**Location:** `loadProductGraph()` vs `generateBundlesForProduct()`

ProductGraph is loaded without root filtering (line 153), but then filtered at usage time (line 255):

```typescript
// Load ALL edges
const edges = await prisma.productGraph.findMany({
  where: { shopId, type: 'BUNDLE', weight: { gte: MIN_WEIGHT } },
});

// Filter later
const winners = allWinners.filter((w) => w.targetRootId === product.rootId);
```

**Improvement:** This works but loads unnecessary data. Consider filtering in the query if shops have large catalogs with many roots.

---

## Potential Improvements

### 1. 🎰 Multi-Armed Bandit for Weight Optimization

Use performance metrics to adjust variant weights dynamically:

```typescript
// Current: Static weights
weight: 0.5;

// Future: Thompson Sampling
const alpha = bundle.clicks24h + 1;
const beta = bundle.views24h - bundle.clicks24h + 1;
const weight = betaSample(alpha, beta);
```

### 2. 📊 Add Bundle Performance Tracking

The `ComputedBundle` model has performance fields but they're not being populated:

```prisma
views24h      Int   @default(0)
clicks24h     Int   @default(0)
conversions7d Int   @default(0)
revenue7d     Float @default(0)
```

**Action:** Implement in `service-analytics` to update these hourly.

### 3. 🔄 Real-time Feedback Loop

Instead of daily regeneration, update weights in real-time:

```
Click event → Update clicks24h → Recalculate weight
```

### 4. 🌐 Cross-Shop Learning

Share category patterns across shops in the same vertical:

```typescript
// If shop A has limited order data, borrow CategoryGraph from similar shops
const categoryGraphMap = await loadCategoryGraphWithFallback(shopId, vertical);
```

### 5. 🎨 Additional Exploration Strategies

- **Color-based**: Bundle complementary colors
- **Price-tier**: Budget/Premium bundles
- **Seasonal**: Holiday-themed bundles
- **Vendor-based**: Complete-the-look from same brand

### 6. ⚡ Performance Optimizations

- **Parallel Category Embeddings Calls**: Batch requests to the embeddings service
- **Redis Caching**: Cache ProductGraph and CategoryGraph for faster access
- **Incremental Updates**: Only regenerate bundles for products with changed data

### 7. 📈 Better Logging & Observability

Add structured metrics:

```typescript
logger.info(
  {
    shopId,
    metrics: {
      productsWithControl: controlCount,
      productsWithExplore: exploreCount,
      productsWithNoBundle: noBundleCount,
      avgCandidatesPerProduct: avgCandidates,
      embeddingsServiceLatencyMs: latency,
    },
  },
  'BUNDLE_GENERATE metrics',
);
```

### 8. 🧪 A/B Test Infrastructure

Add experiment tracking:

```typescript
// ComputedBundle
experimentId: String?  // Link to experiment config
cohort: String?        // "control", "treatment_a", etc.
```
