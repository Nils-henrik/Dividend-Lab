import { MATERIAL_DAY_MOVE_PERCENT, stockholmIsoDate } from "@/lib/companies/current-events";
import { DIVIDEND_KIND_LABEL, type DividendKind } from "@/lib/companies/dividend-view";
import { explicitFiscalPeriod, isReportPublicationTitle } from "@/lib/companies/ingestion/document";
import type { CompanyOfficialData } from "@/lib/companies/official-data";
import { formatMoney } from "@/lib/companies/valuation";

export const FOLLOW_FEED_REPORT_DAYS = 45;
export const FOLLOW_FEED_PRESS_DAYS = 21;
export const FOLLOW_FEED_ARTICLE_DAYS = 30;
export const FOLLOW_FEED_CALENDAR_DAYS = 45;
export const FOLLOW_FEED_DIVIDEND_PAST_DAYS = 30;
export const FOLLOW_FEED_DIVIDEND_FUTURE_DAYS = 60;
export const FOLLOW_FEED_LIMIT = 40;
export const FOLLOW_FEED_RECENCY_TODAY_LABEL = "Ny idag";
export const FOLLOW_FEED_RECENCY_LAST_24H_LABEL = "Senaste 24 h";
const FOLLOW_FEED_RECENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const FOLLOW_FEED_FILTERS = [
  { id: "all", label: "Alla" },
  { id: "reports", label: "Rapporter" },
  { id: "calendar", label: "Kalender" },
  { id: "press", label: "Pressmeddelanden" },
  { id: "dividend", label: "Utdelning" },
  { id: "articles", label: "DivLab-artiklar" },
] as const;

export type FollowFeedFilter = (typeof FOLLOW_FEED_FILTERS)[number]["id"];
export type FollowFeedKind = "calendar" | "report" | "dividend" | "press" | "article" | "price_move";
export type FollowFeedDividendKind = Exclude<DividendKind, "unspecified">;

export type FollowFeedDocument = {
  title: string;
  date: string | null;
  url: string;
  publisher: string | null;
  fiscalPeriod?: string | null;
};

export type FollowFeedDividend = FollowFeedDocument & {
  kind: FollowFeedDividendKind;
};

export type FollowFeedArticle = {
  id: string;
  title: string;
  publishedAt: string;
  href: string;
};

export type FollowFeedPriceMove = {
  changePct: number;
  marketTimestamp: string;
  sourceUrl: string;
};

export type FollowFeedCompanyInput = {
  slug: string;
  name: string;
  ticker: string;
  reports: readonly FollowFeedDocument[];
  press: readonly FollowFeedDocument[];
  events: readonly FollowFeedDocument[];
  dividends: readonly FollowFeedDividend[];
  articles: readonly FollowFeedArticle[];
  priceMove: FollowFeedPriceMove | null;
};

export type FollowFeedItem = {
  id: string;
  companySlug: string;
  companyName: string;
  ticker: string;
  kind: FollowFeedKind;
  typeLabel: string;
  title: string;
  dateLabel: string;
  sortAt: string;
  sourceLabel: string;
  href: string;
  companyHref: string;
  freshnessLabel: string;
  /** Timestamp-derived cue. Null when the event is outside the recent window. */
  recencyLabel: string | null;
  dividendKind: FollowFeedDividendKind | null;
  fallback: boolean;
};

export type FollowFeedMode = "onboarding" | "feed" | "calendar_fallback" | "unavailable";

export type FollowFeedModel = {
  items: FollowFeedItem[];
  summary: {
    followedCount: number;
    upcomingReports: number;
    newOfficialEvents: number;
  };
  mode: FollowFeedMode;
  sourcesUnavailable: boolean;
};

const KIND_RANK: Record<FollowFeedKind, number> = {
  calendar: 1,
  report: 2,
  dividend: 3,
  press: 4,
  article: 5,
  price_move: 6,
};

const TYPE_LABEL: Record<FollowFeedKind, string> = {
  calendar: "Kalender",
  report: "Rapport",
  dividend: "Utdelning",
  press: "Pressmeddelande",
  article: "DivLab",
  price_move: "Kurs",
};

const dateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  day: "numeric",
  month: "short",
});

const dateTimeFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function isoDay(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  return value.slice(0, 10);
}

