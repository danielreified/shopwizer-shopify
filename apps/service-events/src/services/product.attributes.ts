import { getAccessToken } from './shop.service';
import { withShopifyRateLimit } from '../config/shopify';
import { logger } from '@repo/logger';

import { SHOPIFY_CONFIG } from '../config/service.config';

const API_VERSION = SHOPIFY_CONFIG.API_VERSION;

// ---
// Types
// ---

export type ProductAttributesSimple = {
  gender?: string[];
  ageGroup?: string[];
  colors?: Array<{ variantId: string; color?: string }>;
  collectionTitles?: string[];
  collectionHandles?: string[];
};

type ProductMetafieldOut = {
  key: string;
  namespace: string;
  type: string;
  entries: Array<{ id: string | null; value: string }>;
};

type VariantOut = {
  variantGid: string;
  selectedOptions: Array<{ name: string; value: string }>;
};

type FetchInput = {
  shop: string;
  productGid: string;
  apiVersion?: string;
};

// ---
// GraphQL Queries
// ---

const QUERY_PRODUCT = /* GraphQL */ `
  query ProductCategoryAttributes($id: ID!) {
    product(id: $id) {
      id

      targetGender: metafield(namespace: "shopify", key: "target-gender") {
        key
        namespace
        type
        value
        references(first: ${SHOPIFY_CONFIG.FETCH_LIMITS.METAFIELD_REFERENCES}) {
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

      ageGroup: metafield(namespace: "shopify", key: "age-group") {
        key
        namespace
        type
        value
        references(first: ${SHOPIFY_CONFIG.FETCH_LIMITS.METAFIELD_REFERENCES}) {
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

      variants(first: ${SHOPIFY_CONFIG.FETCH_LIMITS.VARIANTS}) {
        nodes {
          id
          selectedOptions {
            name
            value
          }
        }
      }

      collections(first: ${SHOPIFY_CONFIG.FETCH_LIMITS.COLLECTIONS}) {
        nodes {
          title
          handle
        }
      }
    }
  }
`;

const QUERY_NODES = /* GraphQL */ `
  query ResolveTaxonomyValues($ids: [ID!]!) {
    nodes(ids: $ids) {
      id
      __typename
      ... on TaxonomyValue {
        name
      }
    }
  }
`;

// ---
// Main Fetcher
// ---

export async function fetchProductAttributes({
  shop,
  productGid,
  apiVersion = API_VERSION,
}: FetchInput): Promise<ProductAttributesSimple> {
  const token = await getAccessToken(shop);

  const res = await withShopifyRateLimit(shop, () =>
    fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: QUERY_PRODUCT,
        variables: { id: productGid },
      }),
    }),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[shopify] ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  if (json?.errors?.length) {
    const errMsg = JSON.stringify(json.errors, null, 2);
    logger.error({ productGid, errors: json.errors }, 'GraphQL errors fetching product');
    throw new Error(`[shopify:gql] GraphQL errors for ${productGid}: ${errMsg}`);
  }

  const p = json?.data?.product;
  if (!p) {
    throw new Error(
      `[shopify:gql] Product not found for ${productGid} - may be timing issue during bulk`,
    );
  }

  // Collect gender + age group metafields
  const metaNodes = [p.targetGender, p.ageGroup].filter(Boolean);

  // Resolve taxonomy references
  const taxonomyIds = gatherAllTaxonomyIds(metaNodes);
  const idToName = taxonomyIds.length
    ? await resolveTaxonomyNames(shop, taxonomyIds, token, apiVersion)
    : {};

  const product: ProductMetafieldOut[] = metaNodes.map((m: any) => ({
    key: m.key,
    namespace: m.namespace,
    type: String(m.type ?? ''),
    entries: buildEntriesForMetafield(m, idToName),
  }));

  // Normalize variants
  const variants: VariantOut[] = (p.variants?.nodes ?? []).map((v: any) => ({
    variantGid: v.id,
    selectedOptions: Array.isArray(v.selectedOptions) ? v.selectedOptions : [],
  }));

  const collectionTitles: string[] = (p.collections?.nodes ?? [])
    .map((c: any) => c.title?.trim())
    .filter(Boolean);

  const collectionHandles: string[] = (p.collections?.nodes ?? [])
    .map((c: any) => c.handle?.trim())
    .filter(Boolean);

  return {
    gender: getValuesForKey(product, 'target-gender'),
    ageGroup: getValuesForKey(product, 'age-group'),
    colors: extractColorsPerVariant(variants),
    collectionTitles: collectionTitles.length ? collectionTitles : undefined,
    collectionHandles: collectionHandles.length ? collectionHandles : undefined,
  };
}

