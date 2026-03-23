import 'dotenv/config';
import {
  pollSQS,
  createHealthServer,
  setupGracefulShutdown,
  parseJsonSafe,
} from '@repo/event-toolkit';
import { handlePxLogEvent } from './handlers/px-log.sqs';
import { logger } from '@repo/logger';

import { INFRA_CONFIG } from './config/service.config';

const controller = new AbortController();
const server = createHealthServer(INFRA_CONFIG.HEALTH_PORT);

const PX_QUEUE_URL = process.env.PX_QUEUE_URL;
if (!PX_QUEUE_URL) throw new Error('❌ Missing required env: PX_QUEUE_URL');

setupGracefulShutdown(async () => {
  logger.info('Shutting down gracefully...');
  controller.abort();
  server.close();
});

logger.info({ queue: PX_QUEUE_URL, port: INFRA_CONFIG.HEALTH_PORT }, '🚀 Pixel worker started');

pollSQS(
  [
    {
      url: PX_QUEUE_URL,
      handler: async (msg) => {
        try {
          const body = parseJsonSafe(msg.Body) as any;
          if (!body?.Records?.length) {
            logger.warn({ messageId: msg.MessageId }, 'Skipping invalid SQS message');
            return;
          }

          // Only process one record per message
          const record = body.Records[0];
          const bucket = record.s3?.bucket?.name;
          const key = record.s3?.object?.key;

          if (!bucket || !key) {
            logger.warn({ record }, 'Missing bucket or key in record');
            return;
          }

          logger.info({ bucket, key }, 'Received S3 event');
          await handlePxLogEvent({ bucket, key });
          logger.info({ bucket, key }, 'Finished processing');
        } catch (err) {
          logger.error(
            {
              error: err as Error,
              messageId: msg.MessageId,
            },
            'Error handling SQS message',
          );
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
