// src/index.js (ESM)
// Run: pnpm generate -- --in ./data --outDir ./outputs --prefix run
// Output folder: ./outputs/<prefix>-YYYY-MM-DD_HH-mm-ss/

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import fg from 'fast-glob';
import minimist from 'minimist';

// ----- CLI args -----
const args = minimist(process.argv.slice(2));
const INPUT_DIR = args.in || './data';
const OUT_DIR_ROOT = args.outDir || './outputs';
const FOLDER_PREFIX = args.prefix || 'run';

// ----- helpers -----
function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

function sentenceDescription(name, fullPath) {
  // Use same format as product embeddings for better vector matching
  // e.g. "apparel & accessories > shirts > t-shirts"
  return fullPath.toLowerCase();
}

// Build pathIds by walking parents to the root
function pathIdsOf(id, parentOf, guardLimit = 100) {
  const ids = [];
  let cur = id;
  const seen = new Set();
  while (cur && !seen.has(cur) && ids.length < guardLimit) {
    seen.add(cur);
    ids.push(cur);
    cur = parentOf.get(cur);
  }
  return ids.reverse();
}

// Exact-attribute boolean flags (category-local)
function attrBooleans(attrs = []) {
  const set = new Set((attrs || []).map((a) => String(a).toLowerCase()));
  // NOTE: keys must match exactly as listed in YAML
  return {
    hasAgeGroup: set.has('age_group'),
    hasColor: set.has('color'),
    hasFabric: set.has('fabric'),
    hasPattern: set.has('pattern'),
    hasTargetGender: set.has('target_gender'),
  };
}

async function main() {
  // Ensure outputs root & timestamped folder
  fs.mkdirSync(OUT_DIR_ROOT, { recursive: true });
  const outDir = path.join(OUT_DIR_ROOT, `${FOLDER_PREFIX}-${nowStamp()}`);
  fs.mkdirSync(outDir, { recursive: true });
  const OUT_JSON = path.join(outDir, 'taxonomy.categories.json');
  const OUT_STATS = path.join(outDir, 'stats.json');

  // Collect YAML files (exclude attributes.yml which is not categories)
  const files = await fg(['*.yml', '*.yaml', '!attributes.yml'], {
    cwd: INPUT_DIR,
    absolute: true,
    onlyFiles: true,
  });
  if (!files.length) {
    console.error(`No YAML files found in ${INPUT_DIR}`);
    process.exit(1);
  }

  // Load all nodes
  const rawNodes = [];
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const arr = yaml.load(raw);
    if (!Array.isArray(arr)) {
      console.error(`YAML does not contain an array: ${file}`);
      process.exit(1);
    }
    for (const n of arr) {
      rawNodes.push({
        id: n?.id,
        name: n?.name,
        children: Array.isArray(n?.children) ? n.children : [],
        attributes: Array.isArray(n?.attributes) ? n.attributes : [],
        __source: path.basename(file),
      });
    }
  }

  // Index nodes, warn on dupes
  const byId = new Map();
  for (const n of rawNodes) {
    if (!n.id || !n.name) {
      console.warn(`Skipping node missing id/name in ${n.__source}:`, n);
      continue;
    }
    if (byId.has(n.id)) {
      console.warn(`Duplicate id "${n.id}" detected; keeping the first. New seen in ${n.__source}`);
      continue;
    }
    byId.set(n.id, n);
  }

  // Build parent map from children refs
  const parentOf = new Map();
  for (const n of byId.values()) {
    for (const c of n.children) {
      if (parentOf.has(c) && parentOf.get(c) !== n.id) {
        console.warn(`Child "${c}" has multiple parents: ${parentOf.get(c)} and ${n.id}`);
      }
      parentOf.set(c, n.id);
    }
  }

  // Helpers that need maps
  function fullNameOf(id) {
    const pids = pathIdsOf(id, parentOf);
    const names = pids.map((pid) => byId.get(pid)?.name).filter(Boolean);
    return names.join(' > ');
  }

  function topLevelNameOf(id) {
    const pids = pathIdsOf(id, parentOf);
    // first id in the chain is the top-level (root) node for this branch
    const topId = pids[0] || id;
    return byId.get(topId)?.name || '';
  }

  // Transform → rows
  const out = [];
  let missingRefs = 0;

  for (const n of byId.values()) {
    const parentId = parentOf.get(n.id) ?? null;
    const pathIds = pathIdsOf(n.id, parentOf);
    const fullName = fullNameOf(n.id);
    const depth = Math.max(0, pathIds.length - 1);
    const isLeaf = (n.children || []).length === 0;

    // exact attribute booleans (category-local)
    const { hasAgeGroup, hasColor, hasFabric, hasPattern, hasTargetGender } = attrBooleans(
      n.attributes,
    );

    // stats: check for missing child refs
    for (const cid of n.children) {
      if (!byId.has(cid)) {
        missingRefs++;
        console.warn(`Missing child reference: parent=${n.id} child=${cid}`);
      }
    }

    out.push({
      id: n.id,
      name: n.name,

      // hierarchy
      fullName,
      pathIds,
      parentId,
      childrenIds: n.children,
      depth,
      isLeaf,

      // exact attribute booleans
      hasAgeGroup,
      hasColor,
      hasFabric,
      hasPattern,
      hasTargetGender,

      // top-level (first parent) name
      topLevel: topLevelNameOf(n.id),

      // provenance + embedding text
      sourceFile: n.__source,
      description: sentenceDescription(n.name, fullName),
    });
  }

  // Basic stats
  const roots = out.filter((r) => r.parentId === null).length;
  const leaves = out.filter((r) => r.isLeaf).length;
  const depthMin = out.reduce((m, r) => Math.min(m, r.depth), Infinity);
  const depthMax = out.reduce((m, r) => Math.max(m, r.depth), -Infinity);

  // Write files
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync(
    OUT_STATS,
    JSON.stringify(
      {
        inputDir: path.resolve(INPUT_DIR),
        outputDir: path.resolve(outDir),
        fileCount: files.length,
        nodeCount: out.length,
        roots,
        leaves,
        depthRange: [depthMin, depthMax],
        missingChildRefs: missingRefs,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`✓ Wrote ${out.length} categories → ${OUT_JSON}`);
  console.log(`✓ Wrote stats → ${OUT_STATS}`);
  console.log(
    `Roots: ${roots}, Leaves: ${leaves}, Depth range: ${depthMin}..${depthMax}, Missing child refs: ${missingRefs}`,
  );
}

main().catch((err) => {
  console.error('❌ Error generating categories:', err);
  process.exit(1);
});
