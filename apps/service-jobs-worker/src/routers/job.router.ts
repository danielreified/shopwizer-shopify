import { prisma } from '../db/prisma';
import { handleTrendingJob } from '../handlers/trending.handler';
import { handleBestSellerJob } from '../handlers/best-sellers.handler.sqs';
import { handleCurrencyJob } from '../handlers/currency.handler';
import {
  handleBundleGenerateJobV2,
  handleBundleGenerateJobV2Single,
} from '../handlers/bundles.generator.v2';
import { handleGraphWeightsJob } from '../handlers/graph.weights';
import { logger, timer } from '@repo/logger';

type JobMessage = {
  jobId?: string; // Optional - only present when triggered by scheduler
  shopId?: string; // Optional for global jobs like CURRENCY
  type: string;
  force?: boolean; // If true, skip any timing/duplicate checks and run immediately
  bundleId?: string;
};

export async function routeJob(job: JobMessage) {
  const { jobId, shopId, type, force } = job;
  const t = timer();

  logger.info(
    {
      type,
      shopId: shopId ?? '(global)',
      jobId: jobId ?? '(manual)',
      force: force ?? false,
    },
    'Job received',
  );

  try {
    switch (type) {
      // Per-shop jobs — require shopId
      case 'TRENDING':
        if (!shopId) throw new Error('TRENDING job requires shopId');
        await handleTrendingJob(shopId);
        break;

      case 'BEST_SELLER':
        if (!shopId) throw new Error('BEST_SELLER job requires shopId');
        await handleBestSellerJob(shopId);
        break;

      case 'GRAPH_WEIGHTS_DAILY':
        if (!shopId) throw new Error('GRAPH_WEIGHTS_DAILY job requires shopId');
        await handleGraphWeightsJob(shopId);
        break;

      // Global jobs — no shopId needed
      case 'CURRENCY':
        await handleCurrencyJob();
        break;

      // 🎁 Bundle Generation (Self-Optimizing Bundles)
      case 'BUNDLE_GENERATE': {
        const shops = shopId
          ? [{ id: shopId }]
          : await prisma.shop.findMany({ where: { isActive: true }, select: { id: true } });

        logger.info({ shopCount: shops.length }, 'Starting global BUNDLE_GENERATE');
        for (const shop of shops) {
          try {
            await handleBundleGenerateJobV2(shop.id);
          } catch (err) {
            logger.error({ shopId: shop.id, err }, 'Failed BUNDLE_GENERATE for shop');
          }
        }
        break;
      }

      case 'BUNDLE_GENERATE_SINGLE': {
        if (!shopId) throw new Error('BUNDLE_GENERATE_SINGLE job requires shopId');
        if (!job.bundleId) throw new Error('BUNDLE_GENERATE_SINGLE job requires bundleId');
        await handleBundleGenerateJobV2Single(shopId, job.bundleId);
        break;
      }

      default:
        logger.warn({ type }, 'Unknown job type - skipping');
        return;
    }

    // Only update job status if triggered by scheduler (has jobId)
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'SUCCESS' },
      });
    }

    t.done(`job.${type}`, `Job ${type} completed`, { data: { shopId, jobId } });
  } catch (err) {
    logger.error(
      {
        error: err instanceof Error ? err : new Error(String(err)),
        type,
        shopId,
        jobId,
      },
      `Job ${type} failed`,
    );

    // Only update job status if triggered by scheduler (has jobId)
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
    }
  }
}
