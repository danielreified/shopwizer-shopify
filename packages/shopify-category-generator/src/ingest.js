// src/ingest.js
// Usage: pnpm ingest
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import OpenAI from 'openai';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// -----------------------------
// Config (with sensible defaults)
// -----------------------------
const CHUNK = Number(process.env.INGEST_CHUNK || 500);

const DO_EMBED = String(process.env.EMBED_DURING_INGEST || '').toLowerCase() === 'true';
const MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const DIM = Number(process.env.OPENAI_EMBED_DIM || 1536);
const EMBED_BATCH = Number(process.env.EMBED_BATCH || 64);

const USE_LOCAL = String(process.env.USE_LOCAL_EMBEDS || '').toLowerCase() === 'true';
const MANIFEST_PATH = process.env.LOCAL_EMBEDS_MANIFEST
  ? path.resolve(process.env.LOCAL_EMBEDS_MANIFEST)
  : null;
const FORCE_UPDATE_VECTORS =
  String(process.env.FORCE_UPDATE_VECTORS || '').toLowerCase() === 'true';

const TABLE = 'Category'; // table name (quoted in SQL)

// -----------------------------
// Helpers
// -----------------------------
function mustFile(p) {
  const abs = path.resolve(p);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return abs;
}

function getTaxonomyFile() {
  const f = process.env.TAXONOMY_FILE;
  if (!f) throw new Error('❌ TAXONOMY_FILE must be set in .env');
  return mustFile(f);
}

function readJsonArray(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`❌ Failed to parse ${filePath}: ${e.message}`);
  }
  if (!Array.isArray(data)) {
    throw new Error(`❌ Expected JSON array in ${filePath}`);
  }
  return data;
}

// Build ARRAY[...]::vector literal for pgvector
function vectorLiteral(vec) {
  if (!Array.isArray(vec)) throw new Error('vectorLiteral got non-array');
  return `ARRAY[${vec.join(',')}]::vector`;
}
function zeroVectorLiteral(dim) {
  return `ARRAY[${new Array(dim).fill(0).join(',')}]::vector`;
}

