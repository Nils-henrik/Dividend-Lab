import "server-only";

import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import { fetchFxRateToSek } from "@/lib/model-portfolios/engine/fx-adapter";
import {
  isSupportedFxCurrency,
  type FxRateQuote,
  type SupportedFxCurrency,
} from "@/lib/model-portfolios/engine/fx";
import {
  canonicalizeInstrumentSymbol,
  toYahooTransportSymbol,
} from "@/lib/model-portfolios/engine/instrument-symbol";
import { fetchYahooHistoryResearch } from "@/lib/model-portfolios/engine/yahoo-research";
import type { DivLabCompanyClassification } from "./company-classification";
import type { AnalysisEvidence } from "./evidence";
import type { CurrencyAwareFundamentalSnapshot } from "./financial-statement-normalizer";
import {
  deriveAnalysisFxConversion,
  type AnalysisFxConversion,
} from "./fx";
import type { FundamentalSnapshot } from "./fundamental-analysis";
import type { AnalysisSource } from "./quality-gate";
import { fetchNordicDivLabAnalysisResearch } from "./nordic-primary-sources";
import { fetchYahooFinancialStatements } from "./yahoo-financials";

export type DivLabResearchInputs = {
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
    yahooSymbol: string;
    currency: string;
    currentPrice: number;
  };
  history: DailyBar[];
  fundamentals: FundamentalSnapshot;
  /** Source-grounded provider metadata used to choose the correct fundamental methodology. */
  companyClassification: DivLabCompanyClassification;
  /** Reporting-currency -> market-currency conversion, only when required and verified. */
  fxConversion: AnalysisFxConversion | null;
  sources: AnalysisSource[];
  evidence: AnalysisEvidence[];
  loadedAt: string;
};

export type DivLabResearchLoadResult =
  | { ok: true; value: DivLabResearchInputs }
  | {
      ok: false;
      reason:
        | "instrument_identity_required"
        | "market_history_unavailable"
        | "current_price_unavailable"
        | "currency_unavailable"
        | "financial_statements_unavailable";
    };

function isoDate(value: string): string {
  return value.includes("T") ? value : `${value}T00:00:00.000Z`;
}

function isNordicExchange(exchange: string): boolean {
  return ["ST", "CO", "HE", "OL"].includes(exchange.toUpperCase());
}

function fxSourceId(quote: FxRateQuote): string {
  return `fx:${quote.base}:SEK:${quote.asOf}`;
}

function fxAnalysisSource(quote: FxRateQuote, verifiedAt: string): AnalysisSource {
  return {
    id: fxSourceId(quote),
    kind: "fx_data",
    publisher: quote.sourcePublisher,
    url: `https://api.frankfurter.app/latest?from=${encodeURIComponent(quote.base)}&to=SEK`,
    publishedAt: quote.asOf,
    verifiedAt,
    primary: false,
  };
}

async function loadReportingToMarketFx(input: {
  snapshot: FundamentalSnapshot;
  marketCurrency: string;
  now: Date;
  fetchImpl?: typeof fetch;
}): Promise<{
  conversion: AnalysisFxConversion | null;
  sources: AnalysisSource[];
}> {
  const currencyAware = input.snapshot as CurrencyAwareFundamentalSnapshot;
  const reportingCurrency = currencyAware.reportingCurrency?.trim().toUpperCase() ?? "";
  const marketCurrency = input.marketCurrency.trim().toUpperCase();

  if (!reportingCurrency || reportingCurrency === marketCurrency) {
    return { conversion: null, sources: [] };
  }
  if (
    !isSupportedFxCurrency(reportingCurrency) ||
    !isSupportedFxCurrency(marketCurrency)
  ) {
    return { conversion: null, sources: [] };
  }

  const bases = new Set<SupportedFxCurrency>();
  if (reportingCurrency !== "SEK") bases.add(reportingCurrency);
  if (marketCurrency !== "SEK") bases.add(marketCurrency);

  const quotes = new Map<SupportedFxCurrency, FxRateQuote>();
  for (const base of bases) {
    const result = await fetchFxRateToSek(
      base,
      input.now,
      input.fetchImpl ?? fetch,
    );
    if (!result.ok) return { conversion: null, sources: [] };
    quotes.set(base, result.quote);
  }

  const sourceQuotes = [...quotes.values()];
  const sources = sourceQuotes.map((quote) =>
    fxAnalysisSource(quote, input.now.toISOString()),
  );
  const sourceIds = sources.map((source) => source.id);
  const conversion = deriveAnalysisFxConversion({
    fromCurrency: reportingCurrency,
    toCurrency: marketCurrency,
    fromToSek: reportingCurrency === "SEK" ? null : quotes.get(reportingCurrency),
    toToSek: marketCurrency === "SEK" ? null : quotes.get(marketCurrency),
    sourceIds,
    now: input.now,
  });

  return conversion
    ? { conversion, sources }
    : { conversion: null, sources: [] };
}

