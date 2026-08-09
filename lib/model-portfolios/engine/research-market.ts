import type { DailyBar, DelayedQuote } from "./eodhd";
import type { ResearchCandidate } from "./research";
import { analyzeTechnicalSignals } from "./technical-analysis";

export type ResearchMarketSignals = Pick<
  ResearchCandidate,
  "avgDailyTurnoverSek" | "priceMomentum20d" | "priceMomentum60d" | "volatility20d" | "technicalAnalysis"
>;

function average(values: readonly number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dailyReturns(bars: readonly DailyBar[]): number[] {
  const returns: number[] = [];
  for (let index = 1; index < bars.length; index += 1) {
    const previous = bars[index - 1]?.adjustedClose ?? bars[index - 1]?.close;
    const current = bars[index]?.adjustedClose ?? bars[index]?.close;
    if (!previous || !current || previous <= 0) continue;
    returns.push(current / previous - 1);
  }
  return returns;
}

function standardDeviation(values: readonly number[]): number | null {
  const mean = average(values);
  if (mean === null || values.length < 2) return null;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function momentum(bars: readonly DailyBar[], sessions: number): number | undefined {
  if (bars.length <= sessions) return undefined;
  const last = bars.at(-1);
  const first = bars.at(-(sessions + 1));
  if (!last || !first) return undefined;
  const lastPrice = last.adjustedClose ?? last.close;
  const firstPrice = first.adjustedClose ?? first.close;
  if (firstPrice <= 0) return undefined;
  return lastPrice / firstPrice - 1;
}

export function deriveResearchMarketSignals(input: {
  history: readonly DailyBar[];
  quote: DelayedQuote | null;
  fxToSek: number;
}): ResearchMarketSignals {
  const { history, quote, fxToSek } = input;
  if (!Number.isFinite(fxToSek) || fxToSek <= 0) throw new Error("invalid_fx_to_sek");

  const recent20 = history.slice(-20);
  const turnovers = recent20
    .map((bar) => (bar.adjustedClose ?? bar.close) * bar.volume * fxToSek)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const quoteTurnover = quote?.close && quote.volume ? quote.close * quote.volume * fxToSek : null;
  if (quoteTurnover !== null && Number.isFinite(quoteTurnover)) turnovers.push(quoteTurnover);

  const returns = dailyReturns(history.slice(-21));
  const dailyVol = standardDeviation(returns);

  return {
    avgDailyTurnoverSek: average(turnovers) ?? undefined,
    priceMomentum20d: momentum(history, 20),
    priceMomentum60d: momentum(history, 60),
    volatility20d: dailyVol === null ? undefined : dailyVol * Math.sqrt(252),
    technicalAnalysis: analyzeTechnicalSignals(history),
  };
}

export function buildMarketResearchCandidate(input: {
  symbol: string;
  exchange: string;
  history: readonly DailyBar[];
  quote: DelayedQuote | null;
  fxToSek: number;
  base?: Partial<ResearchCandidate>;
}): ResearchCandidate {
  return {
    ...input.base,
    symbol: input.symbol,
    exchange: input.exchange,
    ...deriveResearchMarketSignals({ history: input.history, quote: input.quote, fxToSek: input.fxToSek }),
  };
}
