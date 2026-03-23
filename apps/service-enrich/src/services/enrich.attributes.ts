// src/services/enrich.attributes.ts
import { prisma } from '../db/prisma';
import { generateEmbedding } from './enrich.embedding';
import { createSha256 } from '../utils/crypto';
import { upsertProductAttributesEmbedding } from '../repositories/embed.repository';
import { getAccessToken } from './shop.service';
import { withShopifyRateLimit } from '../config/shopify';
import { OPENAI_MODEL, rateLimitedResponses } from '../config/openai';
import { stripHtml, cleanLlmJson } from '../utils/text';

import { INFRA_CONFIG, ENRICH_LOGIC, PROMPTS } from '../config/service.config';

const API_VERSION = process.env.SHOPIFY_API_VERSION || INFRA_CONFIG.SHOPIFY_API_VERSION;

type AttributesByKey = Record<string, string[]>;

function normalizeShopifyKey(key: string): string {
  return key.replace(/-/g, '_').trim().toLowerCase();
}

// ============================================================================
// 🚀 MAIN ENTRYPOINT
// ============================================================================
export async function runAttributesEmbedding(params: {
  shop: string;
  productId: string | number | bigint;
  categoryId?: string | null;
  title?: string | null;
  descriptionHtml?: string | null;
}) {
  const { shop, productId, categoryId, title, descriptionHtml } = params;

  if (!categoryId) {
    return null;
  }

  // Load category config
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, attributes: true, attributesValues: true },
  });

  if (!category) {
    return null;
  }

  const attributeKeys = (Array.isArray(category.attributes) ? category.attributes : []).map(
    (a: unknown) => normalizeShopifyKey(String(a)),
  );
  const attributesValuesArray = (
    Array.isArray(category.attributesValues) ? category.attributesValues : []
  ).map(String);

  if (!attributeKeys.length || !attributesValuesArray.length) {
    return null;
  }

  // Group allowed canonical values per attribute
  const attributesByKey: AttributesByKey = {};
  for (const val of attributesValuesArray) {
    const [rawKey, option] = val.split('__', 2);
    if (!rawKey || !option) continue;

    const key = normalizeShopifyKey(rawKey);
    if (!attributeKeys.includes(key)) continue;

    if (!attributesByKey[key]) attributesByKey[key] = [];
    attributesByKey[key].push(`${key}__${option}`);
  }

  // ========================================================================
  // 🔥 Dynamic Shopify Query (ONLY your metafields, zero noise)
  // ========================================================================

  const existingValuesByKey = await fetchDynamicAttributeMetafieldsFromShopify({
    shop,
    productId,
    attributeKeys,
    attributesByKey,
  });

  // LLM inference
  const llmAttributes = await inferMissingAttributesWithLLM({
    title: title ?? '',
    descriptionHtml: descriptionHtml ?? '',
    attributesByKey,
    existingValuesByKey,
  });

  // Merge
  const finalByKey: AttributesByKey = {};

  for (const key of Object.keys(attributesByKey)) {
    const allowed = new Set(attributesByKey[key]);
    const existing = new Set(existingValuesByKey[key] ?? []);
    const inferred = new Set(llmAttributes[key] ?? []);

    const merged = new Set<string>();
    for (const v of existing) if (allowed.has(v)) merged.add(v);
    for (const v of inferred) if (allowed.has(v)) merged.add(v);

    if (merged.size > 0) finalByKey[key] = Array.from(merged);
  }

  if (!Object.keys(finalByKey).length) {
    return null;
  }

  const sourceText = buildAttributesText(finalByKey);

  if (!sourceText.trim()) return null;

  const vector = await generateEmbedding(sourceText);
  const textHash = createSha256(sourceText);

  // ------------------------------------------------------------------------
  // 📊 NEW: Calculate categoryCount + valueCount
  // ------------------------------------------------------------------------
  const categoryCount = Object.keys(finalByKey).length;

  const valueCount = Object.values(finalByKey).reduce(
    (total, arr) => total + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  // ------------------------------------------------------------------------
  // 💾 Save embedding + counts
  // ------------------------------------------------------------------------
  const upsertResult = await upsertProductAttributesEmbedding({
    shopId: shop,
    productId,
    version: 1,
    textHash,
    sourceText,
    vector,
    categoryCount,
    valueCount,
  });

  return { ok: upsertResult.ok, sourceText, finalByKey };
}

