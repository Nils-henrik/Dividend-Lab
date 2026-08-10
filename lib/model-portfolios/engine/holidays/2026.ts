/**
 * Authoritative 2026 full-day exchange holidays and early closes.
 * Keep year files isolated so annual calendars are easy to extend.
 */

/** Nasdaq Stockholm (XSTO) full-day closures, local calendar dates. */
export const XSTO_FULL_HOLIDAYS_2026 = new Set<string>([
  "2026-01-01", // New Year's Day
  "2026-01-06", // Epiphany
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-01", // Labour Day
  "2026-05-14", // Ascension Day
  "2026-06-19", // Midsummer Eve
  "2026-12-24", // Christmas Eve
  "2026-12-25", // Christmas Day
  "2026-12-31", // New Year's Eve
]);

/** Optional early closes as local Europe/Stockholm HH:mm. */
export const XSTO_EARLY_CLOSES_2026 = new Map<string, string>([]);

/** NYSE / Nasdaq US full-day closures, America/New_York calendar dates. */
export const US_FULL_HOLIDAYS_2026 = new Set<string>([
  "2026-01-01", // New Year's Day
  "2026-01-19", // Martin Luther King Jr. Day
  "2026-02-16", // Presidents' Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day observed (July 4 is Saturday)
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas Day
]);

/** US early closes as America/New_York HH:mm. */
export const US_EARLY_CLOSES_2026 = new Map<string, string>([
  ["2026-11-27", "13:00"], // Day after Thanksgiving
  ["2026-12-24", "13:00"], // Christmas Eve
]);
