import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type ProductBundleTargetPick = {
  productId: string;
  tier?: number;
  source?: string;
  targetCategoryId?: string;
};

type ProductBundleResult = {
  productId: string;
  templateId?: string;
  bundleIndex?: number;
  targets?: ProductBundleTargetPick[];
};

type ProductBundlesFile = {
  runId: string;
  shopId: string;
  summary?: Record<string, unknown>;
  bundles?: ProductBundleResult[];
};

type TierCounts = { 1: number; 2: number; 3: number };

function parseArgs() {
  const [, , shopArg, runA, runB] = process.argv;
  const shop = shopArg?.trim() || process.env.BUNDLE_V2_COMPARE_SHOP || '';
  if (!shop || !runA || !runB) {
    console.error('Usage: tsx scripts/compare-bundle-v2.ts <shopId> <runIdA> <runIdB>');
    process.exit(1);
  }
  return { shop, runA: runA.trim(), runB: runB.trim() };
}

function countTiers(bundles: ProductBundleResult[]): TierCounts {
  const counts: TierCounts = { 1: 0, 2: 0, 3: 0 };
  for (const bundle of bundles) {
    for (const t of bundle.targets || []) {
      if (t.tier === 1 || t.tier === 2 || t.tier === 3) counts[t.tier] += 1;
    }
  }
  return counts;
}

function percent(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 1000) / 10}%`;
}

function toTargetSet(bundle: ProductBundleResult) {
  return new Set((bundle.targets || []).map((t) => t.productId));
}

function bundleKey(bundle: ProductBundleResult, index: number) {
  const suffix =
    bundle.templateId ?? (bundle.bundleIndex != null ? String(bundle.bundleIndex) : String(index));
  return `${bundle.productId}::${suffix}`;
}

function edgeSet(bundles: ProductBundleResult[]) {
  const edges = new Set<string>();
  for (const b of bundles) {
    for (const t of b.targets || []) {
      edges.add(`${b.productId}→${t.productId}`);
    }
  }
  return edges;
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

async function loadBundles(reportRoot: string, shop: string, runId: string) {
  const filename = `bundle-v2-08-product-bundles-${shop}-${runId}.json`;
  const path = join(reportRoot, shop, runId, filename);
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as ProductBundlesFile;
  return { path, file: parsed, bundles: parsed.bundles || [] };
}

async function main() {
  const { shop, runA, runB } = parseArgs();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const reportRoot = process.env.BUNDLE_V2_REPORT_DIR || join(__dirname, '../tmp/bundle-v2');

  const [a, b] = await Promise.all([
    loadBundles(reportRoot, shop, runA),
    loadBundles(reportRoot, shop, runB),
  ]);

  const bundlesA = a.bundles;
  const bundlesB = b.bundles;

  const tierA = countTiers(bundlesA);
  const tierB = countTiers(bundlesB);
  const totalTargetsA = bundlesA.reduce((acc, x) => acc + (x.targets?.length || 0), 0);
  const totalTargetsB = bundlesB.reduce((acc, x) => acc + (x.targets?.length || 0), 0);

  const mapA = new Map(bundlesA.map((b, idx) => [bundleKey(b, idx), b]));
  const mapB = new Map(bundlesB.map((b, idx) => [bundleKey(b, idx), b]));

  const commonBundles = new Set<string>();
  for (const id of mapA.keys()) {
    if (mapB.has(id)) commonBundles.add(id);
  }

  let changed = 0;
  let unchanged = 0;
  let avgJaccard = 0;
  const worst: { bundleKey: string; score: number }[] = [];

  for (const key of commonBundles) {
    const setA = toTargetSet(mapA.get(key)!);
    const setB = toTargetSet(mapB.get(key)!);
    const score = jaccard(setA, setB);
    avgJaccard += score;
    if (score < 0.999) changed += 1;
    else unchanged += 1;
    worst.push({ bundleKey: key, score });
  }

  avgJaccard = commonBundles.size ? avgJaccard / commonBundles.size : 0;
  worst.sort((x, y) => x.score - y.score);

  const edgesA = edgeSet(bundlesA);
  const edgesB = edgeSet(bundlesB);
  let edgeIntersection = 0;
  for (const edge of edgesA) {
    if (edgesB.has(edge)) edgeIntersection += 1;
  }
  const edgeUnion = edgesA.size + edgesB.size - edgeIntersection;
  const edgeJaccard = edgeUnion === 0 ? 1 : edgeIntersection / edgeUnion;

  console.log('');
  console.log(`Bundle V2 Compare`);
  console.log(`Shop: ${shop}`);
  console.log(`Run A: ${runA}`);
  console.log(`Run B: ${runB}`);
  console.log('');
  console.log(`Files`);
  console.log(`- ${a.path}`);
  console.log(`- ${b.path}`);
  console.log('');
  console.log(`Totals`);
  console.log(`- Bundles A: ${bundlesA.length}`);
  console.log(`- Bundles B: ${bundlesB.length}`);
  console.log(`- Targets A: ${totalTargetsA}`);
  console.log(`- Targets B: ${totalTargetsB}`);
  console.log(`- Unique products A: ${new Set(bundlesA.map((b) => b.productId)).size}`);
  console.log(`- Unique products B: ${new Set(bundlesB.map((b) => b.productId)).size}`);
  console.log('');
  console.log(`Tier Mix`);
  console.log(`- A Tier1: ${tierA[1]} (${percent(tierA[1], totalTargetsA)})`);
  console.log(`- A Tier2: ${tierA[2]} (${percent(tierA[2], totalTargetsA)})`);
  console.log(`- A Tier3: ${tierA[3]} (${percent(tierA[3], totalTargetsA)})`);
  console.log(`- B Tier1: ${tierB[1]} (${percent(tierB[1], totalTargetsB)})`);
  console.log(`- B Tier2: ${tierB[2]} (${percent(tierB[2], totalTargetsB)})`);
  console.log(`- B Tier3: ${tierB[3]} (${percent(tierB[3], totalTargetsB)})`);
  console.log('');
  console.log(`Per-Bundle Overlap`);
  console.log(`- Common bundles: ${commonBundles.size}`);
  console.log(`- Changed bundles: ${changed}`);
  console.log(`- Unchanged bundles: ${unchanged}`);
  console.log(`- Avg Jaccard: ${Math.round(avgJaccard * 1000) / 1000}`);
  console.log('');
  console.log(`Edge Overlap (product→target pairs)`);
  console.log(`- Edge Jaccard: ${Math.round(edgeJaccard * 1000) / 1000}`);
  console.log('');
  console.log(`Worst 10 bundles (lowest Jaccard)`);
  for (const row of worst.slice(0, 10)) {
    console.log(`- ${row.bundleKey}: ${Math.round(row.score * 1000) / 1000}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
