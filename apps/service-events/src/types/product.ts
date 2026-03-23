import { z } from 'zod';

// ---
// Image
// ---
export const ImageDTO = z.object({
  gid: z.string(),
  id: z.string(),
  url: z.string().url(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

// ---
// Variant
// ---
export const VariantDTO = z.object({
  gid: z.string(),
  id: z.string(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  title: z.string().optional(),
  position: z.number().int().optional(),
  price: z.preprocess((val) => {
    if (val == null) return 0; // handle undefined/null
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return val;
  }, z.number()),
  priceUsd: z.number().optional(),
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  imageId: z.string().optional(),
  imageUrl: z.string().url().optional(),
  inventoryQuantity: z.number().int().optional(),
  inventoryItemId: z.string().optional(),
  inventorySku: z.string().optional(),

  // color enrichment (filled by transforms)
  color_base: z.string().optional(),
  color_label: z.string().optional(),
  color_hex: z.string().optional(),
  lab_l: z.number().optional(),
  lab_a: z.number().optional(),
  lab_b: z.number().optional(),
  hue: z.number().optional(),
  color_source: z.enum(['METAFIELD', 'FALLBACK', 'NONE']).optional(),
  color_version: z.number().int().optional(),
});

// ---
// Category
// ---
export const CategoryDTO = z.object({
  gid: z.string(),
  id: z.string(),
  name: z.string(),
  fullName: z.string().optional(),
});

// ---
// Product
// ---
export const ProductDTO = z.object({
  gid: z.string(),
  id: z.string(),
  handle: z.string().optional(),
  title: z.string().optional(),
  vendor: z.string().optional(),
  status: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()),
  descriptionHtml: z.string().optional(),
  featuredImage: ImageDTO.optional(),
  options: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: z.number().int(),
      values: z.array(z.string()),
    }),
  ),
  images: z.array(ImageDTO),
  variants: z.array(VariantDTO),
  colorBases: z.array(z.string()).optional().default([]),
  collectionHandles: z.array(z.string()).optional().default([]),
  // Category (if present in Shopify)
  category: CategoryDTO.optional(),
});

export type TProductDTO = z.infer<typeof ProductDTO>;

// ---
// Event wrapper
// ---
export const ProductUpsertEvent = z.object({
  kind: z.literal('upsert'),
  shop: z.string(), // myshopify domain
  topic: z.string(), // e.g. "products/bulk"
  product: ProductDTO,
});

export type TProductUpsertEvent = z.infer<typeof ProductUpsertEvent>;
