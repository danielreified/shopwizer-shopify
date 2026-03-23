import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/db/prisma';

type ProductBundleTargetPick = {
  productId: string;
  title?: string;
  tier?: number;
  source?: string;
  targetCategoryId?: string;
};

type ProductBundleResult = {
  productId: string;
  title?: string;
  categoryId?: string | null;
  templateId?: string;
  bundleIndex?: number;
  targets?: ProductBundleTargetPick[];
};

type ProductBundlesFile = {
  runId: string;
  shopId: string;
  bundles?: ProductBundleResult[];
};

function parseArgs() {
  const [, , shopArg, runA, runB] = process.argv;
  const shop = shopArg?.trim() || process.env.BUNDLE_V2_COMPARE_SHOP || '';
  const showAll = process.env.BUNDLE_V2_COMPARE_SHOW_ALL === 'true';
  const limitEnv = process.env.BUNDLE_V2_COMPARE_LIMIT;
  const limit = Number(limitEnv || 60);
  if (!shop || !runA || !runB) {
    console.error('Usage: tsx scripts/compare-bundle-v2-html.ts <shopId> <runIdA> <runIdB>');
    process.exit(1);
  }
  return {
    shop,
    runA: runA.trim(),
    runB: runB.trim(),
    showAll,
    limit: Number.isFinite(limit) ? limit : 60,
  };
}

async function loadBundles(reportRoot: string, shop: string, runId: string) {
  const filename = `bundle-v2-08-product-bundles-${shop}-${runId}.json`;
  const path = join(reportRoot, shop, runId, filename);
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as ProductBundlesFile;
  return { path, file: parsed, bundles: parsed.bundles || [] };
}

function toTargetIds(bundle: ProductBundleResult) {
  return (bundle.targets || []).map((t) => t.productId);
}

