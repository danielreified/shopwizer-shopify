import { prisma } from '../db/prisma';
import { fetchProductCategory } from './product.category';
import { logger } from '@repo/logger';

// ---
// Types
// ---

export interface NormalizedCategory {
  id: string;
  gid: string;
  name: string;
  fullName: string;
}

export const FALLBACK_CATEGORY: NormalizedCategory = {
  id: 'na',
  gid: 'gid://shopify/TaxonomyCategory/na',
  name: 'Uncategorized',
  fullName: 'Uncategorized',
};

// ---
// Helpers
// ---

export function stripGid(gid: string | null | undefined): string | null {
  if (!gid) return null;
  const parts = gid.split('/');
  return parts[parts.length - 1] ?? null;
}

export function normalizeCategory(src: any): NormalizedCategory {
  if (!src) return FALLBACK_CATEGORY;

  // Webhook category shape
  if (src.full_name || src.admin_graphql_api_id) {
    const gid = src.admin_graphql_api_id ?? null;
    return {
      id: stripGid(gid) ?? 'na',
      gid: gid ?? FALLBACK_CATEGORY.gid,
      name: src.name ?? 'Uncategorized',
      fullName: src.full_name ?? 'Uncategorized',
    };
  }

  // GraphQL/REST shape
  const gid = src.id ?? null;
  return {
    id: stripGid(gid) ?? 'na',
    gid: gid ?? FALLBACK_CATEGORY.gid,
    name: src.name ?? 'Uncategorized',
    fullName: src.fullName ?? 'Uncategorized',
  };
}

// ---
// Resolution
// ---

export async function resolveCategory(
  topic: string,
  enriched: any,
  webhookCategory: any,
  shop: string,
): Promise<any> {
  const isBulkEvent = topic === 'products/bulk';
  const isCreate = topic === 'products/create';
  const isUpdate = topic === 'products/update';

  // Bulk sync always fetches from API
  if (isBulkEvent) {
    return fetchProductCategory({ shop, productGid: enriched.gid });
  }

  // Create: use webhook category or fetch
  if (isCreate) {
    return webhookCategory || fetchProductCategory({ shop, productGid: enriched.gid });
  }

  // Update: use webhook category, existing, or fetch
  if (isUpdate) {
    if (webhookCategory) return webhookCategory;

    const existing = await prisma.product.findUnique({
      where: { id: Number(enriched.id) },
      select: { categoryId: true },
    });

    if (existing?.categoryId) {
      return {
        id: existing.categoryId,
        gid: `gid://shopify/TaxonomyCategory/${existing.categoryId}`,
        name: null,
        fullName: null,
      };
    }

    return fetchProductCategory({ shop, productGid: enriched.gid });
  }

  return null;
}
