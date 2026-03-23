// app/utils/analytics.ts
export const allowedPeriods = ["Hourly", "Daily", "Weekly", "Monthly", "Quarterly"] as const;
export type Period = (typeof allowedPeriods)[number];

export function toUTCDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
}

export function addPeriod(dt: Date, period: Period): Date {
  const d = new Date(dt);
  switch (period) {
    case "Hourly":
      d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
      break;
    case "Daily":
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "Weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "Monthly":
      d.setUTCMonth(d.getUTCMonth() + 1, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "Quarterly":
      d.setUTCMonth(d.getUTCMonth() + 3, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
  }
  return d;
}

export function floorToPeriod(dt: Date, period: Period): Date {
  const d = new Date(dt);
  switch (period) {
    case "Hourly":
      d.setUTCMinutes(0, 0, 0);
      break;
    case "Daily":
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "Weekly": {
      const day = d.getUTCDay(); // 0=Sun
      const diffToMon = (day + 6) % 7;
      d.setUTCDate(d.getUTCDate() - diffToMon);
      d.setUTCHours(0, 0, 0, 0);
      break;
    }
    case "Monthly":
      d.setUTCDate(1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "Quarterly": {
      const qStart = Math.floor(d.getUTCMonth() / 3) * 3;
      d.setUTCMonth(qStart, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    }
  }
  return d;
}

export function generateIntervalsUTC(since: Date, until: Date, period: Period): Date[] {
  const start = floorToPeriod(toUTCDate(since), period);
  const end = toUTCDate(until);
  const out: Date[] = [];
  for (let t = new Date(start); t < end; t = addPeriod(t, period)) {
    out.push(new Date(t));
  }
  return out;
}

export function formatLabel(dt: Date, period: Period): string {
  const opts: Intl.DateTimeFormatOptions =
    period === "Hourly"
      ? { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", hour12: false }
      : period === "Daily"
        ? { year: "numeric", month: "short", day: "2-digit" }
        : period === "Weekly"
          ? { year: "numeric", month: "short", day: "2-digit" }
          : period === "Monthly"
            ? { year: "numeric", month: "short" }
            : { year: "numeric", month: "short" }; // Quarterly
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(dt);
}

/**
 * Fill gaps in sparse data with 0 values for missing intervals.
 * Use this to ensure continuous chart data like Shopify does.
 * 
 * @param sparseData - Map of ISO date strings to values (from DB query)
 * @param since - Start of range
 * @param until - End of range
 * @param period - Interval period (Hourly, Daily, etc.)
 * @returns Array of [Date, value] tuples for all intervals
 */
export function fillGaps(
  sparseData: Map<string, number>,
  since: Date,
  until: Date,
  period: Period
): Array<[Date, number]> {
  const intervals = generateIntervalsUTC(since, until, period);
  return intervals.map((dt) => {
    const key = floorToPeriod(dt, period).toISOString();
    const value = sparseData.get(key) ?? 0;
    return [dt, value];
  });
}

