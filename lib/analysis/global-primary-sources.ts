import "server-only";

import { getYahooCrumbSession } from "@/lib/model-portfolios/engine/yahoo-research";
import {
  GLOBAL_SOURCE_DISCOVERY_VERSION,
  parseSecPrimarySources,
  parseSecTickerDirectory,
  safeHttpsUrl,
  summarizeGlobalSourceDiscovery,
  type GlobalPrimarySource,
  type GlobalSourceDiscoveryResult,
} from "./global-primary-source-contract";

export type {
  GlobalPrimarySource,
  GlobalSourceDiscoveryResult,
  GlobalSourceKind,
} from "./global-primary-source-contract";

const SEC_TICKER_ENDPOINT = "https://www.sec.gov/files/company_tickers.json";
const SEC_SUBMISSIONS_ENDPOINT = "https://data.sec.gov/submissions";
const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const SEC_USER_AGENT = "DivLab/1.0 (+https://divlab.se/contact)";
const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

type SecSubmissions = {
  name?: unknown;
  website?: unknown;
  investorWebsite?: unknown;
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

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizedSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function cik10(value: number): string {
  return String(value).padStart(10, "0");
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

function invalidDiscovery(input: {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  companyName: string;
}): GlobalSourceDiscoveryResult {
  return {
    version: GLOBAL_SOURCE_DISCOVERY_VERSION,
    yahooSymbol: input.yahooSymbol,
    symbol: input.symbol,
    exchange: input.exchange,
    companyName: input.companyName,
    sources: [],
    primarySourceCount: 0,
    annualPrimaryCount: 0,
    interimPrimaryCount: 0,
    readyForEvidenceExtraction: false,
    status: "unavailable",
    reason: "Instrumentidentiteten är ofullständig. Ingen global källsökning startades.",
  };
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
    return invalidDiscovery({ yahooSymbol, symbol, exchange, companyName });
  }

  const sec = exchange === "US"
    ? await fetchUsSecSources({ ticker: symbol, fetchImpl, now })
    : { companyName: null, sources: [] as GlobalPrimarySource[] };

  const hasIssuerCandidate = sec.sources.some((source) =>
    source.kind === "issuer_ir_candidate" || source.kind === "issuer_website_candidate"
  );
  const issuerFallback = hasIssuerCandidate
    ? []
    : await fetchYahooIssuerWebsiteCandidate({ yahooSymbol, fetchImpl, now });

  return summarizeGlobalSourceDiscovery({
    yahooSymbol,
    symbol,
    exchange,
    companyName: sec.companyName ?? companyName,
    sources: [...sec.sources, ...issuerFallback],
  });
}
