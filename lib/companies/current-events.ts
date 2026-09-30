import { DELAYED_MARKET_DATA_LABEL } from "@/lib/companies/source-labels";

export const MATERIAL_DAY_MOVE_PERCENT = 3;
export const CURRENT_EVENT_LIMIT = 6;

export type CurrentEvent = {
  kind: "calendar" | "report" | "press" | "news" | "price_move" | "dividend";
  title: string;
  date: string | null;
  sourceLabel: string;
  href: string;
};

function isoDay(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  return value.slice(0, 10);
}

export function stockholmIsoDate(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function buildCurrentEvents(input: {
  events: readonly { title: string; date: string | null; url: string; publisher: string | null }[];
  reports: readonly { title: string; date: string | null; url: string; publisher: string | null }[];
  press: readonly { title: string; date: string | null; url: string; publisher: string | null }[];
  articles: readonly { title: string; publishedAt: string; href: string }[];
  dividend?: { title: string; date: string | null; url: string; publisher: string | null } | null;
  changePct: number | null;
  marketTimestamp: string | null;
  marketSourceUrl: string | null;
  now?: Date;
}): CurrentEvent[] {
  const today = stockholmIsoDate(input.now ?? new Date());
  const rows: CurrentEvent[] = [];
  const nextEvent = input.events
    .flatMap((event) => {
      const date = isoDay(event.date);
      return date && date >= today ? [{ ...event, date }] : [];
    })
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  if (nextEvent?.url) {
    rows.push({
      kind: "calendar",
      title: nextEvent.title,
      date: nextEvent.date,
      sourceLabel: nextEvent.publisher ?? "Officiell kalender",
      href: nextEvent.url,
    });
  }
  const report = input.reports[0];
  if (report?.url) {
    rows.push({
      kind: "report",
      title: report.title,
      date: report.date,
      sourceLabel: report.publisher ?? "Officiell rapport",
      href: report.url,
    });
  }
  if (input.dividend?.url) {
    rows.push({
      kind: "dividend",
      title: input.dividend.title,
      date: input.dividend.date,
      sourceLabel: input.dividend.publisher ?? "Officiell utdelning",
      href: input.dividend.url,
    });
  }
  const press = input.press[0];
  if (press?.url) {
    rows.push({
      kind: "press",
      title: press.title,
      date: press.date,
      sourceLabel: press.publisher ?? "Officiellt pressmeddelande",
      href: press.url,
    });
  }
  const article = input.articles[0];
  if (article) {
    rows.push({
      kind: "news",
      title: article.title,
      date: isoDay(article.publishedAt),
      sourceLabel: "DivLab",
      href: article.href,
    });
  }
  if (
    input.changePct !== null &&
    Number.isFinite(input.changePct) &&
    Math.abs(input.changePct) >= MATERIAL_DAY_MOVE_PERCENT &&
    input.marketTimestamp &&
    input.marketSourceUrl
  ) {
    const sign = input.changePct > 0 ? "+" : "";
    rows.push({
      kind: "price_move",
      title: `Dagsförändring ${sign}${input.changePct.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`,
      date: isoDay(input.marketTimestamp),
      sourceLabel: DELAYED_MARKET_DATA_LABEL,
      href: input.marketSourceUrl,
    });
  }
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  return rows.filter((row) => {
    const url = eventKey(row.href);
    const title = titleKey(row.title);
    if (seenUrls.has(url) || (title && seenTitles.has(title))) return false;
    seenUrls.add(url);
    if (title) seenTitles.add(title);
    return true;
  }).slice(0, CURRENT_EVENT_LIMIT);
}
