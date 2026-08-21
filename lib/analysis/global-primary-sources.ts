import "server-only";

import { getYahooCrumbSession } from "@/lib/model-portfolios/engine/yahoo-research";

export const GLOBAL_SOURCE_DISCOVERY_VERSION = "global-source-discovery-v1" as const;

export type GlobalSourceKind =
  | "regulatory_annual_filing"
  | "regulatory_interim_filing"
  | "issuer_ir_candidate"
  | "issuer_website_candidate";

export type GlobalPrimarySource = {
  id: string;
  kind: GlobalSourceKind;
  publisher: string;
  url: string;
  publishedAt: string | null;
  verifiedAt: string;
  primary: boolean;
  form: string | null;
};

export type GlobalSourceDiscoveryResult = {
  version: typeof GLOBAL_SOURCE_DISCOVERY_VERSION;
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  companyName: string;
  sources: GlobalPrimarySource[];
  primarySourceCount: number;
  annualPrimaryCount: number;
  interimPrimaryCount: number;
  readyForEvidenceExtraction: boolean;
  status: "verified_primary" | "candidate_only" | "unavailable";
  reason: string;
};

type SecTickerRow = {
  cik_str?: unknown;
  ticker?: unknown;
  title?: unknown;
};

type SecSubmissions = {
  name?: unknown;
  website?: unknown;
  investorWebsite?: unknown;
  filings?: {
    recent?: {
      accessionNumber?: unknown;
      filingDate?: unknown;
      form?: unknown;
      primaryDocument?: unknown;
    };
  };
};

type YahooProfilePayload = {
  quoteSummary?: {
    result?: Array<{
      assetProfile?: {
        website?: unknown;
      };
    }>;
  };
};

const SEC_TICKER_ENDPOINT = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_ENDPOINT = "https://data.sec.gov/submissions";
const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const SEC_USER_AGENT = "DivLab/1.0 (+https://divlab.se/contact)";
const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const MAX_SEC_FILINGS = 4;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function integer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function safeHttpsUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!url.hostname || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizedSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function cik10(value: number): string {
  return String(value).padStart(10, "0");
}

function secArchiveUrl(input: {
  cik: number;
  accessionNumber: string;
  primaryDocument: string;
}): string | null {
  const accession = input.accessionNumber.replace(/-/g, "");
  const document = input.primaryDocument.trim();
  if (!/^\d+$/.test(accession) || !/^[A-Za-z0-9._-]+$/.test(document)) return null;
  return `https://www.sec.gov/Archives/edgar/data/${input.cik}/${accession}/${encodeURIComponent(document)}`;
}

function recentColumn(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => text(item) ?? "")
    : [];
}

function sourceKindForForm(form: string): GlobalSourceKind | null {
  const normalized = form.toUpperCase();
  if (["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"].includes(normalized)) {
    return "regulatory_annual_filing";
  }
  if (["10-Q", "10-Q/A", "6-K", "6-K/A"].includes(normalized)) {
    return "regulatory_interim_filing";
  }
  return null;
}

export function parseSecTickerDirectory(
  payload: unknown,
  expectedTicker: string,
): { cik: number; ticker: string; title: string } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const ticker = normalizedSymbol(expectedTicker);
  if (!ticker || ticker.includes(".")) return null;

  for (const row of Object.values(payload as Record<string, unknown>)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const candidate = row as SecTickerRow;
    const candidateTicker = text(candidate.ticker)?.toUpperCase() ?? "";
    if (candidateTicker !== ticker) continue;
    const cik = integer(candidate.cik_str);
    const title = text(candidate.title);
    if (!cik || !title) return null;
    return { cik, ticker: candidateTicker, title };
  }
  return null;
}

