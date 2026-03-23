// src/repositories/embed.repository.ts
import { prisma } from '../db/prisma';
import { createSha256 } from '../utils/crypto';

export type UpsertEmbeddingInput = {
  shopId: string;
  productId: bigint | number | string;
  version?: number;
  textHash: string;
  sourceText?: string | null;
  vector: number[];
};

function toBigIntId(v: bigint | number | string) {
  try {
    return typeof v === 'bigint' ? v : BigInt(v);
  } catch {
    throw new Error(`[upsertProductEmbedding] Bad productId: ${String(v)}`);
  }
}

function genId(prefix = 'emb') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// PRODUCT EMBEDDING (vector)
// ---------------------------------------------------------------------------
export async function upsertProductEmbedding({
  shopId,
  productId,
  version = 1,
  textHash,
  sourceText = null,
  vector,
}: UpsertEmbeddingInput) {
  const pid = toBigIntId(productId);
  const id = genId('emb');
  const vecLiteral = `[${vector.join(',')}]`;

  const rows = await prisma.$executeRaw`
    INSERT INTO "ProductEmbedding"
      ("id", "productId", "shopId", "version", "textHash", "sourceText", "vector", "createdAt", "updatedAt")
    VALUES
      (
        ${id},
        ${pid},
        ${shopId},
        ${version},
        ${textHash},
        ${sourceText},
        ${vecLiteral}::vector,
        NOW(),
        NOW()
      )
    ON CONFLICT ("productId") DO UPDATE
      SET "shopId"    = EXCLUDED."shopId",
          "version"   = EXCLUDED."version",
          "textHash"  = EXCLUDED."textHash",
          "sourceText"= EXCLUDED."sourceText",
          "vector"    = EXCLUDED."vector",
          "updatedAt" = NOW()
  `;

  const verify: Array<{
    id: string;
    productId: string;
    shopId: string;
    version: number;
    textHash: string;
    updatedAt: Date;
  }> = await prisma.$queryRaw`
    SELECT "id", "productId"::text, "shopId", "version", "textHash", "updatedAt"
    FROM "ProductEmbedding"
    WHERE "productId" = ${pid}
    LIMIT 1
  `;

  return { ok: true, productId: pid.toString(), verified: !!verify[0] };
}

// ---------------------------------------------------------------------------
// PRODUCT ATTRIBUTES EMBEDDING (vector + counts)
// ---------------------------------------------------------------------------

export type UpsertAttributesEmbeddingInput = {
  shopId: string;
  productId: bigint | number | string;
  version?: number; // default 1
  textHash?: string;
  sourceText?: string | null;
  vector: number[];
  categoryCount: number;
  valueCount: number;
};

export async function upsertProductAttributesEmbedding({
  shopId,
  productId,
  version = 1,
  textHash,
  sourceText,
  vector,
  categoryCount,
  valueCount,
}: UpsertAttributesEmbeddingInput) {
  const pid = toBigIntId(productId);
  const id = genId('attr');
  const vecLiteral = `[${vector.join(',')}]`;

  const finalText = sourceText ?? '';
  const finalHash = textHash ?? createSha256(finalText);

  const rows = await prisma.$executeRaw`
    INSERT INTO "ProductAttributesEmbedding"
      ("id", "productId", "shopId", "version", "textHash", "sourceText", "vector", "categoryCount", "valueCount", "createdAt", "updatedAt")
    VALUES
      (
        ${id},
        ${pid},
        ${shopId},
        ${version},
        ${finalHash},
        ${finalText || null},
        ${vecLiteral}::vector,
        ${categoryCount},
        ${valueCount},
        NOW(),
        NOW()
      )
    ON CONFLICT ("productId") DO UPDATE
      SET "shopId"       = EXCLUDED."shopId",
          "version"      = EXCLUDED."version",
          "textHash"     = EXCLUDED."textHash",
          "sourceText"   = EXCLUDED."sourceText",
          "vector"       = EXCLUDED."vector",
          "categoryCount"= EXCLUDED."categoryCount",
          "valueCount"   = EXCLUDED."valueCount",
          "updatedAt"    = NOW()
  `;

  const verify: Array<{
    id: string;
    productId: string;
    shopId: string;
    version: number;
    textHash: string;
    categoryCount: number;
    valueCount: number;
    updatedAt: Date;
  }> = await prisma.$queryRaw`
    SELECT
      "id",
      "productId"::text,
      "shopId",
      "version",
      "textHash",
      "categoryCount",
      "valueCount",
      "updatedAt"
    FROM "ProductAttributesEmbedding"
    WHERE "productId" = ${pid}
    LIMIT 1
  `;

  return { ok: true, productId: pid.toString(), verified: !!verify[0] };
}
