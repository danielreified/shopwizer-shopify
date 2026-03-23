// src/services/enrich.category.ts
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '@repo/logger';
import { DB_CONFIG, ENRICH_LOGIC, PROMPTS } from '../config/service.config';
import { OPENAI_MODEL, rateLimitedResponses } from '../config/openai';
import { cleanLlmJson } from '../utils/text';

// Schema for LLM category selection
const CategorySelectionSchema = z.object({
  selected_id: z.string().describe('The ID of the selected category'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in this selection'),
  reasoning: z.string().describe('Brief explanation of why this category was chosen'),
});

type CategorySelectionResult = z.infer<typeof CategorySelectionSchema>;

export interface CategoryCandidate {
  id: string;
  fullName: string;
  distance: number;
}

export interface CategoryMatchResult {
  id: string;
  fullName: string;
  distance: number;
  confidence: string;
  hasTargetGender: boolean;
  hasAgeGroup: boolean;
}

export interface ProductSignalsForCategory {
  title: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  collections?: string[];
  description?: string;
}

/**
 * Two-stage category matching:
 * 1. Vector search for top X candidates
 * 2. LLM validation to pick the best match
 */
export async function findCategoryMatch(
  shop: string,
  productId: string,
  productSignals: ProductSignalsForCategory,
  incomingCategoryId?: string | null,
  options: { targetDepth?: number } = {},
): Promise<CategoryMatchResult | null> {
  try {
    const isIncomingValid =
      incomingCategoryId && incomingCategoryId !== 'na' && incomingCategoryId.trim() !== '';

    // ------------------------------------------------------
    // 0️⃣ Use incoming Shopify category if valid
    // ------------------------------------------------------
    if (isIncomingValid) {
      const category = await prisma.category.findUnique({
        where: { id: incomingCategoryId },
        select: {
          id: true,
          fullName: true,
          hasTargetGender: true,
          hasAgeGroup: true,
        },
      });

      if (!category) {
        logger.warn({ incomingCategoryId }, 'Incoming category ID not found in DB');
        return null;
      }

      return {
        id: category.id,
        fullName: category.fullName ?? '',
        distance: 0.0,
        confidence: 'incoming',
        hasTargetGender: category.hasTargetGender ?? false,
        hasAgeGroup: category.hasAgeGroup ?? false,
      };
    }

    // ------------------------------------------------------
    // 1️⃣ Get candidates via vector similarity
    // ------------------------------------------------------

    await prisma.$executeRawUnsafe(`SET enable_seqscan = ${DB_CONFIG.VECTOR_SEARCH.SEQ_SCAN}`);
    await prisma.$executeRawUnsafe(`SET ivfflat.probes = ${DB_CONFIG.VECTOR_SEARCH.PROBES}`);

    const leafCandidates = await prisma.$queryRawUnsafe<
      (CategoryCandidate & { pathIds: string[] })[]
    >(`
      WITH product_vec AS (
        SELECT pe.vector
        FROM "ProductEmbedding" pe
        WHERE pe."productId" = ${BigInt(productId)}
          AND pe.vector IS NOT NULL
        LIMIT 1
      )
      SELECT
        c.id,
        c."fullName",
        c."pathIds",
        (c.vector <=> pv.vector) AS distance
      FROM "Category" c
      CROSS JOIN product_vec pv
      WHERE c.vector IS NOT NULL
      ORDER BY c.vector <=> pv.vector
      LIMIT ${DB_CONFIG.VECTOR_SEARCH.LIMIT};
    `);

    if (!leafCandidates.length) {
      return null;
    }

    // ------------------------------------------------------
    // 1b. Expand with parent categories for generalization
    // ------------------------------------------------------
    const parentIds = new Set<string>();
    for (const c of leafCandidates) {
      if (c.pathIds && c.pathIds.length > 1) {
        for (let i = 0; i < c.pathIds.length - 1; i++) {
          parentIds.add(c.pathIds[i]);
        }
      }
    }

    // Fetch parent categories
    const parentCats =
      parentIds.size > 0
        ? await prisma.category.findMany({
            where: { id: { in: Array.from(parentIds) } },
            select: { id: true, fullName: true },
          })
        : [];

    // Combine: leaf candidates + parent categories (with distance=-1 to mark as "parent option")
    const allCandidates: CategoryCandidate[] = [
      ...leafCandidates.map((c) => ({ id: c.id, fullName: c.fullName, distance: c.distance })),
      ...parentCats.map((p) => ({ id: p.id, fullName: p.fullName ?? '', distance: -1 })),
    ];

    // Dedupe by id
    const uniqueCandidates = Array.from(new Map(allCandidates.map((c) => [c.id, c])).values());

    // ------------------------------------------------------
    // 2️⃣ LLM validation to pick the best match
    // ------------------------------------------------------
    const selected = await validateCategoryWithLLM(
      productSignals,
      uniqueCandidates,
      options.targetDepth,
    );

    if (!selected) {
      logger.debug('LLM validation returned no selection');
      return null;
    }

    // Find the selected candidate
    const winner = uniqueCandidates.find((c) => c.id === selected.selected_id);
    if (!winner) {
      logger.warn({ selectedId: selected.selected_id }, 'LLM selected ID not in candidates');
      return null;
    }

    // Fetch category flags
    const flags = await prisma.category.findUnique({
      where: { id: winner.id },
      select: {
        hasTargetGender: true,
        hasAgeGroup: true,
      },
    });

    return {
      id: winner.id,
      fullName: winner.fullName,
      distance: winner.distance,
      confidence: selected.confidence,
      hasTargetGender: flags?.hasTargetGender ?? false,
      hasAgeGroup: flags?.hasAgeGroup ?? false,
    };
  } catch (err) {
    logger.error({ err }, 'Failed to find category match');
    return null;
  }
}

/**
 * LLM validation step - picks the best category from candidates
 */
async function validateCategoryWithLLM(
  productSignals: ProductSignalsForCategory,
  candidates: CategoryCandidate[],
  targetDepth: number = ENRICH_LOGIC.CATEGORY.TARGET_DEPTH,
): Promise<CategorySelectionResult | null> {
  const systemPrompt = PROMPTS.CATEGORY_VALIDATION(targetDepth);

  const userContent = JSON.stringify(
    {
      product: productSignals,
      candidates: candidates.map((c) => ({
        id: c.id,
        category: c.fullName,
        similarity_score: (1 - (c.distance === -1 ? 0.5 : c.distance)).toFixed(4),
      })),
    },
    null,
    2,
  );

  try {
    const response = await rateLimitedResponses({
      model: OPENAI_MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const cleaned = cleanLlmJson(response.output_text || '');

    const parsed = CategorySelectionSchema.safeParse(JSON.parse(cleaned));

    if (!parsed.success) {
      logger.warn({ errors: parsed.error }, 'Category selection schema validation failed');
      return null;
    }

    return parsed.data;
  } catch (err) {
    logger.error({ err }, 'Category LLM validation error');
    return null;
  }
}
