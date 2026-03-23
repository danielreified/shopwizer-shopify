// src/steps/vendor-embedding.step.ts
import { getOrCreateVendorEmbedding } from '../services/enrich.vendor';
import { prisma } from '../db/prisma';
import type { Step, StepContext } from './types';
import { hasKeysChanged } from './types';
import { logger } from '@repo/logger';

/**
 * Generates vendor embedding for the product (or reuses existing)
 * Uses global VendorEmbedding table - one embedding per normalized vendor name
 * Also saves vendorNormalized to Product for fast JOINs at inference time
 */
export const vendorEmbeddingStep: Step<{ vendorNormalized: string; vector: number[] } | null> = {
  name: 'vendorEmbedding',
  keys: ['vendor'],

  shouldRun(ctx: StepContext): boolean {
    // Only run if vendor changed
    return hasKeysChanged(this.keys, ctx.inputHashes, ctx.prevHashes);
  },

  async execute(ctx: StepContext): Promise<{ vendorNormalized: string; vector: number[] } | null> {
    const vendor = ctx.data.vendor;
    if (!vendor?.trim()) {
      logger.debug({ productId: ctx.productId }, 'vendorEmbedding skipped (no vendor)');
      // Clear vendorNormalized if vendor is empty
      await prisma.product.update({
        where: { id: BigInt(ctx.productId) },
        data: { vendorNormalized: null },
      });
      return null;
    }

    // Get or create global vendor embedding (reuses existing if found)
    const result = await getOrCreateVendorEmbedding(vendor);

    if (result) {
      // Save vendorNormalized to Product for fast JOINs at inference
      await prisma.product.update({
        where: { id: BigInt(ctx.productId) },
        data: { vendorNormalized: result.vendorNormalized },
      });
    }

    logger.debug(
      { productId: ctx.productId, vendorNormalized: result?.vendorNormalized },
      'vendorEmbedding completed',
    );
    return result;
  },
};
