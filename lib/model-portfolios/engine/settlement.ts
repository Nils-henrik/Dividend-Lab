import { buyBrokerageFeeMinor, SIMULATED_BUY_BROKERAGE_FEE_MINOR } from "./fees";
import { convertNativeMinorToSek, currencyForExchange, type FxRateQuote } from "./fx";
import { MODEL_PORTFOLIO_TURNOVER_POLICY, type ModelPortfolioStrategyKey } from "./policy";
import { validateModelPortfolioBuyRisk, type ModelPortfolioRiskRules } from "./risk";
import { evaluateWholeShareBuyEligibility } from "./whole-share-eligibility";

export const SIMULATED_FILL_LABEL = "SIMULATED" as const;
/** Delayed SIMULATED fills may be older than realtime quotes; reject only when clearly stale. */
export const SIMULATED_QUOTE_MAX_AGE_MS = 26 * 60 * 60 * 1_000;

export type SettlementSide = "buy" | "sell";

export type SimulatedFillQuote = {
  symbol: string;
  exchange: string;
  instrumentName: string;
  nativeCurrency: string;
  /** Price in native minor units (öre / cents). */
  nativePriceMinor: number;
  asOf: string;
  sourcePublisher: string;
  delayed: true;
};

export type SettlementHolding = {
  quantity: number;
  averageCostMinor: number;
  lastPriceMinor: number | null;
};

export type SettlementPlanInput = {
  side: SettlementSide;
  portfolioStatus: "draft" | "active" | "paused";
  executionAllowedAtDecisionTime: boolean;
  strategyKey: ModelPortfolioStrategyKey;
  rules: ModelPortfolioRiskRules;
  now: Date;
  cashMinor: number;
  portfolioValueMinor: number;
  investedMinor: number;
  currentHolding: SettlementHolding | null;
  /** Desired target weight for the instrument after the trade (0-100). */
  targetWeightPct: number;
  quote: SimulatedFillQuote;
  fxRateToSek: FxRateQuote | null;
  convictionScore: number;
  materialThesisBreak: boolean;
  hoursSinceLastTradeInInstrument: number | null;
};

export type SettlementPlan =
  | {
      ok: true;
      side: SettlementSide;
      quantity: number;
      nativeCurrency: string;
      nativePriceMinor: number;
      nativeGrossMinor: number;
      fxRateToSek: number;
      fxAsOf: string;
      fxSourcePublisher: string;
      priceSekMinor: number;
      grossAmountSekMinor: number;
      feeSekMinor: number;
      cashDeltaMinor: number;
      averageCostMinorAfter: number;
      quantityAfter: number;
      fillLabel: typeof SIMULATED_FILL_LABEL;
      marketDataAsOf: string;
    }
  | {
      ok: false;
      reason:
        | "portfolio_not_active"
        | "execution_not_allowed"
        | "invalid_target_weight"
        | "invalid_quote"
        | "unsupported_currency"
        | "fx_unavailable"
        | "insufficient_cash"
        | "trade_too_small"
        | "no_position_to_sell"
        | "invalid_portfolio_state"
        | "risk_rejected"
        | string;
    };

function wholeShares(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value + 1e-12);
}