function shiftIsoDay(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function stockholmClock(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return { hour, minute };
}

/** UTC instant for 00:00 on a Stockholm calendar day. */
export function stockholmDayStartUtc(isoDay: string) {
  const [year, month, day] = isoDay.split("-").map(Number);
  const utcMidnight = Date.UTC(year!, (month ?? 1) - 1, day ?? 1);
  for (let hoursBack = 0; hoursBack <= 14; hoursBack += 1) {
    const candidate = new Date(utcMidnight - hoursBack * 3_600_000);
    const clock = stockholmClock(candidate);
    if (stockholmIsoDate(candidate) === isoDay && clock.hour === 0 && clock.minute === 0) {
      return candidate.toISOString();
    }
  }
  return new Date(utcMidnight).toISOString();
}

/** Oldest published_at the feed can still show. Matches the 45-day report window. */
export function followFeedDocumentPublishedAfter(now = new Date()) {
  const today = stockholmIsoDate(now);
  return stockholmDayStartUtc(shiftIsoDay(today, -FOLLOW_FEED_REPORT_DAYS));
}

/** Calendar rows older than the current Stockholm day are not part of the feed or its fallback. */
export function followFeedCalendarEventAfter(now = new Date()) {
  return stockholmDayStartUtc(stockholmIsoDate(now));
}

const STORED_FISCAL_PERIOD = /^(20\d{2})(?: Q[1-4]| H1)?$/;

/**
 * Report dates only. Uses the stored fiscal period or the existing report-title
 * classifier. A calendar heading such as an årsstämma stays a calendar event.
 */
export function isUpcomingReportCalendar(event: { title: string; fiscalPeriod?: string | null }) {
  const fiscalPeriod = event.fiscalPeriod?.trim();
  if (fiscalPeriod && STORED_FISCAL_PERIOD.test(fiscalPeriod)) return true;
  return explicitFiscalPeriod(event.title) !== null || isReportPublicationTitle(event.title);
}

function eventKey(value: string) {
  try {
    const url = new URL(value, "https://divlab.se");
    url.hash = "";
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return value;
  }
}

function titleKey(value: string) {
  return value.toLocaleLowerCase("sv").replace(/\s+/g, " ").trim();
}

/**
 * Honest recency from the event timestamp only.
 * Date-only values can be "Ny idag" on that Stockholm day, never "Senaste 24 h".
 */
export function followFeedRecencyLabel(sortAt: string, now = new Date()) {
  if (!sortAt || !/^\d{4}-\d{2}-\d{2}/.test(sortAt)) return null;
  const hasTime = sortAt.includes("T");
  const day = sortAt.slice(0, 10);
  const today = stockholmIsoDate(now);

  if (!hasTime) {
    if (day !== today) return null;
    return FOLLOW_FEED_RECENCY_TODAY_LABEL;
  }

  const instant = new Date(sortAt);
  if (Number.isNaN(instant.getTime()) || instant.getTime() > now.getTime()) return null;
  if (stockholmIsoDate(instant) === today) return FOLLOW_FEED_RECENCY_TODAY_LABEL;
  const ageMs = now.getTime() - instant.getTime();
  if (ageMs >= 0 && ageMs <= FOLLOW_FEED_RECENCY_WINDOW_MS) return FOLLOW_FEED_RECENCY_LAST_24H_LABEL;
  return null;
}

export function formatFollowFeedDate(value: string | null) {
  if (!value) return "Datum saknas";
  const hasTime = value.includes("T");
  const date = new Date(hasTime ? value : `${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Datum saknas";
  return (hasTime ? dateTimeFormat : dateFormat).format(date);
}

function daysBetween(today: string, day: string) {
  const start = Date.parse(`${today}T00:00:00Z`);
  const end = Date.parse(`${day}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

function calendarFreshness(today: string, day: string, fallback: boolean) {
  if (fallback) return "Nästa kända datum";
  const days = daysBetween(today, day);
  if (days <= 0) return "Idag";
  if (days === 1) return "Imorgon";
  return `Om ${days} dagar`;
}

function companyHref(slug: string) {
  return `/bolag/${slug}`;
}

function withItems<T>(status: string, items: readonly T[]) {
  return status === "available_with_items" ? items : [];
}

function storedText(
  values: ReadonlyMap<string, string> | undefined,
  url: string,
  fallback: string | null,
) {
  if (!values) {
    const section = fallback?.trim();
    return section ? section : null;
  }
  const stored = values.get(url)?.trim();
  return stored ? stored : null;
}

export function followFeedCompanyFromOfficial(input: {
  slug: string;
  name: string;
  ticker: string;
  official: CompanyOfficialData | null;
  articles: readonly FollowFeedArticle[];
  priceMove: FollowFeedPriceMove | null;
  publishersByUrl?: ReadonlyMap<string, string>;
  fiscalPeriodsByUrl?: ReadonlyMap<string, string>;
}): FollowFeedCompanyInput {
  const official = input.official;
  const publisherFor = (url: string, fallback: string | null) => storedText(input.publishersByUrl, url, fallback);
  const reports = official
    ? withItems(official.reports.status, official.reports.items).flatMap((item) =>
        item.url
          ? [{
              title: item.title,
              date: item.date,
              url: item.url,
              publisher: publisherFor(item.url, official.reports.sourcePublisher),
              fiscalPeriod: storedText(input.fiscalPeriodsByUrl, item.url, null),
            }]
          : [],
      )
    : [];
  const press = official
    ? withItems(official.pressReleases.status, official.pressReleases.items).flatMap((item) =>
        item.url
          ? [{
              title: item.title,
              date: item.date,
              url: item.url,
              publisher: publisherFor(item.url, official.pressReleases.sourcePublisher),
            }]
          : [],
      )
    : [];
  const events = official
    ? withItems(official.events.status, official.events.items).flatMap((item) =>
        item.url
          ? [{
              title: item.title,
              date: item.date,
              url: item.url,
              publisher: publisherFor(item.url, official.events.sourcePublisher),
              fiscalPeriod: storedText(input.fiscalPeriodsByUrl, item.url, null),
            }]
          : [],
      )
    : [];
  const dividend = official?.dividend;
  const dividendKind = dividend?.kind === "board_proposal" || dividend?.kind === "decided" || dividend?.kind === "paid"
    ? dividend.kind
    : null;
  const dividends = dividend && dividend.status === "available_with_items" && dividend.perShare !== null && dividendKind && dividend.sourceUrl
    ? [{
        kind: dividendKind,
        title: `${DIVIDEND_KIND_LABEL[dividendKind]} ${formatMoney(dividend.perShare, dividend.currency)}`,
        date: dividend.recordDate ?? dividend.exDate ?? dividend.paymentDate ?? dividend.asOf,
        url: dividend.sourceUrl,
        publisher: dividend.sourcePublisher,
      }]
    : [];

  return {
    slug: input.slug,
    name: input.name,
    ticker: input.ticker,
    reports,
    press,
    events,
    dividends,
    articles: input.articles,
    priceMove: input.priceMove,
  };
}

type Draft = FollowFeedItem & { rank: number; day: string; reportCalendar: boolean };

function publicationRecency(sortAt: string, now: Date) {
  return followFeedRecencyLabel(sortAt, now);
}

function draftItem(input: {
  company: FollowFeedCompanyInput;
  kind: FollowFeedKind;
  title: string;
  sortAt: string;
  day: string;
  sourceLabel: string;
  href: string;
  freshnessLabel: string;
  recencyLabel?: string | null;
  dividendKind?: FollowFeedDividendKind | null;
  fiscalPeriod?: string | null;
  fallback?: boolean;
  idSuffix?: string;
}): Draft {
  return {
    id: `${input.company.slug}:${input.kind}:${input.idSuffix ?? eventKey(input.href)}`,
    companySlug: input.company.slug,
    companyName: input.company.name,
    ticker: input.company.ticker,
    kind: input.kind,
    typeLabel: TYPE_LABEL[input.kind],
    title: input.title,
    dateLabel: formatFollowFeedDate(input.sortAt),
    sortAt: input.sortAt,
    sourceLabel: input.sourceLabel,
    href: input.href,
    companyHref: companyHref(input.company.slug),
    freshnessLabel: input.freshnessLabel,
    recencyLabel: input.recencyLabel ?? null,
    dividendKind: input.dividendKind ?? null,
    fallback: input.fallback ?? false,
    rank: KIND_RANK[input.kind],
    day: input.day,
    reportCalendar: input.kind === "calendar" && isUpcomingReportCalendar({
      title: input.title,
      fiscalPeriod: input.fiscalPeriod,
    }),
  };
}

function collectPrimary(company: FollowFeedCompanyInput, today: string, now: Date): Draft[] {
  const rows: Draft[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const reportStart = shiftIsoDay(today, -FOLLOW_FEED_REPORT_DAYS);
  const pressStart = shiftIsoDay(today, -FOLLOW_FEED_PRESS_DAYS);
  const articleStart = shiftIsoDay(today, -FOLLOW_FEED_ARTICLE_DAYS);
  const dividendStart = shiftIsoDay(today, -FOLLOW_FEED_DIVIDEND_PAST_DAYS);
  const dividendEnd = shiftIsoDay(today, FOLLOW_FEED_DIVIDEND_FUTURE_DAYS);
  const calendarEnd = shiftIsoDay(today, FOLLOW_FEED_CALENDAR_DAYS);

  const calendars = company.events
    .flatMap((event) => {
      const day = isoDay(event.date);
      if (!day || !event.url || day < today || day > calendarEnd) return [];
      return [{ ...event, day }];
    })
    .sort((left, right) => left.day.localeCompare(right.day));

  for (const event of calendars) {
    rows.push(draftItem({
      company,
      kind: "calendar",
      title: event.title,
      sortAt: event.date ?? event.day,
      day: event.day,
      sourceLabel: event.publisher ?? "Officiell kalender",
      href: event.url,
      freshnessLabel: calendarFreshness(today, event.day, false),
      fiscalPeriod: event.fiscalPeriod,
    }));
  }

  function takeDocument(kind: "report" | "press", document: FollowFeedDocument, start: string, freshness: string) {
    const day = isoDay(document.date);
    if (!day || !document.url || day < start || day > today) return;
    const url = eventKey(document.url);
    const title = titleKey(document.title);
    if (seenUrls.has(url) || (title && seenTitles.has(title))) return;
    seenUrls.add(url);
    if (title) seenTitles.add(title);
    const sortAt = document.date ?? day;
    rows.push(draftItem({
      company,
      kind,
      title: document.title,
      sortAt,
      day,
      sourceLabel: document.publisher ?? (kind === "report" ? "Officiell rapport" : "Officiellt pressmeddelande"),
      href: document.url,
      freshnessLabel: freshness,
      recencyLabel: publicationRecency(sortAt, now),
    }));
  }

  const reports = [...company.reports].sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
  const press = [...company.press].sort((left, right) => (right.date ?? "").localeCompare(left.date ?? ""));
  for (const report of reports) takeDocument("report", report, reportStart, "Officiell rapport");
  for (const item of press) takeDocument("press", item, pressStart, "Officiellt pressmeddelande");

  const seenDividends = new Set<string>();
  for (const dividend of company.dividends) {
    const day = isoDay(dividend.date);
    if (!day || !dividend.url || day < dividendStart || day > dividendEnd) continue;
    const idSuffix = `${dividend.kind}:${eventKey(dividend.url)}`;
    if (seenDividends.has(idSuffix)) continue;
    seenDividends.add(idSuffix);
    const dividendSortAt = dividend.date ?? day;
    rows.push(draftItem({
      company,
      kind: "dividend",
      title: dividend.title,
      sortAt: dividendSortAt,
      day,
      sourceLabel: dividend.publisher ?? "Officiell utdelning",
      href: dividend.url,
      freshnessLabel: DIVIDEND_KIND_LABEL[dividend.kind],
      recencyLabel: publicationRecency(dividendSortAt, now),
      dividendKind: dividend.kind,
      idSuffix,
    }));
  }

  for (const article of company.articles) {
    const day = isoDay(article.publishedAt);
    if (!day || !article.href || day < articleStart || day > today) continue;
    rows.push(draftItem({
      company,
      kind: "article",
      title: article.title,
      sortAt: article.publishedAt,
      day,
      sourceLabel: "DivLab",
      href: article.href,
      freshnessLabel: "DivLab-artikel",
      recencyLabel: publicationRecency(article.publishedAt, now),
      idSuffix: article.id,
    }));
  }

  const move = company.priceMove;
  const moveDay = move ? isoDay(move.marketTimestamp) : null;
  if (
    move &&
    moveDay === today &&
    Number.isFinite(move.changePct) &&
    Math.abs(move.changePct) >= MATERIAL_DAY_MOVE_PERCENT &&
    move.sourceUrl
  ) {
    const sign = move.changePct > 0 ? "+" : "";
    const percent = move.changePct.toLocaleString("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    rows.push(draftItem({
      company,
      kind: "price_move",
      title: `Dagsförändring ${sign}${percent} %`,
      sortAt: move.marketTimestamp,
      day: moveDay,
      sourceLabel: "Fördröjd marknadsdata · Yahoo Finance",
      href: move.sourceUrl,
      freshnessLabel: "Materiell kursrörelse",
      recencyLabel: publicationRecency(move.marketTimestamp, now),
    }));
  }

  return rows;
}

function nextCalendar(company: FollowFeedCompanyInput, today: string): Draft | null {
  const next = company.events
    .flatMap((event) => {
      const day = isoDay(event.date);
      if (!day || !event.url || day < today) return [];
      return [{ ...event, day }];
    })
    .sort((left, right) => left.day.localeCompare(right.day))[0];
  if (!next) return null;
  return draftItem({
    company,
    kind: "calendar",
    title: next.title,
    sortAt: next.date ?? next.day,
    day: next.day,
    sourceLabel: next.publisher ?? "Officiell kalender",
    href: next.url,
    freshnessLabel: calendarFreshness(today, next.day, true),
    fiscalPeriod: next.fiscalPeriod,
    fallback: true,
  });
}

function sortDrafts(rows: readonly Draft[]) {
  return [...rows].sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    const byDay = left.kind === "calendar"
      ? left.day.localeCompare(right.day)
      : right.day.localeCompare(left.day);
    if (byDay !== 0) return byDay;
    const byName = left.companyName.localeCompare(right.companyName, "sv");
    if (byName !== 0) return byName;
    return left.id.localeCompare(right.id);
  });
}