function toAliasName(key: string): string {
  // turn: "outerwear_clothing_features" → "outerwearClothingFeatures"
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ============================================================================
// 🛒 DYNAMIC SHOPIFY QUERY — THE REAL FIX
// ============================================================================
function buildDynamicMetafieldsQuery(attributeKeys: string[]) {
  const fields = attributeKeys
    .map((key) => {
      const shopifyKey = key.replace(/_/g, '-').trim().toLowerCase();

      return `
          ${key}: metafield(namespace: "shopify", key: "${shopifyKey}") {
            namespace
            key
            type
            value
            references(first: ${ENRICH_LOGIC.ATTRIBUTES.METAFIELD_REFERENCE_LIMIT}) {
              nodes {
                ... on Metaobject {
                  id
                  handle
                  fields {
                    key
                    value
                  }
                }
              }
            }
          }
        `;
    })
    .join('\n');

  return `
      query ProductDynamicAttributes($id: ID!) {
        product(id: $id) {
          id
          ${fields}
        }
      }
    `;
}

async function fetchDynamicAttributeMetafieldsFromShopify(params: {
  shop: string;
  productId: string | number | bigint;
  attributeKeys: string[];
  attributesByKey: AttributesByKey;
}): Promise<AttributesByKey> {
  const { shop, productId, attributeKeys, attributesByKey } = params;

  const query = buildDynamicMetafieldsQuery(attributeKeys);
  const productGid = `gid://shopify/Product/${String(productId)}`;
  const token = await getAccessToken(shop);

  const res = await withShopifyRateLimit(shop, () =>
    fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: { id: productGid },
      }),
    }),
  );

  const json = await res.json().catch(() => ({}));

  if (json?.errors) {
  }

  // if product missing → still log the data section
  const product = json?.data?.product;

  if (!product) {
    return {};
  }

  const out: AttributesByKey = {};

  for (const key of attributeKeys) {
    const mf = product[key];
    if (!mf) continue;

    const allowed = new Set(attributesByKey[key] ?? []);
    if (!allowed.size) continue;

    const isRef = mf.type?.includes('metaobject_reference') && mf.references?.nodes?.length;

    let canonical: string[] = [];

    if (isRef) {
      canonical = parseMetaobjectReferencesToCanonicalValues(key, mf.references.nodes, allowed);
    } else {
      canonical = parseMetafieldValueToCanonicalValues(key, mf.value, allowed);
    }

    if (canonical.length) out[key] = canonical;
  }

  return out;
}

// ============================================================================
// PARSING HELPERS
// ============================================================================
function parseMetaobjectReferencesToCanonicalValues(
  attrKey: string,
  nodes: any[],
  allowed: Set<string>,
): string[] {
  const out: string[] = [];

  for (const node of nodes ?? []) {
    const fields = Array.isArray(node?.fields) ? node.fields : [];
    if (!fields.length) continue;

    const labelField =
      fields.find((f: any) => f.key === 'label') ||
      fields.find((f: any) => f.key === 'name') ||
      fields[0];

    const rawLabel = labelField?.value;
    if (!rawLabel) continue;

    const norm = normalizeAttributeOption(rawLabel);
    const candidate = `${attrKey}__${norm}`;

    if (allowed.has(candidate)) {
      out.push(candidate);
    } else {
    }
  }

  return [...new Set(out)];
}

function parseMetafieldValueToCanonicalValues(
  attrKey: string,
  rawValue: string | null,
  allowed: Set<string>,
): string[] {
  if (!rawValue) return [];

  let values: string[] = [];

  const t = rawValue.trim();
  if (t.startsWith('[') && t.endsWith(']')) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) values = parsed;
    } catch {}
  }

  if (!values.length) values = rawValue.split(/[,|]/).map((x) => x.trim());

  const out: string[] = [];
  for (const v of values) {
    const norm = normalizeAttributeOption(v);
    const candidate = `${attrKey}__${norm}`;
    if (allowed.has(candidate)) out.push(candidate);
  }

  return [...new Set(out)];
}

function normalizeAttributeOption(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ============================================================================
// 🤖 LLM
// ============================================================================
async function inferMissingAttributesWithLLM(params: {
  title: string;
  descriptionHtml: string;
  attributesByKey: AttributesByKey;
  existingValuesByKey: AttributesByKey;
}): Promise<AttributesByKey> {
  const { title, descriptionHtml, attributesByKey, existingValuesByKey } = params;

  const cleanDesc = stripHtml(descriptionHtml);

  const sys = PROMPTS.ATTRIBUTES;

  const payload = {
    title: title.trim(),
    description: cleanDesc,
    allowedValues: attributesByKey,
    existingValues: existingValuesByKey,
  };

  const res = await rateLimitedResponses({
    model: OPENAI_MODEL,
    input: [
      { role: 'system', content: sys },
      {
        role: 'user',
        content: `Return ONLY raw JSON.\n\n` + JSON.stringify(payload, null, 2),
      },
    ],
  });

  const cleaned = cleanLlmJson(res.output_text || '');

  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {};
  }

  const out: AttributesByKey = {};
  for (const [key, arr] of Object.entries(parsed)) {
    if (!Array.isArray(arr)) continue;
    out[key] = arr.filter((v) => typeof v === 'string' && v.includes('__'));
  }

  return out;
}

// ============================================================================
// Embedding text
// ============================================================================
function buildAttributesText(finalByKey: AttributesByKey): string {
  const parts: string[] = [];

  for (const [key, values] of Object.entries(finalByKey)) {
    if (!values.length) continue;

    const prettyKey = key.replace(/_/g, ' ');
    const prettyVals = values
      .map((canonical) => canonical.split('__')[1] || '')
      .map((suffix) =>
        suffix
          .replace(/_/g, ' ')
          .replace(/\b([a-z])/g, (m) => m.toUpperCase())
          .trim(),
      );

    parts.push(`${prettyKey}: ${prettyVals.join(', ')}`);
  }

  return parts.join(' | ');
}
