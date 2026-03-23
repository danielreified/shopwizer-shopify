// src/steps/category-match.step.ts
import { findCategoryMatch, ProductSignalsForCategory } from '../services/enrich.category';
import { prisma } from '../db/prisma';
import type { Step, StepContext } from './types';
import { hasKeysChanged } from './types';
import { logger } from '@repo/logger';
import { stripHtml, filterUsefulTags } from '../utils/text';

export interface CategoryMatchResult {
  id: string;
  fullName?: string;
  distance?: number;
  confidence: string;
  hasTargetGender: boolean;
  hasAgeGroup: boolean;
}

/**
 * Matches product to a category via:
 * 1. Vector similarity search for top 8 candidates
 * 2. LLM validation to pick the best match
 */
export const categoryMatchStep: Step<CategoryMatchResult | null> = {
  name: 'categoryMatch',
  keys: ['title', 'productType', 'descriptionHtml', 'tags', 'collections', 'vendor'],

  shouldRun(ctx: StepContext): boolean {
    return hasKeysChanged(this.keys, ctx.inputHashes, ctx.prevHashes);
  },

  async execute(ctx: StepContext): Promise<CategoryMatchResult | null> {
    const incomingCategoryId = ctx.data.category?.id ?? null;

    const cleanDescription = stripHtml(ctx.data.descriptionHtml ?? '');
    const usefulTags = filterUsefulTags(ctx.data.tags ?? []);

    const productSignals: ProductSignalsForCategory = {
      title: ctx.data.title,
      productType: ctx.data.productType || undefined,
      vendor: ctx.data.vendor || undefined,
      tags: usefulTags.length > 0 ? usefulTags : undefined,
      collections: ctx.data.collections?.slice(0, 5),
      description: cleanDescription || undefined,
    };

    // Two-stage matching: vector search + LLM validation
    const match = await findCategoryMatch(
      ctx.shop,
      ctx.productId,
      productSignals,
      incomingCategoryId,
    );

    // Check existing category for fallback
    const existing = await prisma.product.findUnique({
      where: { id: BigInt(ctx.productId) },
      select: { categoryId: true },
    });

    const noMatch = !match;

    if (noMatch && existing?.categoryId) {
      logger.debug({ productId: ctx.productId }, 'categoryMatch: keeping existing category');
      return {
        id: existing.categoryId.toString(),
        confidence: 'existing',
        hasTargetGender: false,
        hasAgeGroup: false,
      };
    }

    if (match?.id) {
      // Find the best bundling depth (Depth 3)
      // If the match is deeper (e.g. Depth 4), we roll up to Depth 3.
      // If the match is shallower (e.g. Depth 2), we keep it.
      const category = await prisma.category.findUnique({
        where: { id: match.id },
        select: { pathIds: true, depth: true, id: true },
      });

      let finalCategoryId = match.id;

      if (category && category.pathIds && category.pathIds.length > 0) {
        // pathIds[0] = Depth 0 (Root)
        // pathIds[1] = Depth 1
        // pathIds[2] = Depth 2
        // pathIds[3] = Depth 3 (Target)

        // If we are deeper than depth 3, roll up to depth 3
        if (category.depth > 3 && category.pathIds.length > 3) {
          finalCategoryId = category.pathIds[3];
          logger.debug(
            { productId: ctx.productId, fromDepth: category.depth, toDepth: 3, finalCategoryId },
            'Rolling up category depth',
          );
        }
      }

      // Update product with new category
      await prisma.product.update({
        where: { id: BigInt(ctx.productId) },
        data: { categoryId: finalCategoryId },
      });

      // Backfill to order line items
      await prisma.orderLineItem.updateMany({
        where: { productId: BigInt(ctx.productId) },
        data: { categoryId: finalCategoryId },
      });

      logger.debug(
        { productId: ctx.productId, finalCategoryId },
        'Backfilled categoryId to order line items',
      );

      // Return the updated match object with the final category ID
      return {
        ...match,
        id: finalCategoryId,
      };
    }

    logger.debug({ productId: ctx.productId, matchId: match?.id }, 'categoryMatch completed');
    return match;
  },
};
