import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyModelPortfolioFollowersOfTransaction } from "../follower-email";
import { fetchFxRateToSek } from "./fx-adapter";
import { currencyForExchange, type FxRateQuote } from "./fx";
import type { ModelPortfolioStrategyKey } from "./policy";
import type { ModelPortfolioRiskRules } from "./risk";
import {
  planSimulatedSettlement,
  type SettlementHolding,
  type SimulatedFillQuote,
  type SettlementPlan,
} from "./settlement";

export type DecisionSettlementRequest = {
  decisionId: string;
  portfolioStatus: "draft" | "active" | "paused";
  executionAllowedAtDecisionTime: boolean;
  strategyKey: ModelPortfolioStrategyKey;
  rules: ModelPortfolioRiskRules;
  cashMinor: number;
  portfolioValueMinor: number;
  investedMinor: number;
  currentHolding: SettlementHolding | null;
  targetWeightPct: number;
  side: "buy" | "sell";
  quote: SimulatedFillQuote;
  convictionScore: number;
  materialThesisBreak: boolean;
  hoursSinceLastTradeInInstrument: number | null;
  instrumentName: string;
  fxRateToSek?: FxRateQuote | null;
  now?: Date;
};

export type DecisionSettlementResult =
  | {
      ok: true;
      plan: Extract<SettlementPlan, { ok: true }>;
      transactionId: string;
      idempotent: boolean;
    }
  | {
      ok: false;
      reason: string;
      planReason?: string;
    };

export async function settleModelPortfolioDecision(
  supabase: SupabaseClient,
  request: DecisionSettlementRequest,
): Promise<DecisionSettlementResult> {
  const now = request.now ?? new Date();
  const nativeCurrency = currencyForExchange(request.quote.exchange);
  if (!nativeCurrency) {
    return { ok: false, reason: "unsupported_currency" };
  }

  let fxRate = request.fxRateToSek ?? null;
  if (nativeCurrency !== "SEK" && !fxRate) {
    const fetched = await fetchFxRateToSek(nativeCurrency, now);
    if (!fetched.ok) return { ok: false, reason: "fx_unavailable" };
    fxRate = fetched.quote;
  }

  const plan = planSimulatedSettlement({
    side: request.side,
    portfolioStatus: request.portfolioStatus,
    executionAllowedAtDecisionTime: request.executionAllowedAtDecisionTime,
    strategyKey: request.strategyKey,
    rules: request.rules,
    now,
    cashMinor: request.cashMinor,
    portfolioValueMinor: request.portfolioValueMinor,
    investedMinor: request.investedMinor,
    currentHolding: request.currentHolding,
    targetWeightPct: request.targetWeightPct,
    quote: {
      ...request.quote,
      nativeCurrency,
      instrumentName: request.instrumentName || request.quote.instrumentName,
    },
    fxRateToSek: fxRate,
    convictionScore: request.convictionScore,
    materialThesisBreak: request.materialThesisBreak,
    hoursSinceLastTradeInInstrument: request.hoursSinceLastTradeInInstrument,
  });

  if (!plan.ok) {
    return { ok: false, reason: "plan_rejected", planReason: plan.reason };
  }

  const { data, error } = await supabase.rpc("settle_model_portfolio_decision", {
    p_decision_id: request.decisionId,
    p_plan: {
      side: plan.side,
      quantity: plan.quantity,
      priceSekMinor: plan.priceSekMinor,
      grossAmountSekMinor: plan.grossAmountSekMinor,
      feeSekMinor: plan.feeSekMinor,
      cashDeltaMinor: plan.cashDeltaMinor,
      averageCostMinorAfter: plan.averageCostMinorAfter,
      quantityAfter: plan.quantityAfter,
      nativeCurrency: plan.nativeCurrency,
      nativePriceMinor: plan.nativePriceMinor,
      nativeGrossMinor: plan.nativeGrossMinor,
      fxRateToSek: plan.fxRateToSek,
      fxAsOf: plan.fxAsOf,
      fxSourcePublisher: plan.fxSourcePublisher,
      fillLabel: plan.fillLabel,
      marketDataAsOf: plan.marketDataAsOf,
      instrumentName: request.instrumentName || request.quote.instrumentName,
    },
  });

  if (error) {
    return { ok: false, reason: `rpc_failed:${error.code ?? "unknown"}` };
  }

  const payload = (data ?? {}) as {
    ok?: boolean;
    reason?: string;
    transaction_id?: string;
    idempotent?: boolean;
  };

  if (!payload.ok || !payload.transaction_id) {
    return { ok: false, reason: payload.reason ?? "settlement_rejected" };
  }

  try {
    const notification = await notifyModelPortfolioFollowersOfTransaction({
      supabase,
      transactionId: payload.transaction_id,
    });

    if (notification.status === "failed") {
      console.error("[model-portfolios] follower trade email dispatch failed", {
        transactionId: payload.transaction_id,
        reason: notification.reason,
        failed: notification.failed,
      });
    }
  } catch (error) {
    console.error("[model-portfolios] follower trade email dispatch crashed", {
      transactionId: payload.transaction_id,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  return {
    ok: true,
    plan,
    transactionId: payload.transaction_id,
    idempotent: Boolean(payload.idempotent),
  };
}
