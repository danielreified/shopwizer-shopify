import 'dotenv/config';
import {
  pollSQS,
  createHealthServer,
  setupGracefulShutdown,
  parseAndUnwrap,
} from '@repo/event-toolkit';
import { routeJob } from './routers/job.router';
import { logger } from '@repo/logger';

import { INFRA_CONFIG } from './config/service.config';

const controller = new AbortController();
const server = createHealthServer(INFRA_CONFIG.HEALTH_PORT);

const JOB_QUEUE_URL = process.env.JOB_QUEUE_URL;
if (!JOB_QUEUE_URL) throw new Error('❌ Missing env: JOB_QUEUE_URL');

setupGracefulShutdown(async () => {
  logger.info('Shutting down gracefully...');
  controller.abort();
  server.close();
});

logger.info({ queue: JOB_QUEUE_URL, port: INFRA_CONFIG.HEALTH_PORT }, '🚀 Job worker started');

type JobPayload = {
  jobId?: string;
  shopId?: string;
  type: string;
};

pollSQS(
  [
    {
      url: JOB_QUEUE_URL,
      handler: async (msg) => {
        // parseAndUnwrap handles both EventBridge and direct messages
        const job = parseAndUnwrap<JobPayload>(msg.Body);

        if (!job) {
          logger.error('Failed to parse message body');
          return;
        }

        await routeJob(job);
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