async function tableVectorNullable() {
  // Returns true if "vector" is nullable, false if NOT NULL (or null if column missing)
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
      AND column_name = 'vector'
    `,
    TABLE,
  );
  if (!rows.length) return null;
  const flag = String(rows[0].is_nullable || '').toLowerCase();
  return flag === 'yes';
}

/** Load local embeddings into Map<id, number[]> with diagnostics */
async function loadLocalEmbeddings(manifestPath, { restrictToIds } = {}) {
  const abs = mustFile(manifestPath);
  const baseDir = path.dirname(abs);

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    throw new Error(`Failed to parse manifest at ${abs}: ${e.message}`);
  }

  // Accept common shapes: files[], file, paths[]
  let files = [];
  if (Array.isArray(manifest.files)) files = manifest.files;
  else if (typeof manifest.file === 'string') files = [manifest.file];
  else if (Array.isArray(manifest.paths)) files = manifest.paths;
  else {
    // auto-discover *.jsonl next to manifest
    files = fs.readdirSync(baseDir).filter((f) => f.toLowerCase().endsWith('.jsonl'));
    if (!files.length) {
      console.warn(`⚠️  No files listed in manifest and no *.jsonl found in ${baseDir}`);
      return new Map();
    }
    console.log(`ℹ️  Auto-discovered JSONL: ${files.join(', ')}`);
  }

  const wanted = restrictToIds ? new Set(restrictToIds) : null;

  let totalLines = 0;
  let kept = 0;
  let skippedNoId = 0;
  let skippedNoVec = 0;
  let skippedNotWanted = 0;

  const map = new Map();

  for (const rel of files) {
    const f = path.resolve(baseDir, rel);
    if (!fs.existsSync(f)) {
      console.warn(`⚠️  Listed file not found: ${f}`);
      continue;
    }
    const rl = readline.createInterface({
      input: fs.createReadStream(f, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      const s = line.trim();
      if (!s) continue;
      totalLines++;
      let row;
      try {
        row = JSON.parse(s);
      } catch {
        continue; // bad JSON line
      }
      const id = row?.id;
      if (!id) {
        skippedNoId++;
        continue;
      }
      if (wanted && !wanted.has(id)) {
        skippedNotWanted++;
        continue;
      }
      // Accept several vector shapes
      let vec = null;
      if (Array.isArray(row.embedding)) vec = row.embedding;
      else if (Array.isArray(row.vector)) vec = row.vector;
      else if (row.embedding && Array.isArray(row.embedding.vector)) vec = row.embedding.vector;

      if (!vec) {
        skippedNoVec++;
        continue;
      }
      if (DIM && vec.length !== DIM) {
        console.warn(
          `⚠️  Vector dim mismatch for id=${id}. Expected ${DIM}, got ${vec.length}. Keeping anyway.`,
        );
      }
      map.set(id, vec);
      kept++;

      // DEBUG: Log first few rows to verify ID format
      if (kept <= 3) {
        console.log(`🐛 [DEBUG] Loaded ID sample: "${id}" (vec len: ${vec.length})`);
      }
    }
  }

  console.log(
    `   • scanned ${totalLines} lines; kept ${kept}, skipped(no-id=${skippedNoId}, no-vec=${skippedNoVec}, not-wanted=${skippedNotWanted})`,
  );
  return map;
}

// ---------- Prisma helpers ----------
function toUpsertArgs(c) {
  return {
    where: { id: c.id },
    create: {
      id: c.id,
      name: c.name,
      fullName: c.fullName,
      pathIds: c.pathIds,
      parentId: c.parentId ?? null,
      depth: c.depth,
      isLeaf: c.isLeaf,
      hasAgeGroup: c.hasAgeGroup,
      hasColor: c.hasColor,
      hasFabric: c.hasFabric,
      hasPattern: c.hasPattern,
      hasTargetGender: c.hasTargetGender,

      // ✅ correctly reference c.pathIds[0]
      rootId: c.pathIds[0],

      topLevel: c.topLevel,
      sourceFile: c.sourceFile,
      description: c.description,
    },
    update: {
      name: c.name,
      fullName: c.fullName,
      pathIds: c.pathIds,
      parentId: c.parentId ?? null,
      depth: c.depth,
      isLeaf: c.isLeaf,
      hasAgeGroup: c.hasAgeGroup,
      hasColor: c.hasColor,
      hasFabric: c.hasFabric,
      hasPattern: c.hasPattern,
      hasTargetGender: c.hasTargetGender,

      // ✅ same here
      rootId: c.pathIds[0],

      topLevel: c.topLevel,
      sourceFile: c.sourceFile,
      description: c.description,
    },
  };
}

// which ids still have NULL vectors?
async function idsNeedingVectors(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id FROM "${TABLE}" WHERE "vector" IS NULL AND id IN (${placeholders})`,
    ...ids,
  );
  return rows.map((r) => r.id);
}

async function embedBatch(openai, rows) {
  if (!rows.length) return [];
  const input = rows.map((r) => r.description);
  const res = await openai.embeddings.create({
    model: MODEL,
    input,
    ...(DIM ? { dimensions: DIM } : {}),
  });
  return res.data.map((d) => d.embedding);
}

async function updateVectorsFromEmbeddings(pairs /* [{id, embedding}] */) {
  if (!pairs.length) return;
  const tx = pairs.map(({ id, embedding }) =>
    prisma.$executeRawUnsafe(
      `UPDATE "${TABLE}" SET "vector" = ${vectorLiteral(embedding)} WHERE "id" = $1`,
      id,
    ),
  );
  await prisma.$transaction(tx, { timeout: 120000 });
}

async function updateVectors(rows /* [{id, description}], vectors[] */) {
  if (!rows.length) return;
  const tx = rows.map((r, i) =>
    prisma.$executeRawUnsafe(
      `UPDATE "${TABLE}" SET "vector" = ${vectorLiteral(vectors[i])} WHERE "id" = $1`,
      r.id,
    ),
  );
  await prisma.$transaction(tx, { timeout: 120000 });
}

