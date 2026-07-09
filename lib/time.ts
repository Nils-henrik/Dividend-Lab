export const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
export const STOCKHOLM_LOCALE = "sv-SE";

export function parseDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getStockholmDateKey(date: Date) {
  return new Intl.DateTimeFormat(STOCKHOLM_LOCALE, {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSameStockholmDay(first: Date, second: Date) {
  return getStockholmDateKey(first) === getStockholmDateKey(second);
}

export function formatStockholmTime(date: Date) {
  return new Intl.DateTimeFormat(STOCKHOLM_LOCALE, {
    timeZone: STOCKHOLM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatStockholmDateTime(
  date: Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(STOCKHOLM_LOCALE, {
    timeZone: STOCKHOLM_TIME_ZONE,
    ...options,
  }).format(date);
}
