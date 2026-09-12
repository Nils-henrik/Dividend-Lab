const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

export function parseIsoDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Require a real date-time, not a date-only string that JS treats as UTC midnight.
  if (!/T/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:/.test(trimmed)) {
    return null;
  }

  return parsed;
}

export function stockholmCalendarDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 3_600_000;
}

export function isReasonableArticleDate(
  publishedAt: Date,
  now: Date,
  maxAgeHours: number,
  maxFutureHours: number,
): boolean {
  const ageHours = hoursBetween(publishedAt, now);
  if (ageHours > maxAgeHours) {
    return false;
  }

  if (ageHours < -maxFutureHours) {
    return false;
  }

  return true;
}