// ---------- Raw UPSERT including vector (for NOT NULL vector schemas)
// NOTE: **not** async — returns the Prisma promise directly.
// This is the crucial fix for `$transaction([...])`.
function insertColumnsSql(includeVector) {
  const cols = [
    '"id"',
    '"name"',
    '"fullName"',
    '"pathIds"',
    '"parentId"',
    '"depth"',
    '"isLeaf"',
    '"hasAgeGroup"',
    '"hasColor"',
    '"hasFabric"',
    '"hasPattern"',
    '"hasTargetGender"',
    '"topLevel"',
    '"sourceFile"',
    '"description"',
    '"rootId"',
  ];
  if (includeVector) cols.push('"vector"');
  return cols.join(', ');
}
function insertValuesSql(includeVector) {
  const base = [
    '$1',
    '$2',
    '$3',
    '$4',
    '$5',
    '$6',
    '$7',
    '$8',
    '$9',
    '$10',
    '$11',
    '$12',
    '$13',
    '$14',
    '$15',
    '$16',
  ];
  if (includeVector) base.push('__VECTOR__'); // replaced by literal
  return base.join(', ');
}
function updateSetSql(includeVector) {
  const sets = [
    '"name" = EXCLUDED."name"',
    '"fullName" = EXCLUDED."fullName"',
    '"pathIds" = EXCLUDED."pathIds"',
    '"parentId" = EXCLUDED."parentId"',
    '"depth" = EXCLUDED."depth"',
    '"isLeaf" = EXCLUDED."isLeaf"',
    '"hasAgeGroup" = EXCLUDED."hasAgeGroup"',
    '"hasColor" = EXCLUDED."hasColor"',
    '"hasFabric" = EXCLUDED."hasFabric"',
    '"hasPattern" = EXCLUDED."hasPattern"',
    '"hasTargetGender" = EXCLUDED."hasTargetGender"',
    '"topLevel" = EXCLUDED."topLevel"',
    '"sourceFile" = EXCLUDED."sourceFile"',
    '"description" = EXCLUDED."description"',
    '"rootId" = EXCLUDED."rootId"',
  ];
  if (includeVector) sets.push('"vector" = EXCLUDED."vector"');
  return sets.join(', ');
}

// 🔧 FIXED: no `async` here; returns Prisma promise directly.
function rawUpsertScalarOrWithVector(row, vector /* null or array */) {
  const includeVector = Array.isArray(vector);
  if (includeVector && DIM && vector.length !== DIM) {
    console.warn(
      `⚠️  vector length ${vector.length} != DIM ${DIM} for id=${row.id} — inserting anyway`,
    );
  }

  const sql = `
    INSERT INTO "${TABLE}" (${insertColumnsSql(includeVector)})
    VALUES (${insertValuesSql(includeVector)})
    ON CONFLICT ("id") DO UPDATE SET
      ${updateSetSql(includeVector)}
  `.replace('__VECTOR__', includeVector ? vectorLiteral(vector) : 'NULL');

  const args = [
    row.id,
    row.name,
    row.fullName,
    row.pathIds,
    row.parentId ?? null,
    row.depth,
    row.isLeaf,
    row.hasAgeGroup,
    row.hasColor,
    row.hasFabric,
    row.hasPattern,
    row.hasTargetGender,
    row.topLevel,
    row.sourceFile,
    row.description,
    row.rootId,
  ];

  return prisma.$executeRawUnsafe(sql, ...args);
}

