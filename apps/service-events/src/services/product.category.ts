// src/services/product.category.ts
import { getAccessToken } from './shop.service';
import { withShopifyRateLimit } from '../config/shopify';
import { SHOPIFY_CONFIG } from '../config/service.config';

const API_VERSION = SHOPIFY_CONFIG.API_VERSION;

// ---- GraphQL ----
const QUERY_CATEGORY = /* GraphQL */ `
  query GetCategory($id: ID!) {
    product(id: $id) {
      category {
        id
        fullName
        name
      }
    }
  }
`;

// ---- Types ----
export type ProductCategory = {
  id: string;
  fullName: string;
  name: string;
};

export type FetchCategoryInput = {
  shop: string;
  productGid: string;
  apiVersion?: string;
};

// ---- Function ----
export async function fetchProductCategory({
  shop,
  productGid,
  apiVersion = API_VERSION,
}: FetchCategoryInput): Promise<ProductCategory | null> {
  const token = await getAccessToken(shop);

  const res = await withShopifyRateLimit(shop, () =>
    fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: QUERY_CATEGORY,
        variables: { id: productGid },
      }),
    }),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[shopify] ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  return (json?.data?.product?.category as ProductCategory) ?? null;
}
