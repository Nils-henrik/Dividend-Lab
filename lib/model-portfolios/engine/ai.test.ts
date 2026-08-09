import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_PORTFOLIO_AI_BUDGET,
  estimateAiCostUsdMicros,
  evaluateAiBudget,
  resolveModelPortfolioAiConfig,
  shouldEscalateAiModel,
} from "./ai";

describe("model portfolio AI provider and budget", () => {
  it("uses automatic Vercel OIDC auth in production without requiring another secret", () => {
    assert.deepEqual(resolveModelPortfolioAiConfig({ VERCEL_OIDC_TOKEN: "oidc" }), {
      configured: true,
      authMode: "vercel_oidc",
      primaryModel: "openai/gpt-5.6-luna",
      escalationModel: "openai/gpt-5.6-terra",
    });
  });

  it("fails closed outside Vercel when no gateway auth exists", () => {
    assert.deepEqual(resolveModelPortfolioAiConfig({}), {
      configured: false,
      reason: "gateway_auth_missing",
    });
  });

  it("keeps normal Luna calls very cheap", () => {
    assert.equal(
      estimateAiCostUsdMicros({
        model: "openai/gpt-5.6-luna",
        inputTokens: 12_000,
        outputTokens: 1_200,
      }),
      3_840,
    );
  });

  it("hard stops projected spend above the daily cap", () => {
    assert.deepEqual(
      evaluateAiBudget({
        spentTodayUsdMicros: MODEL_PORTFOLIO_AI_BUDGET.hardDailyUsdMicros - 1_000,
        expectedCallUsdMicros: 2_000,
        runKind: "event",
      }),
      { allowed: false, reason: "daily_ai_budget_exhausted" },
    );
  });

  it("protects budget for event-driven checks", () => {
    assert.deepEqual(
      evaluateAiBudget({
        spentTodayUsdMicros: 210_000,
        expectedCallUsdMicros: 20_000,
        runKind: "primary",
      }),
      { allowed: false, reason: "event_reserve_protected" },
    );
  });

  it("only escalates difficult material cases affecting a current holding", () => {
    assert.equal(
      shouldEscalateAiModel({
        topCandidateScore: 0.84,
        evidenceConflictCount: 2,
        materialEvent: true,
        currentHoldingAffected: true,
      }),
      true,
    );
    assert.equal(
      shouldEscalateAiModel({
        topCandidateScore: 0.84,
        evidenceConflictCount: 2,
        materialEvent: false,
        currentHoldingAffected: true,
      }),
      false,
    );
  });
});
