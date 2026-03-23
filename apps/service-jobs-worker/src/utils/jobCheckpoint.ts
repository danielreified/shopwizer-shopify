import { prisma } from '../db/prisma';
import { GlobalJobType } from '@prisma/client';
import { logger } from '@repo/logger';

export async function loadCheckpoint(job: GlobalJobType) {
  return prisma.globalJobCheckpoint.findUnique({
    where: { job },
  });
}

/**
 * Prevents double-runs:
 * - If last windowEnd == new windowStart → skip
 * - If last windowEnd > new windowStart → skip (future drift)
 * - If force is true → never skip
 */
export function shouldSkipWindow(checkpoint: any, start: Date, force = false) {
  if (force) {
    logger.debug('Force flag set - running job regardless of checkpoint');
    return false;
  }

  if (!checkpoint?.windowEnd) return false;

  const lastEnd = new Date(checkpoint.windowEnd);

  if (lastEnd.getTime() === start.getTime()) {
    logger.debug('Skipping job - window already processed');
    return true;
  }

  if (lastEnd > start) {
    logger.warn('Skipping job - checkpoint ahead of window');
    return true;
  }

  return false;
}

export async function saveCheckpoint(job: GlobalJobType, windowStart: Date, windowEnd: Date) {
  return prisma.globalJobCheckpoint.upsert({
    where: { job },
    update: {
      windowStart,
      windowEnd,
      lastRunAt: new Date(),
    },
    create: {
      job,
      windowStart,
      windowEnd,
      lastRunAt: new Date(),
    },
  });
}
