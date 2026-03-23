/**
 * Timezone utilities for working with shop timezones
 */

/**
 * Get the current UTC offset (in hours) for an IANA timezone.
 * Accounts for Daylight Saving Time automatically.
 * 
 * @param ianaTimezone - IANA timezone string, e.g. "America/New_York", "Africa/Johannesburg"
 * @returns UTC offset in hours, e.g. -5, +2, +8
 * 
 * @example
 * getUtcOffset("America/New_York") // Returns -5 (or -4 during DST)
 * getUtcOffset("Africa/Johannesburg") // Returns 2
 * getUtcOffset("Asia/Tokyo") // Returns 9
 */
export function getUtcOffset(ianaTimezone: string): number {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaTimezone,
            timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(now);
        const tzPart = parts.find((p) => p.type === "timeZoneName")?.value;

        // tzPart is like "GMT-5" or "GMT+2" or "GMT+5:30"
        const match = tzPart?.match(/GMT([+-])(\d+)(?::(\d+))?/);
        if (!match) return 0;

        const sign = match[1] === "+" ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) / 60 : 0;

        return sign * (hours + minutes);
    } catch {
        console.warn(`[timezone] Invalid timezone: ${ianaTimezone}`);
        return 0;
    }
}

/**
 * Get a formatted UTC offset string like "UTC+2" or "UTC-5"
 * 
 * @param ianaTimezone - IANA timezone string
 * @returns Formatted offset string
 * 
 * @example
 * getUtcOffsetString("America/New_York") // "UTC-5" or "UTC-4"
 * getUtcOffsetString("Africa/Johannesburg") // "UTC+2"
 */
export function getUtcOffsetString(ianaTimezone: string): string {
    const offset = getUtcOffset(ianaTimezone);
    if (offset === 0) return "UTC";
    const sign = offset >= 0 ? "+" : "";
    return `UTC${sign}${offset}`;
}

/**
 * Get the current date in the shop's timezone
 * 
 * @param ianaTimezone - IANA timezone string
 * @returns Date object representing "now" in the shop's timezone
 */
export function getShopNow(ianaTimezone: string): Date {
    const now = new Date();
    const offsetMs = getUtcOffset(ianaTimezone) * 60 * 60 * 1000;
    return new Date(now.getTime() + offsetMs + now.getTimezoneOffset() * 60 * 1000);
}

/**
 * Get the start of day (midnight) in the shop's timezone
 * 
 * @param ianaTimezone - IANA timezone string
 * @param date - Optional date to get start of day for (defaults to today)
 * @returns Date object representing midnight in the shop's timezone
 */
export function getShopStartOfDay(ianaTimezone: string, date?: Date): Date {
    const shopDate = date ?? getShopNow(ianaTimezone);
    return new Date(
        Date.UTC(
            shopDate.getFullYear(),
            shopDate.getMonth(),
            shopDate.getDate()
        )
    );
}
