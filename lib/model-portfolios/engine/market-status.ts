import {
  US_EARLY_CLOSES_2026,
  US_FULL_HOLIDAYS_2026,
  XSTO_EARLY_CLOSES_2026,
  XSTO_FULL_HOLIDAYS_2026,
} from "./holidays/2026";

export const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
export const NEW_YORK_TIME_ZONE = "America/New_York";

/** Product observation window in Europe/Stockholm local time. */
export const PRODUCT_OBSERVATION_START_MINUTES = 9 * 60;
export const PRODUCT_OBSERVATION_END_MINUTES = 22 * 60 + 30;

/** Regular XSTO cash equity session. */
export const XSTO_OPEN_MINUTES = 9 * 60;
export const XSTO_CLOSE_MINUTES = 17 * 60 + 30;

/** Regular US cash equity session (NYSE/Nasdaq). */
export const US_OPEN_MINUTES = 9 * 60 + 30;
export const US_CLOSE_MINUTES = 16 * 60;

export type MarketId = "SE" | "US";

export type MarketSessionState = {
  market: MarketId;
  isTradingDay: boolean;
  isOpen: boolean;
  isHoliday: boolean;
  willOpenLaterToday: boolean;
  localDate: string;
  localMinutes: number;
};

export type MarketLiveTone = "live" | "waiting" | "closed";

export type MarketLiveStatus = {
  tone: MarketLiveTone;
  label: string;
  detail: string;
  stockholmOpen: boolean;
  usOpen: boolean;
  withinObservationWindow: boolean;
  asOf: string;
};

function partsInTimeZone(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    weekday: read("weekday"),
  };
}

function localDateKey(parts: { year: number; month: number; day: number }): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localMinutes(parts: { hour: number; minute: number }): number {
  return parts.hour * 60 + parts.minute;
}

function isWeekend(weekday: string): boolean {
  return weekday === "Sat" || weekday === "Sun";
}

function parseHhMm(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function holidaySetForYear(market: MarketId, year: number): Set<string> {
  if (year === 2026) return market === "SE" ? XSTO_FULL_HOLIDAYS_2026 : US_FULL_HOLIDAYS_2026;
  return new Set();
}

function earlyCloseForYear(market: MarketId, year: number, dateKey: string): number | null {
  if (year !== 2026) return null;
  const map = market === "SE" ? XSTO_EARLY_CLOSES_2026 : US_EARLY_CLOSES_2026;
  const raw = map.get(dateKey);
  return raw ? parseHhMm(raw) : null;
}

export function resolveMarketSession(market: MarketId, now: Date): MarketSessionState {
  const timeZone = market === "SE" ? STOCKHOLM_TIME_ZONE : NEW_YORK_TIME_ZONE;
  const parts = partsInTimeZone(now, timeZone);
  const dateKey = localDateKey(parts);
  const minutes = localMinutes(parts);
  const year = parts.year;
  const holiday = holidaySetForYear(market, year).has(dateKey);
  const weekend = isWeekend(parts.weekday);
  const isTradingDay = !weekend && !holiday;
  const openMinutes = market === "SE" ? XSTO_OPEN_MINUTES : US_OPEN_MINUTES;
  const regularClose = market === "SE" ? XSTO_CLOSE_MINUTES : US_CLOSE_MINUTES;
  const earlyClose = earlyCloseForYear(market, year, dateKey);
  const closeMinutes = earlyClose ?? regularClose;
  const isOpen = isTradingDay && minutes >= openMinutes && minutes < closeMinutes;
  const willOpenLaterToday = isTradingDay && minutes < openMinutes;

  return {
    market,
    isTradingDay,
    isOpen,
    isHoliday: holiday,
    willOpenLaterToday,
    localDate: dateKey,
    localMinutes: minutes,
  };
}

export function isWithinProductObservationWindow(now: Date): boolean {
  const parts = partsInTimeZone(now, STOCKHOLM_TIME_ZONE);
  const minutes = localMinutes(parts);
  return minutes >= PRODUCT_OBSERVATION_START_MINUTES && minutes < PRODUCT_OBSERVATION_END_MINUTES;
}

export function resolveMarketLiveStatus(now: Date): MarketLiveStatus {
  const stockholm = resolveMarketSession("SE", now);
  const us = resolveMarketSession("US", now);
  const withinObservationWindow = isWithinProductObservationWindow(now);
  const asOf = now.toISOString();

  if (stockholm.isOpen && us.isOpen) {
    return {
      tone: "live",
      label: "LIVE · SE + USA",
      detail: "Stockholm och USA handlas nu",
      stockholmOpen: true,
      usOpen: true,
      withinObservationWindow,
      asOf,
    };
  }

  if (stockholm.isOpen) {
    return {
      tone: "live",
      label: "LIVE · SE",
      detail: "Stockholm handlas nu",
      stockholmOpen: true,
      usOpen: false,
      withinObservationWindow,
      asOf,
    };
  }

  if (us.isOpen) {
    return {
      tone: "live",
      label: "LIVE · USA",
      detail: "USA handlas nu",
      stockholmOpen: false,
      usOpen: true,
      withinObservationWindow,
      asOf,
    };
  }

  // Waiting: one market is a trading day that has not opened yet while the other is closed.
  if (stockholm.willOpenLaterToday && !us.isOpen) {
    return {
      tone: "waiting",
      label: "Väntar · SE",
      detail: "Stockholm öppnar senare i dag",
      stockholmOpen: false,
      usOpen: false,
      withinObservationWindow,
      asOf,
    };
  }

  if (us.willOpenLaterToday && !stockholm.isOpen) {
    return {
      tone: "waiting",
      label: "Väntar · USA",
      detail: "USA öppnar senare i dag",
      stockholmOpen: false,
      usOpen: false,
      withinObservationWindow,
      asOf,
    };
  }

  return {
    tone: "closed",
    label: "Stängt",
    detail: "Inga övervakade börser är öppna",
    stockholmOpen: false,
    usOpen: false,
    withinObservationWindow,
    asOf,
  };
}