function bundleKey(bundle: ProductBundleResult, index: number) {
  const suffix =
    bundle.templateId ?? (bundle.bundleIndex != null ? String(bundle.bundleIndex) : String(index));
  return `${bundle.productId}::${suffix}`;
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatList(values?: string[] | null) {
  if (!values || values.length === 0) return '-';
  return values.join(', ');
}

async function main() {
  const { shop, runA, runB, showAll, limit } = parseArgs();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const reportRoot = process.env.BUNDLE_V2_REPORT_DIR || join(__dirname, '../tmp/bundle-v2');

  const [a, b] = await Promise.all([
    loadBundles(reportRoot, shop, runA),
    loadBundles(reportRoot, shop, runB),
  ]);

  const mapA = new Map(a.bundles.map((bundle, idx) => [bundleKey(bundle, idx), bundle]));
  const mapB = new Map(b.bundles.map((bundle, idx) => [bundleKey(bundle, idx), bundle]));

  const bundleKeys = new Set<string>();
  for (const id of mapA.keys()) bundleKeys.add(id);
  for (const id of mapB.keys()) bundleKeys.add(id);

  const comparisons: {
    key: string;
    productId: string;
    bundleA?: ProductBundleResult;
    bundleB?: ProductBundleResult;
    jaccard: number;
  }[] = [];

  for (const key of bundleKeys) {
    const bundleA = mapA.get(key);
    const bundleB = mapB.get(key);
    const productId = bundleA?.productId ?? bundleB?.productId ?? key.split('::')[0];
    const setA = new Set(bundleA ? toTargetIds(bundleA) : []);
    const setB = new Set(bundleB ? toTargetIds(bundleB) : []);
    const score = jaccard(setA, setB);
    if (!showAll && score >= 0.999) continue;
    comparisons.push({ key, productId, bundleA, bundleB, jaccard: score });
  }

  comparisons.sort((x, y) => x.jaccard - y.jaccard);
  const shown = comparisons.slice(0, limit);

  const imageMap = new Map<string, string | null>();
  const demoMap = new Map<string, { gender: string[] | null; ageBucket: string[] | null }>();
  const imageIds = new Set<string>();
  for (const row of shown) {
    if (row.bundleA) {
      imageIds.add(row.bundleA.productId);
      for (const t of row.bundleA.targets || []) imageIds.add(t.productId);
    }
    if (row.bundleB) {
      imageIds.add(row.bundleB.productId);
      for (const t of row.bundleB.targets || []) imageIds.add(t.productId);
    }
  }

  const ids = Array.from(imageIds).map((id) => BigInt(id));
  if (ids.length) {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        gender: true,
        ageBucket: true,
        images: { select: { url: true, position: true }, orderBy: { position: 'asc' }, take: 1 },
      },
    });
    for (const row of rows) {
      imageMap.set(row.id.toString(), row.images[0]?.url ?? null);
      demoMap.set(row.id.toString(), {
        gender: row.gender ?? null,
        ageBucket: row.ageBucket ?? null,
      });
    }
  }

  const groupOrder: string[] = [];
  const grouped = new Map<
    string,
    { productId: string; title: string; rows: typeof shown; minJ: number; avgJ: number }
  >();

  for (const row of shown) {
    const title = row.bundleA?.title || row.bundleB?.title || row.productId;
    if (!grouped.has(row.productId)) {
      grouped.set(row.productId, { productId: row.productId, title, rows: [], minJ: 1, avgJ: 0 });
      groupOrder.push(row.productId);
    }
    grouped.get(row.productId)!.rows.push(row);
  }

  for (const key of groupOrder) {
    const group = grouped.get(key)!;
    if (group.rows.length === 0) continue;
    let total = 0;
    let min = 1;
    for (const row of group.rows) {
      total += row.jaccard;
      min = Math.min(min, row.jaccard);
    }
    group.avgJ = total / group.rows.length;
    group.minJ = min;
  }

  const renderSourceCard = (bundle: ProductBundleResult | undefined, title: string) => {
    const sourceImage = bundle ? imageMap.get(bundle.productId) : null;
    const demo = bundle ? demoMap.get(bundle.productId) : undefined;
    const safeTitle = escapeHtml(title || bundle?.title || bundle?.productId || '');
    const categoryId = bundle?.categoryId ?? '-';
    const productId = bundle?.productId ?? '-';
    const imgHtml = sourceImage
      ? `<img class="card-image" src="${escapeHtml(sourceImage)}" alt="${safeTitle}" loading="lazy" />`
      : `<div class="image-placeholder">No image</div>`;

    return `<div class="source-card">
      ${imgHtml}
      <div class="card-title">${safeTitle}</div>
      <div class="card-meta">
        <span>${productId}</span>
        <span>${categoryId}</span>
        <span>gender: ${escapeHtml(formatList(demo?.gender))}</span>
        <span>age: ${escapeHtml(formatList(demo?.ageBucket))}</span>
      </div>
    </div>`;
  };

  const renderBundle = (
    bundle: ProductBundleResult | undefined,
    label: string,
    showSource: boolean,
  ) => {
    if (!bundle) {
      return `<div class="side empty">
        <div class="side-title">${label}</div>
        <div class="empty-state">Missing bundle</div>
      </div>`;
    }

    const targets = bundle.targets || [];
    const targetHtml = targets
      .map((t) => {
        const title = escapeHtml(t.title || '(untitled)');
        const tier = t.tier ?? '-';
        const image = imageMap.get(t.productId);
        const demo = demoMap.get(t.productId);
        const imgHtml = image
          ? `<img class="card-image" src="${escapeHtml(image)}" alt="${title}" loading="lazy" />`
          : `<div class="image-placeholder">No image</div>`;
        return `<div class="card tier-${tier}">
          ${imgHtml}
          <div class="card-title">${title}</div>
          <div class="card-meta">
            <span>${t.productId}</span>
            <span>${t.targetCategoryId ?? '-'}</span>
            <span>tier ${tier}</span>
            <span>${t.source ?? '-'}</span>
            <span>gender: ${escapeHtml(formatList(demo?.gender))}</span>
            <span>age: ${escapeHtml(formatList(demo?.ageBucket))}</span>
          </div>
        </div>`;
      })
      .join('');

    const sourceHtml = showSource
      ? (() => {
          const sourceImage = imageMap.get(bundle.productId);
          return `<div class="card source">
            ${
              sourceImage
                ? `<img class="card-image" src="${escapeHtml(sourceImage)}" alt="${escapeHtml(bundle.title || '')}" loading="lazy" />`
                : `<div class="image-placeholder">No image</div>`
            }
            <div class="card-title">Source</div>
            <div class="card-meta">
              <span>${bundle.productId}</span>
              <span>${bundle.categoryId ?? '-'}</span>
              <span>${bundle.templateId ?? '-'}</span>
              <span>gender: ${escapeHtml(formatList(demoMap.get(bundle.productId)?.gender))}</span>
              <span>age: ${escapeHtml(formatList(demoMap.get(bundle.productId)?.ageBucket))}</span>
            </div>
          </div>`;
        })()
      : '';

    return `<div class="side">
      <div class="side-title">${label}</div>
      <div class="card-row">
        ${sourceHtml}
        ${targetHtml}
      </div>
    </div>`;
  };

  const diffRows = groupOrder
    .map((productId) => {
      const group = grouped.get(productId)!;
      const groupTitle = escapeHtml(group.title || productId);
      const groupBundle = group.rows.find((row) => row.bundleA || row.bundleB);
      const sourceBundle = groupBundle?.bundleA || groupBundle?.bundleB;
      const groupCards = group.rows
        .map((row) => {
          const left = row.bundleA;
          const right = row.bundleB;
          const templateLabel =
            left?.templateId ??
            right?.templateId ??
            (left?.bundleIndex != null ? `bundle-${left.bundleIndex}` : undefined) ??
            (right?.bundleIndex != null ? `bundle-${right.bundleIndex}` : undefined) ??
            row.key;

          return `<div class="compare-card">
            <div class="compare-header">
              <div class="compare-title">Template: ${escapeHtml(String(templateLabel))}</div>
              <div class="compare-score">Jaccard: ${Math.round(row.jaccard * 1000) / 1000}</div>
            </div>
            <div class="compare-grid">
              ${renderBundle(left, `Run A: ${runA}`, false)}
              ${renderBundle(right, `Run B: ${runB}`, false)}
            </div>
          </div>`;
        })
        .join('');

      return `<section class="group">
        <div class="group-header">
          <div class="group-source">
            ${renderSourceCard(sourceBundle, groupTitle)}
            <div class="group-meta">
              <div class="group-title">${groupTitle}</div>
              <div class="group-meta-list">
                <div>${productId}</div>
                <div>templates: ${group.rows.length}</div>
                <div>min J: ${Math.round(group.minJ * 1000) / 1000}</div>
                <div>avg J: ${Math.round(group.avgJ * 1000) / 1000}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="group-grid">
          ${groupCards}
        </div>
      </section>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bundle V2 Compare</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #f7f7f9; color: #111827; margin: 0; padding: 16px; }
      h1 { margin: 0 0 6px; font-size: 18px; }
      .meta { font-size: 12px; color: #4b5563; margin-bottom: 12px; }
      .group { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; margin-bottom: 12px; }
      .group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .group-source { display: flex; align-items: center; gap: 12px; }
      .group-title { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
      .group-meta { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #6b7280; }
      .group-meta-list { display: grid; gap: 2px; font-size: 11px; color: #6b7280; }
      .group-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
      .compare-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px; background: #fff; }
      .compare-header { display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 6px; }
      .compare-title { font-weight: 600; }
      .compare-score { font-weight: 600; }
      .compare-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px; }
      .side { border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; background: #f9fafb; }
      .side-title { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
      .empty-state { font-size: 12px; color: #9ca3af; padding: 12px 0; text-align: center; }
      .card-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; display: grid; gap: 4px; background: #fff; }
      .card-image { width: 100%; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; }
      .card-title { font-weight: 600; font-size: 11px; }
      .card-meta { font-size: 9px; color: #6b7280; display: grid; gap: 2px; }
      .image-placeholder { width: 100%; height: 90px; border-radius: 6px; border: 1px dashed #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #9ca3af; background: #f9fafb; }
      .source-card { width: 120px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; display: grid; gap: 4px; background: #fff; }
      .tier-1 .card-title { color: #047857; }
      .tier-2 .card-title { color: #b45309; }
      .tier-3 .card-title { color: #b91c1c; }
    </style>
  </head>
  <body>
    <h1>Bundle V2 Compare</h1>
    <div class="meta">
      <div>Shop: ${shop}</div>
      <div>Run A: ${runA}</div>
      <div>Run B: ${runB}</div>
      <div>Showing: ${shown.length} ${showAll ? '(all bundles)' : '(changed only)'} </div>
    </div>
    ${diffRows || "<div class='meta'>No differences found. Set BUNDLE_V2_COMPARE_SHOW_ALL=true to view all bundles.</div>"}
  </body>
</html>`;

  const outputName = `bundle-v2-compare-${shop}-${runA}-vs-${runB}.html`;
  const outputPath = join(reportRoot, shop, outputName);
  await writeFile(outputPath, html, 'utf8');
  console.log(`Wrote compare HTML: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
