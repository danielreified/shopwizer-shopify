import { Prisma } from "@prisma/client";
import prisma from "../../../db.server";
import { parseVectorText } from "./vectors";

export interface ProductMetadata {
    id: bigint;
    title: string;
    handle: string;
    vendor: string | null;
    vendorNormalized: string | null;
    categoryId: string | null;
    categoryParentId: string | null;
    categoryTopLevel: string | null;
    categoryRootId: string | null;
    tags: string[];
    gender: string[];
    ageBucket: string[];
    priceUsd: number | null;
    merchandisingBasket: string | null;
    enabled: boolean;
}

export async function fetchProductMetadata(ids: bigint[]): Promise<Map<string, ProductMetadata>> {
    if (!ids.length) return new Map();

    const meta = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
            id: true,
            title: true,
            handle: true,
            vendor: true,
            vendorNormalized: true,
            categoryId: true,
            tags: true,
            gender: true,
            ageBucket: true,
            merchandisingBasket: true,
            enabled: true,
            category: {
                select: { id: true, parentId: true, topLevel: true, rootId: true },
            },
            variants: {
                take: 1,
                orderBy: [{ position: "asc" }, { id: "asc" }],
                select: { priceUsd: true },
            },
        },
    });

    return new Map(meta.map((m) => [
        m.id.toString(),
        {
            id: m.id,
            title: m.title,
            handle: m.handle ?? "",
            vendor: m.vendor,
            vendorNormalized: m.vendorNormalized,
            categoryId: m.category?.id ?? m.categoryId,
            categoryParentId: m.category?.parentId ?? null,
            categoryTopLevel: m.category?.topLevel ?? null,
            categoryRootId: m.category?.rootId ?? null,
            tags: m.tags ?? [],
            gender: m.gender ?? [],
            ageBucket: m.ageBucket ?? [],
            priceUsd: m.variants?.[0]?.priceUsd ? Number(m.variants[0].priceUsd) : null,
            merchandisingBasket: m.merchandisingBasket ?? null,
            enabled: m.enabled ?? true,
        },
    ]));
}

export async function fetchProductEmbeddings(
    ids: bigint[]
): Promise<{
    embedMap: Map<string, number[] | null>;
    attrMap: Map<string, number[] | null>;
    vendorEmbedMap: Map<string, number[] | null>;
}> {
    if (!ids.length) return { embedMap: new Map(), attrMap: new Map(), vendorEmbedMap: new Map() };

    // Fetch all embeddings in parallel
    const [embedRows, attrRows, vendorRows] = await Promise.all([
        // Product embeddings
        prisma.$queryRaw<{ productId: bigint; vector_text: string | null }[]>(Prisma.sql`
            SELECT e."productId", e."vector"::text AS vector_text
            FROM "ProductEmbedding" e
            WHERE e."productId" IN (${Prisma.join(ids)})
        `),
        // Attribute embeddings
        prisma.$queryRaw<{ productId: bigint; vector_text: string | null }[]>(Prisma.sql`
            SELECT ae."productId", ae."vector"::text AS vector_text
            FROM "ProductAttributesEmbedding" ae
            WHERE ae."productId" IN (${Prisma.join(ids)})
        `),
        // Vendor embeddings (JOIN via vendorNormalized)
        prisma.$queryRaw<{ productId: bigint; vector_text: string | null }[]>(Prisma.sql`
            SELECT p."id" AS "productId", ve."vector"::text AS vector_text
            FROM "Product" p
            LEFT JOIN "VendorEmbedding" ve ON ve."vendorNormalized" = p."vendorNormalized"
            WHERE p."id" IN (${Prisma.join(ids)})
        `),
    ]);

    return {
        embedMap: new Map(embedRows.map((r) => [r.productId.toString(), parseVectorText(r.vector_text)])),
        attrMap: new Map(attrRows.map((r) => [r.productId.toString(), parseVectorText(r.vector_text)])),
        vendorEmbedMap: new Map(vendorRows.map((r) => [r.productId.toString(), parseVectorText(r.vector_text)])),
    };
}

/**
 * Fetch vendor embeddings for a set of products.
 * Maps productId → vendor embedding vector.
 */
export async function fetchVendorEmbeddings(
    vendorNormalizedList: string[]
): Promise<Map<string, number[]>> {
    if (!vendorNormalizedList.length) return new Map();

    // Dedupe vendors
    const uniqueVendors = Array.from(new Set(vendorNormalizedList.filter(Boolean)));
    if (!uniqueVendors.length) return new Map();

    const rows = await prisma.$queryRaw<
        { vendorNormalized: string; vector_text: string }[]
    >(Prisma.sql`
    SELECT "vendorNormalized", "vector"::text AS vector_text
    FROM "VendorEmbedding"
    WHERE "vendorNormalized" IN (${Prisma.join(uniqueVendors)})
  `);

    return new Map(
        rows.map((r) => [r.vendorNormalized, parseVectorText(r.vector_text) ?? []])
    );
}
