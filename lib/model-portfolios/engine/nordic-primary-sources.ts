import "server-only";

/**
 * Nordic company-primary event evidence.
 *
 * Source contract:
 * - Prefer official exchange disclosures from Nasdaq Nordic CNS
 *   (`api.news.eu.nasdaq.com`) for Stockholm/Copenhagen/Helsinki listings.
 * - Attribute the destination publisher/domain (news.eu.nasdaq.com / company).
 * - Never convert headlines into invented financial metrics.
 * - Google remains optional supplemental discovery only (see google-research.ts).
 * - Oslo/Euronext lacks a stable public JSON news endpoint here; when CNS has
 *   no match we degrade to zero primary hits (HOLD), never fabricate evidence.
 * - Bounded: at most a few disclosures per target company per pass.
 */

export type NordicPrimarySourceHit = {
  title: string;
  snippet: string;
  url: string;
  publisher: string;
  company: string;
  sourceKind: "company_primary";
  publishedAt: string | null;
  fetchedAt: string;
};

type NasdaqCnsItem = {
  headline?: unknown;
  messageUrl?: unknown;
  releaseTime?: unknown;
  published?: unknown;
  market?: unknown;
  company?: unknown;
  cnsCategory?: unknown;
};

type NasdaqCnsResponse = {
  results?: { item?: NasdaqCnsItem[] | NasdaqCnsItem };
  count?: unknown;
};

const NASDAQ_CNS_ENDPOINT = "https://api.news.eu.nasdaq.com/news/query.action";
const USER_AGENT = "DivLab/1.0 nordic-primary-research";
const MAX_HITS = 2;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function httpsUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function publisherFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "news.eu.nasdaq.com";
  }
}

function toIsoMaybe(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

/**
 * Build query aliases from seed display names like "Atlas Copco AB ser. A".
 */
export function nordicDisclosureCompanyAliases(companyName: string): string[] {
  const raw = companyName.trim();
  if (!raw) return [];
  const aliases = new Set<string>();
  aliases.add(raw);

  const withoutSeries = raw
    .replace(/\s+ser\.?\s*[A-Z]\b/gi, "")
    .replace(/\s*\((?:SDR|B|A)\)\s*$/i, "")
    .replace(/\s+[AB]$/i, "")
    .trim();
  if (withoutSeries) aliases.add(withoutSeries);

  const withoutLegal = withoutSeries
    .replace(/\s+(AB|ASA|Oyj|A\/S|Plc|PLC|Ltd|Limited|Group)\b\.?$/i, "")
    .trim();
  if (withoutLegal) aliases.add(withoutLegal);

  // First two significant tokens often match CNS issuer names ("Atlas Copco", "Novo Nordisk").
  const tokens = withoutLegal.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) aliases.add(tokens.slice(0, 2).join(" "));
  if (tokens.length >= 1 && tokens[0]!.length >= 4) aliases.add(tokens[0]!);

  return [...aliases].filter((item) => item.length >= 3).slice(0, 5);
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function companyNamesLikelyMatch(candidateCompany: string, targetCompany: string): boolean {
  const left = normalizeName(candidateCompany);
  const right = normalizeName(targetCompany);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = left.split(" ").filter((token) => token.length > 2);
  const rightTokens = right.split(" ").filter((token) => token.length > 2);
  if (!leftTokens.length || !rightTokens.length) return false;
  const overlap = rightTokens.filter((token) => leftTokens.includes(token)).length;
  return overlap >= Math.min(2, rightTokens.length);
}

function itemsFromBody(body: NasdaqCnsResponse): NasdaqCnsItem[] {
  const raw = body.results?.item;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

async function queryNasdaqCns(input: {
  company: string;
  fetchImpl: typeof fetch;
}): Promise<NasdaqCnsItem[]> {
  const url = new URL(NASDAQ_CNS_ENDPOINT);
  url.searchParams.set("type", "json");
  url.searchParams.set("showAttachments", "false");
  url.searchParams.set("countResults", "true");
  url.searchParams.set("company", input.company);
  url.searchParams.set("count", "5");
  url.searchParams.set("start", "0");
  url.searchParams.set("dir", "DESC");

  try {
    const response = await input.fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 3_600 },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as NasdaqCnsResponse;
    return itemsFromBody(body);
  } catch {
    return [];
  }
}

/**
 * Fetch bounded official exchange disclosures for a Nordic shortlist name.
 * Returns [] when no matching primary evidence is discoverable.
 */
export async function fetchNordicPrimarySourceEvents(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<NordicPrimarySourceHit[]> {
  const companyName = input.companyName.trim();
  const symbol = input.symbol.trim();
  if (!companyName || !symbol) return [];

  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date();
  const aliases = nordicDisclosureCompanyAliases(companyName);
  const hits: NordicPrimarySourceHit[] = [];
  const seenUrls = new Set<string>();

  for (const alias of aliases) {
    if (hits.length >= MAX_HITS) break;
    const items = await queryNasdaqCns({ company: alias, fetchImpl });
    for (const item of items) {
      if (hits.length >= MAX_HITS) break;
      const issuer = text(item.company);
      const title = text(item.headline);
      const url = httpsUrl(item.messageUrl);
      if (!issuer || !title || !url) continue;
      if (!companyNamesLikelyMatch(issuer, companyName) && !companyNamesLikelyMatch(issuer, alias)) {
        continue;
      }
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);

      const category = text(item.cnsCategory);
      const market = text(item.market);
      const publishedAt =
        toIsoMaybe(text(item.releaseTime)) ?? toIsoMaybe(text(item.published));
      const snippetParts = [
        `Officiellt börsmeddelande från ${issuer}.`,
        category ? `Kategori: ${category}.` : null,
        market ? `Marknad: ${market}.` : null,
        "Primärkälla (börsdisclosure). Ingen nyckeltal har härletts ur rubriken.",
      ].filter(Boolean);

      hits.push({
        title: title.slice(0, 200),
        snippet: snippetParts.join(" ").slice(0, 1_400),
        url,
        publisher: publisherFromUrl(url),
        company: issuer,
        sourceKind: "company_primary",
        publishedAt,
        fetchedAt: now.toISOString(),
      });
    }
  }

  return hits;
}
