/**
 * 🎁 BUNDLE_GENERATE_V2
 *
 * First‑principles rework (in progress). This file intentionally
 * co-exists with the current generator so we can iterate locally
 * without changing production behavior.
 *
 * Reference spec:
 * - docs/BUNDLES_APPROACH_DIFF.md
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { INFRA_CONFIG } from '../config/service.config';

const DRY_RUN = process.env.BUNDLE_V2_DRY_RUN === 'true';
const REPORT_FULL = process.env.BUNDLE_V2_REPORT_FULL === 'true';
const EMBED_TOP_N = Number(process.env.BUNDLE_V2_EMBED_TOP_N || 40);
const EMBED_TIMEOUT_MS = Number(process.env.BUNDLE_V2_EMBED_TIMEOUT_MS || 5000);
const EMBED_CONCURRENCY = Number(process.env.BUNDLE_V2_EMBED_CONCURRENCY || 5);
const EMBED_INCLUDE_RAW = false;
const CATEGORY_GRAPH_TOP_N = Number(process.env.BUNDLE_V2_CATEGORY_GRAPH_TOP_N || 10);
const CATEGORY_GRAPH_MIN_COUNT = Number(process.env.BUNDLE_V2_CATEGORY_GRAPH_MIN_COUNT || 4);
const CATEGORY_MERGED_TOP_N = Number(process.env.BUNDLE_V2_CATEGORY_MERGED_TOP_N || 8);
// Number of target categories (items) displayed per bundle (excludes source product).
const BUNDLE_MAX_ITEMS = Number(process.env.BUNDLE_V2_MAX_ITEMS || 3);
const CATEGORY_TARGET_MIN_COUNT = Number(process.env.BUNDLE_V2_CATEGORY_TARGET_MIN_COUNT || 2);
const CATEGORY_TEMPLATE_PRIMARY = Number(process.env.BUNDLE_V2_CATEGORY_TEMPLATE_PRIMARY || 5);
const CATEGORY_TEMPLATE_BACKUP = Number(process.env.BUNDLE_V2_CATEGORY_TEMPLATE_BACKUP || 2);
const BUNDLES_PER_PRODUCT = Number(process.env.BUNDLE_V2_BUNDLES_PER_PRODUCT || 3);
const CATEGORY_SCORE_TOP_N = Number(process.env.BUNDLE_V2_CATEGORY_SCORE_TOP_N || 20);
const POOL_SMOOTHING_EPSILON = Number(process.env.BUNDLE_V2_POOL_EPSILON || 1e-6);
const GRAPH_PICK_PROB = Number(process.env.BUNDLE_V2_GRAPH_PICK_PROB || 0.7);
const INVENTORY_STRICT = process.env.BUNDLE_V2_INVENTORY_STRICT === 'true';
let PROCESS_SEED_OVERRIDE: string | undefined;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPORT_DIR = join(__dirname, '../../tmp/bundle-v2');
const REPORT_ROOT = process.env.BUNDLE_V2_REPORT_DIR || DEFAULT_REPORT_DIR;

export type BundleV2RunContext = {
  runId: string;
  shopId: string;
  startedAt: Date;
  dryRun: boolean;
};

const SCORE_CONFIG = {
  ENGAGEMENT_WEIGHTS: {
    views7d: 1,
    clicks7d: 3,
    orders7d: 1,
  },
  SCORE_WEIGHTS: {
    engagement: 1.0,
  },
};

const TAXONOMY_TARGET_DEPTH: Record<string, number> = {
  // Depth 3: High functional density (Target specialized product types)
  'Apparel & Accessories': 3,
  'Animals & Pet Supplies': 3,
  'Baby & Toddler': 3,
  'Food, Beverages & Tobacco': 3,
  Furniture: 3,
  'Health & Beauty': 3,
  'Home & Garden': 3,
  'Sporting Goods': 3,
  'Toys & Games': 3,
  'Vehicles & Parts': 3,
  'Business & Industrial': 3,
  Mature: 3,
  Media: 3,
  'Office Supplies': 3,
  Services: 3,

  // Depth 2: High brand/identity importance (Target primary product categories)
  Electronics: 2,
  Software: 2,
  Hardware: 2,
  'Arts & Entertainment': 2,
  'Cameras & Optics': 2,
  'Luggage & Bags': 2,
  'Religious & Ceremonial': 2,

  // Default fallback for any newly introduced or flat root categories
  default: 3,
};

type BundleV2ReportStep = {
  name: string;
  at: string;
  data: Record<string, unknown>;
};

type BundleV2Report = {
  runId: string;
  shopId: string;
  startedAt: string;
  dryRun: boolean;
  steps: BundleV2ReportStep[];
};

function getReportDir(report: BundleV2Report) {
  return join(REPORT_ROOT, report.shopId, report.runId);
}

export async function handleBundleGenerateJobV2(shopId: string) {
  const ctx: BundleV2RunContext = {
    runId: randomUUID(),
    shopId,
    startedAt: new Date(),
    dryRun: DRY_RUN,
  };

  const report: BundleV2Report = {
    runId: ctx.runId,
    shopId: ctx.shopId,
    startedAt: ctx.startedAt.toISOString(),
    dryRun: ctx.dryRun,
    steps: [],
  };

  logger.info(
    { shopId: ctx.shopId, runId: ctx.runId, dryRun: ctx.dryRun },
    'Starting BUNDLE_GENERATE_V2',
  );

  // Step 1: Freeze product snapshot for this run
  const products = await loadProductsSnapshot(ctx);
  if (products.length === 0) {
    recordStep(report, 'snapshot', { productCount: 0 });
    await writeReport(report);
    logger.warn({ shopId: ctx.shopId, runId: ctx.runId }, 'No active products found');
    return;
  }

  logger.info(
    { shopId: ctx.shopId, runId: ctx.runId, productCount: products.length },
    'Loaded product snapshot',
  );
  const categoryCounts = countCategories(products);
  recordStep(report, 'snapshot', {
    productCount: products.length,
    withCategory: products.filter((p) => p.categoryId).length,
    uniqueCategories: categoryCounts.length,
  });
  recordStep(report, 'category_counts', {
    total: categoryCounts.length,
    counts: categoryCounts,
  });
  await writeCategoryCountsReport(report, categoryCounts);

  // Phase 2: Category embeddings map (category-level only)
  const categoryEmbeddings = await buildCategoryEmbeddingsMap(categoryCounts);
  const embeddingsSummary = summarizeEmbeddings(categoryEmbeddings);
  recordStep(report, 'category_embeddings', embeddingsSummary);
  await writeCategoryEmbeddingsReport(report, categoryEmbeddings, embeddingsSummary);

  // Phase 2.5: CategoryGraph map (store co-purchase signal only)
  const categoryGraph = await buildCategoryGraphMap(ctx.shopId, categoryCounts);
  const graphSummary = summarizeCategoryGraph(categoryGraph);
  recordStep(report, 'category_graph', graphSummary);
  await writeCategoryGraphReport(report, categoryGraph, graphSummary);

  // Phase 2.6: Merge CategoryGraph + Embeddings (graph-first with backfill)
  const categoryMerged = mergeCategoryAffinity(categoryCounts, categoryGraph, categoryEmbeddings);
  const mergedSummary = summarizeCategoryMerged(categoryMerged);
  recordStep(report, 'category_merged', mergedSummary);
  await writeCategoryMergedReport(report, categoryMerged, mergedSummary);

  // Phase 2.7: Category bundle templates (category-level only)
  const categoryTemplates = buildCategoryTemplates(categoryMerged);
  const templateSummary = summarizeCategoryTemplates(categoryTemplates);
  recordStep(report, 'category_templates', templateSummary);
  await writeCategoryTemplatesReport(report, categoryTemplates, templateSummary);

  // Step 2: Build a unified per-product score (phase 1)
  const { scores, metrics } = await computeUnifiedProductScores(ctx, products);
  recordStep(report, 'signal_metrics', metrics);

  if (scores.length > 0) {
    const top = scores.slice(0, 100).map((s) => ({
      productId: s.productId.toString(),
      title: s.title,
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      categoryFullName: s.categoryFullName,
      unifiedScore: s.unifiedScore,
      engagement: s.engagementScore,
    }));
    recordStep(report, 'top_scores', { top, total: scores.length });
    if (REPORT_FULL) {
      recordStep(report, 'all_scores', { scores });
    }
    logger.info({ shopId: ctx.shopId, runId: ctx.runId, top }, 'Top unified product scores (v2)');
  }

  // Phase 3 prep: Group scores by category for inspection
  const { groups: categoryScoreGroups, summary: scoreGroupSummary } = buildCategoryScoreGroups(
    scores,
    REPORT_FULL,
  );
  recordStep(report, 'category_scores', scoreGroupSummary);
  await writeCategoryScoreGroupsReport(report, categoryScoreGroups, scoreGroupSummary);

  // Phase 3 prep: Build category product pools (weights from ProductFeature engagement)
  const { pools: categoryProductPools, summary: poolSummary } = buildCategoryProductPools(
    products,
    scores,
  );
  recordStep(report, 'category_product_pools', poolSummary);
  await writeCategoryProductPoolsReport(report, categoryProductPools, poolSummary);

  // Phase 3: Build per-product bundle candidates using templates + pools
  const productGraph = await loadProductGraphMap(ctx.shopId);
  const {
    bundles: productBundles,
    summary: bundleSummary,
    failures: bundleFailures,
    failureSummary,
  } = buildProductBundles(products, categoryTemplates, categoryProductPools, productGraph);
  recordStep(report, 'product_bundles', bundleSummary);
  recordStep(report, 'bundle_failures', failureSummary);
  await writeProductBundlesReport(report, productBundles, bundleSummary);
  await writeBundleFailuresReport(report, bundleFailures, failureSummary);
  const persistSummary = await persistComputedBundlesV2(
    ctx,
    productBundles,
    products.map((p) => p.id.toString()),
    new Set(products.map((p) => p.id.toString())),
  );
  recordStep(report, 'db_persist', persistSummary);

  await writeReport(report);
  logger.info(
    { shopId: ctx.shopId, runId: ctx.runId, dryRun: ctx.dryRun, persistSummary },
    'BUNDLE_GENERATE_V2 complete',
  );
}

export async function handleBundleGenerateJobV2Single(shopId: string, bundleId: string) {
  const ctx: BundleV2RunContext = {
    runId: randomUUID(),
    shopId,
    startedAt: new Date(),
    dryRun: DRY_RUN,
  };
  const singleSeedSalt = ctx.runId;
  const previousSeedOverride = PROCESS_SEED_OVERRIDE;
  PROCESS_SEED_OVERRIDE = singleSeedSalt;

  const report: BundleV2Report = {
    runId: ctx.runId,
    shopId: ctx.shopId,
    startedAt: ctx.startedAt.toISOString(),
    dryRun: ctx.dryRun,
    steps: [],
  };

  logger.info(
    { shopId: ctx.shopId, runId: ctx.runId, dryRun: ctx.dryRun, bundleId },
    'Starting BUNDLE_GENERATE_V2_SINGLE',
  );

  let bundleRow = await prisma.computedBundle.findFirst({
    where: { id: bundleId, shopId: ctx.shopId },
    select: {
      id: true,
      productId: true,
      slotIndex: true,
      variant: true,
      slotId: true,
      pinConfig: true,
    },
  });

  let targetProductId: string | null = null;
  let targetSlotIndex: number | null = null;

  if (bundleRow) {
    targetProductId = bundleRow.productId.toString();
    targetSlotIndex = Number(bundleRow.slotIndex ?? inferSlotIndex(bundleRow.variant));
  } else {
    const slotRow = await prisma.bundleSlot.findFirst({
      where: { id: bundleId, shopId: ctx.shopId },
      select: { id: true, productId: true, slotIndex: true },
    });
    if (slotRow) {
      targetProductId = slotRow.productId.toString();
      targetSlotIndex = Number(slotRow.slotIndex);
    }
  }

  if (!targetProductId || !targetSlotIndex) {
    recordStep(report, 'target_bundle', { bundleId, found: false });
    await writeReport(report);
    logger.warn(
      { shopId: ctx.shopId, runId: ctx.runId, bundleId },
      'Bundle not found for single regeneration',
    );
    PROCESS_SEED_OVERRIDE = previousSeedOverride;
    return;
  }
  recordStep(report, 'target_bundle', {
    bundleId,
    productId: targetProductId,
    slotIndex: targetSlotIndex,
  });

  const products = await loadProductsSnapshot(ctx);
  if (products.length === 0) {
    recordStep(report, 'snapshot', { productCount: 0 });
    await writeReport(report);
    logger.warn({ shopId: ctx.shopId, runId: ctx.runId }, 'No active products found');
    PROCESS_SEED_OVERRIDE = previousSeedOverride;
    return;
  }

  const targetProduct = products.find((p) => p.id.toString() === targetProductId);
  if (!targetProduct) {
    recordStep(report, 'snapshot', { productCount: products.length, targetFound: false });
    await writeReport(report);
    logger.warn(
      { shopId: ctx.shopId, runId: ctx.runId, productId: targetProductId },
      'Target product not found',
    );
    PROCESS_SEED_OVERRIDE = previousSeedOverride;
    return;
  }

  logger.info(
    {
      shopId: ctx.shopId,
      runId: ctx.runId,
      productCount: products.length,
      productId: targetProductId,
    },
    'Loaded product snapshot',
  );

  const categoryCounts = countCategories(products);
  recordStep(report, 'snapshot', {
    productCount: products.length,
    withCategory: products.filter((p) => p.categoryId).length,
    uniqueCategories: categoryCounts.length,
  });
  recordStep(report, 'category_counts', {
    total: categoryCounts.length,
    counts: categoryCounts,
  });
  await writeCategoryCountsReport(report, categoryCounts);

  const categoryEmbeddings = await buildCategoryEmbeddingsMap(categoryCounts);
  const embeddingsSummary = summarizeEmbeddings(categoryEmbeddings);
  recordStep(report, 'category_embeddings', embeddingsSummary);
  await writeCategoryEmbeddingsReport(report, categoryEmbeddings, embeddingsSummary);

  const categoryGraph = await buildCategoryGraphMap(ctx.shopId, categoryCounts);
  const graphSummary = summarizeCategoryGraph(categoryGraph);
  recordStep(report, 'category_graph', graphSummary);
  await writeCategoryGraphReport(report, categoryGraph, graphSummary);

  const categoryMerged = mergeCategoryAffinity(categoryCounts, categoryGraph, categoryEmbeddings);
  const mergedSummary = summarizeCategoryMerged(categoryMerged);
  recordStep(report, 'category_merged', mergedSummary);
  await writeCategoryMergedReport(report, categoryMerged, mergedSummary);

  const categoryTemplates = buildCategoryTemplates(categoryMerged);
  const templateSummary = summarizeCategoryTemplates(categoryTemplates);
  recordStep(report, 'category_templates', templateSummary);
  await writeCategoryTemplatesReport(report, categoryTemplates, templateSummary);

  const { scores, metrics } = await computeUnifiedProductScores(ctx, products);
  recordStep(report, 'signal_metrics', metrics);

  if (scores.length > 0) {
    const top = scores.slice(0, 100).map((s) => ({
      productId: s.productId.toString(),
      title: s.title,
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      categoryFullName: s.categoryFullName,
      unifiedScore: s.unifiedScore,
      engagement: s.engagementScore,
    }));
    recordStep(report, 'top_scores', { top, total: scores.length });
    if (REPORT_FULL) {
      recordStep(report, 'all_scores', { scores });
    }
    logger.info({ shopId: ctx.shopId, runId: ctx.runId, top }, 'Top unified product scores (v2)');
  }

  const { groups: categoryScoreGroups, summary: scoreGroupSummary } = buildCategoryScoreGroups(
    scores,
    REPORT_FULL,
  );
  recordStep(report, 'category_scores', scoreGroupSummary);
  await writeCategoryScoreGroupsReport(report, categoryScoreGroups, scoreGroupSummary);

  const { pools: categoryProductPools, summary: poolSummary } = buildCategoryProductPools(
    products,
    scores,
  );
  recordStep(report, 'category_product_pools', poolSummary);
  await writeCategoryProductPoolsReport(report, categoryProductPools, poolSummary);

  const productGraph = await loadProductGraphMap(ctx.shopId);
  const {
    bundles: productBundles,
    summary: bundleSummary,
    failures: bundleFailures,
    failureSummary,
  } = buildProductBundles([targetProduct], categoryTemplates, categoryProductPools, productGraph);
  recordStep(report, 'product_bundles', bundleSummary);
  recordStep(report, 'bundle_failures', failureSummary);
  await writeProductBundlesReport(report, productBundles, bundleSummary);
  await writeBundleFailuresReport(report, bundleFailures, failureSummary);

  const targetBundles = productBundles.filter(
    (bundle) => bundle.productId === targetProductId && bundle.bundleIndex === targetSlotIndex,
  );
  const bundlePinConfig = normalizePinConfig((bundleRow as any)?.pinConfig);
  const persistSummary = await persistComputedBundlesV2Single(
    ctx,
    targetBundles,
    targetProductId,
    targetSlotIndex,
    new Set(products.map((p) => p.id.toString())),
    bundlePinConfig ?? undefined,
  );
  recordStep(report, 'db_persist', persistSummary);

  await writeReport(report);
  PROCESS_SEED_OVERRIDE = previousSeedOverride;
  logger.info(
    { shopId: ctx.shopId, runId: ctx.runId, dryRun: ctx.dryRun, bundleId, persistSummary },
    'BUNDLE_GENERATE_V2_SINGLE complete',
  );
}

async function loadProductsSnapshot(ctx: BundleV2RunContext) {
  return prisma.product.findMany({
    where: { shopId: ctx.shopId, status: 'ACTIVE' },
    select: {
      id: true,
      handle: true,
      title: true,
      categoryId: true,
      category: {
        select: { rootId: true, topLevel: true, name: true, fullName: true },
      },
      gender: true,
      ageBucket: true,
      vendorNormalized: true,
      variants: {
        select: { priceUsd: true, inventoryQuantity: true },
        take: 1,
      },
    },
  });
}

// Placeholder types for upcoming steps
export type BundleCandidateV2 = {
  productId: bigint;
  categoryId?: string;
  title?: string;
  source: 'product_graph' | 'category_graph' | 'embeddings' | 'bestseller';
  score: number;
};

type ProductSnapshot = Awaited<ReturnType<typeof loadProductsSnapshot>>[number];

type UnifiedProductScore = {
  productId: bigint;
  unifiedScore: number;
  engagementScore: number;
  title: string;
  categoryId: string | null;
  categoryName?: string | null;
  categoryFullName?: string | null;
};

type UnifiedScoreMetrics = {
  productCount: number;
  featureCount: number;
  engagementRawMin: number;
  engagementRawMax: number;
};

async function computeUnifiedProductScores(ctx: BundleV2RunContext, products: ProductSnapshot[]) {
  const productIds = products.map((p) => p.id);

  const [features] = await Promise.all([
    prisma.productFeature.findMany({
      where: { shopId: ctx.shopId, productId: { in: productIds } },
      select: { productId: true, views7d: true, clicks7d: true, orders7d: true },
    }),
  ]);

  const featureMap = new Map<bigint, { views7d: number; clicks7d: number; orders7d: number }>();
  for (const f of features) {
    featureMap.set(f.productId, {
      views7d: f.views7d || 0,
      clicks7d: f.clicks7d || 0,
      orders7d: f.orders7d || 0,
    });
  }

  const rawEngagement = new Map<bigint, number>();

  for (const p of products) {
    const f = featureMap.get(p.id) || { views7d: 0, clicks7d: 0, orders7d: 0 };
    const engagement =
      f.views7d * SCORE_CONFIG.ENGAGEMENT_WEIGHTS.views7d +
      f.clicks7d * SCORE_CONFIG.ENGAGEMENT_WEIGHTS.clicks7d +
      f.orders7d * SCORE_CONFIG.ENGAGEMENT_WEIGHTS.orders7d;

    rawEngagement.set(p.id, engagement);
  }

  const engagementStats = minMax(Array.from(rawEngagement.values()));

  const normEngagement = normalizeMap(rawEngagement);

  const results: UnifiedProductScore[] = products.map((p) => {
    const engagementScore = normEngagement.get(p.id) || 0;

    const unifiedScore = SCORE_CONFIG.SCORE_WEIGHTS.engagement * engagementScore;

    return {
      productId: p.id,
      unifiedScore: round(unifiedScore, 4),
      engagementScore: round(engagementScore, 4),
      title: p.title,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      categoryFullName: p.category?.fullName ?? null,
    };
  });

  results.sort((a, b) => b.unifiedScore - a.unifiedScore);
  const metrics: UnifiedScoreMetrics = {
    productCount: products.length,
    featureCount: features.length,
    engagementRawMin: engagementStats.min,
    engagementRawMax: engagementStats.max,
  };
  return { scores: results, metrics };
}

function normalizeMap(map: Map<bigint, number>) {
  const values = Array.from(map.values());
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const normalized = new Map<bigint, number>();
  for (const [key, value] of map.entries()) {
    normalized.set(key, (value - min) / range);
  }
  return normalized;
}

function minMax(values: number[]) {
  if (values.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function round(value: number, digits: number) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function countCategories(products: ProductSnapshot[]) {
  const counts = new Map<string, { count: number; name?: string; fullName?: string }>();
  for (const p of products) {
    if (!p.categoryId) continue;
    const existing = counts.get(p.categoryId);
    if (existing) {
      existing.count += 1;
      if (!existing.fullName && p.category?.fullName) existing.fullName = p.category.fullName;
      if (!existing.name && p.category?.name) existing.name = p.category.name;
    } else {
      counts.set(p.categoryId, {
        count: 1,
        name: p.category?.name ?? undefined,
        fullName: p.category?.fullName ?? undefined,
      });
    }
  }
  const result = Array.from(counts.entries()).map(([categoryId, meta]) => ({
    categoryId,
    name: meta.name,
    fullName: meta.fullName,
    count: meta.count,
  }));
  result.sort((a, b) => b.count - a.count || a.categoryId.localeCompare(b.categoryId));
  return result;
}

type CategoryCount = ReturnType<typeof countCategories>[number];

type CategoryEmbeddingResult = {
  sourceCategoryId: string;
  sourceName?: string;
  sourceFullName?: string;
  sourceCount: number;
  results: {
    targetCategoryId: string;
    score: number;
    inShop: boolean;
    targetCount?: number;
    targetName?: string;
    targetFullName?: string;
  }[];
  raw?: unknown;
  error?: string;
};

type CategoryEmbeddingSummary = {
  totalSources: number;
  successCount: number;
  errorCount: number;
  avgResults: number;
  topN: number;
  timeoutMs: number;
  concurrency: number;
};

type CategoryGraphResult = {
  sourceCategoryId: string;
  sourceName?: string;
  sourceFullName?: string;
  sourceCount: number;
  results: {
    targetCategoryId: string;
    count: number;
    targetCount?: number;
    targetName?: string;
    targetFullName?: string;
  }[];
};

type CategoryGraphSummary = {
  totalSources: number;
  sourcesWithResults: number;
  avgResults: number;
  topN: number;
};

type CategoryMergedTarget = {
  targetCategoryId: string;
  source: 'graph' | 'embedding';
  count?: number;
  score?: number;
  targetCount?: number;
  targetName?: string;
  targetFullName?: string;
};

type CategoryMergedResult = {
  sourceCategoryId: string;
  normalizedSourceCategoryId: string;
  sourceName?: string;
  sourceFullName?: string;
  sourceCount: number;
  results: CategoryMergedTarget[];
  graphUsed: number;
  embedUsed: number;
};

type CategoryMergedSummary = {
  totalSources: number;
  sourcesWithGraph: number;
  sourcesWithEmbeddings: number;
  sourcesWithMerged: number;
  avgGraphUsed: number;
  avgEmbedUsed: number;
  avgTotal: number;
  topN: number;
  graphMinCount: number;
  targetMinCount: number;
  maxItemsPerBundle: number;
};

type CategoryProductPoolItem = {
  productId: string;
  title?: string;
  gender?: string[] | null;
  ageBucket?: string[] | null;
  priceUsd?: number | null;
  weight: number;
  probability: number;
  engagement: number;
  inStock: boolean;
};

type CategoryProductPool = {
  categoryId: string;
  categoryName?: string;
  categoryFullName?: string;
  productCount: number;
  totalWeight: number;
  uniformWeights: boolean;
  items?: CategoryProductPoolItem[];
  top?: CategoryProductPoolItem[];
};

type CategoryProductPoolSummary = {
  totalCategories: number;
  totalProducts: number;
  inStockProducts: number;
  avgProductsPerCategory: number;
  avgTotalWeight: number;
  zeroWeightCategories: number;
  topSampleSize: number;
};

type CategoryScoreProduct = {
  productId: string;
  title: string;
  unifiedScore: number;
  engagement: number;
};

type CategoryScoreGroup = {
  groupCategoryId: string;
  groupCategoryName?: string | null;
  groupCategoryFullName?: string | null;
  sourceCategoryIds?: string[];
  count: number;
  products?: CategoryScoreProduct[];
  top?: CategoryScoreProduct[];
};

type CategoryScoreGroupSummary = {
  totalCategories: number;
  totalProducts: number;
  avgProductsPerCategory: number;
  topSampleSize: number;
  includeAll: boolean;
};

type ProductGraphEdge = {
  targetId: string;
  count: number;
};

type ProductBundleTargetPick = {
  targetCategoryId: string;
  productId: string;
  title?: string;
  source: 'product_graph' | 'pool';
  weight: number;
  tier: number;
};

type PinConfig = {
  pinnedIds: string[];
};

type BundleSlotConfig = {
  enabled: boolean;
  pinConfig?: PinConfig;
};

type ProductBundleResult = {
  productId: string;
  title?: string;
  categoryId?: string | null;
  bundleIndex: number;
  templateId?: string;
  templateSource?: 'primary' | 'backup';
  targets: ProductBundleTargetPick[];
  fallbackAttempts: number;
};

type ProductBundleSummary = {
  totalProducts: number;
  withCategory: number;
  productsWithBundles: number;
  bundlesBuilt: number;
  bundlesFailed: number;
  avgBundlesPerProduct: number;
  avgTargetsPerBundle: number;
  avgFallbackAttempts: number;
  graphPickProbability: number;
  templateTargets: number;
  bundlesPerProductTarget: number;
};

type BundlePersistSummary = {
  persisted: boolean;
  dryRun: boolean;
  productsTouched: number;
  rowsCreated: number;
  rowsArchived: number;
};

type BundleFailureReason = 'no_category' | 'no_template' | 'no_candidates';

type BundleFailure = {
  productId: string;
  title?: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryFullName?: string | null;
  reason: BundleFailureReason;
  templateId?: string;
  targetCategoryId?: string;
  graphCandidates?: number;
  poolCandidates?: number;
};

type BundleFailureSummary = {
  totalFailures: number;
  noCategory: number;
  noTemplate: number;
  noCandidates: number;
};

type CategoryTemplateTarget = {
  targetCategoryId: string;
  source: 'graph' | 'embedding';
  count?: number;
  score?: number;
  targetCount?: number;
  targetName?: string;
  targetFullName?: string;
};

type CategoryTemplate = {
  id: string;
  targets: CategoryTemplateTarget[];
  graphUsed: number;
  embedUsed: number;
};

type CategoryTemplateResult = {
  sourceCategoryId: string;
  normalizedSourceCategoryId: string;
  sourceName?: string;
  sourceFullName?: string;
  sourceCount: number;
  primary: CategoryTemplate[];
  backup: CategoryTemplate[];
};

type CategoryTemplateSummary = {
  totalSources: number;
  sourcesWithTemplates: number;
  totalPrimary: number;
  totalBackup: number;
  avgPrimary: number;
  avgBackup: number;
  avgTotal: number;
  templateSize: number;
  primaryPerSource: number;
  backupPerSource: number;
  maxItemsPerBundle: number;
};

async function buildCategoryEmbeddingsMap(categoryCounts: CategoryCount[]) {
  const categoryMeta = new Map<string, CategoryCount>();
  for (const c of categoryCounts) {
    categoryMeta.set(c.categoryId, c);
  }

  const sourceIds = categoryCounts.map((c) => c.categoryId);
  const baseUrl = normalizeCategoryEmbeddingsUrl(INFRA_CONFIG.APIS.CATEGORY_EMBEDDINGS_URL);

  const results: CategoryEmbeddingResult[] = await mapWithConcurrency(
    sourceIds,
    EMBED_CONCURRENCY,
    async (categoryId) => {
      const meta = categoryMeta.get(categoryId);
      try {
        const response = await fetch(`${baseUrl}/similar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: categoryId, top_n: EMBED_TOP_N }),
          signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
        });

        if (!response.ok) {
          return {
            sourceCategoryId: categoryId,
            sourceName: meta?.name,
            sourceFullName: meta?.fullName,
            sourceCount: meta?.count ?? 0,
            results: [],
            error: `http_${response.status}`,
          };
        }

        const data = await response.json();
        const rawCategories: { category_id: string; score: number }[] = data?.categories || [];

        const mapped = rawCategories.map((c) => {
          const targetMeta = categoryMeta.get(c.category_id);
          return {
            targetCategoryId: c.category_id,
            score: Number(c.score) || 0,
            inShop: Boolean(targetMeta),
            targetCount: targetMeta?.count,
            targetName: targetMeta?.name,
            targetFullName: targetMeta?.fullName,
          };
        });

        return {
          sourceCategoryId: categoryId,
          sourceName: meta?.name,
          sourceFullName: meta?.fullName,
          sourceCount: meta?.count ?? 0,
          results: mapped.filter((r) => r.inShop),
          raw: EMBED_INCLUDE_RAW ? data : undefined,
        };
      } catch (err) {
        return {
          sourceCategoryId: categoryId,
          sourceName: meta?.name,
          sourceFullName: meta?.fullName,
          sourceCount: meta?.count ?? 0,
          results: [],
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  );

  return results;
}

function summarizeEmbeddings(items: CategoryEmbeddingResult[]): CategoryEmbeddingSummary {
  const successCount = items.filter((i) => !i.error).length;
  const errorCount = items.length - successCount;
  const avgResults = items.length
    ? Math.round((items.reduce((acc, i) => acc + i.results.length, 0) / items.length) * 100) / 100
    : 0;

  return {
    totalSources: items.length,
    successCount,
    errorCount,
    avgResults,
    topN: EMBED_TOP_N,
    timeoutMs: EMBED_TIMEOUT_MS,
    concurrency: EMBED_CONCURRENCY,
  };
}

async function buildCategoryGraphMap(shopId: string, categoryCounts: CategoryCount[]) {
  const normalizedMeta = buildNormalizedCategoryMeta(categoryCounts);
  const categoryIdToNormalized = buildCategoryIdToNormalizedMap(categoryCounts);
  const sourceIds = Array.from(new Set(Array.from(categoryIdToNormalized.values())));

  const edges = await prisma.categoryGraph.findMany({
    where: { shopId, sourceCategory: { in: Array.from(categoryIdToNormalized.keys()) } },
    select: { sourceCategory: true, targetCategory: true, count: true },
  });

  const grouped = new Map<string, Map<string, number>>();
  for (const edge of edges) {
    const sourceNorm = categoryIdToNormalized.get(edge.sourceCategory);
    const targetNorm = categoryIdToNormalized.get(edge.targetCategory);
    if (!sourceNorm || !targetNorm) continue;
    if (sourceNorm === targetNorm) continue;

    const targetMap = grouped.get(sourceNorm) || new Map<string, number>();
    const existing = targetMap.get(targetNorm);
    if (existing === undefined || edge.count > existing) {
      targetMap.set(targetNorm, edge.count);
    }
    grouped.set(sourceNorm, targetMap);
  }

  const results: CategoryGraphResult[] = [];
  for (const sourceId of sourceIds) {
    const sourceMeta = normalizedMeta.get(sourceId);
    const sourceRoot = getCategoryRootId(sourceId);
    const targetMap = grouped.get(sourceId) || new Map<string, number>();
    const sorted = Array.from(targetMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, CATEGORY_GRAPH_TOP_N);

    results.push({
      sourceCategoryId: sourceId,
      sourceName: sourceMeta?.name,
      sourceFullName: sourceMeta?.fullName,
      sourceCount: sourceMeta?.count ?? 0,
      results: sorted
        .map(([targetId, weight]) => {
          const targetMeta = normalizedMeta.get(targetId);
          const targetRoot = getCategoryRootId(targetId);
          if (sourceRoot && targetRoot && sourceRoot !== targetRoot) return null;
          return {
            targetCategoryId: targetId,
            count: Math.round(weight),
            targetCount: targetMeta?.count,
            targetName: targetMeta?.name,
            targetFullName: targetMeta?.fullName,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    });
  }

  results.sort(
    (a, b) => b.sourceCount - a.sourceCount || a.sourceCategoryId.localeCompare(b.sourceCategoryId),
  );
  return results;
}

function summarizeCategoryGraph(items: CategoryGraphResult[]): CategoryGraphSummary {
  const sourcesWithResults = items.filter((i) => i.results.length > 0).length;
  const avgResults = items.length
    ? Math.round((items.reduce((acc, i) => acc + i.results.length, 0) / items.length) * 100) / 100
    : 0;

  return {
    totalSources: items.length,
    sourcesWithResults,
    avgResults,
    topN: CATEGORY_GRAPH_TOP_N,
  };
}

function mergeCategoryAffinity(
  categoryCounts: CategoryCount[],
  graph: CategoryGraphResult[],
  embeddings: CategoryEmbeddingResult[],
) {
  const graphBySource = new Map<string, CategoryGraphResult>();
  for (const g of graph) {
    graphBySource.set(g.sourceCategoryId, g);
  }

  const embedBySource = new Map<string, CategoryEmbeddingResult>();
  for (const e of embeddings) {
    embedBySource.set(e.sourceCategoryId, e);
  }

  const merged: CategoryMergedResult[] = [];

  for (const source of categoryCounts) {
    const normalizedSource = normalizeCategoryId(source.categoryId, source.fullName);
    const graphResult = graphBySource.get(normalizedSource);
    const embedResult = embedBySource.get(source.categoryId);

    const used = new Set<string>();
    const results: CategoryMergedTarget[] = [];

    const graphCandidates = (graphResult?.results || [])
      .filter((r) => r.count >= CATEGORY_GRAPH_MIN_COUNT)
      .filter((r) => (r.targetCount ?? 0) >= CATEGORY_TARGET_MIN_COUNT);

    for (const r of graphCandidates) {
      if (results.length >= CATEGORY_MERGED_TOP_N) break;
      if (used.has(r.targetCategoryId)) continue;
      used.add(r.targetCategoryId);
      results.push({
        targetCategoryId: r.targetCategoryId,
        source: 'graph',
        count: r.count,
        targetCount: r.targetCount,
        targetName: r.targetName,
        targetFullName: r.targetFullName,
      });
    }

    const embedCandidates = (embedResult?.results || []).filter(
      (r) => (r.targetCount ?? 0) >= CATEGORY_TARGET_MIN_COUNT,
    );

    for (const r of embedCandidates) {
      if (results.length >= CATEGORY_MERGED_TOP_N) break;
      if (used.has(r.targetCategoryId)) continue;
      used.add(r.targetCategoryId);
      results.push({
        targetCategoryId: r.targetCategoryId,
        source: 'embedding',
        score: round(r.score, 4),
        targetCount: r.targetCount,
        targetName: r.targetName,
        targetFullName: r.targetFullName,
      });
    }

    const graphUsed = results.filter((r) => r.source === 'graph').length;
    const embedUsed = results.filter((r) => r.source === 'embedding').length;

    merged.push({
      sourceCategoryId: source.categoryId,
      normalizedSourceCategoryId: normalizedSource,
      sourceName: source.name,
      sourceFullName: source.fullName,
      sourceCount: source.count,
      results,
      graphUsed,
      embedUsed,
    });
  }

  return merged;
}

function summarizeCategoryMerged(items: CategoryMergedResult[]): CategoryMergedSummary {
  const totalSources = items.length;
  const sourcesWithGraph = items.filter((i) => i.graphUsed > 0).length;
  const sourcesWithEmbeddings = items.filter((i) => i.embedUsed > 0).length;
  const sourcesWithMerged = items.filter((i) => i.results.length > 0).length;

  const avgGraphUsed = totalSources
    ? Math.round((items.reduce((acc, i) => acc + i.graphUsed, 0) / totalSources) * 100) / 100
    : 0;
  const avgEmbedUsed = totalSources
    ? Math.round((items.reduce((acc, i) => acc + i.embedUsed, 0) / totalSources) * 100) / 100
    : 0;
  const avgTotal = totalSources
    ? Math.round((items.reduce((acc, i) => acc + i.results.length, 0) / totalSources) * 100) / 100
    : 0;

  return {
    totalSources,
    sourcesWithGraph,
    sourcesWithEmbeddings,
    sourcesWithMerged,
    avgGraphUsed,
    avgEmbedUsed,
    avgTotal,
    topN: CATEGORY_MERGED_TOP_N,
    graphMinCount: CATEGORY_GRAPH_MIN_COUNT,
    targetMinCount: CATEGORY_TARGET_MIN_COUNT,
    maxItemsPerBundle: BUNDLE_MAX_ITEMS,
  };
}

function buildCategoryTemplates(merged: CategoryMergedResult[]): CategoryTemplateResult[] {
  const templateSize = Math.max(1, BUNDLE_MAX_ITEMS);
  const maxTemplates = CATEGORY_TEMPLATE_PRIMARY + CATEGORY_TEMPLATE_BACKUP;
  const seedDay = new Date().toISOString().slice(0, 10);

  return merged.map((source) => {
    const seedBase = PROCESS_SEED_OVERRIDE ? `${seedDay}:${PROCESS_SEED_OVERRIDE}` : seedDay;
    const orderedTargets = [...source.results].sort((a, b) => {
      if (a.source !== b.source) return a.source === 'graph' ? -1 : 1;
      if (a.source === 'graph') return (b.count ?? 0) - (a.count ?? 0);
      return (b.score ?? 0) - (a.score ?? 0);
    });

    const graphTargets = orderedTargets.filter((t) => t.source === 'graph');
    const embedTargets = orderedTargets.filter((t) => t.source === 'embedding');
    const rng = createSeededRng(`${seedBase}:${source.sourceCategoryId}`);
    const randomizedTargets = [
      ...seededShuffle(graphTargets, rng),
      ...seededShuffle(embedTargets, rng),
    ];

    const combos = generateTargetCombos(randomizedTargets, templateSize, maxTemplates, rng);
    const primaryCombos = combos.slice(0, CATEGORY_TEMPLATE_PRIMARY);
    const backupCombos = combos.slice(
      CATEGORY_TEMPLATE_PRIMARY,
      CATEGORY_TEMPLATE_PRIMARY + CATEGORY_TEMPLATE_BACKUP,
    );

    const primary = primaryCombos.map((targets, idx) => {
      const graphUsed = targets.filter((t) => t.source === 'graph').length;
      const embedUsed = targets.length - graphUsed;
      return {
        id: `${source.sourceCategoryId}-p${idx + 1}`,
        targets,
        graphUsed,
        embedUsed,
      };
    });

    const backup = backupCombos.map((targets, idx) => {
      const graphUsed = targets.filter((t) => t.source === 'graph').length;
      const embedUsed = targets.length - graphUsed;
      return {
        id: `${source.sourceCategoryId}-b${idx + 1}`,
        targets,
        graphUsed,
        embedUsed,
      };
    });

    return {
      sourceCategoryId: source.sourceCategoryId,
      normalizedSourceCategoryId: source.normalizedSourceCategoryId,
      sourceName: source.sourceName,
      sourceFullName: source.sourceFullName,
      sourceCount: source.sourceCount,
      primary,
      backup,
    };
  });
}

function generateTargetCombos<T>(
  items: T[],
  size: number,
  limit: number,
  rng?: () => number,
): T[][] {
  if (size <= 0 || items.length === 0 || limit <= 0) return [];
  if (size === 1) return items.slice(0, limit).map((item) => [item]);

  const combos: T[][] = [];
  const seen = new Set<string>();
  const maxSlidingStart = items.length - size;

  // 1) Sliding windows on the randomized list
  for (let i = 0; i <= maxSlidingStart && combos.length < limit; i += 1) {
    const combo = items.slice(i, i + size);
    const key = comboKey(combo);
    if (!seen.has(key)) {
      combos.push(combo);
      seen.add(key);
    }
  }

  // 2) Random combos to fill the rest
  if (combos.length < limit) {
    const seedBase = PROCESS_SEED_OVERRIDE ? `:${PROCESS_SEED_OVERRIDE}` : '';
    const random = rng ?? createSeededRng(`combo-fill:${items.length}:${size}:${limit}${seedBase}`);
    let attempts = 0;
    const maxAttempts = Math.max(50, limit * 20);

    while (combos.length < limit && attempts < maxAttempts) {
      attempts += 1;
      const indices = pickDistinctIndices(items.length, size, random);
      if (!indices) continue;
      const combo = indices.map((i) => items[i]);
      const key = comboKey(combo);
      if (seen.has(key)) continue;
      combos.push(combo);
      seen.add(key);
    }
  }

  return combos;
}

function comboKey<T>(combo: T[]) {
  return combo
    .map((item) => {
      if (item && typeof item === 'object') {
        if ('targetCategoryId' in item)
          return String((item as { targetCategoryId?: string }).targetCategoryId);
        if ('productId' in item) return String((item as { productId?: string }).productId);
      }
      return String(item);
    })
    .join('|');
}

function pickDistinctIndices(length: number, size: number, rng: () => number) {
  if (size > length) return null;
  const indices = new Set<number>();
  let guard = 0;
  while (indices.size < size && guard < length * 3) {
    indices.add(Math.floor(rng() * length));
    guard += 1;
  }
  if (indices.size < size) return null;
  return Array.from(indices).sort((a, b) => a - b);
}

function seededShuffle<T>(items: T[], rng: () => number) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createSeededRng(seed: string) {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function summarizeCategoryTemplates(items: CategoryTemplateResult[]): CategoryTemplateSummary {
  const totalSources = items.length;
  const totalPrimary = items.reduce((acc, i) => acc + i.primary.length, 0);
  const totalBackup = items.reduce((acc, i) => acc + i.backup.length, 0);
  const totalTemplates = totalPrimary + totalBackup;
  const sourcesWithTemplates = items.filter((i) => i.primary.length + i.backup.length > 0).length;

  const avgPrimary = totalSources ? Math.round((totalPrimary / totalSources) * 100) / 100 : 0;
  const avgBackup = totalSources ? Math.round((totalBackup / totalSources) * 100) / 100 : 0;
  const avgTotal = totalSources ? Math.round((totalTemplates / totalSources) * 100) / 100 : 0;

  return {
    totalSources,
    sourcesWithTemplates,
    totalPrimary,
    totalBackup,
    avgPrimary,
    avgBackup,
    avgTotal,
    templateSize: Math.max(1, BUNDLE_MAX_ITEMS),
    primaryPerSource: CATEGORY_TEMPLATE_PRIMARY,
    backupPerSource: CATEGORY_TEMPLATE_BACKUP,
    maxItemsPerBundle: BUNDLE_MAX_ITEMS,
  };
}

function buildCategoryProductPools(
  products: ProductSnapshot[],
  scores: UnifiedProductScore[],
): { pools: CategoryProductPool[]; summary: CategoryProductPoolSummary } {
  const scoreMap = new Map<string, UnifiedProductScore>();
  for (const score of scores) {
    scoreMap.set(score.productId.toString(), score);
  }

  const pools = new Map<string, CategoryProductPool>();
  let totalProducts = 0;
  let inStockProducts = 0;

  for (const product of products) {
    if (!product.categoryId) continue;
    totalProducts += 1;

    const inventory = product.variants[0]?.inventoryQuantity;
    const inStock = inventory == null || inventory > 0 || !INVENTORY_STRICT;
    if (!inStock) continue;
    inStockProducts += 1;

    const score = scoreMap.get(product.id.toString());
    const engagement = score?.engagementScore ?? 0;

    let pool = pools.get(product.categoryId);
    if (!pool) {
      pool = {
        categoryId: product.categoryId,
        categoryName: product.category?.name ?? undefined,
        categoryFullName: product.category?.fullName ?? undefined,
        productCount: 0,
        totalWeight: 0,
        uniformWeights: false,
        items: [],
        top: [],
      };
      pools.set(product.categoryId, pool);
    }

    const priceUsd = product.variants[0]?.priceUsd;
    const item: CategoryProductPoolItem = {
      productId: product.id.toString(),
      title: product.title,
      gender: product.gender ?? null,
      ageBucket: product.ageBucket ?? null,
      priceUsd: priceUsd == null ? null : Number(priceUsd),
      weight: engagement,
      probability: 0,
      engagement,
      inStock,
    };

    pool.productCount += 1;
    pool.totalWeight += engagement;
    pool.items?.push(item);
    pool.top?.push(item);
  }

  const poolList: CategoryProductPool[] = [];
  let zeroWeightCategories = 0;
  let totalWeight = 0;

  for (const pool of pools.values()) {
    pool.top = (pool.top || [])
      .sort((a, b) => b.weight - a.weight || a.productId.localeCompare(b.productId))
      .slice(0, 10);

    if (pool.totalWeight <= 0 && pool.productCount > 0) {
      pool.uniformWeights = true;
      pool.totalWeight = pool.productCount;
      const updateItems = pool.items ?? [];
      for (const item of updateItems) {
        item.weight = 1;
      }
    }

    const applyProbabilities = (items: CategoryProductPoolItem[] | undefined) => {
      if (!items || items.length === 0) return;
      const count = pool.productCount || 1;
      const denom = pool.totalWeight + POOL_SMOOTHING_EPSILON * count || 1;
      for (const item of items) {
        const adjusted = item.weight + POOL_SMOOTHING_EPSILON;
        item.probability = round(adjusted / denom, 6);
      }
    };

    applyProbabilities(pool.items);
    applyProbabilities(pool.top);

    totalWeight += pool.totalWeight;
    if (pool.totalWeight <= 0) zeroWeightCategories += 1;
    poolList.push(pool);
  }

  poolList.sort(
    (a, b) => b.productCount - a.productCount || a.categoryId.localeCompare(b.categoryId),
  );

  const summary: CategoryProductPoolSummary = {
    totalCategories: poolList.length,
    totalProducts,
    inStockProducts,
    avgProductsPerCategory: poolList.length
      ? Math.round((inStockProducts / poolList.length) * 100) / 100
      : 0,
    avgTotalWeight: poolList.length ? Math.round((totalWeight / poolList.length) * 100) / 100 : 0,
    zeroWeightCategories,
    topSampleSize: 10,
  };

  return { pools: poolList, summary };
}

function buildNormalizedPoolMap(pools: CategoryProductPool[]) {
  const map = new Map<string, CategoryProductPool>();

  for (const pool of pools) {
    const normalizedId = normalizeCategoryId(pool.categoryId, pool.categoryFullName ?? null);
    let target = map.get(normalizedId);
    if (!target) {
      const normalizedFullName = truncateCategoryFullName(pool.categoryFullName, normalizedId);
      const normalizedName = normalizedFullName
        ? normalizedFullName.split(' > ')[normalizedFullName.split(' > ').length - 1]
        : pool.categoryName;
      target = {
        categoryId: normalizedId,
        categoryName: normalizedName,
        categoryFullName: normalizedFullName ?? pool.categoryFullName,
        productCount: 0,
        totalWeight: 0,
        uniformWeights: false,
        items: [],
        top: [],
      };
      map.set(normalizedId, target);
    }

    target.productCount += pool.productCount;
    target.totalWeight += pool.totalWeight;
    target.items = [...(target.items || []), ...(pool.items || [])];
    target.top = [...(target.top || []), ...(pool.top || [])];
  }

  for (const pool of map.values()) {
    if (pool.totalWeight <= 0 && pool.productCount > 0) {
      pool.uniformWeights = true;
      pool.totalWeight = pool.productCount;
      for (const item of pool.items || []) {
        item.weight = 1;
      }
    }

    const applyProbabilities = (items: CategoryProductPoolItem[] | undefined) => {
      if (!items || items.length === 0) return;
      const count = pool.productCount || 1;
      const denom = pool.totalWeight + POOL_SMOOTHING_EPSILON * count || 1;
      for (const item of items) {
        const adjusted = item.weight + POOL_SMOOTHING_EPSILON;
        item.probability = round(adjusted / denom, 6);
      }
    };

    applyProbabilities(pool.items);

    pool.top = (pool.top || [])
      .sort((a, b) => b.weight - a.weight || a.productId.localeCompare(b.productId))
      .slice(0, 10);
    applyProbabilities(pool.top);
  }

  return map;
}

function buildCategoryScoreGroups(
  scores: UnifiedProductScore[],
  includeAll: boolean,
): { groups: CategoryScoreGroup[]; summary: CategoryScoreGroupSummary } {
  const groups = new Map<string, CategoryScoreGroup>();
  const groupSourceIds = new Map<string, Set<string>>();
  let totalProducts = 0;

  for (const score of scores) {
    if (!score.categoryId) continue;
    totalProducts += 1;
    const groupId = normalizeCategoryId(score.categoryId, score.categoryFullName);
    let group = groups.get(groupId);
    if (!group) {
      const normalizedFullName = truncateCategoryFullName(score.categoryFullName, groupId);
      const normalizedName = normalizedFullName
        ? normalizedFullName.split(' > ')[normalizedFullName.split(' > ').length - 1]
        : (score.categoryName ?? null);
      group = {
        groupCategoryId: groupId,
        groupCategoryName: normalizedName,
        groupCategoryFullName: normalizedFullName ?? score.categoryFullName ?? null,
        count: 0,
        products: includeAll ? [] : undefined,
        top: [],
      };
      groups.set(groupId, group);
    }

    const sourceIds = groupSourceIds.get(groupId) ?? new Set<string>();
    sourceIds.add(score.categoryId);
    groupSourceIds.set(groupId, sourceIds);

    const product: CategoryScoreProduct = {
      productId: score.productId.toString(),
      title: score.title,
      unifiedScore: score.unifiedScore,
      engagement: score.engagementScore,
    };

    group.count += 1;
    if (includeAll) {
      group.products?.push(product);
    }
    group.top?.push(product);
  }

  const groupList: CategoryScoreGroup[] = [];
  for (const [groupId, group] of groups.entries()) {
    const sourceIds = Array.from(groupSourceIds.get(groupId) ?? []);
    sourceIds.sort();
    group.sourceCategoryIds = sourceIds;

    group.top = (group.top || [])
      .sort((a, b) => b.unifiedScore - a.unifiedScore || a.productId.localeCompare(b.productId))
      .slice(0, CATEGORY_SCORE_TOP_N);
    groupList.push(group);
  }

  groupList.sort((a, b) => b.count - a.count || a.groupCategoryId.localeCompare(b.groupCategoryId));

  const summary: CategoryScoreGroupSummary = {
    totalCategories: groupList.length,
    totalProducts,
    avgProductsPerCategory: groupList.length
      ? Math.round((totalProducts / groupList.length) * 100) / 100
      : 0,
    topSampleSize: CATEGORY_SCORE_TOP_N,
    includeAll,
  };

  return { groups: groupList, summary };
}

async function loadProductGraphMap(shopId: string) {
  const edges = await prisma.productGraph.findMany({
    where: { shopId, type: 'BUNDLE', count: { gt: 0 } },
    select: { sourceId: true, targetId: true, count: true },
  });

  const map = new Map<string, ProductGraphEdge[]>();
  for (const edge of edges) {
    const key = edge.sourceId.toString();
    const list = map.get(key) || [];
    list.push({ targetId: edge.targetId.toString(), count: edge.count });
    map.set(key, list);
  }

  for (const list of map.values()) {
    list.sort((a, b) => b.count - a.count || a.targetId.localeCompare(b.targetId));
  }

  return map;
}

function buildProductBundles(
  products: ProductSnapshot[],
  templates: CategoryTemplateResult[],
  pools: CategoryProductPool[],
  productGraph: Map<string, ProductGraphEdge[]>,
): {
  bundles: ProductBundleResult[];
  summary: ProductBundleSummary;
  failures: BundleFailure[];
  failureSummary: BundleFailureSummary;
} {
  const templateMap = new Map<string, CategoryTemplateResult>();
  for (const template of templates) {
    templateMap.set(template.sourceCategoryId, template);
  }

  const poolMap = new Map<string, CategoryProductPool>();
  for (const pool of pools) {
    poolMap.set(pool.categoryId, pool);
  }
  const normalizedPoolMap = buildNormalizedPoolMap(pools);

  const productMeta = new Map<
    string,
    {
      categoryId?: string | null;
      normalizedCategoryId?: string;
      title?: string;
      gender?: string[] | null;
      ageBucket?: string[] | null;
      inStock: boolean;
    }
  >();
  for (const product of products) {
    const inventory = product.variants[0]?.inventoryQuantity;
    const inStock = inventory == null || inventory > 0 || !INVENTORY_STRICT;
    const normalizedCategoryId = product.categoryId
      ? normalizeCategoryId(product.categoryId, product.category?.fullName ?? null)
      : undefined;
    productMeta.set(product.id.toString(), {
      categoryId: product.categoryId,
      normalizedCategoryId,
      title: product.title,
      gender: product.gender ?? null,
      ageBucket: product.ageBucket ?? null,
      inStock,
    });
  }

  const bundles: ProductBundleResult[] = [];
  const failures: BundleFailure[] = [];
  let withCategory = 0;
  let bundlesBuilt = 0;
  let bundlesFailed = 0;
  let productsWithBundles = 0;
  let totalTargets = 0;
  let totalFallbackAttempts = 0;
  let failuresNoCategory = 0;
  let failuresNoTemplate = 0;
  let failuresNoCandidates = 0;
  const seedDay = new Date().toISOString().slice(0, 10);
  const seedBase = PROCESS_SEED_OVERRIDE ? `${seedDay}:${PROCESS_SEED_OVERRIDE}` : seedDay;
  const desiredBundlesPerProduct = Math.max(1, BUNDLES_PER_PRODUCT);

  for (const product of products) {
    const categoryId = product.categoryId;
    if (!categoryId) {
      failuresNoCategory += 1;
      failures.push({
        productId: product.id.toString(),
        title: product.title,
        categoryId: product.categoryId,
        categoryName: product.category?.name ?? null,
        categoryFullName: product.category?.fullName ?? null,
        reason: 'no_category',
      });
      continue;
    }
    withCategory += 1;

    const templateSet = templateMap.get(categoryId);
    if (!templateSet || templateSet.primary.length === 0) {
      failuresNoTemplate += 1;
      failures.push({
        productId: product.id.toString(),
        title: product.title,
        categoryId,
        categoryName: product.category?.name ?? null,
        categoryFullName: product.category?.fullName ?? null,
        reason: 'no_template',
      });
      bundlesFailed += 1;
      continue;
    }

    const productId = product.id.toString();
    const seed = `${seedBase}:${productId}`;
    const rng = createSeededRng(seed);
    const primary = seededShuffle(templateSet.primary, rng);
    const fallbackQueue = [...primary, ...templateSet.backup];

    const bundlesForProduct: ProductBundleResult[] = [];
    let failureDetail: BundleFailure | null = null;
    let attempts = 0;
    let failedSinceLastSuccess = 0;
    const graphEdges = productGraph.get(productId) || [];
    const usedGlobal = new Set<string>([productId]);

    for (let i = 0; i < fallbackQueue.length; i += 1) {
      if (bundlesForProduct.length >= desiredBundlesPerProduct) break;
      const template = fallbackQueue[i];
      attempts += 1;
      const used = new Set<string>(usedGlobal);
      const picks: ProductBundleTargetPick[] = [];

      for (const target of template.targets) {
        const graphCandidates = graphEdges.filter((edge) => {
          if (used.has(edge.targetId)) return false;
          const meta = productMeta.get(edge.targetId);
          if (!meta || !meta.inStock) return false;
          return (
            meta.categoryId === target.targetCategoryId ||
            meta.normalizedCategoryId === target.targetCategoryId
          );
        });

        const pool =
          poolMap.get(target.targetCategoryId) ?? normalizedPoolMap.get(target.targetCategoryId);
        const poolCandidates = pool?.items?.filter((item) => !used.has(item.productId)) ?? [];

        const pick = pickTargetProduct({
          sourceProductId: productId,
          sourceGender: product.gender ?? [],
          sourceAgeBucket: product.ageBucket ?? [],
          targetCategoryId: target.targetCategoryId,
          productGraph,
          poolMap,
          normalizedPoolMap,
          productMeta,
          used,
          seed: `${seedBase}:${productId}:${target.targetCategoryId}`,
        });

        if (!pick) {
          if (!failureDetail) {
            failureDetail = {
              productId,
              title: product.title,
              categoryId,
              categoryName: product.category?.name ?? null,
              categoryFullName: product.category?.fullName ?? null,
              reason: 'no_candidates',
              templateId: template.id,
              targetCategoryId: target.targetCategoryId,
              graphCandidates: graphCandidates.length,
              poolCandidates: poolCandidates.length,
            };
          }
          picks.length = 0;
          break;
        }

        used.add(pick.productId);
        picks.push(pick);
      }

      if (picks.length === template.targets.length) {
        const bundleIndex = bundlesForProduct.length + 1;
        const selected: ProductBundleResult = {
          productId,
          title: product.title,
          categoryId,
          bundleIndex,
          templateId: template.id,
          templateSource: i < primary.length ? 'primary' : 'backup',
          targets: picks,
          fallbackAttempts: failedSinceLastSuccess,
        };
        bundlesForProduct.push(selected);
        failedSinceLastSuccess = 0;
        for (const pick of picks) {
          usedGlobal.add(pick.productId);
        }
      } else {
        failedSinceLastSuccess += 1;
      }
    }

    if (bundlesForProduct.length > 0) {
      for (const bundle of bundlesForProduct) {
        bundles.push(bundle);
        bundlesBuilt += 1;
        totalTargets += bundle.targets.length;
        totalFallbackAttempts += bundle.fallbackAttempts;
      }
      productsWithBundles += 1;
    } else {
      failuresNoCandidates += 1;
      failures.push(
        failureDetail ?? {
          productId,
          title: product.title,
          categoryId,
          categoryName: product.category?.name ?? null,
          categoryFullName: product.category?.fullName ?? null,
          reason: 'no_candidates',
        },
      );
      bundlesFailed += 1;
    }
  }

  const summary: ProductBundleSummary = {
    totalProducts: products.length,
    withCategory,
    productsWithBundles,
    bundlesBuilt,
    bundlesFailed,
    avgBundlesPerProduct: productsWithBundles
      ? Math.round((bundlesBuilt / productsWithBundles) * 100) / 100
      : 0,
    avgTargetsPerBundle: bundlesBuilt ? Math.round((totalTargets / bundlesBuilt) * 100) / 100 : 0,
    avgFallbackAttempts: bundlesBuilt
      ? Math.round((totalFallbackAttempts / bundlesBuilt) * 100) / 100
      : 0,
    graphPickProbability: GRAPH_PICK_PROB,
    templateTargets: BUNDLE_MAX_ITEMS,
    bundlesPerProductTarget: desiredBundlesPerProduct,
  };

  const failureSummary: BundleFailureSummary = {
    totalFailures: failures.length,
    noCategory: failuresNoCategory,
    noTemplate: failuresNoTemplate,
    noCandidates: failuresNoCandidates,
  };

  return { bundles, summary, failures, failureSummary };
}

function pickTargetProduct(args: {
  sourceProductId: string;
  sourceGender: string[];
  sourceAgeBucket: string[];
  targetCategoryId: string;
  productGraph: Map<string, ProductGraphEdge[]>;
  poolMap: Map<string, CategoryProductPool>;
  normalizedPoolMap: Map<string, CategoryProductPool>;
  productMeta: Map<
    string,
    {
      categoryId?: string | null;
      normalizedCategoryId?: string;
      title?: string;
      gender?: string[] | null;
      ageBucket?: string[] | null;
      inStock: boolean;
    }
  >;
  used: Set<string>;
  seed: string;
}): ProductBundleTargetPick | null {
  const {
    sourceProductId,
    sourceGender,
    sourceAgeBucket,
    targetCategoryId,
    productGraph,
    poolMap,
    normalizedPoolMap,
    productMeta,
    used,
    seed,
  } = args;

  const rng = createSeededRng(seed);
  const graphEdges = productGraph.get(sourceProductId) || [];
  const graphCandidates = graphEdges.filter((edge) => {
    if (used.has(edge.targetId)) return false;
    const meta = productMeta.get(edge.targetId);
    if (!meta || !meta.inStock) return false;
    return meta.categoryId === targetCategoryId || meta.normalizedCategoryId === targetCategoryId;
  });

  const pool = poolMap.get(targetCategoryId) ?? normalizedPoolMap.get(targetCategoryId);

  const useGraph = graphCandidates.length > 0 && rng() < GRAPH_PICK_PROB;

  const availablePool = pool?.items?.filter((item) => !used.has(item.productId)) ?? [];

  const graphTiered = splitCandidatesByTier(graphCandidates, {
    originGender: sourceGender,
    originAgeBucket: sourceAgeBucket,
    getGender: (edge) => productMeta.get(edge.targetId)?.gender ?? [],
    getAgeBucket: (edge) => productMeta.get(edge.targetId)?.ageBucket ?? [],
  });

  const poolTiered = splitCandidatesByTier(availablePool, {
    originGender: sourceGender,
    originAgeBucket: sourceAgeBucket,
    getGender: (item) => item.gender ?? [],
    getAgeBucket: (item) => item.ageBucket ?? [],
  });

  const bestGraphTier = graphTiered.bestTier ?? Number.POSITIVE_INFINITY;
  const bestPoolTier = poolTiered.bestTier ?? Number.POSITIVE_INFINITY;

  const pickFromGraph = (tier: number) => {
    const bucket = graphTiered.byTier[tier] || [];
    const pick = weightedPick(bucket, (item) => item.count + POOL_SMOOTHING_EPSILON, rng);
    if (!pick) return null;
    const meta = productMeta.get(pick.targetId);
    return {
      targetCategoryId,
      productId: pick.targetId,
      title: meta?.title,
      source: 'product_graph',
      weight: pick.count,
      tier,
    };
  };

  const pickFromPool = (tier: number) => {
    const bucket = poolTiered.byTier[tier] || [];
    const pick = weightedPick(bucket, (item) => item.weight + POOL_SMOOTHING_EPSILON, rng);
    if (!pick) return null;
    return {
      targetCategoryId,
      productId: pick.productId,
      title: pick.title,
      source: 'pool',
      weight: pick.weight,
      tier,
    };
  };

  if (useGraph) {
    if (bestGraphTier <= bestPoolTier) {
      const pick = pickFromGraph(bestGraphTier);
      if (pick) return pick;
    }
    if (bestPoolTier < Number.POSITIVE_INFINITY) {
      const pick = pickFromPool(bestPoolTier);
      if (pick) return pick;
    }
  } else {
    if (bestPoolTier <= bestGraphTier) {
      const pick = pickFromPool(bestPoolTier);
      if (pick) return pick;
    }
    if (bestGraphTier < Number.POSITIVE_INFINITY) {
      const pick = pickFromGraph(bestGraphTier);
      if (pick) return pick;
    }
  }

  return null;
}

function weightedPick<T>(items: T[], getWeight: (item: T) => number, rng: () => number) {
  let total = 0;
  for (const item of items) {
    total += Math.max(0, getWeight(item));
  }
  if (total <= 0) return null;
  const threshold = rng() * total;
  let acc = 0;
  for (const item of items) {
    acc += Math.max(0, getWeight(item));
    if (acc >= threshold) return item;
  }
  return items[items.length - 1] ?? null;
}

type TierBuckets<T> = {
  byTier: { 1: T[]; 2: T[]; 3: T[] };
  bestTier: number | null;
};

function splitCandidatesByTier<T>(
  items: T[],
  opts: {
    originGender: string[];
    originAgeBucket: string[];
    getGender: (item: T) => string[];
    getAgeBucket: (item: T) => string[];
  },
): TierBuckets<T> {
  const byTier: { 1: T[]; 2: T[]; 3: T[] } = { 1: [], 2: [], 3: [] };
  if (items.length === 0) return { byTier, bestTier: null };

  const originGender = opts.originGender ?? [];
  const originAgeBucket = opts.originAgeBucket ?? [];
  const genderTiers = originGender.length > 0 ? buildGenderTiers(originGender) : null;
  const ageTiers = originAgeBucket.length > 0 ? buildAgeTiers(originAgeBucket) : null;

  for (const item of items) {
    const genders = opts.getGender(item) ?? [];
    const ageBuckets = opts.getAgeBucket(item) ?? [];
    const gTier = genderTiers ? getGenderTier(genders, genderTiers) : 1;
    const aTier = ageTiers ? getAgeTier(ageBuckets, ageTiers) : 1;
    const combined = Math.max(gTier, aTier);

    if (combined === 1) byTier[1].push(item);
    else if (combined === 2) byTier[2].push(item);
    else byTier[3].push(item);
  }

  const bestTier = byTier[1].length ? 1 : byTier[2].length ? 2 : byTier[3].length ? 3 : null;
  return { byTier, bestTier };
}

// Demographic tier rules (mirrors app-remix recommendations/helpers.server/demographics.ts)
type TierMap = Map<string, number>;

function buildGenderTiers(originGenders: string[]): TierMap {
  const tiers = new Map<string, number>();
  const primaryGender = originGenders[0] || 'UNKNOWN';

  if (primaryGender === 'MALE') {
    tiers.set('MALE', 1);
    tiers.set('UNISEX', 1);
    tiers.set('UNKNOWN', 2);
    tiers.set('FEMALE', 3);
  } else if (primaryGender === 'FEMALE') {
    tiers.set('FEMALE', 1);
    tiers.set('UNISEX', 1);
    tiers.set('UNKNOWN', 2);
    tiers.set('MALE', 3);
  } else if (primaryGender === 'UNISEX') {
    tiers.set('UNISEX', 1);
    tiers.set('MALE', 1);
    tiers.set('FEMALE', 1);
    tiers.set('UNKNOWN', 2);
  } else {
    tiers.set('UNKNOWN', 1);
    tiers.set('UNISEX', 1);
    tiers.set('MALE', 2);
    tiers.set('FEMALE', 2);
  }

  return tiers;
}

function getGenderTier(genders: string[], tiers: TierMap): number {
  if (genders.length === 0) return 1;
  let bestTier = 99;
  for (const g of genders) {
    const tier = tiers.get(g) ?? 99;
    if (tier < bestTier) bestTier = tier;
  }
  return bestTier;
}

function buildAgeTiers(originAgeBuckets: string[]): TierMap {
  const tiers = new Map<string, number>();
  const primaryAge = originAgeBuckets[0] || 'UNKNOWN';

  tiers.set('ALL_AGE', 1);

  if (primaryAge === 'ADULT') {
    tiers.set('ADULT', 1);
    tiers.set('TEEN', 2);
    tiers.set('UNKNOWN', 2);
    tiers.set('KID', 3);
    tiers.set('BABY', 3);
    tiers.set('NEWBORN', 3);
  } else if (primaryAge === 'TEEN') {
    tiers.set('TEEN', 1);
    tiers.set('ADULT', 2);
    tiers.set('KID', 2);
    tiers.set('UNKNOWN', 2);
    tiers.set('BABY', 3);
    tiers.set('NEWBORN', 3);
  } else if (primaryAge === 'KID') {
    tiers.set('KID', 1);
    tiers.set('TEEN', 2);
    tiers.set('BABY', 2);
    tiers.set('UNKNOWN', 2);
    tiers.set('ADULT', 3);
    tiers.set('NEWBORN', 3);
  } else if (primaryAge === 'BABY') {
    tiers.set('BABY', 1);
    tiers.set('NEWBORN', 2);
    tiers.set('KID', 2);
    tiers.set('UNKNOWN', 2);
    tiers.set('TEEN', 3);
    tiers.set('ADULT', 3);
  } else if (primaryAge === 'NEWBORN') {
    tiers.set('NEWBORN', 1);
    tiers.set('BABY', 2);
    tiers.set('UNKNOWN', 2);
    tiers.set('KID', 3);
    tiers.set('TEEN', 3);
    tiers.set('ADULT', 3);
  } else if (primaryAge === 'ALL_AGE') {
    tiers.set('ADULT', 1);
    tiers.set('TEEN', 1);
    tiers.set('KID', 1);
    tiers.set('BABY', 1);
    tiers.set('NEWBORN', 1);
    tiers.set('UNKNOWN', 2);
  } else {
    tiers.set('UNKNOWN', 1);
    tiers.set('ADULT', 2);
    tiers.set('TEEN', 2);
    tiers.set('KID', 2);
    tiers.set('BABY', 3);
    tiers.set('NEWBORN', 3);
  }

  return tiers;
}

function getAgeTier(ageBuckets: string[], tiers: TierMap): number {
  if (ageBuckets.length === 0) return 1;
  let bestTier = 99;
  for (const a of ageBuckets) {
    const tier = tiers.get(a) ?? 99;
    if (tier < bestTier) bestTier = tier;
  }
  return bestTier;
}

function normalizeCategoryEmbeddingsUrl(baseUrl: string) {
  if (baseUrl.includes(':8003')) return baseUrl.replace(':8003', ':8004');
  if (
    !baseUrl.includes(':8004') &&
    (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1'))
  ) {
    return baseUrl.replace(/:\d+$/, '') + ':8004';
  }
  return baseUrl;
}

function buildNormalizedCategoryMeta(categoryCounts: CategoryCount[]) {
  const normalized = new Map<string, { name?: string; fullName?: string; count: number }>();
  for (const c of categoryCounts) {
    const normalizedId = normalizeCategoryId(c.categoryId, c.fullName);
    const existing = normalized.get(normalizedId);
    if (existing) {
      existing.count += c.count;
    } else {
      normalized.set(normalizedId, {
        name: c.name,
        fullName: c.fullName,
        count: c.count,
      });
    }
  }
  return normalized;
}

function buildCategoryIdToNormalizedMap(categoryCounts: CategoryCount[]) {
  const map = new Map<string, string>();
  for (const c of categoryCounts) {
    map.set(c.categoryId, normalizeCategoryId(c.categoryId, c.fullName));
  }
  return map;
}

function normalizeCategoryId(categoryId: string, fullName?: string | null) {
  const rootName = fullName ? fullName.split(' > ')[0] : undefined;
  const depth = TAXONOMY_TARGET_DEPTH[rootName ?? ''] ?? TAXONOMY_TARGET_DEPTH.default;
  return truncateCategoryId(categoryId, depth);
}

function truncateCategoryId(categoryId: string, maxDepth: number) {
  const parts = categoryId.split('-');
  if (parts.length <= maxDepth) return categoryId;
  return parts.slice(0, maxDepth).join('-');
}

function truncateCategoryFullName(fullName?: string | null, categoryId?: string | null) {
  if (!fullName || !categoryId) return fullName ?? undefined;
  const depth = categoryId.split('-').length;
  const parts = fullName.split(' > ');
  if (parts.length <= depth) return fullName;
  return parts.slice(0, depth).join(' > ');
}

function getCategoryRootId(categoryId?: string | null) {
  if (!categoryId) return undefined;
  return categoryId.split('-')[0]?.trim() || undefined;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      results.push(await fn(current));
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}

function normalizePinConfig(value: unknown): PinConfig | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as { pinnedIds?: unknown };
  const pinnedIds = Array.isArray(raw.pinnedIds)
    ? raw.pinnedIds.map((id) => String(id)).filter((id) => id.length > 0)
    : [];
  if (pinnedIds.length === 0) return null;
  return { pinnedIds };
}

function inferSlotIndex(variant: string | null | undefined) {
  if (!variant) return 1;
  const normalized = variant.toLowerCase();
  if (normalized === 'control' || normalized === 'bundle_1') return 1;
  if (normalized === 'explore' || normalized === 'explore_a' || normalized === 'bundle_2') return 2;
  if (normalized === 'explore_b' || normalized === 'bundle_3') return 3;
  return 1;
}

async function loadActiveBundleSlotConfigV2(
  shopId: string,
  productIds: bigint[],
): Promise<Map<string, Map<number, BundleSlotConfig>>> {
  if (productIds.length === 0) return new Map();

  const rows = (await prisma.computedBundle.findMany({
    where: {
      shopId,
      productId: { in: productIds },
      status: 'ACTIVE',
    },
    select: {
      productId: true,
      slotIndex: true,
      variant: true,
      enabled: true,
      pinConfig: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  } as any)) as Array<any>;

  const map = new Map<string, Map<number, BundleSlotConfig>>();
  for (const row of rows) {
    const productId = row.productId.toString();
    const slotIndex = Number((row as any).slotIndex ?? inferSlotIndex(row.variant));
    const pinConfig = normalizePinConfig(row.pinConfig);
    if (!map.has(productId)) map.set(productId, new Map());
    if (map.get(productId)!.has(slotIndex)) continue;
    map.get(productId)!.set(slotIndex, {
      enabled: (row as any).enabled !== false,
      pinConfig: pinConfig ?? undefined,
    });
  }

  return map;
}

async function ensureBundleSlots(
  shopId: string,
  productIds: bigint[],
  slotsPerProduct: number,
): Promise<Map<string, Map<number, string>>> {
  if (productIds.length === 0) return new Map();

  const existing = await prisma.bundleSlot.findMany({
    where: { shopId, productId: { in: productIds } },
    select: { id: true, productId: true, slotIndex: true },
  });

  const slotMap = new Map<string, Map<number, string>>();
  for (const row of existing) {
    const pid = row.productId.toString();
    if (!slotMap.has(pid)) slotMap.set(pid, new Map());
    slotMap.get(pid)!.set(Number(row.slotIndex), row.id);
  }

  const missing: Array<{ shopId: string; productId: bigint; slotIndex: number }> = [];
  for (const productId of productIds) {
    const pid = productId.toString();
    for (let idx = 1; idx <= slotsPerProduct; idx += 1) {
      if (!slotMap.get(pid)?.has(idx)) {
        missing.push({ shopId, productId, slotIndex: idx });
      }
    }
  }

  if (missing.length > 0) {
    await prisma.bundleSlot.createMany({ data: missing, skipDuplicates: true });
    const refreshed = await prisma.bundleSlot.findMany({
      where: { shopId, productId: { in: productIds } },
      select: { id: true, productId: true, slotIndex: true },
    });
    const refreshedMap = new Map<string, Map<number, string>>();
    for (const row of refreshed) {
      const pid = row.productId.toString();
      if (!refreshedMap.has(pid)) refreshedMap.set(pid, new Map());
      refreshedMap.get(pid)!.set(Number(row.slotIndex), row.id);
    }
    return refreshedMap;
  }

  return slotMap;
}

async function persistComputedBundlesV2(
  ctx: BundleV2RunContext,
  bundles: ProductBundleResult[],
  allProductIds: string[],
  availableProductIds: Set<string>,
): Promise<BundlePersistSummary> {
  if (ctx.dryRun) {
    return {
      persisted: false,
      dryRun: true,
      productsTouched: 0,
      rowsCreated: 0,
      rowsArchived: 0,
    };
  }

  if (allProductIds.length === 0) {
    return {
      persisted: true,
      dryRun: false,
      productsTouched: 0,
      rowsCreated: 0,
      rowsArchived: 0,
    };
  }

  const grouped = new Map<string, ProductBundleResult[]>();
  for (const bundle of bundles) {
    if (!grouped.has(bundle.productId)) grouped.set(bundle.productId, []);
    grouped.get(bundle.productId)!.push(bundle);
  }

  const productIds = allProductIds.map((id) => BigInt(id));
  const slotIdMap = await ensureBundleSlots(ctx.shopId, productIds, BUNDLES_PER_PRODUCT);
  const slotConfig = await loadActiveBundleSlotConfigV2(ctx.shopId, productIds);
  const rows: any[] = [];

  const perSlotWeight = round(1 / Math.max(1, BUNDLES_PER_PRODUCT), 4);
  for (const productId of allProductIds) {
    const productBundles = grouped.get(productId) ?? [];
    const sorted = [...productBundles]
      .sort((a, b) => (a.bundleIndex || 999) - (b.bundleIndex || 999))
      .slice(0, BUNDLES_PER_PRODUCT);

    for (let idx = 0; idx < BUNDLES_PER_PRODUCT; idx += 1) {
      const slotIndex = idx + 1;
      const slotState = slotConfig.get(productId)?.get(slotIndex);
      const candidateIds =
        sorted[idx]?.targets.map((t) => t.productId).slice(0, BUNDLE_MAX_ITEMS) ?? [];
      const pinnedAdjusted = applyPinnedCandidates({
        candidateIds,
        pinConfig: slotState?.pinConfig,
        availableProductIds,
        maxItems: BUNDLE_MAX_ITEMS,
        sourceProductId: productId,
      });
      const nextCandidateIds = pinnedAdjusted.candidateIds;
      const nextPinConfig = pinnedAdjusted.pinConfig;
      const hasCandidates = nextCandidateIds.length > 0;
      const slotId = slotIdMap.get(productId)?.get(slotIndex);

      rows.push({
        shopId: ctx.shopId,
        productId: BigInt(productId),
        slotId,
        candidateIds: nextCandidateIds,
        variant: `bundle_${slotIndex}`,
        slotIndex,
        enabled: hasCandidates ? (slotState?.enabled ?? true) : false,
        status: 'ACTIVE',
        weight: hasCandidates ? perSlotWeight : 0,
        pinConfig: nextPinConfig,
      });
    }
  }

  if (rows.length === 0) {
    return {
      persisted: true,
      dryRun: false,
      productsTouched: 0,
      rowsCreated: 0,
      rowsArchived: 0,
    };
  }

  const touchedProductIds = Array.from(new Set(rows.map((r) => r.productId.toString()))).map((id) =>
    BigInt(id),
  );
  const { createdCount } = await prisma.$transaction(async (tx) => {
    const existing = await tx.computedBundle.findMany({
      where: {
        shopId: ctx.shopId,
        productId: { in: touchedProductIds },
      },
      select: { id: true, productId: true, slotIndex: true },
    });
    const existingKeys = new Set(
      existing.map((row) => `${row.productId.toString()}:${Number(row.slotIndex ?? 1)}`),
    );
    const existingIdByKey = new Map(
      existing.map((row) => [`${row.productId.toString()}:${Number(row.slotIndex ?? 1)}`, row.id]),
    );

    let created = 0;
    for (const row of rows) {
      const key = `${row.productId.toString()}:${Number(row.slotIndex ?? 1)}`;
      if (existingKeys.has(key)) {
        const existingId = existingIdByKey.get(key);
        if (!existingId) continue;
        await tx.computedBundle.update({
          where: { id: existingId },
          data: {
            candidateIds: row.candidateIds,
            variant: row.variant,
            enabled: row.enabled,
            status: row.status,
            weight: row.weight,
            pinConfig: row.pinConfig ?? null,
            slotId: row.slotId ?? null,
          },
        });
      } else {
        await tx.computedBundle.create({ data: row });
        created += 1;
      }
    }

    return { createdCount: created };
  });

  return {
    persisted: true,
    dryRun: false,
    productsTouched: touchedProductIds.length,
    rowsCreated: createdCount,
    rowsArchived: 0,
  };
}

async function persistComputedBundlesV2Single(
  ctx: BundleV2RunContext,
  bundles: ProductBundleResult[],
  productId: string,
  slotIndex: number,
  availableProductIds: Set<string>,
  pinConfigOverride?: PinConfig,
): Promise<BundlePersistSummary> {
  if (ctx.dryRun) {
    return {
      persisted: false,
      dryRun: true,
      productsTouched: 0,
      rowsCreated: 0,
      rowsArchived: 0,
    };
  }

  const productIds = [BigInt(productId)];
  const slotIdMap = await ensureBundleSlots(ctx.shopId, productIds, BUNDLES_PER_PRODUCT);
  const slotConfig = await loadActiveBundleSlotConfigV2(ctx.shopId, productIds);
  const slotState = slotConfig.get(productId)?.get(slotIndex);
  const slotId = slotIdMap.get(productId)?.get(slotIndex);

  const bundle = bundles.find((b) => b.productId === productId && b.bundleIndex === slotIndex);
  const candidateIds = bundle?.targets.map((t) => t.productId).slice(0, BUNDLE_MAX_ITEMS) ?? [];
  const pinnedAdjusted = applyPinnedCandidates({
    candidateIds,
    pinConfig: pinConfigOverride ?? slotState?.pinConfig,
    availableProductIds,
    maxItems: BUNDLE_MAX_ITEMS,
    sourceProductId: productId,
  });
  const nextCandidateIds = pinnedAdjusted.candidateIds;
  const nextPinConfig = pinnedAdjusted.pinConfig;

  if (pinConfigOverride?.pinnedIds?.length) {
    logger.info(
      {
        shopId: ctx.shopId,
        productId,
        slotIndex,
        pinConfigOverride,
        candidateIds,
        nextCandidateIds,
      },
      'Bundle pin override applied',
    );
  }
  const hasCandidates = nextCandidateIds.length > 0;
  const perSlotWeight = round(1 / Math.max(1, BUNDLES_PER_PRODUCT), 4);

  const rows: any[] = [
    {
      shopId: ctx.shopId,
      productId: BigInt(productId),
      slotId,
      candidateIds: nextCandidateIds,
      variant: `bundle_${slotIndex}`,
      slotIndex,
      enabled: hasCandidates ? (slotState?.enabled ?? true) : false,
      status: 'ACTIVE',
      weight: hasCandidates ? perSlotWeight : 0,
      pinConfig: nextPinConfig,
    },
  ];

  const { createdCount } = await prisma.$transaction(async (tx) => {
    const existing = await tx.computedBundle.findUnique({
      where: {
        shopId_productId_slotIndex: {
          shopId: ctx.shopId,
          productId: BigInt(productId),
          slotIndex,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await tx.computedBundle.update({
        where: { id: existing.id },
        data: {
          candidateIds: nextCandidateIds,
          variant: `bundle_${slotIndex}`,
          enabled: hasCandidates ? (slotState?.enabled ?? true) : false,
          status: 'ACTIVE',
          weight: hasCandidates ? perSlotWeight : 0,
          pinConfig: nextPinConfig ?? null,
          slotId: slotId ?? null,
        },
      });
      return { createdCount: 0 };
    }

    await tx.computedBundle.create({ data: rows[0] });
    return { createdCount: 1 };
  });

  return {
    persisted: true,
    dryRun: false,
    productsTouched: 1,
    rowsCreated: createdCount,
    rowsArchived: 0,
  };
}

function applyPinnedCandidates(args: {
  candidateIds: string[];
  pinConfig: PinConfig | undefined;
  availableProductIds: Set<string>;
  maxItems: number;
  sourceProductId: string;
}) {
  const { candidateIds, pinConfig, availableProductIds, maxItems, sourceProductId } = args;
  if (!pinConfig || pinConfig.pinnedIds.length === 0) {
    return { candidateIds, pinConfig: undefined };
  }

  const pinned = Array.from(
    new Set(
      pinConfig.pinnedIds
        .map((id) => String(id))
        .filter((id) => id.length > 0)
        .filter((id) => id !== sourceProductId)
        .filter((id) => availableProductIds.has(id)),
    ),
  );

  if (pinned.length === 0) {
    return { candidateIds, pinConfig: undefined };
  }

  const remaining = candidateIds.filter((id) => id !== sourceProductId && !pinned.includes(id));
  const merged = [...pinned, ...remaining].slice(0, Math.max(1, maxItems));
  const nextPinned = pinned.filter((id) => merged.includes(id));

  return {
    candidateIds: merged,
    pinConfig: nextPinned.length > 0 ? { pinnedIds: nextPinned } : undefined,
  };
}

function recordStep(report: BundleV2Report, name: string, data: Record<string, unknown>) {
  report.steps.push({ name, at: new Date().toISOString(), data });
}

function safeStringify(value: unknown) {
  return JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? val.toString() : val), 2);
}

async function writeReport(report: BundleV2Report) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-09-report-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  await writeFile(path, safeStringify(report), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 report');
}

async function writeCategoryCountsReport(
  report: BundleV2Report,
  categoryCounts: ReturnType<typeof countCategories>,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-01-categories-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    total: categoryCounts.length,
    counts: categoryCounts,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category counts');
}

async function writeCategoryEmbeddingsReport(
  report: BundleV2Report,
  embeddings: CategoryEmbeddingResult[],
  summary: CategoryEmbeddingSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-02-embeddings-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    embeddings,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category embeddings');
}

async function writeCategoryGraphReport(
  report: BundleV2Report,
  graph: CategoryGraphResult[],
  summary: CategoryGraphSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-03-category-graph-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    graph,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category graph');
}

async function writeCategoryMergedReport(
  report: BundleV2Report,
  merged: CategoryMergedResult[],
  summary: CategoryMergedSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-04-category-merged-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    merged,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category merged');
}

async function writeCategoryTemplatesReport(
  report: BundleV2Report,
  templates: CategoryTemplateResult[],
  summary: CategoryTemplateSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-05-category-templates-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    templates,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category templates');
}

async function writeCategoryProductPoolsReport(
  report: BundleV2Report,
  pools: CategoryProductPool[],
  summary: CategoryProductPoolSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-06-category-product-pools-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const reportPools = REPORT_FULL
    ? pools
    : pools.map((pool) => ({
        ...pool,
        items: undefined,
      }));
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    pools: reportPools,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category product pools');
}

async function writeCategoryScoreGroupsReport(
  report: BundleV2Report,
  groups: CategoryScoreGroup[],
  summary: CategoryScoreGroupSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-07-category-scores-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const reportGroups = REPORT_FULL
    ? groups
    : groups.map((group) => ({
        ...group,
        products: undefined,
      }));
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    categories: reportGroups,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 category score groups');
}

async function writeProductBundlesReport(
  report: BundleV2Report,
  bundles: ProductBundleResult[],
  summary: ProductBundleSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-08-product-bundles-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const reportBundles = REPORT_FULL ? bundles : bundles.slice(0, 200);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    bundles: reportBundles,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 product bundles');
}

async function writeBundleFailuresReport(
  report: BundleV2Report,
  failures: BundleFailure[],
  summary: BundleFailureSummary,
) {
  const reportDir = getReportDir(report);
  await mkdir(reportDir, { recursive: true });
  const filename = `bundle-v2-08b-bundle-failures-${report.shopId}-${report.runId}.json`;
  const path = join(reportDir, filename);
  const payload = {
    runId: report.runId,
    shopId: report.shopId,
    startedAt: report.startedAt,
    generatedAt: new Date().toISOString(),
    summary,
    failures,
  };
  await writeFile(path, safeStringify(payload), 'utf8');
  logger.info({ path }, 'Wrote BUNDLE_GENERATE_V2 bundle failures');
}
