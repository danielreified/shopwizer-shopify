// utils/jobCheckpoint.ts
import { prisma } from '../db/prisma';
import { GlobalJobType } from '@prisma/client';
import { logger } from '@repo/logger';

export async function loadCheckpoint(job: GlobalJobType) {
  return prisma.globalJobCheckpoint.findUnique({
    where: { job },
  });
}

/**
 * Prevents double-runs within the same window.
 *
 * IMPORTANT: resolveHourlyWindow() sets startHour = checkpoint.windowEnd,
 * so the "next window to process" always starts where the last one ended.
 *
 * We should only skip if:
 * - checkpoint.windowEnd > start: The checkpoint is AHEAD of the requested window,
 *   meaning this window was already processed. This shouldn't happen in normal
 *   operation but protects against duplicate queue messages.
 *
 * We should NOT skip when checkpoint.windowEnd === start, because that's the
 * normal case: we're processing the next sequential window.
 */
export function shouldSkipWindow(checkpoint: any, start: Date, force = false) {
  if (force) {
    logger.debug('Force flag set - running job regardless of checkpoint');
    return false;
  }

  if (!checkpoint?.windowEnd) return false;

  const lastEnd = new Date(checkpoint.windowEnd);

  // Only skip if checkpoint is AHEAD of the requested window
  // (protects against duplicate SQS messages processing the same window twice)
  if (lastEnd > start) {
    logger.warn(
      { lastEnd: lastEnd.toISOString(), start: start.toISOString() },
      'Skipping job - checkpoint ahead of window (already processed)',
    );
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
