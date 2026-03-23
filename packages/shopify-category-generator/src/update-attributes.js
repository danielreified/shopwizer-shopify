// src/update-attributes.js
import 'dotenv/config';
import fs from 'node:fs';
import yaml from 'js-yaml';
import fg from 'fast-glob';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// These NEVER come from taxonomy — you resolve them from Shopify metafields
const REMOVE = new Set(['color', 'target_gender', 'age_group']);

/**
 * Load YAML file and support both formats:
 *  - [ { id: "...", attributes: [...] } ]
 *  - { base_attributes: [ ... ] }
 */
function loadYamlArray(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw);

  // Case 1 → file is an array
  if (Array.isArray(parsed)) {
    return parsed;
  }

  // Case 2 → file has base_attributes: [ ... ]
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.base_attributes)) {
    return parsed.base_attributes;
  }

  throw new Error(`❌ YAML must be array or base_attributes array: ${filePath}`);
}

/**
 * Build a map: friendly_id → list of allowed values
 * Example:
 *   "material" → ["material__cotton", "material__wool", ...]
 */
function buildAttributeValuesMap(baseAttributesYaml) {
  const map = new Map();

  for (const attr of baseAttributesYaml) {
    if (!attr?.friendly_id || !Array.isArray(attr.values)) continue;
    map.set(attr.friendly_id, attr.values);
  }

  return map;
}

/**
 * Remove metafield attributes from category attribute list
 */
function cleanAttributes(attrs = []) {
  return attrs.filter((a) => !REMOVE.has(String(a).toLowerCase()));
}

/**
 * Load each category YAML file → build Map<categoryId, attributes[]>
 */
async function loadTaxonomyAttributes(inputDir) {
  const files = await fg(['*.yml', '*.yaml'], {
    cwd: inputDir,
    absolute: true,
    onlyFiles: true,
  });

  const map = new Map();

  for (const file of files) {
    // skip attributes.yml — handled separately
    if (file.endsWith('attributes.yml')) continue;

    const arr = loadYamlArray(file);

    for (const node of arr) {
      if (!node?.id) continue;
      const attrs = Array.isArray(node.attributes) ? node.attributes : [];
      map.set(node.id, attrs);
    }
  }

  return map;
}

async function main() {
  const TAXONOMY_DIR = process.env.TAXONOMY_DIR || './data';
  const BASE_ATTR_FILE = `${TAXONOMY_DIR}/attributes.yml`;

  console.log('📥 Loading taxonomy category files…');
  const categoryAttrsMap = await loadTaxonomyAttributes(TAXONOMY_DIR);

  console.log('📥 Loading base_attributes values…');
  const baseAttributes = loadYamlArray(BASE_ATTR_FILE);

  // friendly_id → ["material__cotton", ...]
  const attributeValuesMap = buildAttributeValuesMap(baseAttributes);

  console.log(`📦 Loaded categories:      ${categoryAttrsMap.size}`);
  console.log(`📦 Loaded base_attributes: ${attributeValuesMap.size} attribute groups`);

  let updated = 0;
  let missing = 0;

  console.log('🛠 Writing Category.attributes + Category.attributesValues…');

  for (const [id, attrs] of categoryAttrsMap.entries()) {
    const cleaned = cleanAttributes(attrs);

    // Build FLAT list of allowed values for this category
    const flatValues = [];

    for (const a of cleaned) {
      const allowed = attributeValuesMap.get(a);
      if (Array.isArray(allowed)) flatValues.push(...allowed);
    }

    const result = await prisma.category.updateMany({
      where: { id },
      data: {
        attributes: cleaned, // ["material", "pattern", ...]
        attributesValues: flatValues, // ["material__wool", "pattern__striped", ...]
      },
    });

    if (result.count > 0) updated++;
    else missing++;
  }

  console.log('\n✅ Update Complete!');
  console.log(`   ✔ Updated: ${updated}`);
  console.log(`   ⚠ Missing: ${missing}`);
}

main()
  .catch((err) => {
    console.error('❌ update-attributes failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
