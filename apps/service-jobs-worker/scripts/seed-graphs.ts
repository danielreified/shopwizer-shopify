import 'dotenv/config';
import { prisma } from '../src/db/prisma';

type ProductSeed = {
  id: bigint;
  categoryId: string;
  rootId: string | null;
};

const shopDomain = process.argv[2];
if (!shopDomain) {
  console.error('Usage: tsx scripts/seed-graphs.ts <shopDomain>');
  process.exit(1);
}

const DRY_RUN = process.env.GRAPH_SEED_DRY_RUN === 'true';
const CLEAR = process.env.GRAPH_SEED_CLEAR !== 'false';
const TOP_K = Number(process.env.GRAPH_SEED_TOP_K || 10);
const CATEGORY_TOP_K = Number(process.env.GRAPH_SEED_CATEGORY_TOP_K || 40);
const SAME_CATEGORY_RATIO = Number(process.env.GRAPH_SEED_SAME_CATEGORY_RATIO || 0.7);
const COUNT_MIN = Number(process.env.GRAPH_SEED_COUNT_MIN || 2);
const COUNT_MAX = Number(process.env.GRAPH_SEED_COUNT_MAX || 80);
const SEED = process.env.GRAPH_SEED_SEED ? Number(process.env.GRAPH_SEED_SEED) : null;
const BATCH_SIZE = Number(process.env.GRAPH_SEED_BATCH_SIZE || 500);

function makeRng(seed: number | null) {
  if (seed === null || Number.isNaN(seed)) {
    return () => Math.random();
  }
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

const rng = makeRng(SEED);

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function shuffled<T>(items: T[], rand: () => number) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickUnique(list: bigint[], count: number, used: Set<string>, rand: () => number) {
  if (count <= 0) return [];
  const available = list.filter((id) => !used.has(id.toString()));
  if (available.length <= count) return available;
  return shuffled(available, rand).slice(0, count);
}

async function loadProducts(shopId: string): Promise<ProductSeed[]> {
  const rows = await prisma.product.findMany({
    where: { shopId, status: 'ACTIVE', enabled: true, categoryId: { not: null } },
    select: {
      id: true,
      categoryId: true,
      category: { select: { rootId: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    categoryId: row.categoryId!,
    rootId: row.category?.rootId ?? null,
  }));
}

function buildCategoryMaps(products: ProductSeed[]) {
  const byCategory = new Map<string, bigint[]>();
  const byRoot = new Map<string, bigint[]>();
  const productById = new Map<string, ProductSeed>();

  for (const product of products) {
    productById.set(product.id.toString(), product);

    const categoryList = byCategory.get(product.categoryId) || [];
    categoryList.push(product.id);
    byCategory.set(product.categoryId, categoryList);

    if (product.rootId) {
      const rootList = byRoot.get(product.rootId) || [];
      rootList.push(product.id);
      byRoot.set(product.rootId, rootList);
    }
  }

  return { byCategory, byRoot, productById };
}

function buildProductEdges(
  products: ProductSeed[],
  byCategory: Map<string, bigint[]>,
  byRoot: Map<string, bigint[]>,
) {
  const edges: {
    shopId: string;
    sourceId: bigint;
    targetId: bigint;
    type: 'BUNDLE';
    count: number;
  }[] = [];

  const step = TOP_K > 1 ? (COUNT_MAX - COUNT_MIN) / (TOP_K - 1) : 0;

  for (const product of products) {
    const used = new Set<string>();
    used.add(product.id.toString());

    const desiredSame = clampInt(TOP_K * SAME_CATEGORY_RATIO, 0, TOP_K);
    const desiredOther = Math.max(0, TOP_K - desiredSame);

    const sameCategory = byCategory.get(product.categoryId) || [];
    const sameRoot = product.rootId ? byRoot.get(product.rootId) || [] : [];
    const all = products.map((p) => p.id);

    const targets: bigint[] = [];

    const fromSame = pickUnique(sameCategory, desiredSame, used, rng);
    for (const id of fromSame) {
      targets.push(id);
      used.add(id.toString());
    }

    const fromRoot = pickUnique(sameRoot, desiredOther, used, rng);
    for (const id of fromRoot) {
      targets.push(id);
      used.add(id.toString());
    }

    if (targets.length < TOP_K) {
      const fromAll = pickUnique(all, TOP_K - targets.length, used, rng);
      for (const id of fromAll) {
        targets.push(id);
        used.add(id.toString());
      }
    }

    for (let i = 0; i < targets.length; i += 1) {
      const base = COUNT_MAX - step * i;
      const jitter = 0.9 + rng() * 0.2;
      const count = clampInt(base * jitter, COUNT_MIN, COUNT_MAX);
      edges.push({
        shopId: '',
        sourceId: product.id,
        targetId: targets[i],
        type: 'BUNDLE',
        count,
      });
    }
  }

  return edges;
}

function buildCategoryEdges(
  productById: Map<string, ProductSeed>,
  productEdges: { sourceId: bigint; targetId: bigint; count: number }[],
) {
  const perSource = new Map<string, Map<string, number>>();

  for (const edge of productEdges) {
    const source = productById.get(edge.sourceId.toString());
    const target = productById.get(edge.targetId.toString());
    if (!source || !target) continue;
    if (source.categoryId === target.categoryId) continue;

    const targetMap = perSource.get(source.categoryId) || new Map<string, number>();
    const next = (targetMap.get(target.categoryId) || 0) + edge.count;
    targetMap.set(target.categoryId, next);
    perSource.set(source.categoryId, targetMap);
  }

  const rows: { sourceCategory: string; targetCategory: string; count: number }[] = [];
  for (const [sourceCategory, targets] of perSource) {
    const sorted = Array.from(targets.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, CATEGORY_TOP_K);
    for (const [targetCategory, count] of sorted) {
      rows.push({
        sourceCategory,
        targetCategory,
        count: clampInt(count, 1, Number.MAX_SAFE_INTEGER),
      });
    }
  }

  return rows;
}

async function main() {
  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });

  if (!shop) {
    console.error('Shop not found:', shopDomain);
    process.exit(1);
  }

  const shopId = shop.id;
  const products = await loadProducts(shopId);

  if (products.length < 2) {
    console.error('Not enough products with categories to seed graphs.');
    process.exit(1);
  }

  const { byCategory, byRoot, productById } = buildCategoryMaps(products);
  const productEdges = buildProductEdges(products, byCategory, byRoot).map((edge) => ({
    ...edge,
    shopId,
  }));
  const categoryEdges = buildCategoryEdges(productById, productEdges);

  console.log(`Seeding ProductGraph (edges: ${productEdges.length})`);
  console.log(`Seeding CategoryGraph (edges: ${categoryEdges.length})`);
  if (DRY_RUN) {
    console.log('DRY RUN: no DB writes will occur');
    return;
  }

  if (CLEAR) {
    await prisma.productGraph.deleteMany({ where: { shopId, type: 'BUNDLE' } });
    await prisma.categoryGraph.deleteMany({ where: { shopId } });
  }

  for (let i = 0; i < productEdges.length; i += BATCH_SIZE) {
    const batch = productEdges.slice(i, i + BATCH_SIZE);
    await prisma.productGraph.createMany({ data: batch });
  }

  for (let i = 0; i < categoryEdges.length; i += BATCH_SIZE) {
    const batch = categoryEdges.slice(i, i + BATCH_SIZE).map((edge) => ({
      shopId,
      sourceCategory: edge.sourceCategory,
      targetCategory: edge.targetCategory,
      count: edge.count,
    }));
    await prisma.categoryGraph.createMany({ data: batch });
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
