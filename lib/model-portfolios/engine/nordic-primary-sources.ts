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
 * - Bounded: at most a few disclosures per target company per pass by default;
 *   callers doing dedicated deep research may request a larger but still hard-
 *   capped window without changing the model-portfolio default.
 */

export type NordicPrimaryAttachment = {
  url: string;
  mimeType: string | null;
  fileName: string | null;
};

export type NordicPrimarySourceHit = {
  title: string;
  snippet: string;
  url: string;
  publisher: string;
  company: string;
  sourceKind: "company_primary";
  publishedAt: string | null;
  fetchedAt: string;
  category: string | null;
  market: string | null;
  attachments: NordicPrimaryAttachment[];
};

type NasdaqCnsAttachment = {
  mimetype?: unknown;
  fileName?: unknown;
  attachmentUrl?: unknown;
};

type NasdaqCnsItem = {
  headline?: unknown;
  messageUrl?: unknown;
  releaseTime?: unknown;
  published?: unknown;
  market?: unknown;
  company?: unknown;
  cnsCategory?: unknown;
  attachment?: unknown;
};

type NasdaqCnsResponse = {
  results?: { item?: NasdaqCnsItem[] | NasdaqCnsItem };
  count?: unknown;
};

const NASDAQ_CNS_ENDPOINT = "https://api.news.eu.nasdaq.com/news/query.action";
const USER_AGENT = "DivLab/1.0 nordic-primary-research";
const DEFAULT_MAX_HITS = 2;
const DEFAULT_QUERY_COUNT = 5;
const HARD_MAX_HITS = 12;
const HARD_MAX_QUERY_COUNT = 20;

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

function boundedInteger(value: number | undefined, fallback: number, max: number): number {
  const candidate = Number.isFinite(value) ? Math.floor(value as number) : fallback;
  return Math.max(1, Math.min(max, candidate));
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

function attachmentsFromItem(item: NasdaqCnsItem): NordicPrimaryAttachment[] {
  const raw = item.attachment;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const attachments: NordicPrimaryAttachment[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const attachment = entry as NasdaqCnsAttachment;
    const url = httpsUrl(attachment.attachmentUrl);
    if (!url || seen.has(url)) continue;
    // Official CNS attachments only — never follow arbitrary remote hosts here.
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host !== "attachment.news.eu.nasdaq.com") continue;
    } catch {
      continue;
    }
    seen.add(url);
    attachments.push({
      url,
      mimeType: text(attachment.mimetype),
      fileName: text(attachment.fileName),
    });
    if (attachments.length >= 2) break;
  }
  return attachments;
}

async function queryNasdaqCns(input: {
  company: string;
  fetchImpl: typeof fetch;
  count: number;
}): Promise<NasdaqCnsItem[]> {
  const url = new URL(NASDAQ_CNS_ENDPOINT);
  url.searchParams.set("type", "json");
  // Needed to discover official PDF report attachments for document retrieval.
  url.searchParams.set("showAttachments", "true");
  url.searchParams.set("countResults", "true");
  url.searchParams.set("company", input.company);
  url.searchParams.set("count", String(input.count));
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
 *
 * The model-portfolio caller keeps the conservative defaults (2 hits / 5 CNS
 * rows per alias). Dedicated DivLab Deep Research may explicitly request a
 * wider discovery window, hard-capped at 12 hits / 20 CNS rows per alias.
 */
export async function fetchNordicPrimarySourceEvents(input: {
  companyName: string;
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  maxHits?: number;
  queryCount?: number;
}): Promise<NordicPrimarySourceHit[]> {
  const companyName = input.companyName.trim();
  const symbol = input.symbol.trim();
  if (!companyName || !symbol) return [];

  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date();
  const maxHits = boundedInteger(input.maxHits, DEFAULT_MAX_HITS, HARD_MAX_HITS);
  const queryCount = boundedInteger(input.queryCount, DEFAULT_QUERY_COUNT, HARD_MAX_QUERY_COUNT);
  const aliases = nordicDisclosureCompanyAliases(companyName);
  const hits: NordicPrimarySourceHit[] = [];
  const seenUrls = new Set<string>();

  for (const alias of aliases) {
    if (hits.length >= maxHits) break;
    const items = await queryNasdaqCns({ company: alias, fetchImpl, count: queryCount });
    for (const item of items) {
      if (hits.length >= maxHits) break;
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
      const attachments = attachmentsFromItem(item);
      const publishedAt =
        toIsoMaybe(text(item.releaseTime)) ?? toIsoMaybe(text(item.published));
      const snippetParts = [
        `Officiellt börsmeddelande från ${issuer}.`,
        category ? `Kategori: ${category}.` : null,
        market ? `Marknad: ${market}.` : null,
        attachments.length
          ? `CNS anger ${attachments.length} officiell bilaga(or); bilagetext läses endast efter säker hämtning.`
          : "Ingen officiell bilaga i CNS-svaret.",
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
        category,
        market,
        attachments,
      });
    }
  }

  return hits;
}
