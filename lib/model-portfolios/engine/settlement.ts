import { MODEL_PORTFOLIO_COURTAGE_MINOR } from "./fees";
import {
  convertNativeMinorToSek,
  isSupportedTradeCurrency,
  type FxRateToSek,
  type SupportedTradeCurrency,
} from "./fx";
import type { ModelPortfolioRiskRules } from "./risk";
import { validateModelPortfolioBuyRisk } from "./risk";

export const SETTLEMENT_IDEMPOTENCY_PREFIX = "settle:decision:";

export type SettlementSide = "buy" | "sell";

export type SettlementExecutionQuote = {
  symbol: string;
  exchange: string;
  instrumentName: string;
  /** Native/instrument currency. */
  nativeCurrency: string;
  /** Native share price in minor units of nativeCurrency. */
  nativePriceMinor: number;
  asOf: string;
  sourcePublisher: string;
  /** Required when nativeCurrency !== SEK. */
  fxRateToSek?: FxRateToSek | null;
};

export type SettlementDecisionRef = {
  decisionId: string;
  /** True when this decision is already status=executed in storage. */
  alreadyExecuted: boolean;
  /** Existing transaction idempotency key if a settle row already exists. */
  existingIdempotencyKey?: string | null;
};

export type BuySettlementInput = {
  now: Date;
  decision: SettlementDecisionRef;
  quote: SettlementExecutionQuote;
  rules: ModelPortfolioRiskRules;
  portfolioValueMinor: number;
  cashMinor: number;
  investedMinor: number;
  currentPositionValueMinor: number;
  currentHoldingQuantity: number;
  /** Existing average cost in SEK minor (0 when flat). */
  currentAverageCostMinor?: number;
  /** Desired target portfolio weight for the position after the trade (0–100). */
  proposedPortfolioPct: number;
  rationale: string;
};

export type SellSettlementInput = {
  now: Date;
  decision: SettlementDecisionRef;
  quote: SettlementExecutionQuote;
  cashMinor: number;
  currentHoldingQuantity: number;
  currentAverageCostMinor: number;
  /** Whole shares to sell. If omitted, sells entire holding. */
  quantityToSell?: number;
  rationale: string;
};

export type SettledTradePlan = {
  side: SettlementSide;
  idempotencyKey: string;
  symbol: string;
  exchange: string;
  instrumentName: string;
  quantity: number;
  nativeCurrency: SupportedTradeCurrency;
  nativePriceMinor: number;
  fxToSek: number;
  grossNativeMinor: number;
  /** SEK price per share (minor). */
  priceMinor: number;
  /** SEK gross share value before courtage (minor). */
  grossAmountMinor: number;
  feeMinor: number;
  /** Net SEK cash delta (negative for buy, positive for sell after fee). */
  cashDeltaMinor: number;
  cashAfterMinor: number;
  holdingQuantityAfter: number;
  averageCostMinorAfter: number;
  marketDataAsOf: string;
  rationale: string;
  decisionId: string;
};

export type SettlementResult =
  | { ok: true; plan: SettledTradePlan }
  | { ok: true; alreadySettled: true; idempotencyKey: string; decisionId: string }
  | {
      ok: false;
      reason:
        | "already_executed"
        | "invalid_decision"
        | "invalid_quote"
        | "unsupported_currency"
        | "fx_required"
        | "invalid_fx"
        | "insufficient_cash"
        | "insufficient_cash_for_fee"
        | "zero_quantity"
        | "oversell"
        | "negative_cash"
        | "risk_rejected"
        | "invalid_portfolio_state";
      detail?: string;
    };

function settlementIdempotencyKey(decisionId: string): string {
  return `${SETTLEMENT_IDEMPOTENCY_PREFIX}${decisionId}`;
}

function assertPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function resolveQuotePriceSek(quote: SettlementExecutionQuote):
  | {
      ok: true;
      nativeCurrency: SupportedTradeCurrency;
      nativePriceMinor: number;
      priceMinor: number;
      fxToSek: number;
    }
  | { ok: false; reason: SettlementResult & { ok: false } extends never ? never : "unsupported_currency" | "fx_required" | "invalid_fx" | "invalid_quote" } {
  if (
    !quote.symbol.trim() ||
    !quote.exchange.trim() ||
    !quote.instrumentName.trim() ||
    !quote.sourcePublisher.trim() ||
    !quote.asOf.trim() ||
    !assertPositiveFinite(quote.nativePriceMinor)
  ) {
    return { ok: false, reason: "invalid_quote" };
  }

  if (!isSupportedTradeCurrency(quote.nativeCurrency)) {
    return { ok: false, reason: "unsupported_currency" };
  }

  const converted = convertNativeMinorToSek({
    nativeMinor: quote.nativePriceMinor,
    nativeCurrency: quote.nativeCurrency,
    fxRateToSek: quote.fxRateToSek,
  });

  if (!converted.ok) {
    return { ok: false, reason: converted.reason === "invalid_amount" ? "invalid_quote" : converted.reason };
  }

  return {
    ok: true,
    nativeCurrency: converted.nativeCurrency,
    nativePriceMinor: converted.nativeMinor,
    priceMinor: converted.sekMinor,
    fxToSek: converted.fxToSek,
  };
}

function checkIdempotency(decision: SettlementDecisionRef): SettlementResult | null {
  if (!decision.decisionId.trim()) {
    return { ok: false, reason: "invalid_decision" };
  }
  const key = settlementIdempotencyKey(decision.decisionId);
  if (decision.alreadyExecuted || decision.existingIdempotencyKey === key) {
    return { ok: true, alreadySettled: true, idempotencyKey: key, decisionId: decision.decisionId };
  }
  return null;
}

/**
 * Derive whole-share BUY quantity from target weight and available SEK cash,
 * reserving fixed courtage so cash never goes negative.
 */
export function sizeWholeShareBuy(input: {
  cashMinor: number;
  portfolioValueMinor: number;
  proposedPortfolioPct: number;
  priceSekMinor: number;
  feeMinor?: number;
}): { quantity: number; spendableForSharesMinor: number } {
  const fee = input.feeMinor ?? MODEL_PORTFOLIO_COURTAGE_MINOR;
  if (
    input.cashMinor < fee ||
    input.priceSekMinor <= 0 ||
    input.portfolioValueMinor <= 0 ||
    !Number.isFinite(input.proposedPortfolioPct) ||
    input.proposedPortfolioPct <= 0
  ) {
    return { quantity: 0, spendableForSharesMinor: 0 };
  }

  const cashForShares = input.cashMinor - fee;
  const targetPositionMinor = Math.floor((input.portfolioValueMinor * input.proposedPortfolioPct) / 100);
  const spendableForSharesMinor = Math.max(0, Math.min(cashForShares, targetPositionMinor));
  const quantity = Math.floor(spendableForSharesMinor / input.priceSekMinor);
  return { quantity, spendableForSharesMinor };
}

