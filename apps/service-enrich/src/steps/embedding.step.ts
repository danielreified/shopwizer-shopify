// src/steps/embedding.step.ts
import { generateEmbedding } from '../services/enrich.embedding';
import { upsertProductEmbedding } from '../repositories/embed.repository';
import type { Step, StepContext } from './types';
import { hasKeysChanged, getStepResult } from './types';
import { logger } from '@repo/logger';

const VERSION = 2;

/**
 * Generates and stores product embedding based on category label
 */
export const embeddingStep: Step<unknown> = {
  name: 'embedding',
  keys: ['title', 'productType', 'descriptionHtml'],

  shouldRun(ctx: StepContext): boolean {
    // First check if our keys changed
    const keysChanged = hasKeysChanged(this.keys, ctx.inputHashes, ctx.prevHashes);

    // If keys didn't change, skip (categoryLabel would have also skipped)
    if (!keysChanged) {
      return false;
    }

    // Keys changed - we need a categoryLabel result to proceed
    // If categoryLabel also ran (keys changed), we'll have its result
    const label = getStepResult<string>(ctx, 'categoryLabel');
    if (!label) {
      return false;
    }

    return true;
  },

  async execute(ctx: StepContext): Promise<unknown> {
    const label = getStepResult<string>(ctx, 'categoryLabel');
    if (!label) return null;

    const vector = await generateEmbedding(label);

    const result = await upsertProductEmbedding({
      shopId: ctx.shop,
      productId: ctx.productId,
      version: VERSION,
      textHash: label,
      sourceText: label,
      vector,
    });

    logger.debug({ productId: ctx.productId }, 'embedding completed');
    return result;
  },
};
