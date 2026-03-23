import { generateEmbedding } from './enrich.embedding';
import { prisma } from '../db/prisma';
import { makeDebug } from '../utils/debug';

const log = makeDebug('enrich:vendor');

/**
 * Normalize vendor name to Title Case
 * " UNDER ARMOUR " → "Under Armour"
 * "nike" → "Nike"
 */
function normalizeVendorName(vendor: string): string {
  return vendor
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get or create a vendor embedding.
 * Uses global VendorEmbedding table - one embedding per normalized vendor name.
 * Returns the vendor embedding vector, or null if generation fails.
 */
export async function getOrCreateVendorEmbedding(
  vendorRaw: string | null | undefined,
): Promise<{ vendorNormalized: string; vector: number[] } | null> {
  if (!vendorRaw?.trim()) {
    return null;
  }

  const vendorNormalized = normalizeVendorName(vendorRaw);

  try {
    // 1. Check if embedding already exists
    const existing = await prisma.$queryRaw<{ vector_text: string }[]>`
      SELECT "vector"::text AS vector_text
      FROM "VendorEmbedding"
      WHERE "vendorNormalized" = ${vendorNormalized}
      LIMIT 1
    `;

    if (existing.length > 0 && existing[0].vector_text) {
      // Parse existing vector
      const vectorStr = existing[0].vector_text;
      const vector = vectorStr
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);

      log.info(`✅ Reusing existing vendor embedding for: ${vendorNormalized}`);
      return { vendorNormalized, vector };
    }

    // 2. Generate new embedding
    log.info(`🆕 Creating new vendor embedding for: ${vendorNormalized}`);
    const vector = await generateEmbedding(vendorNormalized);
    const vecLiteral = `[${vector.join(',')}]`;

    // 3. Insert new embedding (upsert to handle race conditions)
    const id = `vend_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "VendorEmbedding"
        ("id", "vendorNormalized", "vendorOriginal", "vector", "createdAt", "updatedAt")
      VALUES
        ('${id}', '${vendorNormalized.replace(/'/g, "''")}', '${vendorRaw.replace(/'/g, "''")}', '${vecLiteral}'::vector, NOW(), NOW())
      ON CONFLICT ("vendorNormalized") DO NOTHING
    `);

    log.info(`✅ Created vendor embedding for: ${vendorNormalized}`);
    return { vendorNormalized, vector };
  } catch (err: any) {
    log.error('❌ Failed to get/create vendor embedding', {
      vendor: vendorRaw,
      error: err.message,
    });
    return null;
  }
}
