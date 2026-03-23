// src/steps/attributes-embedding.step.ts
import { runAttributesEmbedding } from '../services/enrich.attributes';
import type { Step, StepContext } from './types';
import { getStepResult } from './types';
import type { CategoryMatchResult } from './category-match.step';
import { logger } from '@repo/logger';

/**
 * Generates attribute embeddings for the product
 * Always runs (empty keys = always run) to catch metafield changes
 */
export const attributesEmbeddingStep: Step<unknown> = {
  name: 'attributesEmbedding',
  keys: [], // Empty = always run

  shouldRun(): boolean {
    // Always run - metafields can change independently
    return true;
  },

  async execute(ctx: StepContext): Promise<unknown> {
    // Get categoryId from categoryMatch result or input data
    const categoryMatch = getStepResult<CategoryMatchResult>(ctx, 'categoryMatch');
    const categoryId = categoryMatch?.id ?? ctx.data.category?.id ?? null;

    const result = await runAttributesEmbedding({
      shop: ctx.shop,
      productId: ctx.productId,
      categoryId,
      title: ctx.data.title,
      descriptionHtml: ctx.data.descriptionHtml,
    });

    logger.debug({ productId: ctx.productId }, 'attributesEmbedding completed');
    return result;
  },
};