// ---
// Helpers
// ---

function gatherAllTaxonomyIds(nodes: any[]): string[] {
  const out = new Set<string>();
  for (const m of nodes) {
    const refs = m?.references?.nodes ?? [];
    for (const r of refs) {
      const fields = r?.fields ?? [];
      const byKey = objFromFields(fields);
      const t1 = byKey.get('taxonomy_reference');
      if (isGid(t1)) out.add(t1);
    }
  }
  return [...out];
}

function buildEntriesForMetafield(m: any, idToName: Record<string, string>) {
  const out: Array<{ id: string | null; value: string }> = [];
  const refs = m?.references?.nodes ?? [];

  for (const r of refs) {
    const fields = r?.fields ?? [];
    const byKey = objFromFields(fields);
    const id = byKey.get('taxonomy_reference');
    const label = inferLabel(byKey) ?? r?.handle ?? '';

    if (isGid(id)) {
      out.push({ id, value: idToName[id] ?? label });
    } else if (label) {
      out.push({ id: null, value: label });
    }
  }

  if (!refs.length && typeof m?.value === 'string' && m.value.trim()) {
    out.push({ id: null, value: m.value.trim() });
  }

  return dedupeEntries(out);
}

function getValuesForKey(metas: ProductMetafieldOut[], key: string): string[] | undefined {
  const m = metas.find((x) => x.key === key);
  if (!m) return undefined;
  const vals = (m.entries || []).map((e) => e.value).filter(Boolean);
  return vals.length ? vals : undefined;
}

// ---
// Extract single color per variant
// ---

function extractColorsPerVariant(
  variants: VariantOut[],
): Array<{ variantId: string; color?: string }> | undefined {
  if (!variants?.length) return undefined;

  const out: Array<{ variantId: string; color?: string }> = [];

  for (const v of variants) {
    const variantId = v.variantGid.split('/').pop() ?? v.variantGid;
    const color = (v.selectedOptions ?? [])
      .find((o) => o.name.toLowerCase() === 'color')
      ?.value?.trim();

    out.push({ variantId, color: color || undefined });
  }

  return out.length ? out : undefined;
}

// ---
// Utility Functions
// ---

function dedupeEntries(entries: Array<{ id: string | null; value: string }>) {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  return entries.filter((e) => {
    const nameKey = e.value.trim().toLowerCase();
    if (e.id) {
      if (seenIds.has(e.id)) return false;
      seenIds.add(e.id);
      seenNames.add(nameKey);
      return true;
    } else {
      if (!nameKey || seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
      return true;
    }
  });
}

function objFromFields(fields: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of fields ?? []) {
    if (typeof f?.key === 'string') map.set(f.key, f.value ?? '');
  }
  return map;
}

function inferLabel(byKey: Map<string, string>): string | null {
  const v =
    byKey.get('label') ?? byKey.get('name') ?? byKey.get('value') ?? byKey.get('title') ?? '';
  const t = v.trim();
  return t || null;
}

function isGid(x: unknown): x is string {
  return typeof x === 'string' && x.startsWith('gid://');
}

async function resolveTaxonomyNames(
  shop: string,
  ids: string[],
  token: string,
  apiVersion: string,
): Promise<Record<string, string>> {
  const res = await withShopifyRateLimit(shop, () =>
    fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query: QUERY_NODES, variables: { ids } }),
    }),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[shopify] nodes ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  const map: Record<string, string> = {};
  for (const n of json?.data?.nodes ?? []) {
    if (n?.__typename === 'TaxonomyValue' && typeof n?.name === 'string') {
      map[n.id] = n.name;
    }
  }
  return map;
}
