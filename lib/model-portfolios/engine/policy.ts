export type ModelPortfolioStrategyKey =
  | "conservative"
  | "balanced"
  | "high_risk"
  | "dividend";

export type ModelPortfolioEventKind =
  | "earnings_surprise"
  | "profit_warning"
  | "guidance_change"
  | "large_price_move"
  | "regulatory"
  | "geopolitical"
  | "company_specific"
  | "dividend_cut"
  | "dividend_suspension"
  | "takeover_bid"
  | "management_change"
  | "risk_limit_breach";

export type ModelPortfolioTurnoverPolicy = {
  maxRunsPerTradingDay: number;
  maxAdditionalEventRuns: number;
  minTradePctOfPortfolio: number;
  replacementThresholdScore: number;
  trimThresholdScore: number;
  cooldownHours: number;
};

export const MODEL_PORTFOLIO_TURNOVER_POLICY: Record<
  ModelPortfolioStrategyKey,
  ModelPortfolioTurnoverPolicy
> = {
  conservative: {
    maxRunsPerTradingDay: 4,
    maxAdditionalEventRuns: 3,
    minTradePctOfPortfolio: 10,
    replacementThresholdScore: 0.82,
    trimThresholdScore: 0.72,
    cooldownHours: 120,
  },
  balanced: {
    maxRunsPerTradingDay: 4,
    maxAdditionalEventRuns: 3,
    minTradePctOfPortfolio: 10,
    replacementThresholdScore: 0.72,
    trimThresholdScore: 0.64,
    cooldownHours: 72,
  },
  high_risk: {
    maxRunsPerTradingDay: 4,
    maxAdditionalEventRuns: 3,
    minTradePctOfPortfolio: 10,
    replacementThresholdScore: 0.58,
    trimThresholdScore: 0.52,
    cooldownHours: 24,
  },
  dividend: {
    maxRunsPerTradingDay: 4,
    maxAdditionalEventRuns: 3,
    minTradePctOfPortfolio: 10,
    replacementThresholdScore: 0.78,
    trimThresholdScore: 0.68,
    cooldownHours: 96,
  },
};

export type ModelPortfolioRunEligibilityInput = {
  strategyKey: ModelPortfolioStrategyKey;
  slotId: "open" | "midday" | "us-open" | "close";
  completedRunsToday: number;
  completedEventRunsToday: number;
  hasMaterialEvent: boolean;
  eventKind?: ModelPortfolioEventKind;
  duplicateEvent: boolean;
};

export type ModelPortfolioRunEligibility =
  | { allowed: true; runKind: "primary" | "event" }
  | {
      allowed: false;
      reason:
        | "daily_run_cap"
        | "primary_only_at_open"
        | "event_required"
        | "event_run_cap"
        | "duplicate_event";
    };

export function evaluateModelPortfolioRunEligibility(
  input: ModelPortfolioRunEligibilityInput,
): ModelPortfolioRunEligibility {
  const policy = MODEL_PORTFOLIO_TURNOVER_POLICY[input.strategyKey];

  if (input.completedRunsToday >= policy.maxRunsPerTradingDay) {
    return { allowed: false, reason: "daily_run_cap" };
  }

  if (input.completedRunsToday === 0) {
    return input.slotId === "open"
      ? { allowed: true, runKind: "primary" }
      : { allowed: false, reason: "primary_only_at_open" };
  }

  if (!input.hasMaterialEvent) {
    return { allowed: false, reason: "event_required" };
  }
  if (input.completedEventRunsToday >= policy.maxAdditionalEventRuns) {
    return { allowed: false, reason: "event_run_cap" };
  }
  if (input.duplicateEvent) {
    return { allowed: false, reason: "duplicate_event" };
  }

  return { allowed: true, runKind: "event" };
}

export function shouldAllowPortfolioChange(input: {
  strategyKey: ModelPortfolioStrategyKey;
  action: "buy" | "sell" | "trim" | "rebalance";
  convictionScore: number;
  tradeValueMinor: number;
  portfolioValueMinor: number;
  hoursSinceLastTradeInInstrument: number | null;
  materialThesisBreak: boolean;
}): { allowed: true } | { allowed: false; reason: string } {
  const policy = MODEL_PORTFOLIO_TURNOVER_POLICY[input.strategyKey];

  if (
    !Number.isFinite(input.convictionScore) ||
    input.convictionScore < 0 ||
    input.convictionScore > 1 ||
    !Number.isFinite(input.tradeValueMinor) ||
    !Number.isFinite(input.portfolioValueMinor) ||
    input.tradeValueMinor <= 0 ||
    input.portfolioValueMinor <= 0
  ) {
    return { allowed: false, reason: "invalid_change_input" };
  }

  const tradePct = (input.tradeValueMinor / input.portfolioValueMinor) * 100;
  if (tradePct < policy.minTradePctOfPortfolio) {
    return { allowed: false, reason: "trade_too_small" };
  }

  if (
    input.hoursSinceLastTradeInInstrument !== null &&
    input.hoursSinceLastTradeInInstrument < policy.cooldownHours &&
    !input.materialThesisBreak
  ) {
    return { allowed: false, reason: "instrument_cooldown" };
  }

  const threshold =
    input.action === "trim" ? policy.trimThresholdScore : policy.replacementThresholdScore;

  if (input.convictionScore < threshold && !input.materialThesisBreak) {
    return { allowed: false, reason: "conviction_below_profile_threshold" };
  }

  return { allowed: true };
}
