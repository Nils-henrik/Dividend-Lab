import "server-only";

import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import {
  canonicalizeInstrumentSymbol,
  toYahooTransportSymbol,
} from "@/lib/model-portfolios/engine/instrument-symbol";
import { fetchYahooHistoryResearch } from "@/lib/model-portfolios/engine/yahoo-research";
import type { FundamentalSnapshot } from "./fundamental-analysis";
import type { AnalysisSource } from "./quality-gate";
import { fetchNordicDivLabAnalysisSources } from "./nordic-primary-sources";
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
  sources: AnalysisSource[];
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
      id: `yahoo-financials:${canonical.baseSymbol}:${financials.fetchedAt}`,
      kind: "fundamental_data",
      publisher: "Yahoo Finance",
      url: financials.sourceUrl,
      publishedAt: isoDate(financials.snapshot.asOf),
      verifiedAt: financials.fetchedAt,
      primary: false,
    },
  ];

  if (isNordicExchange(canonical.exchange)) {
    const primarySources = await fetchNordicDivLabAnalysisSources({
      companyName: name,
      symbol: canonical.baseSymbol,
      exchange: canonical.exchange,
      fetchImpl: input.fetchImpl,
      now,
    });
    sources.push(...primarySources);
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
      sources,
      loadedAt: now.toISOString(),
    },
  };
}