export async function loadDivLabResearchInputs(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<DivLabResearchLoadResult> {
  const symbol = input.symbol.trim();
  const exchange = input.exchange.trim().toUpperCase();
  const name = input.name.trim();
  if (!symbol || !exchange || !name) return { ok: false, reason: "instrument_identity_required" };

  const now = input.now ?? new Date();
  const canonical = canonicalizeInstrumentSymbol(symbol, exchange);
  const yahooSymbol = toYahooTransportSymbol(canonical.baseSymbol, canonical.exchange);
  const market = await fetchYahooHistoryResearch(yahooSymbol, input.fetchImpl);
  if (!market || !market.history.length) {
    return { ok: false, reason: "market_history_unavailable" };
  }

  const lastBar = market.history.at(-1)!;
  const currentPrice = market.quote?.close ?? lastBar.adjustedClose ?? lastBar.close;
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return { ok: false, reason: "current_price_unavailable" };
  }

  const currency = market.currency?.trim().toUpperCase() ?? "";
  if (!currency) return { ok: false, reason: "currency_unavailable" };

  const financials = await fetchYahooFinancialStatements({
    yahooSymbol,
    currency,
    currentPrice,
    fetchImpl: input.fetchImpl,
    now,
  });
  if (!financials) {
    return { ok: false, reason: "financial_statements_unavailable" };
  }

  const marketPublishedAt = market.quote?.timestamp ?? isoDate(lastBar.date);
  const financialSourceId = `yahoo-financials:${canonical.baseSymbol}:${financials.fetchedAt}`;
  const sources: AnalysisSource[] = [
    {
      id: `yahoo-market:${canonical.baseSymbol}:${marketPublishedAt}`,
      kind: "market_data",
      publisher: "Yahoo Finance",
      url: market.sourceUrl,
      publishedAt: marketPublishedAt,
      verifiedAt: now.toISOString(),
      primary: false,
    },
    {
      id: financialSourceId,
      kind: "fundamental_data",
      publisher: "Yahoo Finance",
      url: financials.sourceUrl,
      publishedAt: isoDate(financials.snapshot.asOf),
      verifiedAt: financials.fetchedAt,
      primary: false,
    },
  ];
  const companyClassification: DivLabCompanyClassification = {
    ...financials.companyClassification,
    sourceIds: [financialSourceId],
  };
  const evidence: AnalysisEvidence[] = [];

  const fx = await loadReportingToMarketFx({
    snapshot: financials.snapshot,
    marketCurrency: currency,
    now,
    fetchImpl: input.fetchImpl,
  });
  sources.push(...fx.sources);

  if (isNordicExchange(canonical.exchange)) {
    const primaryResearch = await fetchNordicDivLabAnalysisResearch({
      companyName: name,
      symbol: canonical.baseSymbol,
      exchange: canonical.exchange,
      fetchImpl: input.fetchImpl,
      now,
    });
    sources.push(...primaryResearch.sources);
    evidence.push(...primaryResearch.evidence);
  }

  return {
    ok: true,
    value: {
      instrument: {
        symbol: canonical.baseSymbol,
        exchange: canonical.exchange,
        name,
        yahooSymbol,
        currency,
        currentPrice,
      },
      history: [...market.history],
      fundamentals: financials.snapshot,
      companyClassification,
      fxConversion: fx.conversion,
      sources,
      evidence,
      loadedAt: now.toISOString(),
    },
  };
}