// -----------------------------
// Main
// -----------------------------
async function main() {
  // 0) Assert env & input
  const file = getTaxonomyFile();
  const rows = readJsonArray(file);
  console.log(`📥 Ingesting ${rows.length} categories from ${file}`);

  // --- DEBUG START ---
  console.log('----------------------------------------------------------------');
  console.log('🐛 [DEBUG] Config Check:');
  console.log('   USE_LOCAL:', USE_LOCAL);
  console.log('   MANIFEST_PATH:', MANIFEST_PATH);
  console.log('   DO_EMBED:', DO_EMBED);
  console.log('   TABLE:', TABLE);
  console.log('----------------------------------------------------------------');
  // --- DEBUG END ---

  // 1) Column nullability for "vector"
  const vectorNullable = await tableVectorNullable();
  if (vectorNullable == null) {
    console.warn(
      '⚠️  Could not detect vector column via information_schema. Assuming NULLABLE. (If you see NOT NULL errors, set it nullable or enable embeddings.)',
    );
  } else {
    console.log(`🧭 "Category"."vector" is ${vectorNullable ? 'NULLABLE' : 'NOT NULL'}`);
  }

  // 2) Prepare embeddings
  let openai = null;
  if (DO_EMBED) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('EMBED_DURING_INGEST=true but OPENAI_API_KEY is missing');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log(`🧠 Online embedding enabled: model=${MODEL} dim=${DIM} batch=${EMBED_BATCH}`);
  }

  let localMap = new Map();
  if (USE_LOCAL) {
    if (!MANIFEST_PATH)
      throw new Error('USE_LOCAL_EMBEDS=true but LOCAL_EMBEDS_MANIFEST is not set');
    console.log(`📦 Loading local embeddings from ${MANIFEST_PATH} ...`);
    localMap = await loadLocalEmbeddings(
      MANIFEST_PATH /*, { restrictToIds: rows.map(r => r.id) } */,
    );
    console.log(`   • loaded ${localMap.size} vectors from disk`);
  }

  // 3) If vector is NOT NULL, ensure we can supply vectors
  if (vectorNullable === false) {
    if (!USE_LOCAL && !DO_EMBED) {
      throw new Error(
        '❌ "Category"."vector" is NOT NULL but neither USE_LOCAL_EMBEDS nor EMBED_DURING_INGEST is enabled. Enable one or make the column nullable.',
      );
    }
    if (USE_LOCAL && localMap.size === 0 && !DO_EMBED) {
      throw new Error(
        '❌ "Category"."vector" is NOT NULL and local embeddings loaded = 0. Provide embeddings (manifest/jsonl) or enable EMBED_DURING_INGEST.',
      );
    }
  }

  // 4) Upsert order: parents first
  rows.sort((a, b) => a.depth - b.depth);

  // 5) Process in chunks
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const ids = slice.map((r) => r.id);
    console.log(`\n— Chunk ${i / CHUNK + 1}: ${slice.length} rows`);

    if (vectorNullable !== false) {
      // Case A: vector is nullable -> upsert scalars first, then fill vectors
      const upserts = slice.map((c) => prisma.category.upsert(toUpsertArgs(c)));
      await prisma.$transaction(upserts, { timeout: 120000 });
      console.log(`  ✓ Upserted scalars for ${slice.length} rows`);

      // FORCE_UPDATE_VECTORS: update ALL vectors, not just NULL ones
      let needIds = FORCE_UPDATE_VECTORS ? ids : await idsNeedingVectors(ids);
      if (FORCE_UPDATE_VECTORS) {
        console.log(`  • 🔄 FORCE updating vectors for ALL ${needIds.length} rows`);
      } else {
        console.log(`  • ${needIds.length} need vectors (NULL in DB)`);
        if (!needIds.length) continue;
      }

      // apply local
      if (localMap.size) {
        // DEBUG: Trace lookup for first batch
        if (needIds.length > 0) {
          console.log(
            `🐛 [DEBUG] Checking local map for ${needIds.length} IDs. First: "${needIds[0]}" In map? ${localMap.has(needIds[0])}`,
          );
        }

        const locals = needIds
          .filter((id) => localMap.has(id))
          .map((id) => ({ id, embedding: localMap.get(id) }));
        if (locals.length) {
          await updateVectorsFromEmbeddings(locals);
          console.log(`  ↳ wrote ${locals.length} vectors from local disk`);
          needIds = await idsNeedingVectors(ids);
          console.log(`  • remaining after local: ${needIds.length}`);
        }
      }

      // embed remainder online
      if (DO_EMBED && needIds.length) {
        const byId = new Map(slice.map((r) => [r.id, r]));
        for (let j = 0; j < needIds.length; j += EMBED_BATCH) {
          const batchIds = needIds.slice(j, j + EMBED_BATCH);
          const batchRows = batchIds.map((id) => ({ id, description: byId.get(id).description }));
          let vecs;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              vecs = await embedBatch(openai, batchRows);
              break;
            } catch (e) {
              if (attempt === 3) throw e;
              const delay = 500 * 2 ** (attempt - 1);
              console.warn(`  ↻ embed retry ${attempt}/3 after ${delay}ms: ${e.message}`);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
          await updateVectors(batchRows, vecs);
          console.log(
            `  ↳ embedded online ${Math.min(j + EMBED_BATCH, needIds.length)}/${needIds.length}`,
          );
          await new Promise((r) => setTimeout(r, 30));
        }
      }
    } else {
      // Case B: vector is NOT NULL -> include a vector in the upsert
      const byId = new Map(slice.map((r) => [r.id, r]));
      const pairs = [];

      // Start with local if present
      let localHits = 0;
      for (const id of ids) {
        const vec = localMap.get(id);
        if (vec) {
          pairs.push({ id, vector: vec });
          localHits++;
        } else {
          // DEBUG: why miss?
          if (i < 5) console.log(`🐛 [DEBUG] No local vector for ID: "${id}"`);
        }
      }
      if (localHits) {
        console.log(`  • local vectors for ${localHits}/${slice.length}`);
      }

      // For missing ones, embed online if allowed
      const missingIds = ids.filter((id) => !localMap.has(id));
      if (missingIds.length && DO_EMBED) {
        console.log(`  • online embedding for ${missingIds.length} (no local)`);
        for (let j = 0; j < missingIds.length; j += EMBED_BATCH) {
          const batchIds = missingIds.slice(j, j + EMBED_BATCH);
          const batchRows = batchIds.map((id) => byId.get(id));
          let vecs;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              vecs = await embedBatch(openai, batchRows);
              break;
            } catch (e) {
              if (attempt === 3) throw e;
              const delay = 500 * 2 ** (attempt - 1);
              console.warn(`  ↻ embed retry ${attempt}/3 after ${delay}ms: ${e.message}`);
              await new Promise((r) => setTimeout(r, delay));
            }
          }
          for (let k = 0; k < batchIds.length; k++) {
            pairs.push({ id: batchIds[k], vector: vecs[k] });
          }
          console.log(
            `  ↳ embedded ${Math.min(j + EMBED_BATCH, missingIds.length)}/${missingIds.length}`,
          );
          await new Promise((r) => setTimeout(r, 30));
        }
      }

      // If still missing, supply a zero vector
      const stillMissing = ids.filter((id) => !pairs.find((p) => p.id === id));
      if (stillMissing.length) {
        console.warn(
          `  ⚠️ ${stillMissing.length} rows have no vector available (no local, no online). Using ZERO vector (dim=${DIM}).`,
        );
        for (const id of stillMissing) {
          pairs.push({ id, vector: new Array(DIM).fill(0) });
        }
      }

      // Raw UPSERT each row with the vector — build Prisma promises (no async wrapper!)
      const tx = slice.map((row) => {
        const p = pairs.find((x) => x.id === row.id);
        const vec = p?.vector ?? new Array(DIM).fill(0);
        return rawUpsertScalarOrWithVector(row, vec); // returns Prisma promise
      });

      await prisma.$transaction(tx, { timeout: 180000 });
      console.log(`  ✓ Upserted ${slice.length} rows (with vector)`);
    }

    await new Promise((r) => setTimeout(r, 10));
  }

  if (USE_LOCAL || DO_EMBED) {
    await prisma.$executeRawUnsafe(`ANALYZE "${TABLE}"`);
  }

  console.log('\n✅ Ingest complete.');
}

main()
  .catch((e) => {
    console.error('❌ Ingest failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