export function planBuySettlement(input: BuySettlementInput): SettlementResult {
  const idempotent = checkIdempotency(input.decision);
  if (idempotent) return idempotent;

  if (input.cashMinor < 0 || input.investedMinor < 0 || input.currentHoldingQuantity < 0) {
    return { ok: false, reason: "invalid_portfolio_state" };
  }

  if (input.cashMinor < MODEL_PORTFOLIO_COURTAGE_MINOR) {
    return { ok: false, reason: "insufficient_cash_for_fee" };
  }

  const priced = resolveQuotePriceSek(input.quote);
  if (!priced.ok) return { ok: false, reason: priced.reason };

  const { quantity } = sizeWholeShareBuy({
    cashMinor: input.cashMinor,
    portfolioValueMinor: input.portfolioValueMinor,
    proposedPortfolioPct: input.proposedPortfolioPct,
    priceSekMinor: priced.priceMinor,
  });

  if (quantity < 1) {
    return { ok: false, reason: "zero_quantity" };
  }

  const grossNativeMinor = priced.nativePriceMinor * quantity;
  const grossAmountMinor = priced.priceMinor * quantity;
  const feeMinor = MODEL_PORTFOLIO_COURTAGE_MINOR;
  const totalDebit = grossAmountMinor + feeMinor;

  if (totalDebit > input.cashMinor) {
    return { ok: false, reason: "insufficient_cash" };
  }

  const risk = validateModelPortfolioBuyRisk({
    now: input.now,
    quote: {
      symbol: input.quote.symbol,
      exchange: input.quote.exchange,
      currency: "SEK",
      priceMinor: priced.priceMinor,
      asOf: input.quote.asOf,
      sourcePublisher: input.quote.sourcePublisher,
    },
    rules: input.rules,
    portfolioValueMinor: input.portfolioValueMinor,
    // Reserve courtage so the risk gate's cash checks reflect fee affordability
    // without treating courtage as invested capital.
    cashMinor: input.cashMinor - feeMinor,
    investedMinor: input.investedMinor,
    currentPositionValueMinor: input.currentPositionValueMinor,
    proposedTradeGrossMinor: grossAmountMinor,
    fxRateToSek: undefined,
  });

  if (!risk.ok) {
    if (risk.reason === "insufficient_cash") return { ok: false, reason: "insufficient_cash" };
    return { ok: false, reason: "risk_rejected", detail: risk.reason };
  }

  const cashAfterMinor = input.cashMinor - totalDebit;
  if (cashAfterMinor < 0) {
    return { ok: false, reason: "negative_cash" };
  }

  const holdingQuantityAfter = input.currentHoldingQuantity + quantity;
  const previousCostBasis = (input.currentAverageCostMinor ?? 0) * input.currentHoldingQuantity;
  const averageCostMinorAfter =
    holdingQuantityAfter <= 0
      ? 0
      : Math.round((previousCostBasis + grossAmountMinor) / holdingQuantityAfter);

  return {
    ok: true,
    plan: {
      side: "buy",
      idempotencyKey: settlementIdempotencyKey(input.decision.decisionId),
      symbol: input.quote.symbol,
      exchange: input.quote.exchange,
      instrumentName: input.quote.instrumentName,
      quantity,
      nativeCurrency: priced.nativeCurrency,
      nativePriceMinor: priced.nativePriceMinor,
      fxToSek: priced.fxToSek,
      grossNativeMinor,
      priceMinor: priced.priceMinor,
      grossAmountMinor,
      feeMinor,
      cashDeltaMinor: -totalDebit,
      cashAfterMinor,
      holdingQuantityAfter,
      averageCostMinorAfter,
      marketDataAsOf: input.quote.asOf,
      rationale: input.rationale,
      decisionId: input.decision.decisionId,
    },
  };
}

export function planSellSettlement(input: SellSettlementInput): SettlementResult {
  const idempotent = checkIdempotency(input.decision);
  if (idempotent) return idempotent;

  if (input.cashMinor < 0 || input.currentHoldingQuantity <= 0) {
    return { ok: false, reason: "invalid_portfolio_state" };
  }

  const priced = resolveQuotePriceSek(input.quote);
  if (!priced.ok) return { ok: false, reason: priced.reason };

  const requested =
    input.quantityToSell === undefined
      ? Math.floor(input.currentHoldingQuantity)
      : Math.floor(input.quantityToSell);

  if (!Number.isFinite(requested) || requested < 1) {
    return { ok: false, reason: "zero_quantity" };
  }

  if (requested > input.currentHoldingQuantity) {
    return { ok: false, reason: "oversell" };
  }

  const grossNativeMinor = priced.nativePriceMinor * requested;
  const grossAmountMinor = priced.priceMinor * requested;
  const feeMinor = MODEL_PORTFOLIO_COURTAGE_MINOR;

  if (grossAmountMinor < feeMinor && input.cashMinor + grossAmountMinor < feeMinor) {
    return { ok: false, reason: "insufficient_cash_for_fee" };
  }

  const cashDeltaMinor = grossAmountMinor - feeMinor;
  const cashAfterMinor = input.cashMinor + cashDeltaMinor;
  if (cashAfterMinor < 0) {
    return { ok: false, reason: "negative_cash" };
  }

  const holdingQuantityAfter = input.currentHoldingQuantity - requested;
  const averageCostMinorAfter = holdingQuantityAfter <= 0 ? 0 : input.currentAverageCostMinor;

  return {
    ok: true,
    plan: {
      side: "sell",
      idempotencyKey: settlementIdempotencyKey(input.decision.decisionId),
      symbol: input.quote.symbol,
      exchange: input.quote.exchange,
      instrumentName: input.quote.instrumentName,
      quantity: requested,
      nativeCurrency: priced.nativeCurrency,
      nativePriceMinor: priced.nativePriceMinor,
      fxToSek: priced.fxToSek,
      grossNativeMinor,
      priceMinor: priced.priceMinor,
      grossAmountMinor,
      feeMinor,
      cashDeltaMinor,
      cashAfterMinor,
      holdingQuantityAfter,
      averageCostMinorAfter,
      marketDataAsOf: input.quote.asOf,
      rationale: input.rationale,
      decisionId: input.decision.decisionId,
    },
  };
}