function toItem(row: Draft): FollowFeedItem {
  return {
    id: row.id,
    companySlug: row.companySlug,
    companyName: row.companyName,
    ticker: row.ticker,
    kind: row.kind,
    typeLabel: row.typeLabel,
    title: row.title,
    dateLabel: row.dateLabel,
    sortAt: row.sortAt,
    sourceLabel: row.sourceLabel,
    href: row.href,
    companyHref: row.companyHref,
    freshnessLabel: row.freshnessLabel,
    recencyLabel: row.recencyLabel,
    dividendKind: row.dividendKind,
    fallback: row.fallback,
  };
}

function boundByCategory(rows: readonly Draft[]) {
  const counts = new Map<FollowFeedKind, number>();
  const kept: Draft[] = [];
  for (const row of sortDrafts(rows)) {
    const count = counts.get(row.kind) ?? 0;
    if (count >= FOLLOW_FEED_LIMIT) continue;
    counts.set(row.kind, count + 1);
    kept.push(row);
  }
  return kept;
}

export function filterFollowFeed(items: readonly FollowFeedItem[], filter: FollowFeedFilter) {
  if (filter === "all") return items.slice(0, FOLLOW_FEED_LIMIT);
  const kind: FollowFeedKind = filter === "reports"
    ? "report"
    : filter === "calendar"
      ? "calendar"
      : filter === "press"
        ? "press"
        : filter === "dividend"
          ? "dividend"
          : "article";
  return items.filter((item) => item.kind === kind);
}

