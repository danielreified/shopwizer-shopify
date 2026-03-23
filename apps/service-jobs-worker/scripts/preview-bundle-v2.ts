import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/db/prisma';

type ProductBundleTarget = {
  targetCategoryId?: string;
  productId: string;
  title?: string;
  source?: string;
  weight?: number;
  tier?: number;
};

type ProductBundle = {
  productId: string;
  title?: string;
  categoryId?: string | null;
  bundleIndex?: number;
  templateId?: string;
  templateSource?: string;
  targets?: ProductBundleTarget[];
};

type ProductBundleFile = {
  runId: string;
  shopId: string;
  startedAt?: string;
  generatedAt?: string;
  summary?: Record<string, unknown>;
  bundles?: ProductBundle[];
};

const RUN_ID_LENGTH = 36;

function parseArgs() {
  const [, , shopArg, runIdArg, limitArg] = process.argv;
  const limitEnv = process.env.BUNDLE_V2_PREVIEW_LIMIT;
  const includeImagesEnv = process.env.BUNDLE_V2_PREVIEW_IMAGES;
  const limit = Number(limitArg || limitEnv || 300);
  return {
    shop: shopArg?.trim() || null,
    runId: runIdArg?.trim() || null,
    limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 300,
    includeImages: includeImagesEnv?.toLowerCase() === 'false' ? false : true,
  };
}

function extractShopAndRunId(filename: string) {
  const prefix = 'bundle-v2-08-product-bundles-';
  const suffix = '.json';
  if (!filename.startsWith(prefix) || !filename.endsWith(suffix)) return null;
  const rest = filename.slice(prefix.length, -suffix.length);
  if (rest.length <= RUN_ID_LENGTH + 1) return null;
  const runId = rest.slice(-RUN_ID_LENGTH);
  const shop = rest.slice(0, -RUN_ID_LENGTH - 1);
  return { shop, runId };
}

function computeTierCounts(bundles: ProductBundle[]) {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const bundle of bundles) {
    for (const t of bundle.targets || []) {
      if (t.tier === 1 || t.tier === 2 || t.tier === 3) counts[t.tier] += 1;
    }
  }
  return counts;
}

