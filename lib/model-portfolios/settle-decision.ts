import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FxRateToSek } from "./engine/fx";
import {
  planBuySettlement,
  planSellSettlement,
  type SettledTradePlan,
  type SettlementResult,
} from "./engine/settlement";
import type { ModelPortfolioRiskRules } from "./engine/risk";
import type { SettlementExecutionQuote } from "./engine/settlement";
import { persistSettledTrade } from "./settlement-store";

export type ProposedDecisionForSettlement = {
  decisionId: string;
  portfolioId: string;
  action: "buy" | "sell" | "trim" | "rebalance";
  status: string;
  symbol: string;
  exchange: string;
  instrumentName: string;
  proposedPortfolioPct: number;
  rationale: string;
  quantityToSell?: number;
};

export type PortfolioStateForSettlement = {
  cashMinor: number;
  investedMinor: number;
  portfolioValueMinor: number;
  contributedCapitalMinor: number;
  rules: ModelPortfolioRiskRules;
  holding: {
    quantity: number;
    averageCostMinor: number;
    positionValueMinor: number;
  } | null;
};

/**
 * Plan a simulated settlement for an approved/proposed AI decision.
 * Fail-closed: requires an explicit execution quote (never research evidence alone).
 */
export function planDecisionSettlement(input: {
  now: Date;
  decision: ProposedDecisionForSettlement;
  state: PortfolioStateForSettlement;
  quote: SettlementExecutionQuote;
}): SettlementResult {
  if (input.decision.status === "executed") {
    return {
      ok: true,
      alreadySettled: true,
      idempotencyKey: `settle:decision:${input.decision.decisionId}`,
      decisionId: input.decision.decisionId,
    };
  }

  if (input.decision.status !== "proposed") {
    return { ok: false, reason: "invalid_decision", detail: input.decision.status };
  }

  const decisionRef = {
    decisionId: input.decision.decisionId,
    alreadyExecuted: false,
  };

  if (input.decision.action === "buy") {
    return planBuySettlement({
      now: input.now,
      decision: decisionRef,
      quote: input.quote,
      rules: input.state.rules,
      portfolioValueMinor: input.state.portfolioValueMinor,
      cashMinor: input.state.cashMinor,
      investedMinor: input.state.investedMinor,
      currentPositionValueMinor: input.state.holding?.positionValueMinor ?? 0,
      currentHoldingQuantity: input.state.holding?.quantity ?? 0,
      proposedPortfolioPct: input.decision.proposedPortfolioPct,
      rationale: input.decision.rationale,
    });
  }

  if (
    input.decision.action === "sell" ||
    input.decision.action === "trim" ||
    input.decision.action === "rebalance"
  ) {
    if (!input.state.holding || input.state.holding.quantity <= 0) {
      return { ok: false, reason: "invalid_portfolio_state", detail: "no_holding" };
    }
    return planSellSettlement({
      now: input.now,
      decision: decisionRef,
      quote: input.quote,
      cashMinor: input.state.cashMinor,
      currentHoldingQuantity: input.state.holding.quantity,
      currentAverageCostMinor: input.state.holding.averageCostMinor,
      quantityToSell: input.decision.quantityToSell,
      rationale: input.decision.rationale,
    });
  }

  return { ok: false, reason: "invalid_decision", detail: "unsupported_action" };
}

export async function settlePlannedTrade(
  client: SupabaseClient,
  input: {
    portfolioId: string;
    plan: SettledTradePlan;
    state: PortfolioStateForSettlement;
  },
) {
  const holdingQtyAfter = input.plan.holdingQuantityAfter;
  const price = input.plan.priceMinor;
  const previousInvested = input.state.investedMinor;
  const previousPositionValue = input.state.holding?.positionValueMinor ?? 0;

  let investedValueAfterMinor = previousInvested;
  if (input.plan.side === "buy") {
    investedValueAfterMinor = previousInvested - previousPositionValue + holdingQtyAfter * price;
  } else {
    investedValueAfterMinor = Math.max(0, previousInvested - previousPositionValue + holdingQtyAfter * price);
  }

  return persistSettledTrade(client, {
    portfolioId: input.portfolioId,
    plan: input.plan,
    contributedCapitalMinor: input.state.contributedCapitalMinor,
    investedValueAfterMinor,
  });
}

export function isModelPortfolioSettlementEnabled(): boolean {
  return process.env.MODEL_PORTFOLIO_SETTLEMENT_ENABLED === "true";
}

export type { FxRateToSek };
