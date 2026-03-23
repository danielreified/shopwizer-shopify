import 'dotenv/config';
import {
  pollSQS,
  createHealthServer,
  setupGracefulShutdown,
  parseJsonSafe,
} from '@repo/event-toolkit';
import { logger, timer } from '@repo/logger';

import { handleFeatureHourlyJob } from './handlers/feature.hourly.sqs';
import { handleFeatureValidateDailyJob } from './handlers/feature.daily.sqs';

// ⭐ RAIL METRIC JOBS
import { handleRailHourlyMetricsJob } from './handlers/rail.hourly.metrics.sqs';

// 🧠 GRAPH WEIGHT JOBS (Self-Optimizing Bundles)
import { handleGraphWeightsDailyJob } from './handlers/graph.weights.daily';
import { handleBundleMetricsHourlyJob } from './handlers/bundle.metrics.hourly.sqs';
import { handleCategoryGraphRebuild90d } from './handlers/category.graph.rebuild.90d';
import { handleProductGraphRebuild90d } from './handlers/product.graph.rebuild.90d';

import { INFRA_CONFIG } from './config/service.config';

// ------------------------------------------------------------------
// 1️⃣ Setup base infra
// ------------------------------------------------------------------
const controller = new AbortController();
const server = createHealthServer(INFRA_CONFIG.HEALTH_PORT);

const ANALYTICS_QUEUE_URL = process.env.ANALYTICS_QUEUE_URL;
if (!ANALYTICS_QUEUE_URL) throw new Error('❌ Missing required env: ANALYTICS_QUEUE_URL');

// Graceful shutdown for ECS
setupGracefulShutdown(async () => {
  logger.info('Shutting down gracefully...');
  controller.abort();
  server.close();
});

logger.info(
  { queue: ANALYTICS_QUEUE_URL, port: INFRA_CONFIG.HEALTH_PORT },
  '🚀 Analytics worker started',
);

// ------------------------------------------------------------------
// 2️⃣ Poll SQS for jobs
// ------------------------------------------------------------------
pollSQS(
  [
    {
      url: ANALYTICS_QUEUE_URL,
      handler: async (msg) => {
        const body = parseJsonSafe(msg.Body) as {
          job_type?: string;
          shop?: string;
        };

        const jobType = body?.job_type;
        const shop = body?.shop;

        if (!jobType) {
          logger.warn({ messageId: msg.MessageId }, 'Invalid message - missing job_type');
          return;
        }

        const t = timer();

        logger.info(
          {
            jobType,
            shop: shop ?? '(all shops)',
            messageId: msg.MessageId,
          },
          'Job received',
        );

        try {
          switch (jobType) {
            // -----------------------------------------
            // 📦 PRODUCT FEATURE JOBS
            // -----------------------------------------
            case 'FEATURE_HOURLY':
              await handleFeatureHourlyJob();
              break;

            case 'FEATURE_VALIDATE_DAILY':
              await handleFeatureValidateDailyJob();
              break;

            // -----------------------------------------
            // 🔥 RAIL METRIC JOBS
            // -----------------------------------------
            case 'RAIL_HOURLY':
              await handleRailHourlyMetricsJob();
              break;

            // -----------------------------------------
            // 🧠 GRAPH WEIGHT JOBS (Self-Optimizing Bundles)
            // -----------------------------------------
            case 'GRAPH_WEIGHTS_DAILY':
              await handleGraphWeightsDailyJob(shop);
              break;

            case 'BUNDLE_METRICS_HOURLY':
              await handleBundleMetricsHourlyJob();
              break;

            case 'CATEGORY_GRAPH_REBUILD_90D':
              await handleCategoryGraphRebuild90d(shop);
              break;

            case 'PRODUCT_GRAPH_REBUILD_90D':
              await handleProductGraphRebuild90d(shop);
              break;

            // -----------------------------------------
            // ❓ UNKNOWN JOB
            // -----------------------------------------
            default:
              logger.warn({ jobType }, 'Unknown job type - skipping');
              return;
          }

          t.done(`analytics.job.${jobType}`, `Job ${jobType} completed`, { data: { shop } });
        } catch (err: any) {
          logger.error({ error: err, jobType, shop }, `Job ${jobType} failed`);
        }
      },
    },
  ],
  {
    signal: controller.signal,
    waitTimeSeconds: INFRA_CONFIG.SQS.WAIT_TIME_SECONDS,
    maxMessages: INFRA_CONFIG.SQS.MAX_MESSAGES,
    visibilityTimeout: INFRA_CONFIG.SQS.VISIBILITY_TIMEOUT,
  },
);
