// src/steps/category-label.step.ts
import { generateCategoryLabel } from '../services/enrich.llm-generate';
import type { Step, StepContext } from './types';
import { hasKeysChanged } from './types';
import { logger } from '@repo/logger';
import { stripHtml, filterUsefulTags } from '../utils/text';

/**
 * Generates a category label from product signals using LLM.
 * The LLM is instructed to distinguish product type words from brand/model names.
 */
export const categoryLabelStep: Step<string> = {
  name: 'categoryLabel',
  keys: ['title', 'productType', 'descriptionHtml', 'tags', 'collections', 'vendor'],

  shouldRun(ctx: StepContext): boolean {
    return hasKeysChanged(this.keys, ctx.inputHashes, ctx.prevHashes);
  },

  async execute(ctx: StepContext): Promise<string> {
    const cleanDescription = stripHtml(ctx.data.descriptionHtml ?? '');
    const usefulTags = filterUsefulTags(ctx.data.tags ?? []);

    // Pass ALL signals - let the LLM prioritize based on prompt instructions
    const signals: Record<string, unknown> = {
      title: ctx.data.title,
    };

    // Include all available signals (LLM will prioritize)
    if (ctx.data.productType) {
      signals.productType = ctx.data.productType;
    }
    if (ctx.data.collections?.length) {
      signals.collections = ctx.data.collections.slice(0, 5);
    }
    if (usefulTags.length > 0) {
      signals.tags = usefulTags;
    }
    if (cleanDescription && cleanDescription.length > 20) {
      signals.description = cleanDescription.slice(0, 300);
    }
    if (ctx.data.vendor) {
      signals.vendor = ctx.data.vendor;
    }

    try {
      const label = await generateCategoryLabel(signals as any);
      return label;
    } catch (err) {
      return 'unknown > unknown';
    }
  },
};
