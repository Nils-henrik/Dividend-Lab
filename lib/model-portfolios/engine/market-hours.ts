/**
 * Deterministic Nasdaq Stockholm + NYSE/Nasdaq US regular-session calendars.
 * Holidays use explicit rules + Anonymous Gregorian Easter (movable dates).
 * Client JS stays minimal — this module is safe for server + tiny client refresh.
 */

export type MarketId = "SE" | "US";

export type MarketSessionStatus = {
  market: MarketId;
  open: boolean;
  localDate: string;
  nextOpenAt: string | null;
  nextCloseAt: string | null;
  holidayName: string | null;
};

export type CombinedMarketStatus = {
  asOf: string;
  sweden: MarketSessionStatus;
  us: MarketSessionStatus;
  anyOpen: boolean;
  bothOpen: boolean;
  /** Compact Swedish label for UI. */
  label: string;
  /** live | closing | closed — visual tone (closed is amber/subdued, never price-loss red). */
  tone: "live" | "closing" | "closed";
  showPulse: boolean;
};

const STOCKHOLM = "Europe/Stockholm";
const NEW_YORK = "America/New_York";

type Ymd = { year: number; month: number; day: number };

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function ymdKey(d: Ymd): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

function addDays(d: Ymd, days: number): Ymd {
  const dt = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

function weekdayUtc(d: Ymd): number {
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

/** Anonymous Gregorian algorithm — Easter Sunday. */
export function easterSunday(year: number): Ymd {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Ymd {
  let count = 0;
  for (let day = 1; day <= 31; day += 1) {
    const d = { year, month, day };
    if (new Date(Date.UTC(year, month - 1, day)).getUTCMonth() + 1 !== month) break;
    if (weekdayUtc(d) === weekday) {
      count += 1;
      if (count === n) return d;
    }
  }
  throw new Error(`nthWeekdayOfMonth failed ${year}-${month} weekday=${weekday} n=${n}`);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): Ymd {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = lastDay; day >= 1; day -= 1) {
    const d = { year, month, day };
    if (weekdayUtc(d) === weekday) return d;
  }
  throw new Error(`lastWeekdayOfMonth failed ${year}-${month}`);
}

/** Midsummer Eve: Friday between 19–25 June. */
function swedishMidsummerEve(year: number): Ymd {
  for (let day = 19; day <= 25; day += 1) {
    const d = { year, month: 6, day };
    if (weekdayUtc(d) === 5) return d;
  }
  throw new Error(`midsummer eve failed ${year}`);
}

function observedUsHoliday(d: Ymd): Ymd {
  const wd = weekdayUtc(d);
  if (wd === 0) return addDays(d, 1); // Sunday → Monday
  if (wd === 6) return addDays(d, -1); // Saturday → Friday
  return d;
}

export function swedishExchangeHolidays(year: number): Map<string, string> {
  const easter = easterSunday(year);
  const map = new Map<string, string>();
  const add = (d: Ymd, name: string) => {
    map.set(ymdKey(d), name);
  };

  add({ year, month: 1, day: 1 }, "Nyårsdagen");
  add({ year, month: 1, day: 6 }, "Trettondedag jul");
  add(addDays(easter, -2), "Långfredagen");
  add(addDays(easter, 1), "Annandag påsk");
  add({ year, month: 5, day: 1 }, "Första maj");
  add(addDays(easter, 39), "Kristi himmelsfärdsdag");
  add({ year, month: 6, day: 6 }, "Sveriges nationaldag");
  add(swedishMidsummerEve(year), "Midsommarafton");
  add({ year, month: 12, day: 24 }, "Julafton");
  add({ year, month: 12, day: 25 }, "Juldagen");
  add({ year, month: 12, day: 26 }, "Annandag jul");
  add({ year, month: 12, day: 31 }, "Nyårsafton");
  return map;
}

export function usExchangeHolidays(year: number): Map<string, string> {
  const easter = easterSunday(year);
  const map = new Map<string, string>();
  const add = (d: Ymd, name: string) => map.set(ymdKey(d), name);

  add(observedUsHoliday({ year, month: 1, day: 1 }), "New Year's Day");
  add(nthWeekdayOfMonth(year, 1, 1, 3), "Martin Luther King Jr. Day");
  add(nthWeekdayOfMonth(year, 2, 1, 3), "Presidents' Day");
  add(addDays(easter, -2), "Good Friday");
  add(lastWeekdayOfMonth(year, 5, 1), "Memorial Day");
  add(observedUsHoliday({ year, month: 6, day: 19 }), "Juneteenth");
  add(observedUsHoliday({ year, month: 7, day: 4 }), "Independence Day");
  add(nthWeekdayOfMonth(year, 9, 1, 1), "Labor Day");
  add(nthWeekdayOfMonth(year, 11, 4, 4), "Thanksgiving");
  add(observedUsHoliday({ year, month: 12, day: 25 }), "Christmas Day");
  return map;
}

function zonedParts(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday,
  };
}

/** Approximate instant for a local wall time in a zone (handles DST via iterative refine). */
export function zonedWallTimeToUtc(
  ymd: Ymd,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let guess = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const parts = zonedParts(new Date(guess), timeZone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    const target = Date.UTC(ymd.year, ymd.month - 1, ymd.day, hour, minute, 0);
    guess += target - asUtc;
  }
  return new Date(guess);
}

function isWeekendYmd(d: Ymd): boolean {
  const wd = weekdayUtc(d);
  return wd === 0 || wd === 6;
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function formatStockholmClock(date: Date): string {
  const parts = zonedParts(date, STOCKHOLM);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

function findNextOpen(
  market: MarketId,
  from: Date,
  holidays: (year: number) => Map<string, string>,
  openHour: number,
  openMinute: number,
  timeZone: string,
): Date {
  const cursor = zonedParts(from, timeZone);
  const d: Ymd = { year: cursor.year, month: cursor.month, day: cursor.day };
  const startMinutes = minutesSinceMidnight(cursor.hour, cursor.minute);

  let dayCursor = d;
  for (let i = 0; i < 14; i += 1) {
    const key = ymdKey(dayCursor);
    const holidayMap = holidays(dayCursor.year);
    const isHoliday = holidayMap.has(key);
    const weekend = isWeekendYmd(dayCursor);
    if (!weekend && !isHoliday) {
      const open = zonedWallTimeToUtc(dayCursor, openHour, openMinute, timeZone);
      if (i > 0 || startMinutes < minutesSinceMidnight(openHour, openMinute) || from.getTime() < open.getTime()) {
        if (open.getTime() > from.getTime()) return open;
      }
    }
    dayCursor = addDays(dayCursor, 1);
  }
  return zonedWallTimeToUtc(dayCursor, openHour, openMinute, timeZone);
}

function sessionStatusForMarket(
  market: MarketId,
  now: Date,
  openHour: number,
  openMinute: number,
  closeHour: number,
  closeMinute: number,
  timeZone: string,
  holidays: (year: number) => Map<string, string>,
): MarketSessionStatus {
  const parts = zonedParts(now, timeZone);
  const local: Ymd = { year: parts.year, month: parts.month, day: parts.day };
  const localDate = ymdKey(local);
  const holidayMap = holidays(local.year);
  const holidayName = holidayMap.get(localDate) ?? null;
  const weekend = isWeekendYmd(local);
  const mins = minutesSinceMidnight(parts.hour, parts.minute);
  const openMins = minutesSinceMidnight(openHour, openMinute);
  const closeMins = minutesSinceMidnight(closeHour, closeMinute);

  const tradingDay = !weekend && !holidayName;
  const open = tradingDay && mins >= openMins && mins < closeMins;

  const nextOpenAt = open
    ? null
    : findNextOpen(market, now, holidays, openHour, openMinute, timeZone).toISOString();

  const nextCloseAt = open
    ? zonedWallTimeToUtc(local, closeHour, closeMinute, timeZone).toISOString()
    : null;

  return {
    market,
    open,
    localDate,
    nextOpenAt,
    nextCloseAt,
    holidayName,
  };
}

export function getSwedenMarketStatus(now: Date): MarketSessionStatus {
  // Nasdaq Stockholm regular equity session ~09:00–17:30 Europe/Stockholm
  return sessionStatusForMarket("SE", now, 9, 0, 17, 30, STOCKHOLM, swedishExchangeHolidays);
}

export function getUsMarketStatus(now: Date): MarketSessionStatus {
  // NYSE/Nasdaq regular session 09:30–16:00 America/New_York
  return sessionStatusForMarket("US", now, 9, 30, 16, 0, NEW_YORK, usExchangeHolidays);
}

function formatNextOpenLabel(status: MarketSessionStatus): string {
  if (!status.nextOpenAt) return "";
  return formatStockholmClock(new Date(status.nextOpenAt));
}

export function resolveCombinedMarketStatus(now = new Date()): CombinedMarketStatus {
  const sweden = getSwedenMarketStatus(now);
  const us = getUsMarketStatus(now);
  const anyOpen = sweden.open || us.open;
  const bothOpen = sweden.open && us.open;

  let label: string;
  let tone: CombinedMarketStatus["tone"];
  let showPulse: boolean;

  if (bothOpen) {
    label = "LIVE · Sverige + USA";
    tone = "live";
    showPulse = true;
  } else if (sweden.open && !us.open) {
    label = us.holidayName
      ? `LIVE · Sverige · USA stängt (${us.holidayName})`
      : "LIVE · Sverige · USA stängt";
    tone = "live";
    showPulse = true;
  } else if (us.open && !sweden.open) {
    label = sweden.holidayName
      ? `LIVE · USA · Sverige stängt (${sweden.holidayName})`
      : "LIVE · USA · Sverige stängt";
    tone = "live";
    showPulse = true;
  } else {
    // Neither open — truthful closed / upcoming state (amber/subdued, not price-loss red).
    showPulse = false;
    tone = "closed";

    const stockholm = zonedParts(now, STOCKHOLM);
    const stockholmMins = minutesSinceMidnight(stockholm.hour, stockholm.minute);
    const inEveningWindow =
      !weekendParts(stockholm) &&
      stockholmMins >= minutesSinceMidnight(16, 0) &&
      stockholmMins < minutesSinceMidnight(22, 30);

    if (sweden.holidayName && us.nextOpenAt) {
      label = `Sverige stängt · USA öppnar ${formatNextOpenLabel(us)}`;
    } else if (us.holidayName && !sweden.holidayName && sweden.nextOpenAt) {
      // US holiday while Sweden is also closed (e.g. before SE open or after SE close).
      label = `USA stängt · Sverige ${sweden.nextOpenAt && Date.parse(sweden.nextOpenAt) > now.getTime() ? `öppnar ${formatNextOpenLabel(sweden)}` : "stängt"}`;
    } else if (sweden.nextOpenAt && us.nextOpenAt) {
      const seMs = Date.parse(sweden.nextOpenAt);
      const usMs = Date.parse(us.nextOpenAt);
      if (Number.isFinite(seMs) && Number.isFinite(usMs) && usMs < seMs) {
        label = `Marknaden är stängd · USA öppnar ${formatNextOpenLabel(us)}`;
      } else {
        label = `Marknaden är stängd · Sverige öppnar ${formatNextOpenLabel(sweden)}`;
      }
    } else {
      label = "Marknaden är stängd";
    }

    if (inEveningWindow) {
      tone = "closing";
    }
  }

  return {
    asOf: now.toISOString(),
    sweden,
    us,
    anyOpen,
    bothOpen,
    label,
    tone,
    showPulse,
  };
}

function weekendParts(parts: { year: number; month: number; day: number }): boolean {
  return isWeekendYmd({ year: parts.year, month: parts.month, day: parts.day });
}
