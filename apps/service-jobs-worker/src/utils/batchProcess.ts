import { logger } from '@repo/logger';
import { chunkArray } from './chunkArray';

export async function batchProcess<T>(
  rows: T[],
  batchSize: number,
  processFn: (row: T) => Promise<void>,
): Promise<{ updated: number; skipped: number }> {
  const batches = chunkArray(rows, batchSize);
  let updated = 0;
  let skipped = 0;

  for (const batch of batches) {
    const results = await Promise.allSettled(batch.map((row) => processFn(row)));

    for (const result of results) {
      if (result.status === 'fulfilled') {
        updated++;
      } else {
        const err = result.reason as any;
        if (err?.code === 'P2003' || err?.code === 'P2025') {
          skipped++;
        } else {
          logger.error({ err: err?.message }, 'Unexpected batch update error');
          skipped++;
        }
      }
    }
  }

  return { updated, skipped };
}
