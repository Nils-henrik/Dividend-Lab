import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DelayedQuote } from "./eodhd";
import { fetchFxRateToSek } from "./fx-adapter";
import { convertNativeMinorToSek, currencyForExchange, type FxRateQuote, type SupportedFxCurrency } from "./fx";
import { fetchYahooHistoryResearch, toYahooSymbol } from "./yahoo-research";

export type ValuationHolding = {
  portfolio_id: string;
  instrument_symbol: string;
  exchange: string;
  quantity: number | string;
  last_price_minor: number | null;
};

function instrumentKey(symbol: string, exchange: string): string {
  return `${symbol}.${exchange}`.toUpperCase();
}

async function resolveFx(
  currency: SupportedFxCurrency,
  now: Date,
  cache: Map<SupportedFxCurrency, FxRateQuote | null>,
): Promise<FxRateQuote | null> {
  if (currency === "SEK") return null;
  if (cache.has(currency)) return cache.get(currency) ?? null;
  const result = await fetchFxRateToSek(currency, now);
  const quote = result.ok ? result.quote : null;
  cache.set(currency, quote);
  return quote;
}

/**
 * Mark every existing holding to the freshest Yahoo quote available for the run.
 * Reuse quotes from the current research pass first; holdings from another market
 * are fetched explicitly so an hourly AI pass still produces a current portfolio value.
 */
export async function refreshModelPortfolioHoldingPrices(input: {
  supabase: SupabaseClient;
  holdings: ValuationHolding[];
  quotes: Map<string, DelayedQuote>;
  now: Date;
}): Promise<void> {
  const fxCache = new Map<SupportedFxCurrency, FxRateQuote | null>();
  const quoteCache = new Map(input.quotes);
  const externalQuoteAttempts = new Set<string>();

  for (const holding of input.holdings) {
    const key = instrumentKey(holding.instrument_symbol, holding.exchange);
    let quote = quoteCache.get(key);

    if (!quote && !externalQuoteAttempts.has(key)) {
      externalQuoteAttempts.add(key);
      const research = await fetchYahooHistoryResearch(
        toYahooSymbol(holding.instrument_symbol, holding.exchange),
      );
      if (research?.quote) {
        quote = research.quote;
        quoteCache.set(key, research.quote);
      }
    }

    if (!quote || quote.close === null || !Number.isFinite(quote.close) || quote.close <= 0) continue;

    const nativeCurrency = currencyForExchange(holding.exchange);
    if (!nativeCurrency) continue;
    const fxRate = await resolveFx(nativeCurrency, input.now, fxCache);
    if (nativeCurrency !== "SEK" && !fxRate) continue;

    const converted = convertNativeMinorToSek({
      nativeCurrency,
      nativeAmountMinor: Math.round(quote.close * 100),
      fxRateToSek: fxRate,
    });
    if (!converted.ok || converted.sekAmountMinor <= 0) continue;

    const { error } = await input.supabase
      .from("model_portfolio_holdings")
      .update({
        last_price_minor: converted.sekAmountMinor,
        last_price_as_of: quote.timestamp,
        updated_at: input.now.toISOString(),
      })
      .eq("portfolio_id", holding.portfolio_id)
      .eq("instrument_symbol", holding.instrument_symbol)
      .eq("exchange", holding.exchange);
    if (error) throw new Error(`model_portfolio_mark_to_market_failed:${error.code ?? "unknown"}`);

    holding.last_price_minor = converted.sekAmountMinor;
  }
}

/** Persist one point per portfolio after every scheduled/manual valuation run, including HOLD runs. */
export async function persistModelPortfolioValuationSnapshots(input: {
  supabase: SupabaseClient;
  portfolioIds: readonly string[];
  now: Date;
}): Promise<void> {
  if (!input.portfolioIds.length) return;

  const [holdingResult, cashResult] = await Promise.all([
    input.supabase
      .from("model_portfolio_holdings")
      .select("portfolio_id,quantity,last_price_minor,last_price_as_of")
      .in("portfolio_id", [...input.portfolioIds])
      .gt("quantity", 0),
    input.supabase
      .from("model_portfolio_cash_ledger")
      .select("portfolio_id,event_type,amount_minor")
      .in("portfolio_id", [...input.portfolioIds]),
  ]);
  if (holdingResult.error || cashResult.error) {
    throw new Error("model_portfolio_snapshot_state_unavailable");
  }

  const snapshots = input.portfolioIds.map((portfolioId) => {
    const portfolioHoldings = (holdingResult.data ?? []).filter((row) => row.portfolio_id === portfolioId);
    const portfolioCash = (cashResult.data ?? []).filter((row) => row.portfolio_id === portfolioId);
    const cashMinor = portfolioCash.reduce((sum, row) => sum + Number(row.amount_minor), 0);
    const contributedMinor = portfolioCash
      .filter((row) => row.event_type === "initial_capital" || row.event_type === "monthly_contribution")
      .reduce((sum, row) => sum + Number(row.amount_minor), 0);
    const investedMinor = portfolioHoldings.reduce((sum, row) => {
      const quantity = Number(row.quantity);
      const price = Number(row.last_price_minor ?? 0);
      if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0) return sum;
      return sum + Math.round(quantity * price);
    }, 0);
    const marketDataAsOf = portfolioHoldings
      .map((row) => row.last_price_as_of ? Date.parse(String(row.last_price_as_of)) : Number.NaN)
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0];

    return {
      portfolio_id: portfolioId,
      snapshot_at: input.now.toISOString(),
      total_value_minor: cashMinor + investedMinor,
      cash_value_minor: cashMinor,
      invested_value_minor: investedMinor,
      contributed_capital_minor: contributedMinor,
      market_data_as_of: Number.isFinite(marketDataAsOf)
        ? new Date(marketDataAsOf as number).toISOString()
        : null,
    };
  });

  const { error } = await input.supabase.from("model_portfolio_snapshots").insert(snapshots);
  if (error && error.code !== "23505") {
    throw new Error(`model_portfolio_snapshot_insert_failed:${error.code ?? "unknown"}`);
  }
}
