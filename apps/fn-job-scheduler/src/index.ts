import { PrismaClient } from '@prisma/client';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { logger, timer } from '@repo/logger';

import { INFRA_CONFIG, RUNTIME_CONFIG } from './config/service.config';

// Globals to persist across warm invocations
let prisma: PrismaClient;
let sqs_client: SQSClient;

// Helper to get SQS client
function getSqs() {
  if (!sqs_client) {
    sqs_client = new SQSClient({ region: INFRA_CONFIG.AWS_REGION });
  }
  return sqs_client;
}

// Helper to get Prisma client (lazy init for Lambda warm starts)
function getPrisma() {
  if (!prisma) {
    logger.debug({}, '[job-scheduler] Connecting to database...');
    prisma = new PrismaClient({
      datasources: {
        db: { url: INFRA_CONFIG.DATABASE.URL },
      },
    });
  }
  return prisma;
}

export const handler = async () => {
  const now = new Date();
  const t = timer();
  const db = getPrisma();
  const sqs = getSqs();

  try {
    const dueJobs = await db.job.findMany({
      where: {
        enabled: true,
        nextRun: { lte: now },
      },
    });

    if (dueJobs.length === 0) {
      logger.info({}, '[job-scheduler] No due jobs at this time');
      return { ok: true, message: 'no-due-jobs', count: 0 };
    }

    logger.info({ count: dueJobs.length }, '[job-scheduler] Found due jobs');

    for (const job of dueJobs) {
      const nextRun = new Date(now.getTime() + job.scheduleInterval * 60_000);

      await db.job.update({
        where: { id: job.id },
        data: { status: 'RUNNING', lastRun: now, nextRun },
      });

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: INFRA_CONFIG.SQS.JOB_QUEUE_URL,
          MessageBody: JSON.stringify({
            jobId: job.id,
            shopId: job.shopId,
            type: job.type,
          }),
        }),
      );

      logger.info(
        { jobId: job.id, shopId: job.shopId, type: job.type },
        '[job-scheduler] Queued job',
      );
    }

    logger.info(
      {
        event: 'job_scheduler.complete',
        data: {
          count: dueJobs.length,
        },
      },
      'Job scheduling complete',
    );

    t.done('job_scheduler.handler', 'Handler execution finished');
    return { ok: true, message: 'jobs-enqueued', count: dueJobs.length };
  } catch (err) {
    logger.error({ error: err as Error, event: 'job_scheduler.error' }, 'Error processing jobs');
    return { ok: false, error: (err as Error).message };
  }
};

// Local auto-run
if (RUNTIME_CONFIG.IS_LOCAL && !RUNTIME_CONFIG.IS_OFFLINE && !RUNTIME_CONFIG.IS_INVOKE_LOCAL) {
  (async () => {
    logger.info('IS_LOCAL=true — processing jobs...');
    await handler();
    process.exit(0);
  })();
}