export function planSimulatedSettlement(input: SettlementPlanInput): SettlementPlan {
  if (input.portfolioStatus !== "active") {
    return { ok: false, reason: "portfolio_not_active" };
  }
  if (!input.executionAllowedAtDecisionTime) {
    return { ok: false, reason: "execution_not_allowed" };
  }
  if (
    !Number.isFinite(input.targetWeightPct) ||
    input.targetWeightPct < 0 ||
    input.targetWeightPct > 100
  ) {
    return { ok: false, reason: "invalid_target_weight" };
  }
  if (
    !input.quote.symbol.trim() ||
    !input.quote.exchange.trim() ||
    !input.quote.instrumentName.trim() ||
    !Number.isFinite(input.quote.nativePriceMinor) ||
    !Number.isInteger(input.quote.nativePriceMinor) ||
    input.quote.nativePriceMinor <= 0 ||
    !input.quote.asOf.trim() ||
    !input.quote.sourcePublisher.trim()
  ) {
    return { ok: false, reason: "invalid_quote" };
  }

  const inferredCurrency = currencyForExchange(input.quote.exchange);
  const nativeCurrency = input.quote.nativeCurrency.trim().toUpperCase();
  if (!inferredCurrency || nativeCurrency !== inferredCurrency) {
    return { ok: false, reason: "unsupported_currency" };
  }

  const unitConversion = convertNativeMinorToSek({
    nativeCurrency,
    nativeAmountMinor: input.quote.nativePriceMinor,
    fxRateToSek: input.fxRateToSek,
  });
  if (!unitConversion.ok) {
    return {
      ok: false,
      reason: unitConversion.reason === "fx_unavailable" || unitConversion.reason === "invalid_fx_rate"
        ? "fx_unavailable"
        : unitConversion.reason,
    };
  }

  const priceSekMinor = unitConversion.sekAmountMinor;
  if (priceSekMinor <= 0) return { ok: false, reason: "invalid_quote" };

  const currentQty = input.currentHolding?.quantity ?? 0;
  const currentAvg = input.currentHolding?.averageCostMinor ?? 0;
  const currentPositionValueMinor = Math.round(currentQty * (input.currentHolding?.lastPriceMinor ?? priceSekMinor));

  if (input.side === "buy") {
    const feeSekMinor = buyBrokerageFeeMinor("buy");
    const targetValueMinor = Math.round((input.portfolioValueMinor * input.targetWeightPct) / 100);
    const desiredGrossMinor = Math.max(0, targetValueMinor - currentPositionValueMinor);
    if (desiredGrossMinor <= 0) return { ok: false, reason: "trade_too_small" };

    const affordableGross = input.cashMinor - feeSekMinor;
    if (affordableGross <= 0) return { ok: false, reason: "insufficient_cash" };

    const policy = MODEL_PORTFOLIO_TURNOVER_POLICY[input.strategyKey];
    const minTradeGrossMinor = Math.ceil(
      (input.portfolioValueMinor * policy.minTradePctOfPortfolio) / 100,
    );
    if (desiredGrossMinor < minTradeGrossMinor && !input.materialThesisBreak) {
      return { ok: false, reason: "trade_too_small" };
    }

    const grossBudget = Math.min(desiredGrossMinor, affordableGross);
    let quantity = wholeShares(grossBudget / priceSekMinor);

    // The pre-AI eligibility gate intentionally uses ceil() for the minimum
    // meaningful whole-share trade. Settlement previously used floor() only,
    // so a valid 10% target could become 9.x% (or zero shares) and be rejected
    // as trade_too_small. When the AI has requested at least the policy minimum,
    // round up only to the smallest whole-share quantity that reaches that
    // minimum and only when that quantity still fits all deterministic caps.
    if (!input.materialThesisBreak && quantity * priceSekMinor < minTradeGrossMinor) {
      const eligibility = evaluateWholeShareBuyEligibility({
        strategyKey: input.strategyKey,
        rules: input.rules,
        cashMinor: input.cashMinor,
        portfolioValueMinor: input.portfolioValueMinor,
        investedMinor: input.investedMinor,
        currentPositionValueMinor,
        priceSekMinor,
      });
      if (!eligibility.eligible) return { ok: false, reason: "trade_too_small" };
      quantity = eligibility.minWholeShares;
    }

    if (quantity <= 0) return { ok: false, reason: "trade_too_small" };

    const grossAmountSekMinor = quantity * priceSekMinor;
    const totalCashNeeded = grossAmountSekMinor + feeSekMinor;
    if (totalCashNeeded > input.cashMinor) {
      return { ok: false, reason: "insufficient_cash" };
    }

    const tradePct = (grossAmountSekMinor / input.portfolioValueMinor) * 100;
    if (tradePct < policy.minTradePctOfPortfolio && !input.materialThesisBreak) {
      return { ok: false, reason: "trade_too_small" };
    }

    // Position/equity gates use gross trade value. Cash already reserved courtage above.
    const cashAfterFee = input.cashMinor - feeSekMinor;
    const risk = validateModelPortfolioBuyRisk({
      now: input.now,
      quote: {
        symbol: input.quote.symbol,
        exchange: input.quote.exchange,
        currency: "SEK",
        priceMinor: priceSekMinor,
        asOf: input.quote.asOf,
        sourcePublisher: input.quote.sourcePublisher,
      },
      rules: input.rules,
      portfolioValueMinor: input.portfolioValueMinor,
      cashMinor: cashAfterFee,
      investedMinor: input.investedMinor,
      currentPositionValueMinor,
      proposedTradeGrossMinor: grossAmountSekMinor,
      maxQuoteAgeMs: SIMULATED_QUOTE_MAX_AGE_MS,
    });
    if (!risk.ok) {
      if (risk.reason === "insufficient_cash" || risk.reason === "min_cash_breached") {
        return { ok: false, reason: risk.reason === "insufficient_cash" ? "insufficient_cash" : "risk_rejected" };
      }
      return { ok: false, reason: risk.reason === "invalid_portfolio_state" ? "invalid_portfolio_state" : "risk_rejected" };
    }

    if (
      input.hoursSinceLastTradeInInstrument !== null &&
      input.hoursSinceLastTradeInInstrument < policy.cooldownHours &&
      !input.materialThesisBreak
    ) {
      return { ok: false, reason: "instrument_cooldown" };
    }

    const quantityAfter = currentQty + quantity;
    const averageCostMinorAfter = Math.round(
      (currentQty * currentAvg + grossAmountSekMinor + feeSekMinor) / quantityAfter,
    );

    const nativeGrossMinor = quantity * input.quote.nativePriceMinor;

    return {
      ok: true,
      side: "buy",
      quantity,
      nativeCurrency,
      nativePriceMinor: input.quote.nativePriceMinor,
      nativeGrossMinor,
      fxRateToSek: unitConversion.fxRateToSek,
      fxAsOf: unitConversion.fxAsOf,
      fxSourcePublisher: unitConversion.fxSourcePublisher,
      priceSekMinor,
      grossAmountSekMinor,
      feeSekMinor,
      cashDeltaMinor: -(grossAmountSekMinor + feeSekMinor),
      averageCostMinorAfter,
      quantityAfter,
      fillLabel: SIMULATED_FILL_LABEL,
      marketDataAsOf: input.quote.asOf,
    };
  }

  // sell / trim toward target weight
  if (currentQty <= 0) return { ok: false, reason: "no_position_to_sell" };

  const targetValueMinor = Math.round((input.portfolioValueMinor * input.targetWeightPct) / 100);
  const desiredSellValue = Math.max(0, currentPositionValueMinor - targetValueMinor);
  if (desiredSellValue <= 0 && input.targetWeightPct > 0) {
    return { ok: false, reason: "trade_too_small" };
  }

  const quantityFromValue = input.targetWeightPct === 0
    ? wholeShares(currentQty)
    : wholeShares(desiredSellValue / priceSekMinor);
  const quantity = Math.min(wholeShares(currentQty), quantityFromValue);
  if (quantity <= 0) return { ok: false, reason: "trade_too_small" };

  const feeSekMinor = buyBrokerageFeeMinor("sell");
  const grossAmountSekMinor = quantity * priceSekMinor;
  const policy = MODEL_PORTFOLIO_TURNOVER_POLICY[input.strategyKey];
  const tradePct = (grossAmountSekMinor / input.portfolioValueMinor) * 100;
  if (tradePct < policy.minTradePctOfPortfolio && !input.materialThesisBreak) {
    return { ok: false, reason: "trade_too_small" };
  }

  const quantityAfter = currentQty - quantity;
  const averageCostMinorAfter = quantityAfter <= 0 ? 0 : currentAvg;
  const nativeGrossMinor = quantity * input.quote.nativePriceMinor;

  return {
    ok: true,
    side: "sell",
    quantity,
    nativeCurrency,
    nativePriceMinor: input.quote.nativePriceMinor,
    nativeGrossMinor,
    fxRateToSek: unitConversion.fxRateToSek,
    fxAsOf: unitConversion.fxAsOf,
    fxSourcePublisher: unitConversion.fxSourcePublisher,
    priceSekMinor,
    grossAmountSekMinor,
    feeSekMinor,
    cashDeltaMinor: grossAmountSekMinor - feeSekMinor,
    averageCostMinorAfter,
    quantityAfter,
    fillLabel: SIMULATED_FILL_LABEL,
    marketDataAsOf: input.quote.asOf,
  };
}

export { SIMULATED_BUY_BROKERAGE_FEE_MINOR };