export function parseSecPrimarySources(input: {
  payload: unknown;
  cik: number;
  ticker: string;
  now: Date;
}): GlobalPrimarySource[] {
  if (!Number.isFinite(input.now.getTime())) return [];
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) return [];

  const body = input.payload as SecSubmissions;
  const recent = body.filings?.recent;
  if (!recent) return [];

  const accessions = recentColumn(recent.accessionNumber);
  const dates = recentColumn(recent.filingDate);
  const forms = recentColumn(recent.form);
  const documents = recentColumn(recent.primaryDocument);
  const length = Math.min(accessions.length, dates.length, forms.length, documents.length);
  const sources: GlobalPrimarySource[] = [];
  let annualAdded = false;
  let interimAdded = false;

  for (let index = 0; index < length && sources.length < MAX_SEC_FILINGS; index += 1) {
    const form = forms[index]!;
    const kind = sourceKindForForm(form);
    if (!kind) continue;
    if (kind === "regulatory_annual_filing" && annualAdded) continue;
    if (kind === "regulatory_interim_filing" && interimAdded) continue;

    const url = secArchiveUrl({
      cik: input.cik,
      accessionNumber: accessions[index]!,
      primaryDocument: documents[index]!,
    });
    const filingDate = dates[index]!;
    if (!url || !/^\d{4}-\d{2}-\d{2}$/.test(filingDate)) continue;

    sources.push({
      id: `sec:${input.cik}:${accessions[index]}`,
      kind,
      publisher: "U.S. Securities and Exchange Commission",
      url,
      publishedAt: `${filingDate}T00:00:00.000Z`,
      verifiedAt: input.now.toISOString(),
      primary: true,
      form,
    });
    if (kind === "regulatory_annual_filing") annualAdded = true;
    if (kind === "regulatory_interim_filing") interimAdded = true;
  }

  return sources;
}

function issuerCandidatesFromSec(input: {
  payload: unknown;
  ticker: string;
  now: Date;
}): GlobalPrimarySource[] {
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) return [];
  const body = input.payload as SecSubmissions;
  const candidates: GlobalPrimarySource[] = [];
  const seen = new Set<string>();

  for (const [kind, raw] of [
    ["issuer_ir_candidate", body.investorWebsite],
    ["issuer_website_candidate", body.website],
  ] as const) {
    const url = safeHttpsUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    candidates.push({
      id: `sec-issuer:${input.ticker}:${kind}`,
      kind,
      publisher: new URL(url).hostname.replace(/^www\./i, ""),
      url,
      publishedAt: null,
      verifiedAt: input.now.toISOString(),
      primary: false,
      form: null,
    });
  }
  return candidates;
}

async function fetchYahooIssuerWebsiteCandidate(input: {
  yahooSymbol: string;
  fetchImpl: typeof fetch;
  now: Date;
}): Promise<GlobalPrimarySource[]> {
  const session = await getYahooCrumbSession(input.fetchImpl, input.now);
  if (!session) return [];

  const url = new URL(`${YAHOO_SUMMARY_ENDPOINT}/${encodeURIComponent(input.yahooSymbol)}`);
  url.searchParams.set("modules", "assetProfile");
  url.searchParams.set("formatted", "false");
  url.searchParams.set("crumb", session.crumb);

  try {
    const response = await input.fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": YAHOO_USER_AGENT,
        Cookie: session.cookie,
      },
      next: { revalidate: 14_400 },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as YahooProfilePayload;
    const website = safeHttpsUrl(body.quoteSummary?.result?.[0]?.assetProfile?.website);
    if (!website) return [];
    return [{
      id: `issuer-website:${input.yahooSymbol}`,
      kind: "issuer_website_candidate",
      publisher: new URL(website).hostname.replace(/^www\./i, ""),
      url: website,
      publishedAt: null,
      verifiedAt: input.now.toISOString(),
      primary: false,
      form: null,
    }];
  } catch {
    return [];
  }
}