function percent(n: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((n / total) * 1000) / 10}%`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function walkFiles(root: string) {
  const results: { path: string; file: string }[] = [];
  const stack: string[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    let entries: { name: string; isDirectory: () => boolean }[] = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        results.push({ path: fullPath, file: entry.name });
      }
    }
  }

  return results;
}

async function main() {
  const { shop, runId, limit, includeImages } = parseArgs();
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const reportDir = join(__dirname, '../tmp/bundle-v2');

  const files = await walkFiles(reportDir);
  const candidates = files
    .map((entry) => ({ ...entry, info: extractShopAndRunId(entry.file) }))
    .filter((entry) => entry.info !== null)
    .filter((entry) => (shop ? entry.info!.shop === shop : true))
    .filter((entry) => (runId ? entry.info!.runId === runId : true));

  if (candidates.length === 0) {
    console.error('No bundle v2 product-bundles files found for the given filters.');
    process.exit(1);
  }

  const withStats = await Promise.all(
    candidates.map(async (c) => {
      const fileStat = await stat(c.path);
      return { ...c, mtime: fileStat.mtimeMs };
    }),
  );

  withStats.sort((a, b) => b.mtime - a.mtime);
  const selected = withStats[0];
  const payload = JSON.parse(await readFile(selected.path, 'utf8')) as ProductBundleFile;

  const bundles = payload.bundles || [];
  const totalTargets = bundles.reduce((acc, b) => acc + (b.targets?.length || 0), 0);
  const tierCounts = computeTierCounts(bundles);

  const shown = bundles.slice(0, limit);

  const imageMap = new Map<string, string | null>();
  if (includeImages) {
    const idSet = new Set<string>();
    for (const bundle of shown) {
      idSet.add(bundle.productId);
      for (const t of bundle.targets || []) {
        idSet.add(t.productId);
      }
    }

    const ids = Array.from(idSet).map((id) => BigInt(id));
    try {
      const rows = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          images: { select: { url: true, position: true }, orderBy: { position: 'asc' }, take: 1 },
        },
      });
      for (const row of rows) {
        imageMap.set(row.id.toString(), row.images[0]?.url ?? null);
      }
    } catch (err) {
      console.warn(
        '⚠️ Unable to fetch product images for preview. Continuing without images.',
        err,
      );
    }
  }
  const rows = shown
    .map((bundle, index) => {
      const targets = bundle.targets || [];
      const sourceImage = imageMap.get(bundle.productId) ?? null;
      const targetCards = targets
        .map((t) => {
          const title = t.title ? escapeHtml(t.title) : '(untitled)';
          const tier = t.tier ?? '-';
          const weight = t.weight ?? 0;
          const image = imageMap.get(t.productId);
          const imgHtml = image
            ? `<img class="card-image" src="${escapeHtml(image)}" alt="${title}" loading="lazy" />`
            : `<div class="image-placeholder">No image</div>`;
          return `<div class="card target tier-${tier}">
            ${imgHtml}
            <div class="card-title">${title}</div>
            <div class="card-meta">
              <span>${t.productId}</span>
              <span>${t.targetCategoryId ?? '-'}</span>
              <span>tier ${tier}</span>
              <span>${t.source ?? '-'}</span>
              <span>${weight.toFixed ? weight.toFixed(4) : weight}</span>
            </div>
          </div>`;
        })
        .join('\n');

      const sourceCard = includeImages
        ? `<div class="card source">
            ${sourceImage ? `<img class="card-image" src="${escapeHtml(sourceImage)}" alt="${escapeHtml(bundle.title || '')}" loading="lazy" />` : `<div class="image-placeholder">No image</div>`}
          <div class="card-title">Source</div>
          <div class="card-meta">
            <span>${bundle.productId}</span>
            <span>${bundle.categoryId ?? '-'}</span>
            <span>${bundle.templateSource ?? '-'}</span>
            <span>${bundle.templateId ?? '-'}</span>
          </div>
        </div>`
        : '';

      return `<section class="bundle">
        <h3>${index + 1}. ${escapeHtml(bundle.title || '(untitled)')}</h3>
        <div class="bundle-meta">
          <span>productId: ${bundle.productId}</span>
          <span>categoryId: ${bundle.categoryId ?? '-'}</span>
          <span>bundle: ${bundle.bundleIndex ?? '-'}</span>
          <span>template: ${bundle.templateSource ?? '-'}</span>
          <span>templateId: ${bundle.templateId ?? '-'}</span>
        </div>
        <div class="bundle-row">
          ${sourceCard}
          ${targetCards}
        </div>
      </section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bundle V2 Preview</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; background: #f7f7f9; color: #111827; margin: 0; padding: 16px; }
      h1 { margin: 0 0 6px; font-size: 18px; }
      .meta { font-size: 12px; color: #4b5563; margin-bottom: 10px; }
      .summary { background: #fff; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; }
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 6px; font-size: 12px; }
      .bundle { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px 10px; margin-bottom: 8px; }
      .bundle h3 { margin: 0 0 4px; font-size: 14px; }
      .bundle-meta { font-size: 11px; color: #6b7280; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
      .bundle-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
      .card { width: 170px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; display: grid; gap: 6px; background: #fff; }
      .card-image { width: 100%; height: 110px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; }
      .card-title { font-weight: 600; font-size: 12px; }
      .card-meta { font-size: 10px; color: #6b7280; display: grid; gap: 2px; }
      .image-placeholder { width: 100%; height: 110px; border-radius: 6px; border: 1px dashed #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af; background: #f9fafb; }
      .tier-1 .card-title { color: #047857; }
      .tier-2 .card-title { color: #b45309; }
      .tier-3 .card-title { color: #b91c1c; }
    </style>
  </head>
  <body>
    <h1>Bundle V2 Preview</h1>
    <div class="meta">
      <div>File: ${selected.file}</div>
      <div>Shop: ${payload.shopId}</div>
      <div>Run: ${payload.runId}</div>
      <div>Generated: ${payload.generatedAt ?? '-'}</div>
    </div>
    <div class="summary">
      <strong>Summary</strong>
      <div class="summary-grid">
        <div>Total bundles: ${bundles.length}</div>
        <div>Total targets: ${totalTargets}</div>
        <div>Tier 1: ${tierCounts[1]} (${percent(tierCounts[1], totalTargets)})</div>
        <div>Tier 2: ${tierCounts[2]} (${percent(tierCounts[2], totalTargets)})</div>
        <div>Tier 3: ${tierCounts[3]} (${percent(tierCounts[3], totalTargets)})</div>
        <div>Showing: ${shown.length}</div>
      </div>
    </div>
    ${rows}
  </body>
</html>`;

  const outputName = `bundle-v2-preview-${payload.shopId}-${payload.runId}.html`;
  const outputPath = join(dirname(selected.path), outputName);
  await writeFile(outputPath, html, 'utf8');
  console.log(`Wrote preview: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
