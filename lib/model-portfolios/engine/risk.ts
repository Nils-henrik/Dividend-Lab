export type ModelPortfolioQuote = {
  symbol: string;
  exchange: string;
  currency: string;
  priceMinor: number;
  asOf: string;
  sourcePublisher: string;
};

export type ModelPortfolioRiskRules = {
  maxSinglePositionPct: number;
  minCashPct: number;
  maxEquityPct: number;
};

export type ModelPortfolioBuyRiskInput = {
  now: Date;
  quote: ModelPortfolioQuote;
  rules: ModelPortfolioRiskRules;
  portfolioValueMinor: number;
  cashMinor: number;
  investedMinor: number;
  currentPositionValueMinor: number;
  proposedTradeGrossMinor: number;
  fxRateToSek?: {
    rate: number;
    asOf: string;
    sourcePublisher: string;
  };
};

export type ModelPortfolioRiskGateResult =
  | { ok: true; tradeValueSekMinor: number }
  | {
      ok: false;
      reason:
        | "invalid_quote"
        | "stale_quote"
        | "fx_required"
        | "stale_fx"
        | "insufficient_cash"
        | "min_cash_breached"
        | "max_position_breached"
        | "max_equity_breached"
        | "invalid_portfolio_state";
    };

const MAX_MARKET_DATA_AGE_MS = 30 * 60 * 1000;

function ageMs(now: Date, asOf: string): number | null {
  const timestamp = Date.parse(asOf);
  const nowMs = now.getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(nowMs)) {
    return null;
  }
  return nowMs - timestamp;
}

function isFresh(now: Date, asOf: string): boolean {
  const age = ageMs(now, asOf);
  return age !== null && age >= -60_000 && age <= MAX_MARKET_DATA_AGE_MS;
}

function pct(value: number, total: number): number {
  return total <= 0 ? Number.POSITIVE_INFINITY : (value / total) * 100;
}

export function validateModelPortfolioBuyRisk(
  input: ModelPortfolioBuyRiskInput,
): ModelPortfolioRiskGateResult {
  const {
    now,
    quote,
    rules,
    portfolioValueMinor,
    cashMinor,
    investedMinor,
    currentPositionValueMinor,
    proposedTradeGrossMinor,
  } = input;

  if (
    portfolioValueMinor <= 0 ||
    cashMinor < 0 ||
    investedMinor < 0 ||
    currentPositionValueMinor < 0 ||
    proposedTradeGrossMinor <= 0 ||
    !Number.isFinite(portfolioValueMinor) ||
    !Number.isFinite(cashMinor) ||
    !Number.isFinite(investedMinor) ||
    !Number.isFinite(currentPositionValueMinor) ||
    !Number.isFinite(proposedTradeGrossMinor)
  ) {
    return { ok: false, reason: "invalid_portfolio_state" };
  }

  if (
    quote.priceMinor <= 0 ||
    !Number.isFinite(quote.priceMinor) ||
    !quote.symbol.trim() ||
    !quote.exchange.trim() ||
    !quote.currency.trim() ||
    !quote.sourcePublisher.trim()
  ) {
    return { ok: false, reason: "invalid_quote" };
  }

  if (!isFresh(now, quote.asOf)) {
    return { ok: false, reason: "stale_quote" };
  }

  let tradeValueSekMinor = proposedTradeGrossMinor;
  if (quote.currency !== "SEK") {
    const fx = input.fxRateToSek;
    if (!fx || fx.rate <= 0 || !Number.isFinite(fx.rate) || !fx.sourcePublisher.trim()) {
      return { ok: false, reason: "fx_required" };
    }
    if (!isFresh(now, fx.asOf)) {
      return { ok: false, reason: "stale_fx" };
    }
    tradeValueSekMinor = Math.round(proposedTradeGrossMinor * fx.rate);
  }

  if (tradeValueSekMinor > cashMinor) {
    return { ok: false, reason: "insufficient_cash" };
  }

  const cashAfter = cashMinor - tradeValueSekMinor;
  const investedAfter = investedMinor + tradeValueSekMinor;
  const positionAfter = currentPositionValueMinor + tradeValueSekMinor;

  if (pct(cashAfter, portfolioValueMinor) < rules.minCashPct) {
    return { ok: false, reason: "min_cash_breached" };
  }
  if (pct(positionAfter, portfolioValueMinor) > rules.maxSinglePositionPct) {
    return { ok: false, reason: "max_position_breached" };
  }
  if (pct(investedAfter, portfolioValueMinor) > rules.maxEquityPct) {
    return { ok: false, reason: "max_equity_breached" };
  }

  return { ok: true, tradeValueSekMinor };
}
