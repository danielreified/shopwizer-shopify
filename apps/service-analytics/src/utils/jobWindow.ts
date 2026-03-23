// utils/jobWindow.ts

import { logger } from '@repo/logger';

/**
 * Resolve a clean hourly window from a checkpoint.
 * Always returns a valid pair.
 * If the checkpoint is too stale (>24h behind), skip ahead to current hour.
 */
export function resolveHourlyWindow(checkpoint: any) {
  let startHour: Date;
  let endHour: Date;

  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setUTCMinutes(0, 0, 0);

  if (checkpoint?.windowEnd) {
    // Resume from last finished hour
    startHour = new Date(checkpoint.windowEnd);

    // If checkpoint is more than 24 hours behind, skip ahead to current hour
    // This prevents endless catch-up loops when there's no historical data
    const hoursBehind = (currentHour.getTime() - startHour.getTime()) / (60 * 60 * 1000);
    if (hoursBehind > 24) {
      logger.info(
        { hoursBehind, oldStart: startHour.toISOString() },
        'Checkpoint is >24h stale, skipping ahead to current hour',
      );
      startHour = new Date(currentHour);
    }

    endHour = new Date(startHour);
    endHour.setUTCHours(startHour.getUTCHours() + 1);
  } else {
    // First ever run → align to current hour
    startHour = new Date(currentHour);

    endHour = new Date(startHour);
    endHour.setUTCHours(startHour.getUTCHours() + 1);
  }

  return { startHour, endHour };
}

/**
 * Get all pending hourly windows to process.
 * Returns an array so we can catch up multiple hours in one run.
 * Max 48 hours to prevent runaway loops.
 */
export function getPendingHourlyWindows(
  checkpoint: any,
): Array<{ startHour: Date; endHour: Date }> {
  const now = new Date();
  const currentHour = new Date(now);
  currentHour.setUTCMinutes(0, 0, 0);

  let startHour: Date;

  if (checkpoint?.windowEnd) {
    startHour = new Date(checkpoint.windowEnd);
  } else {
    // First ever run → just do current hour
    const endHour = new Date(currentHour);
    endHour.setUTCHours(currentHour.getUTCHours() + 1);
    return [{ startHour: currentHour, endHour }];
  }

  const windows: Array<{ startHour: Date; endHour: Date }> = [];
  const maxWindows = 48; // Cap at 48 hours to prevent runaway

  while (startHour < currentHour && windows.length < maxWindows) {
    const endHour = new Date(startHour);
    endHour.setUTCHours(startHour.getUTCHours() + 1);
    windows.push({ startHour: new Date(startHour), endHour: new Date(endHour) });
    startHour = endHour;
  }

  // If no windows (we're caught up), return current hour
  if (windows.length === 0) {
    const endHour = new Date(currentHour);
    endHour.setUTCHours(currentHour.getUTCHours() + 1);
    return [{ startHour: currentHour, endHour }];
  }

  return windows;
}

/**
 * Resolve a clean daily window from a checkpoint.
 * Always returns TODAY's window (start-of-day → next day).
 * The checkpoint is used elsewhere for skip logic, not here.
 */
export function resolveDailyWindow(checkpoint: any) {
  // Always use today's date - checkpoint is only for skip detection
  const startDay = new Date();
  startDay.setUTCHours(0, 0, 0, 0);

  // Next 24-hour window
  const endDay = new Date(startDay);
  endDay.setUTCDate(startDay.getUTCDate() + 1);

  return { startDay, endDay };
}

export function resolve12HourWindow(checkpoint: any) {
  let start: Date;

  if (checkpoint?.windowEnd) {
    // Continue from previous 12h window
    start = new Date(checkpoint.windowEnd);
  } else {
    // First run → align to current 12h block
    start = new Date();
    const h = start.getUTCHours();
    const aligned = h - (h % 12); // 0 or 12
    start.setUTCHours(aligned, 0, 0, 0);
  }

  const end = new Date(start);
  end.setUTCHours(start.getUTCHours() + 12);

  return { start, end };
}
