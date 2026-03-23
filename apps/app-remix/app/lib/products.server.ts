// app/lib/products.server.ts
import prisma from "../db.server";
import { makeProductRepo } from "../repositories/products.repo.server";

// --- JSON-safe DTOs (no BigInt/Decimal) ---
export type ProductDetailDTO = {
  id: string;
  shopId: string;
  shopifyGid: string;
  handle: string | null;
  title: string;
  vendor: string | null;
  productType: string | null;
  descriptionHtml: string | null;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  colorBases: string[];
  gender: string[];
  genderSource: string | null;
  ageBucket: string[];
  ageSource: string | null;
  categorySource: "FIELD" | "AUTO" | "NONE" | null;
  enabled: boolean;
  merchandisingBasket: string | null;

  attributesEmbeddings: any;

  category?: {
    id: string;
    name: string;
    fullName: string;
    topLevel: string | null;
    hasAgeGroup: boolean;
    hasTargetGender: boolean;
    hasColor: boolean;
  };

  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
    position: number | null;
  }>;

  variants: Array<{
    id: string;
    title: string | null;
    price: string | null;
    compareAtPrice: string | null;
    sku: string | null;
    position: number | null;
    color_base: string | null;
    color_label: string | null;
    color_hex: string | null;
  }>;
};

const toDTO = (p: any): ProductDetailDTO => ({
  id: p.id.toString(),
  shopId: p.shopId,
  shopifyGid: p.shopifyGid,
  handle: p.handle,
  title: p.title,
  vendor: p.vendor,
  productType: p.productType,
  descriptionHtml: p.descriptionHtml,
  status: p.status,
  colorBases: p.colorBases ?? [],
  gender: p.gender ?? [],
  genderSource: p.genderSource ?? null,
  ageBucket: p.ageBucket ?? [],
  ageSource: p.ageSource ?? null,
  categorySource: p.categorySource ?? null,
  enabled: p.enabled ?? true,
  merchandisingBasket: p.merchandisingBasket ?? null,
  attributesEmbeddings: p.attributesEmbeddings
    ? {
      categoryCount: p.attributesEmbeddings.categoryCount ?? 0,
      valuesCount: p.attributesEmbeddings.valueCount ?? 0,
    }
    : null,
  category: p.category
    ? {
      id: p.category.id,
      name: p.category.name,
      fullName: p.category.fullName,
      topLevel: p.category.topLevel,
      hasAgeGroup: p.category.hasAgeGroup,
      hasTargetGender: p.category.hasTargetGender,
      hasColor: p.category.hasColor
    }
    : undefined,
  images: (p.images ?? []).map((img: any) => ({
    id: img.id.toString(),
    url: img.url,
    altText: img.altText,
    width: img.width,
    height: img.height,
    position: img.position,
  })),
  variants: (p.variants ?? []).map((v: any) => ({
    id: v.id.toString(),
    title: v.title,
    price: v.price ? v.price.toString() : null,
    compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toString() : null,
    sku: v.sku ?? null,
    position: typeof v.position === "number" ? v.position : null,
    color_base: v.color_base ?? null,
    color_label: v.color_label ?? null,
    color_hex: v.color_hex ?? null,
  })),
});


/**
 * Thin domain layer: calls the repo and normalizes to JSON-safe DTO.
 * Keeps loaders/components clean and consistent.
 */
export async function getProductById(
  shopId: string,
  productId: string | number | bigint,
): Promise<ProductDetailDTO | null> {
  const repo = makeProductRepo(prisma);
  const product = await repo.findByIdForShop(shopId, productId);
  return product ? toDTO(product) : null;
}