export function buildFollowFeed(input: {
  companies: readonly FollowFeedCompanyInput[];
  followedCount: number;
  available: boolean;
  sourcesUnavailable?: boolean;
  now?: Date;
}): FollowFeedModel {
  const sourcesUnavailable = input.sourcesUnavailable === true;
  if (!input.available) {
    return {
      items: [],
      summary: { followedCount: 0, upcomingReports: 0, newOfficialEvents: 0 },
      mode: "unavailable",
      sourcesUnavailable,
    };
  }
  if (input.followedCount <= 0) {
    return {
      items: [],
      summary: { followedCount: 0, upcomingReports: 0, newOfficialEvents: 0 },
      mode: "onboarding",
      sourcesUnavailable,
    };
  }

  const now = input.now ?? new Date();
  const today = stockholmIsoDate(now);
  const primary = input.companies.flatMap((company) => collectPrimary(company, today, now));
  const usingFallback = primary.length === 0;
  const selected = boundByCategory(usingFallback
    ? input.companies.flatMap((company) => {
        const calendar = nextCalendar(company, today);
        return calendar ? [calendar] : [];
      })
    : primary);
  const items = selected.map(toItem);
  const official = selected.filter((item) => item.kind === "report" || item.kind === "press" || item.kind === "dividend");

  return {
    items,
    summary: {
      followedCount: input.followedCount,
      upcomingReports: selected.filter((item) => item.reportCalendar).length,
      newOfficialEvents: official.length,
    },
    mode: usingFallback ? "calendar_fallback" : "feed",
    sourcesUnavailable,
  };
}
