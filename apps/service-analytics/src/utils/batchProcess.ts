import { chunkArray } from './chunkArray';
import { logger } from '@repo/logger';

/**
 * Process rows in batches with parallel execution within each batch.
 * Skips Prisma P2003 (FK constraint) and P2025 (record not found) errors.
 * Logs unexpected errors but never throws, so the entire batch always completes.
 */
export async function batchProcess<T>(
  rows: T[],
  batchSize: number,
  processFn: (row: T) => Promise<void>,
): Promise<{ updated: number; skipped: number }> {
  const batches = chunkArray(rows, batchSize);
  let updated = 0;
  let skipped = 0;

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (row) => {
        try {
          await processFn(row);
          updated++;
        } catch (err: any) {
          if (err.code === 'P2003' || err.code === 'P2025') {
            skipped++;
            return;
          }
          logger.error({ row, err }, 'Unexpected error in batchProcess');
          skipped++;
        }
      }),
    );
  }

  return { updated, skipped };
}
