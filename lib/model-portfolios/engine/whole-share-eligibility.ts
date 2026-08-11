import { buyBrokerageFeeMinor } from "./fees";
import { MODEL_PORTFOLIO_TURNOVER_POLICY, type ModelPortfolioStrategyKey } from "./policy";
import type { ModelPortfolioRiskRules } from "./risk";

export type WholeShareBuyEligibilityInput = {
  strategyKey: ModelPortfolioStrategyKey;
  rules: ModelPortfolioRiskRules;
  cashMinor: number;
  portfolioValueMinor: number;
  investedMinor: number;
  currentPositionValueMinor: number;
  priceSekMinor: number;
};

export type WholeShareBuyEligibility =
  | {
      eligible: true;
      minWholeShares: number;
      maxWholeShares: number;
    }
  | {
      eligible: false;
      reason: "invalid_input" | "no_whole_share_capacity" | "minimum_trade_not_reachable";
    };

function validNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Pre-AI buyability gate for model portfolios.
 *
 * A new candidate is eligible only when at least one integer share can be
 * purchased while respecting brokerage, minimum cash, maximum equity,
 * maximum single-position weight and the strategy's minimum trade size.
 */
export function evaluateWholeShareBuyEligibility(
  input: WholeShareBuyEligibilityInput,
): WholeShareBuyEligibility {
  if (
    !validNonNegative(input.cashMinor) ||
    !validNonNegative(input.investedMinor) ||
    !validNonNegative(input.currentPositionValueMinor) ||
    !Number.isFinite(input.portfolioValueMinor) ||
    input.portfolioValueMinor <= 0 ||
    !Number.isFinite(input.priceSekMinor) ||
    !Number.isInteger(input.priceSekMinor) ||
    input.priceSekMinor <= 0
  ) {
    return { eligible: false, reason: "invalid_input" };
  }

  const feeMinor = buyBrokerageFeeMinor("buy");
  const minCashReserveMinor = Math.ceil(
    (input.portfolioValueMinor * input.rules.minCashPct) / 100,
  );
  const maxPositionValueMinor = Math.floor(
    (input.portfolioValueMinor * input.rules.maxSinglePositionPct) / 100,
  );
  const maxEquityValueMinor = Math.floor(
    (input.portfolioValueMinor * input.rules.maxEquityPct) / 100,
  );

  const cashGrossCapacity = input.cashMinor - feeMinor - minCashReserveMinor;
  const positionGrossCapacity = maxPositionValueMinor - input.currentPositionValueMinor;
  const equityGrossCapacity = maxEquityValueMinor - input.investedMinor;
  const maxGrossMinor = Math.floor(
    Math.min(cashGrossCapacity, positionGrossCapacity, equityGrossCapacity),
  );

  const maxWholeShares = Math.floor(maxGrossMinor / input.priceSekMinor);
  if (maxWholeShares < 1) {
    return { eligible: false, reason: "no_whole_share_capacity" };
  }

  const minTradePct = MODEL_PORTFOLIO_TURNOVER_POLICY[input.strategyKey].minTradePctOfPortfolio;
  const minTradeGrossMinor = Math.ceil((input.portfolioValueMinor * minTradePct) / 100);
  const minWholeShares = Math.max(1, Math.ceil(minTradeGrossMinor / input.priceSekMinor));

  if (maxWholeShares < minWholeShares) {
    return { eligible: false, reason: "minimum_trade_not_reachable" };
  }

  return { eligible: true, minWholeShares, maxWholeShares };
}
