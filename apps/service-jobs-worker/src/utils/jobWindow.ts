/**
 * Resolve a clean hourly window from a checkpoint.
 */
export function resolveHourlyWindow(checkpoint: any) {
  let startHour: Date;
  let endHour: Date;

  if (checkpoint?.windowEnd) {
    startHour = new Date(checkpoint.windowEnd);
    endHour = new Date(startHour);
    endHour.setUTCHours(startHour.getUTCHours() + 1);
  } else {
    startHour = new Date();
    startHour.setUTCMinutes(0, 0, 0);
    endHour = new Date(startHour);
    endHour.setUTCHours(startHour.getUTCHours() + 1);
  }

  return { startHour, endHour };
}

/**
 * Resolve a clean daily window from a checkpoint.
 */
export function resolveDailyWindow(checkpoint: any) {
  let startDay: Date;

  if (checkpoint?.windowEnd) {
    startDay = new Date(checkpoint.windowEnd);
  } else {
    startDay = new Date();
  }

  startDay.setUTCHours(0, 0, 0, 0);

  const endDay = new Date(startDay);
  endDay.setUTCDate(startDay.getUTCDate() + 1);

  return { startDay, endDay };
}

/**
 * Resolve a 12-hour window from a checkpoint.
 */
export function resolve12HourWindow(checkpoint: any) {
  let start: Date;

  if (checkpoint?.windowEnd) {
    start = new Date(checkpoint.windowEnd);
  } else {
    start = new Date();
    const h = start.getUTCHours();
    const aligned = h - (h % 12);
    start.setUTCHours(aligned, 0, 0, 0);
  }

  const end = new Date(start);
  end.setUTCHours(start.getUTCHours() + 12);

  return { start, end };
}