async function fetchUsSecSources(input: {
  ticker: string;
  fetchImpl: typeof fetch;
  now: Date;
}): Promise<{ companyName: string | null; sources: GlobalPrimarySource[] }> {
  try {
    const tickerResponse = await input.fetchImpl(SEC_TICKER_ENDPOINT, {
      headers: { Accept: "application/json", "User-Agent": SEC_USER_AGENT },
      next: { revalidate: 86_400 },
    });
    if (!tickerResponse.ok) return { companyName: null, sources: [] };
    const directory = parseSecTickerDirectory(await tickerResponse.json(), input.ticker);
    if (!directory) return { companyName: null, sources: [] };

    const submissionsResponse = await input.fetchImpl(
      `${SEC_SUBMISSIONS_ENDPOINT}/CIK${cik10(directory.cik)}.json`,
      {
        headers: { Accept: "application/json", "User-Agent": SEC_USER_AGENT },
        next: { revalidate: 3_600 },
      },
    );
    if (!submissionsResponse.ok) return { companyName: directory.title, sources: [] };
    const submissions = await submissionsResponse.json();
    return {
      companyName: text((submissions as SecSubmissions).name) ?? directory.title,
      sources: [
        ...parseSecPrimarySources({
          payload: submissions,
          cik: directory.cik,
          ticker: directory.ticker,
          now: input.now,
        }),
        ...issuerCandidatesFromSec({
          payload: submissions,
          ticker: directory.ticker,
          now: input.now,
        }),
      ],
    };
  } catch {
    return { companyName: null, sources: [] };
  }
}

export async function discoverGlobalPrimarySources(input: {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  companyName: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<GlobalSourceDiscoveryResult> {
  const yahooSymbol = normalizedSymbol(input.yahooSymbol);
  const symbol = normalizedSymbol(input.symbol);
  const exchange = normalizedSymbol(input.exchange);
  const companyName = input.companyName.trim();
  const now = input.now ?? new Date();
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!yahooSymbol || !symbol || !exchange || !companyName || !Number.isFinite(now.getTime())) {
    return {
      version: GLOBAL_SOURCE_DISCOVERY_VERSION,
      yahooSymbol,
      symbol,
      exchange,
      companyName,
      sources: [],
      primarySourceCount: 0,
      annualPrimaryCount: 0,
      interimPrimaryCount: 0,
      readyForEvidenceExtraction: false,
      status: "unavailable",
      reason: "Instrumentidentiteten är ofullständig. Ingen global källsökning startades.",
    };
  }

  const sec = exchange === "US"
    ? await fetchUsSecSources({ ticker: symbol, fetchImpl, now })
    : { companyName: null, sources: [] as GlobalPrimarySource[] };
  const issuerFallback = sec.sources.some((source) => source.kind.includes("issuer_"))
    ? []
    : await fetchYahooIssuerWebsiteCandidate({ yahooSymbol, fetchImpl, now });
  const sources = [...sec.sources, ...issuerFallback];
  const primarySources = sources.filter((source) => source.primary);
  const annualPrimaryCount = primarySources.filter(
    (source) => source.kind === "regulatory_annual_filing",
  ).length;
  const interimPrimaryCount = primarySources.filter(
    (source) => source.kind === "regulatory_interim_filing",
  ).length;
  const readyForEvidenceExtraction = annualPrimaryCount >= 1 && interimPrimaryCount >= 1;
  const status = readyForEvidenceExtraction
    ? "verified_primary"
    : sources.length > 0
      ? "candidate_only"
      : "unavailable";
  const reason = readyForEvidenceExtraction
    ? "SEC har verifierat minst en aktuell årsfiling och en interimfiling. Källorna kan gå vidare till en separat, bounded evidence-extraction gate."
    : sources.length > 0
      ? "Bolagets källdomän eller en del av primärkällorna hittades, men DivLab saknar ännu komplett verifierad års- och interimtäckning för denna marknad."
      : "Ingen verifierad global primärkälla hittades. Full Deep Research förblir låst.";

  return {
    version: GLOBAL_SOURCE_DISCOVERY_VERSION,
    yahooSymbol,
    symbol,
    exchange,
    companyName: sec.companyName ?? companyName,
    sources,
    primarySourceCount: primarySources.length,
    annualPrimaryCount,
    interimPrimaryCount,
    readyForEvidenceExtraction,
    status,
    reason,
  };
}
