import { z } from 'zod';
import { ProductUpsertEvent, type TProductUpsertEvent } from '../types/product';
import { loadCurrencyRates, convertToUsd } from '../utils/currency';
import { clean } from '../utils/strings';

/** helpers */
const gidToId = (gid?: string | null) => {
  if (!gid) return '';
  const m = gid.match(/\/(\d+)$/);
  return m ? m[1] : gid;
};

/** raw semi-product from bulk */
const ImageNode = z.object({
  id: z.string(),
  url: z.string().url(),
  altText: z.string().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});

const VariantNode = z.object({
  id: z.string(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  price: z.string().or(z.number()),
  position: z.number().int().optional().default(0),
  title: z.string().optional().default(''),
  product: z.object({ id: z.string() }).optional(),
  image: z
    .object({ id: z.string().optional(), url: z.string().url().optional() })
    .nullable()
    .optional(),
  selectedOptions: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional()
    .default([]),
  inventoryQuantity: z.number().int().nullable().optional(),
  inventoryItem: z
    .object({
      id: z.string().optional(),
      sku: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const OptionNode = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
  values: z.array(z.string()),
});

const ProductNode = z.object({
  id: z.string(),
  handle: z.string().optional().default(''),
  title: z.string().optional().default(''),
  vendor: z.string().optional(),
  status: z.string().optional().default('ACTIVE'),
  productType: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  descriptionHtml: z.string().optional().default(''),
  featuredImage: ImageNode.nullable().optional(),
  options: z.array(OptionNode).optional().default([]),
});

const SemiProduct = z.object({
  product: ProductNode,
  images: z.array(ImageNode).optional().default([]),
  variants: z.array(VariantNode).optional().default([]),
});

/** normalize one semi product */
export async function adaptBulk(
  semi: unknown,
  meta: { shop: string; topic?: string; currency?: string },
): Promise<TProductUpsertEvent> {
  const { product, images, variants } = SemiProduct.parse(semi);

  const rates = await loadCurrencyRates();

  const normImages = [
    ...(product.featuredImage
      ? [
          {
            gid: product.featuredImage.id,
            id: gidToId(product.featuredImage.id),
            url: product.featuredImage.url,
            alt: clean(product.featuredImage.altText),
            width: product.featuredImage.width ?? undefined,
            height: product.featuredImage.height ?? undefined,
          },
        ]
      : []),
    ...images.map((img) => ({
      gid: img.id,
      id: gidToId(img.id),
      url: img.url,
      alt: clean(img.altText),
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    })),
  ];

  const normVariants = variants.map((v) => {
    const price = typeof v.price === 'number' ? v.price : parseFloat(v.price);
    const priceUsd = convertToUsd(price, meta.currency, rates);

    return {
      gid: v.id,
      id: gidToId(v.id),
      sku: clean(v.sku ?? undefined),
      barcode: clean(v.barcode ?? undefined),
      title: clean(v.title),
      position: v.position ?? 0,
      price,
      priceUsd,
      selectedOptions: v.selectedOptions ?? [],
      imageId: v.image?.id ? gidToId(v.image.id) : undefined,
      imageUrl: v.image?.url || undefined,
      inventoryQuantity: v.inventoryQuantity ?? undefined,
      inventoryItemId: v.inventoryItem?.id ? gidToId(v.inventoryItem.id) : undefined,
      inventorySku: clean(v.inventoryItem?.sku ?? undefined),
    };
  });

  return ProductUpsertEvent.parse({
    kind: 'upsert',
    shop: meta.shop,
    topic: meta.topic ?? 'products/bulk',
    product: {
      gid: product.id,
      id: gidToId(product.id),
      handle: clean(product.handle),
      title: clean(product.title),
      vendor: clean(product.vendor),
      status: clean(product.status) ?? 'ACTIVE',
      productType: clean(product.productType),
      tags: (product.tags ?? []).map((t) => t.trim()).filter(Boolean),
      descriptionHtml: product.descriptionHtml ?? '',
      featuredImage: normImages[0],
      options: product.options ?? [],
      images: normImages,
      variants: normVariants,
    },
  });
}
