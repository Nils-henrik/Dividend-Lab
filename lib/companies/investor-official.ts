import "server-only";

const INVESTOR_ORIGIN = "https://www.investorab.com";
const PRESS_RELEASES_URL =
  "https://vp053.alertir.com/v4/en/press-releases?origin=https://investorab-new.euwest01.umbraco.io/investors-media/press-releases";
const EVENTS_URL = "https://vp053.alertir.com/v4/en/events-calendar";
const PUBLIC_EVENTS_URL = `${INVESTOR_ORIGIN}/investors-media/events-calendar`;
const REPORTS_URL = `${INVESTOR_ORIGIN}/investors-media/reports-presentations/2026`;
const OWNERSHIP_URL = `${INVESTOR_ORIGIN}/investors-media/the-investor-share/ownership-structure`;
const DIVIDEND_URL = `${INVESTOR_ORIGIN}/investors-media/the-investor-share/dividend-and-dividend-policy`;
const MANAGEMENT_URL = `${INVESTOR_ORIGIN}/about-investor/board-management/executive-leadership-team`;

const USER_AGENT = "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se)";
const MAX_HTML_BYTES = 2_000_000;

export type OfficialItem = {
  title: string;
  date: string | null;
  url: string;
};

export type OwnershipItem = {
  owner: string;
  capitalPct: number;
  votesPct: number | null;
};

export type InvestorOfficialData = {
  pressReleases: OfficialItem[];
  events: OfficialItem[];
  reports: OfficialItem[];
  ownership: OwnershipItem[];
  ownershipAsOf: string | null;
  ceo: string | null;
  dividendPerShare: number | null;
  fetchedAt: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteInvestorUrl(value: string) {
  try {
    const url = new URL(value, INVESTOR_ORIGIN);
    return url.protocol === "https:" ? url.toString() : INVESTOR_ORIGIN;
  } catch {
    return INVESTOR_ORIGIN;
  }
}

function toIsoDate(value: string): string | null {
  const match = value.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

export function parseInvestorPressReleases(html: string): OfficialItem[] {
  return [...html.matchAll(/<div[^>]*class="[^"]*views-row[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*views-row|$)/gi)]
    .map((match) => {
      const block = match[1];
      const date = toIsoDate(decodeHtml(block));
      const anchor = [...block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
        .map((item) => ({ url: item[1], title: decodeHtml(item[2]) }))
        .find((item) => item.title.length > 15);
      return anchor ? { ...anchor, url: absoluteInvestorUrl(anchor.url), date } : null;
    })
    .filter((item): item is OfficialItem => Boolean(item))
    .slice(0, 6);
}

export function parseInvestorEvents(html: string): OfficialItem[] {
  return [...html.matchAll(/<div[^>]*class="[^"]*views-row[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*views-row|$)/gi)]
    .flatMap((match): OfficialItem[] => {
      const block = match[1];
      const date = toIsoDate(decodeHtml(block));
      const titleMatch = block.match(/class="[^"]*views-field-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const title = titleMatch ? decodeHtml(titleMatch[1]) : "";
      if (!date || !title || /^20\d{2}/.test(title)) return [];
      return [{ title, date, url: PUBLIC_EVENTS_URL }];
    })
    .slice(0, 5);
}

export function parseInvestorReports(html: string): OfficialItem[] {
  const seen = new Set<string>();
  return [...html.matchAll(/<a\b[^>]*href="([^"]+\.pdf(?:\?[^"]*)?)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({
      title: decodeHtml(match[2]),
      date: null,
      url: absoluteInvestorUrl(match[1].replace(/&amp;/g, "&")),
    }))
    .filter((item) => {
      if (!item.title || item.title.length > 100 || seen.has(item.url)) return false;
      seen.add(item.url);
      return /report|statement|annual/i.test(item.title);
    })
    .slice(0, 6);
}

function parsePercent(value: string): number | null {
  const parsed = Number(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseInvestorOwnership(html: string): {
  items: OwnershipItem[];
  asOf: string | null;
} {
  const marker = html.search(/ten largest shareholders/i);
  const relevant = marker >= 0 ? html.slice(marker, marker + 60_000) : html;
  const items = [...relevant.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) => [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => decodeHtml(cell[1])))
    .filter((cells) => cells.length >= 6 && cells[0].toLowerCase() !== "owner")
    .map((cells) => ({
      owner: cells[0],
      capitalPct: parsePercent(cells[4]),
      votesPct: parsePercent(cells[5]),
    }))
    .filter((item): item is OwnershipItem => Boolean(item.owner && item.capitalPct !== null))
    .slice(0, 10);
  const asOfMatch = decodeHtml(relevant).match(/as of\s+(\d{1,2})\/(\d{1,2})\s+(20\d{2})/i);
  return {
    items,
    asOf: asOfMatch
      ? `${asOfMatch[3]}-${asOfMatch[1].padStart(2, "0")}-${asOfMatch[2].padStart(2, "0")}`
      : null,
  };
}

export function parseInvestorCeo(html: string): string | null {
  const match = html.match(/<h3[^>]*class="[^"]*business-card__name[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]{0,400}?Chief Executive Officer/i);
  return match ? decodeHtml(match[1]) : null;
}

export function parseInvestorDividend(html: string): number | null {
  const text = decodeHtml(html);
  const match = text.match(/dividend[^.]{0,180}?(?:SEK\s*)?(\d+[.,]\d{1,2})\s*(?:SEK|kronor|per share)/i)
    ?? text.match(/(?:SEK\s*)?(\d+[.,]\d{1,2})\s*(?:SEK\s*)?per share/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value > 0 && value < 100 ? value : null;
}

async function fetchOfficialHtml(url: string, revalidate: number) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": USER_AGENT },
      next: { revalidate },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return "";
    const html = await response.text();
    return html.length <= MAX_HTML_BYTES ? html : "";
  } catch {
    return "";
  }
}

export async function getInvestorOfficialData(): Promise<InvestorOfficialData> {
  const [pressHtml, eventsHtml, reportsHtml, ownershipHtml, managementHtml, dividendHtml] =
    await Promise.all([
      fetchOfficialHtml(PRESS_RELEASES_URL, 900),
      fetchOfficialHtml(EVENTS_URL, 3600),
      fetchOfficialHtml(REPORTS_URL, 14_400),
      fetchOfficialHtml(OWNERSHIP_URL, 86_400),
      fetchOfficialHtml(MANAGEMENT_URL, 86_400),
      fetchOfficialHtml(DIVIDEND_URL, 86_400),
    ]);
  const ownership = parseInvestorOwnership(ownershipHtml);
  return {
    pressReleases: parseInvestorPressReleases(pressHtml),
    events: parseInvestorEvents(eventsHtml),
    reports: parseInvestorReports(reportsHtml),
    ownership: ownership.items,
    ownershipAsOf: ownership.asOf,
    ceo: parseInvestorCeo(managementHtml),
    dividendPerShare: parseInvestorDividend(dividendHtml),
    fetchedAt: new Date().toISOString(),
  };
}
