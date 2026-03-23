// src/make-category-embeddings.js
// Usage: pnpm make:embeddings
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const DIM = Number(process.env.OPENAI_EMBED_DIM || 1536);
const BATCH = Number(process.env.EMBED_BATCH || 64);

// Inputs/outputs
const TAXONOMY_FILE = process.env.TAXONOMY_FILE ? path.resolve(process.env.TAXONOMY_FILE) : null;
if (!TAXONOMY_FILE || !fs.existsSync(TAXONOMY_FILE)) {
  throw new Error('Set TAXONOMY_FILE in .env and ensure the file exists');
}

const OUT_DIR = process.env.EMBED_OUT_DIR || path.join(path.dirname(TAXONOMY_FILE), `embeddings`);
fs.mkdirSync(OUT_DIR, { recursive: true });

const OUT_JSONL = path.join(OUT_DIR, `embeddings-${MODEL}-${DIM}.jsonl`);
const OUT_MANIFEST = path.join(OUT_DIR, `manifest.json`);

// Init
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY missing in .env');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function embedBatch(rows) {
  const input = rows.map((r) => r.description);
  const res = await openai.embeddings.create({
    model: MODEL,
    input,
    ...(DIM ? { dimensions: DIM } : {}),
  });
  return res.data.map((d) => d.embedding);
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(TAXONOMY_FILE, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('TAXONOMY_FILE must be a JSON array');

  // create / truncate outputs
  fs.writeFileSync(OUT_JSONL, '');
  const taxoSha = hashFile(TAXONOMY_FILE);

  let written = 0;
  const batches = chunk(rows, BATCH);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    // simple retry (3 tries, exponential backoff)
    let vecs;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        vecs = await embedBatch(batch);
        break;
      } catch (e) {
        if (attempt === 3) throw e;
        const delay = 500 * 2 ** (attempt - 1);
        console.warn(`Retry ${attempt}/3 after ${delay}ms due to error:`, e.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    const lines = batch.map((r, j) =>
      JSON.stringify({
        id: r.id,
        model: MODEL,
        dim: DIM,
        embedding: vecs[j],
      }),
    );
    fs.appendFileSync(OUT_JSONL, lines.join('\n') + '\n');

    written += batch.length;
    console.log(`wrote ${written}/${rows.length}`);
  }

  const manifest = {
    source_file: path.relative(process.cwd(), TAXONOMY_FILE),
    source_sha256: taxoSha,
    count: rows.length,
    model: MODEL,
    dim: DIM,
    created_at: new Date().toISOString(),
    jsonl_file: path.relative(process.cwd(), OUT_JSONL),
  };
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2));

  console.log('✅ Embeddings written:');
  console.log('  ', OUT_JSONL);
  console.log('  ', OUT_MANIFEST);
}

main().catch((e) => {
  console.error('❌ make-category-embeddings failed:', e);
  process.exit(1);
});
