export type AnalysisInstrumentKind = "equity" | "index" | "etf" | "other";

export type AnalysisInstrumentSearchResult = {
  yahooSymbol: string;
  symbol: string;
  exchange: string;
  name: string;
  kind: AnalysisInstrumentKind;
  currency: string | null;
  supported: boolean;
  unsupportedReason: string | null;
};

type YahooSearchQuote = {
  symbol?: unknown;
  shortname?: unknown;
  longname?: unknown;
  quoteType?: unknown;
  exchange?: unknown;
  exchDisp?: unknown;
  currency?: unknown;
};

type YahooSearchResponse = {
  quotes?: YahooSearchQuote[];
};

const SEARCH_ENDPOINT = "https://query1.finance.yahoo.com/v1/finance/search";
const USER_AGENT = "DivLab/1.0 analysis-instrument-search";
const NORDIC_SUFFIXES = {
  ".ST": "ST",
  ".CO": "CO",
  ".HE": "HE",
  ".OL": "OL",
} as const;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function kindFromQuoteType(value: unknown): AnalysisInstrumentKind {
  const type = text(value)?.toUpperCase();
  if (type === "EQUITY") return "equity";
  if (type === "INDEX") return "index";
  if (type === "ETF") return "etf";
  return "other";
}

function nordicIdentity(yahooSymbol: string): { symbol: string; exchange: string } | null {
  const upper = yahooSymbol.trim().toUpperCase();
  for (const [suffix, exchange] of Object.entries(NORDIC_SUFFIXES)) {
    if (upper.endsWith(suffix)) {
      return {
        symbol: upper.slice(0, -suffix.length),
        exchange,
      };
    }
  }
  return null;
}

function normalizedName(quote: YahooSearchQuote, yahooSymbol: string): string {
  return text(quote.longname) ?? text(quote.shortname) ?? yahooSymbol;
}

function normalizedCurrency(quote: YahooSearchQuote): string | null {
  return text(quote.currency)?.toUpperCase() ?? null;
}

function unsupportedReasonFor(input: {
  kind: AnalysisInstrumentKind;
  identity: { symbol: string; exchange: string } | null;
}): string | null {
  if (input.kind === "index") {
    return "Index hittas, men DivLabs separata indexmetodik måste vara klar innan index kan publiceras med bolagsmotorns 100/100-grindar.";
  }
  if (input.kind === "etf") {
    return "ETF hittas, men ETF-metodiken är ännu inte kopplad till publiceringsmotorn.";
  }
  if (input.kind !== "equity") {
    return "Instrumenttypen stöds ännu inte av DivLabs publiceringsmotor.";
  }
  if (!input.identity) {
    return "Just nu kan nya bolagsanalyser skapas för nordiska aktier på Stockholm, Köpenhamn, Helsingfors och Oslo.";
  }
  return null;
}

export function normalizeYahooSearchQuotes(
  quotes: readonly YahooSearchQuote[],
): AnalysisInstrumentSearchResult[] {
  const output: AnalysisInstrumentSearchResult[] = [];
  const seen = new Set<string>();

  for (const quote of quotes) {
    const yahooSymbol = text(quote.symbol)?.toUpperCase();
    if (!yahooSymbol || seen.has(yahooSymbol)) continue;
    seen.add(yahooSymbol);

    const kind = kindFromQuoteType(quote.quoteType);
    const identity = nordicIdentity(yahooSymbol);
    const unsupportedReason = unsupportedReasonFor({ kind, identity });

    output.push({
      yahooSymbol,
      symbol: identity?.symbol ?? yahooSymbol,
      exchange: identity?.exchange ?? (text(quote.exchange)?.toUpperCase() ?? "INDEX"),
      name: normalizedName(quote, yahooSymbol),
      kind,
      currency: normalizedCurrency(quote),
      supported: unsupportedReason === null,
      unsupportedReason,
    });
  }

  return output;
}

function omxs30Fallback(query: string): AnalysisInstrumentSearchResult | null {
  const normalized = query.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!["OMXS30", "OMX30", "OMXSTOCKHOLM30"].includes(normalized)) return null;
  return {
    yahooSymbol: "^OMX",
    symbol: "^OMX",
    exchange: "INDEX",
    name: "OMX Stockholm 30 Index",
    kind: "index",
    currency: "SEK",
    supported: false,
    unsupportedReason:
      "OMXS30 hittas korrekt. Index kräver en egen teknisk/makro-metodik och får inte köras genom bolagsmotorns årsrapport- och värderingsgrindar.",
  };
}

export async function searchAnalysisInstruments(input: {
  query: string;
  fetchImpl?: typeof fetch;
  limit?: number;
}): Promise<AnalysisInstrumentSearchResult[]> {
  const query = input.query.trim();
  if (query.length < 2) return [];

  const fetchImpl = input.fetchImpl ?? fetch;
  const limit = Math.max(1, Math.min(input.limit ?? 8, 12));
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("quotesCount", String(limit));
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("enableFuzzyQuery", "true");

  let normalized: AnalysisInstrumentSearchResult[] = [];
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });
    if (response.ok) {
      const body = (await response.json()) as YahooSearchResponse;
      normalized = normalizeYahooSearchQuotes(body.quotes ?? []);
    }
  } catch {
    normalized = [];
  }

  const fallback = omxs30Fallback(query);
  if (fallback && !normalized.some((item) => item.yahooSymbol === fallback.yahooSymbol)) {
    normalized.unshift(fallback);
  }

  return normalized.slice(0, limit);
}

function yahooSymbolForNordicEquity(symbol: string, exchange: string): string | null {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedExchange = exchange.trim().toUpperCase();
  if (!normalizedSymbol) return null;
  const suffix = ({ ST: ".ST", CO: ".CO", HE: ".HE", OL: ".OL" } as Record<string, string>)[
    normalizedExchange
  ];
  return suffix ? `${normalizedSymbol}${suffix}` : null;
}

export async function resolveNordicEquityAnalysisTarget(input: {
  symbol: string;
  exchange: string;
  fetchImpl?: typeof fetch;
}): Promise<{
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
} | null> {
  const expectedYahooSymbol = yahooSymbolForNordicEquity(input.symbol, input.exchange);
  if (!expectedYahooSymbol) return null;

  const matches = await searchAnalysisInstruments({
    query: expectedYahooSymbol,
    fetchImpl: input.fetchImpl,
    limit: 10,
  });
  const exact = matches.find(
    (candidate) =>
      candidate.supported &&
      candidate.kind === "equity" &&
      candidate.yahooSymbol === expectedYahooSymbol,
  );
  if (!exact) return null;

  return {
    symbol: exact.symbol,
    exchange: exact.exchange,
    name: exact.name,
    yahooSymbol: exact.yahooSymbol,
  };
}
