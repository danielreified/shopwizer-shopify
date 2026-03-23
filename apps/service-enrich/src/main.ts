import 'dotenv/config';
import { pollSQS, createHealthServer, setupGracefulShutdown } from '@repo/event-toolkit';
import { handleEnrichMessage } from './handlers/enrich.sqs';
import { logger } from '@repo/logger';

import { INFRA_CONFIG } from './config/service.config';

// Graceful shutdown control
const controller = new AbortController();

// Simple HTTP health endpoint (e.g. for ECS ALB target health checks)
const server = createHealthServer(INFRA_CONFIG.HEALTH_PORT);

// Validate environment
const ENRICH_PRODUCTS_QUEUE_URL = process.env.ENRICH_PRODUCTS_QUEUE_URL;
if (!ENRICH_PRODUCTS_QUEUE_URL)
  throw new Error('❌ Missing required env: ENRICH_PRODUCTS_QUEUE_URL');

// Hook graceful shutdown
setupGracefulShutdown(async () => {
  logger.info('Shutting down gracefully...');
  controller.abort();
  server.close();
});

// Begin polling from SQS
pollSQS(
  [
    {
      url: ENRICH_PRODUCTS_QUEUE_URL,
      handler: async (msg) => {
        try {
          await handleEnrichMessage(msg.Body!);
        } catch (err) {
          logger.error({ error: err }, 'Message processing failed');
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

logger.info(
  {
    queue: ENRICH_PRODUCTS_QUEUE_URL,
    port: INFRA_CONFIG.HEALTH_PORT,
  },
  '🚀 service-enrich started',
);
