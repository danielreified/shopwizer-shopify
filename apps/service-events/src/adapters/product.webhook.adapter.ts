import { z } from 'zod';
import { ProductUpsertEvent, type TProductUpsertEvent } from '../types/product';
import { loadCurrencyRates, convertToUsd } from '../utils/currency';
import { clean } from '../utils/strings';

// ---
// Category normalizer
function normalizeCategory(raw: any) {
  if (!raw || !raw.admin_graphql_api_id) return undefined;
  const gid = raw.admin_graphql_api_id;
  const id = gid.split('/').pop(); // e.g. "hg-13-5-5"
  return {
    gid,
    id,
    name: clean(raw.name) ?? '',
    fullName: clean(raw.full_name),
  };
}

/**
 * Shopify Webhook payload shape (REST):
 *  {
 *    id, title, handle, body_html, vendor, product_type,
 *    status, tags, images[], image?, variants[], options[], category?
 *  }
 */

const WebhookImage = z.object({
  id: z.number(),
  src: z.string().url(),
  alt: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

const WebhookVariant = z.object({
  id: z.number(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  price: z.coerce.number(),
  priceUsd: z.coerce.number().optional(),
  position: z.number().int().optional().default(0),
  image_id: z.number().nullable().optional(),
  inventory_quantity: z.number().nullable().optional(),
});

const WebhookOption = z.object({
  id: z.number(),
  name: z.string(),
  position: z.number(),
  values: z.array(z.string()).optional().default([]),
});

const WebhookCategory = z
  .object({
    admin_graphql_api_id: z.string(),
    name: z.string(),
    full_name: z.string().optional(),
  })
  .nullable()
  .optional();

const WebhookProduct = z.object({
  id: z.number(),
  handle: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  product_type: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  body_html: z.string().nullable().optional(),
  images: z.array(WebhookImage).optional().default([]),
  image: WebhookImage.nullable().optional(), // top-level featured image
  variants: z.array(WebhookVariant).optional().default([]),
  options: z.array(WebhookOption).optional().default([]),
  category: WebhookCategory,
});

export async function adaptWebhook(
  raw: unknown,
  meta: { shop: string; topic?: string; currency?: string },
): Promise<TProductUpsertEvent> {
  const product = WebhookProduct.parse(raw);

  // ---- Normalize images ----
  const normImages = product.images.map((img) => ({
    gid: `gid://shopify/ProductImage/${img.id}`,
    id: String(img.id),
    url: img.src,
    alt: clean(img.alt),
    width: img.width ?? undefined,
    height: img.height ?? undefined,
  }));

  // ---- Determine featured image ----
  const featured = product.image
    ? {
        gid: `gid://shopify/ProductImage/${product.image.id}`,
        id: String(product.image.id),
        url: product.image.src,
        alt: clean(product.image.alt),
        width: product.image.width ?? undefined,
        height: product.image.height ?? undefined,
      }
    : normImages[0];

  const rates = await loadCurrencyRates();

  const normVariants = product.variants.map((v) => {
    const price = typeof v.price === 'number' ? v.price : parseFloat(v.price);
    const priceUsd = convertToUsd(price, meta.currency, rates);

    return {
      gid: `gid://shopify/ProductVariant/${v.id}`,
      id: String(v.id),
      sku: clean(v.sku ?? undefined),
      barcode: clean(v.barcode ?? undefined),
      title: clean(v.title),
      position: v.position ?? 0,
      price,
      priceUsd,
      selectedOptions: [],
      imageId: v.image_id ? String(v.image_id) : undefined,
      inventoryQuantity: v.inventory_quantity ?? undefined,
    };
  });

  // ---- Tags normalization ----
  const tagList = (product.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // ---- Normalize category (if exists) ----
  const category = normalizeCategory(product.category);

  // ---- Final normalization ----
  return ProductUpsertEvent.parse({
    kind: 'upsert',
    shop: meta.shop,
    topic: meta.topic ?? 'products/webhook',
    product: {
      gid: `gid://shopify/Product/${product.id}`,
      id: String(product.id),
      handle: clean(product.handle),
      title: clean(product.title),
      vendor: clean(product.vendor),
      status: clean(product.status) ?? 'ACTIVE',
      productType: clean(product.product_type),
      tags: tagList,
      descriptionHtml: product.body_html ?? '',
      featuredImage: featured,
      options: product.options.map((o) => ({
        id: String(o.id),
        name: o.name,
        position: o.position,
        values: o.values ?? [],
      })),
      images: normImages,
      variants: normVariants,
      category,
    },
  });
}
