// src/services/product.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import type { TProductUpsertEvent, TProductDTO } from '../types/product';

// ---
// Helpers
// ---

const toBig = (v?: string | number | bigint | null) => (v == null ? undefined : BigInt(v as any));

type VariantDTO = TProductDTO['variants'][number];

function buildVariantData(v: VariantDTO, productId: bigint, imageId: bigint | undefined) {
  return {
    productId,
    shopifyGid: v.gid,
    sku: v.sku ?? null,
    barcode: v.barcode ?? null,
    position: v.position ?? null,
    title: v.title ?? null,
    price: new Prisma.Decimal(v.price ?? 0),
    priceUsd: v.priceUsd ? new Prisma.Decimal(v.priceUsd) : null,
    inventoryQuantity: v.inventoryQuantity ?? null,
    inventoryItemGid: v.inventoryItemId ? `gid://shopify/InventoryItem/${v.inventoryItemId}` : null,
    imageId: imageId ?? null,
    color_label: v.color_label ?? null,
    color_hex: v.color_hex ?? null,
    lab_l: v.lab_l ?? null,
    lab_a: v.lab_a ?? null,
    lab_b: v.lab_b ?? null,
    hue: v.hue ?? null,
    color_source: v.color_source ?? null,
    color_version: v.color_version ?? null,
  };
}

async function resolveVariantImageId(
  productId: bigint,
  imageIdStr?: string,
  imageUrl?: string,
): Promise<bigint | undefined> {
  const numeric = toBig(imageIdStr);
  if (numeric) return numeric;

  if (imageUrl) {
    const byUrl = await prisma.productImage.findFirst({
      where: { productId, url: imageUrl },
      select: { id: true },
    });
    if (byUrl) return byUrl.id;
  }

  return undefined;
}

// ---
// Product Upsert
// ---

export async function upsertNormalizedProduct(evt: TProductUpsertEvent) {
  const { shop: shopDomain, product } = evt;
  const pid = toBig(product.id);

  if (!pid) {
    throw new Error(`Invalid product id: ${product.id}`);
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Ensure Shop exists
    const shop = await tx.shop.upsert({
      where: { domain: shopDomain },
      update: {},
      create: { id: shopDomain, domain: shopDomain },
    });

    // 2. Upsert Product
    const upsertedProduct = await tx.product.upsert({
      where: { id: pid },
      create: {
        id: pid,
        shopId: shop.id,
        shopifyGid: product.gid,
        handle: product.handle ?? null,
        title: product.title ?? '',
        vendor: product.vendor ?? null,
        status: 'ACTIVE',
        productType: product.productType ?? null,
        tags: product.tags ?? [],
        descriptionHtml: product.descriptionHtml ?? null,
        collectionHandles: product.collectionHandles ?? [],
      },
      update: {
        shopId: shop.id,
        shopifyGid: product.gid,
        handle: product.handle ?? null,
        title: product.title ?? '',
        vendor: product.vendor ?? null,
        productType: product.productType ?? null,
        tags: product.tags ?? [],
        descriptionHtml: product.descriptionHtml ?? null,
        collectionHandles: product.collectionHandles ?? [],
      },
    });

    // 3. Upsert Images
    for (const [idx, img] of (product.images ?? []).entries()) {
      const iid = toBig(img.id);
      if (!iid) continue;

      await tx.productImage.upsert({
        where: { id: iid },
        create: {
          id: iid,
          productId: upsertedProduct.id,
          shopifyGid: img.gid,
          url: img.url,
          altText: img.alt ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          position: idx + 1,
        },
        update: {
          productId: upsertedProduct.id,
          shopifyGid: img.gid,
          url: img.url,
          altText: img.alt ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
          position: idx + 1,
        },
      });
    }

    // 4. Upsert Variants (with color enrichment)
    for (const v of product.variants ?? []) {
      const vid = toBig(v.id);
      if (!vid) continue;

      const imageId = await resolveVariantImageId(upsertedProduct.id, v.imageId, v.imageUrl);

      const variantData = buildVariantData(v, upsertedProduct.id, imageId);

      await tx.productVariant.upsert({
        where: { id: vid },
        create: { id: vid, compareAtPrice: null, ...variantData },
        update: variantData,
      });
    }

    return {
      shop: upsertedProduct.shopId,
      productGid: upsertedProduct.shopifyGid,
      productId: upsertedProduct.id.toString(),
    };
  });
}
