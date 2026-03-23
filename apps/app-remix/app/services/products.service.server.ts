import prisma from "../db.server";

export type ProductsTableRow = {
  id: string;
  title: string;
  handle?: string | null;
  vendor?: string | null;
  status: string;
  productType?: string | null;
  thumbnailUrl?: string;
  variantsCount: number;
  priceMin?: number | null;
  priceMax?: number | null;
  inventoryTotal?: number | null;
  colorBases: string[];
  gender: string[];
  ageBuckets: string[];
  updatedAt: string;
  hasEmbedding?: boolean;

  attributesCategoryCount: number;
  attributesValueCount: number;

  categoryCount?: number | null;
  valueCount?: number | null;

  enabled: boolean;
  pipelineState: string;

  category?: any;
};

export async function listProductsTable(opts: {
  shopId: string;
  q?: string;
  status?: ("ACTIVE" | "DRAFT" | "ARCHIVED")[];
  colors?: string[];
  take?: number;
  skip?: number;
}) {
  const { shopId, q, take = 10, skip = 0 } = opts;

  // Build search filter
  const searchFilter = q
    ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { vendor: { contains: q, mode: "insensitive" as const } },
        { productType: { contains: q, mode: "insensitive" as const } },
        { handle: { contains: q, mode: "insensitive" as const } },
      ],
    }
    : {};

  const where = { shopId, ...searchFilter };

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take,
    skip,
    include: {
      category: true,
      attributesEmbeddings: true,
      _count: { select: { variants: true } },
      images: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { url: true },
      },
      variants: {
        select: { price: true, inventoryQuantity: true },
      },
    },
  });

  const rows: ProductsTableRow[] = products.map((p) => {
    const prices = p.variants
      .map((v) => (v.price ? Number(v.price) : null))
      .filter((x): x is number => x !== null);

    return {
      id: p.id.toString(),
      title: p.title,
      handle: p.handle,
      vendor: p.vendor ?? undefined,
      status: p.status,
      productType: p.productType ?? undefined,
      thumbnailUrl: p.images[0]?.url,
      variantsCount: p._count.variants,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      colorBases: [],
      gender: p.gender,
      ageBuckets: p.ageBucket,
      updatedAt: p.updatedAt.toISOString(),
      hasEmbedding: false,
      category: p.category,
      attributesCategoryCount: p.attributesEmbeddings?.categoryCount ?? 0,
      attributesValueCount: p.attributesEmbeddings?.valueCount ?? 0,
      enabled: p.enabled,
      pipelineState: p.pipelineState,
    };
  });

  const total = await prisma.product.count({ where });

  return { rows, total };
}

export async function getDistinctTags(shopId: string): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { shopId },
    select: { tags: true },
  });

  const tags = new Set<string>();
  products.forEach((p) => {
    p.tags.forEach((t) => tags.add(t));
  });

  return Array.from(tags).sort();
}
