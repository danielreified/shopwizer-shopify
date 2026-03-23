// utils/dates.ts

/**
 * Generates an array of the last N UTC days, including today.
 * Each element contains { y, m, d } for year, month, day — zero-padded.
 *
 * Example (n = 3, on 2025-11-13):
 * [
 *   { y: 2025, m: '11', d: '13' },
 *   { y: 2025, m: '11', d: '12' },
 *   { y: 2025, m: '11', d: '11' }
 * ]
 */
export function lastNDaysUTC(n: number): Array<{ y: string; m: string; d: string }> {
  const out: Array<{ y: string; m: string; d: string }> = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    out.push({
      y: String(dt.getUTCFullYear()),
      m: String(dt.getUTCMonth() + 1).padStart(2, '0'),
      d: String(dt.getUTCDate()).padStart(2, '0'),
    });
  }

  return out;
}

/**
 * Returns a UTC ISO timestamp string truncated to seconds.
 * (Athena needs timestamps like '2025-11-13 14:00:00')
 */
export function toAthenaTimestampUTC(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Returns the UTC "top of hour" timestamp (minutes, seconds, ms = 0)
 */
export function topOfHourUTC(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

// utils/dates.ts

/**
 * Returns UTC year/month/day/hour from a Date instance.
 * Useful for building Athena partition paths.
 *
 * Example:
 *  getUtcDateParts(new Date("2025-11-12T10:40:00Z"))
 *  => { year: 2025, month: 11, day: 12, hour: 10 }
 */
export function getUtcDateParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // 0 → 11
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
  };
}

/**
 * Convenience helper for "now in UTC parts".
 */
export function getNowUtcDateParts() {
  return getUtcDateParts(new Date());
}

/**
 * Returns zero-padded UTC date parts suitable for Hive partition clauses.
 *
 * Example:
 *  toPartitionStrings(new Date("2025-11-02T08:00:00Z"))
 *  => { year: "2025", month: "02", day: "02", hour: "08" }
 */
export function toPartitionStrings(date: Date) {
  const p = getUtcDateParts(date);
  return {
    year: String(p.year),
    month: String(p.month).padStart(2, '0'),
    day: String(p.day).padStart(2, '0'),
    hour: String(p.hour).padStart(2, '0'),
  };
}
