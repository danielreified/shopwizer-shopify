import 'dotenv/config';
import { pollSQS, createHealthServer, setupGracefulShutdown } from '@repo/event-toolkit';
import { handleProductsMessage, handleProductsBulkMessage } from './handlers/products.sqs';
import { handleCheckoutsMessage } from './handlers/checkouts.sqs';
import { handleOrdersMessage } from './handlers/orders.sqs';
import { logger } from '@repo/logger';

// ---
// Configuration
// ---

interface QueueConfig {
  name: string;
  url: string;
  handler: (body: string) => Promise<void>;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

// ---
// Queue Definitions
// ---

const QUEUES: QueueConfig[] = [
  {
    name: 'products-bulk',
    url: getRequiredEnv('PRODUCTS_BULK_QUEUE_URL'),
    handler: handleProductsBulkMessage,
  },
  {
    name: 'products',
    url: getRequiredEnv('PRODUCTS_QUEUE_URL'),
    handler: handleProductsMessage,
  },
  {
    name: 'checkouts',
    url: getRequiredEnv('CHECKOUTS_QUEUE_URL'),
    handler: handleCheckoutsMessage,
  },
  {
    name: 'orders',
    url: getRequiredEnv('ORDERS_QUEUE_URL'),
    handler: handleOrdersMessage,
  },
];

// ---
// Bootstrap
// ---

import { INFRA_CONFIG } from './config/service.config';

const controller = new AbortController();
const server = createHealthServer(INFRA_CONFIG.HEALTH_PORT);

setupGracefulShutdown(async () => {
  logger.info('Shutting down gracefully...');
  controller.abort();
  server.close();
});

// ---
// Startup
// ---

logger.info(
  {
    queues: QUEUES.map((q) => ({ name: q.name, url: q.url })),
    port: INFRA_CONFIG.HEALTH_PORT,
  },
  'Shopify event poller started',
);

// ---
// SQS Polling
// ---

pollSQS(
  QUEUES.map((q) => ({
    url: q.url,
    handler: async (msg) => {
      logger.debug({ queue: q.name }, 'Processing SQS message');
      await q.handler(msg.Body!);
    },
  })),
  {
    signal: controller.signal,
    waitTimeSeconds: INFRA_CONFIG.SQS.WAIT_TIME_SECONDS,
    maxMessages: INFRA_CONFIG.SQS.MAX_MESSAGES,
    visibilityTimeout: INFRA_CONFIG.SQS.VISIBILITY_TIMEOUT,
  },
);
