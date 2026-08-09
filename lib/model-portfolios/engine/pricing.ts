import type { ModelPortfolioMarket } from "./sources";

export type ExecutionSide = "buy" | "sell";

export type RealtimeExecutionQuote = {
  market: ModelPortfolioMarket;
  symbol: string;
  exchange: string;
  currency: string;
  bidMinor: number | null;
  askMinor: number | null;
  lastTradeMinor: number | null;
  marketTimestamp: string;
  receivedAt: string;
  provider: string;
  providerMode: "realtime_quote" | "realtime_trade";
};

export type ExecutionPriceSnapshot = {
  symbol: string;
  exchange: string;
  currency: string;
  side: ExecutionSide;
  executionPriceMinor: number;
  priceBasis: "best_ask" | "best_bid" | "last_trade";
  marketTimestamp: string;
  receivedAt: string;
  provider: string;
};

export type ExecutionPriceResult =
  | { ok: true; snapshot: ExecutionPriceSnapshot }
  | {
      ok: false;
      reason:
        | "invalid_quote"
        | "stale_execution_quote"
        | "future_quote"
        | "no_executable_price";
    };

export const MAX_EXECUTION_QUOTE_AGE_MS = 5_000;
export const FOLLOWER_PUBLICATION_TARGET_MS = 30_000;

function parseTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function positivePrice(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function selectExecutionPrice(
  side: ExecutionSide,
  quote: RealtimeExecutionQuote,
  now: Date,
): ExecutionPriceResult {
  if (!quote.symbol.trim() || !quote.exchange.trim() || !quote.currency.trim() || !quote.provider.trim()) {
    return { ok: false, reason: "invalid_quote" };
  }

  const marketMs = parseTimestamp(quote.marketTimestamp);
  const nowMs = now.getTime();
  if (marketMs === null || !Number.isFinite(nowMs)) {
    return { ok: false, reason: "invalid_quote" };
  }

  const ageMs = nowMs - marketMs;
  if (ageMs < -1_000) return { ok: false, reason: "future_quote" };
  if (ageMs > MAX_EXECUTION_QUOTE_AGE_MS) {
    return { ok: false, reason: "stale_execution_quote" };
  }

  const preferred = side === "buy" ? quote.askMinor : quote.bidMinor;
  const preferredBasis = side === "buy" ? "best_ask" : "best_bid";
  if (positivePrice(preferred)) {
    return {
      ok: true,
      snapshot: {
        symbol: quote.symbol,
        exchange: quote.exchange,
        currency: quote.currency,
        side,
        executionPriceMinor: preferred,
        priceBasis: preferredBasis,
        marketTimestamp: quote.marketTimestamp,
        receivedAt: quote.receivedAt,
        provider: quote.provider,
      },
    };
  }

  if (quote.providerMode === "realtime_trade" && positivePrice(quote.lastTradeMinor)) {
    return {
      ok: true,
      snapshot: {
        symbol: quote.symbol,
        exchange: quote.exchange,
        currency: quote.currency,
        side,
        executionPriceMinor: quote.lastTradeMinor,
        priceBasis: "last_trade",
        marketTimestamp: quote.marketTimestamp,
        receivedAt: quote.receivedAt,
        provider: quote.provider,
      },
    };
  }

  return { ok: false, reason: "no_executable_price" };
}

export type PublishedModelTrade = ExecutionPriceSnapshot & {
  transactionId: string;
  portfolioId: string;
  quantity: number;
  executedAt: string;
  rationale: string;
};

export function buildFollowerTradePayload(input: PublishedModelTrade) {
  if (!input.transactionId.trim() || !input.portfolioId.trim() || !Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error("invalid_published_trade");
  }

  return {
    type: "model_portfolio_trade" as const,
    transactionId: input.transactionId,
    portfolioId: input.portfolioId,
    symbol: input.symbol,
    exchange: input.exchange,
    side: input.side,
    quantity: input.quantity,
    executionPriceMinor: input.executionPriceMinor,
    currency: input.currency,
    priceBasis: input.priceBasis,
    marketTimestamp: input.marketTimestamp,
    executedAt: input.executedAt,
    provider: input.provider,
    rationale: input.rationale,
    publicationTargetMs: FOLLOWER_PUBLICATION_TARGET_MS,
  };
}
