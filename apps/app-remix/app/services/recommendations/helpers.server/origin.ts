import prisma from "../../../db.server";
import { parseVectorText } from "./vectors";

export interface OriginProduct {
    id: bigint;
    title: string;
    handle: string;
    categoryId: string | null;
    tags: string[];
    gender: string[];
    ageBucket: string[];
}

export async function loadOriginProduct(
    shop: string,
    productId: string
): Promise<OriginProduct | null> {
    const [row] = await prisma.$queryRaw<
        {
            id: bigint;
            title: string;
            handle: string;
            categoryId: string | null;
            tags: string[];
            gender: string[];
            ageBucket: string[];
        }[]
    >`
    SELECT p."id", p."title", p."handle", p."categoryId", p."tags", p."gender", p."ageBucket"
    FROM "Product" p
    JOIN "Shop" s ON s."id" = p."shopId"
    WHERE s."domain" = ${shop}
      AND p."id" = ${BigInt(productId)}
    LIMIT 1;
  `;

    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        categoryId: row.categoryId,
        tags: row.tags ?? [],
        gender: row.gender ?? [],
        ageBucket: row.ageBucket ?? [],
    };
}

export async function getOriginRootId(categoryId: string | null): Promise<string | null> {
    if (!categoryId) return null;

    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { rootId: true },
    });

    return category?.rootId ?? null;
}

export interface OriginWithEmbeddings extends OriginProduct {
    price: number | null;
    vendor: string | null;
    vendorNormalized: string | null;
    categoryTopLevel: string | null;
    embeddingVector: number[] | null;
    attrEmbedding: number[] | null;
}

export async function loadOriginWithEmbeddings(
    shop: string,
    productId: string
): Promise<OriginWithEmbeddings | null> {
    const [row] = await prisma.$queryRaw<
        {
            id: bigint;
            title: string;
            handle: string;
            price: number | null;
            vendor: string | null;
            vendorNormalized: string | null;
            categoryId: string | null;
            categoryTopLevel: string | null;
            tags: string[];
            gender: string[];
            ageBucket: string[];
            vector_text: string | null;
            attr_vector_text: string | null;
        }[]
    >`
    SELECT
      p."id", p."title", p."handle",
      (SELECT v."priceUsd" FROM "ProductVariant" v WHERE v."productId" = p."id" ORDER BY v."position" ASC, v."id" ASC LIMIT 1) AS price,
      p."vendor", p."vendorNormalized", p."categoryId",
      c."topLevel" AS "categoryTopLevel",
      p."tags", p."gender", p."ageBucket",
      e."vector"::text AS vector_text,
      ae."vector"::text AS attr_vector_text
    FROM "Product" p
    JOIN "Shop" s ON s."id" = p."shopId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    LEFT JOIN "ProductEmbedding" e ON e."productId" = p."id"
    LEFT JOIN "ProductAttributesEmbedding" ae ON ae."productId" = p."id"
    WHERE s."domain" = ${shop} AND p."id" = ${BigInt(productId)}
    LIMIT 1
  `;

    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        handle: row.handle,
        price: row.price,
        vendor: row.vendor,
        vendorNormalized: row.vendorNormalized,
        categoryId: row.categoryId,
        categoryTopLevel: row.categoryTopLevel,
        tags: row.tags ?? [],
        gender: row.gender ?? [],
        ageBucket: row.ageBucket ?? [],
        embeddingVector: parseVectorText(row.vector_text),
        attrEmbedding: parseVectorText(row.attr_vector_text),
    };
}
