import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDecisionAuditRow, MODEL_PORTFOLIO_PROMPT_VERSION } from "./decision-audit";

const evidence = [
  {
    id: "market:INVE-B",
    kind: "market_data" as const,
    publisher: "EODHD",
    publishedAt: "2026-08-10T07:05:00.000Z",
    verifiedAt: "2026-08-10T07:20:00.000Z",
    title: "Investor market data",
    summary: "Verified delayed market snapshot.",
  },
  {
    id: "market:VOLV-B",
    kind: "market_data" as const,
    publisher: "EODHD",
    publishedAt: "2026-08-10T07:06:00.000Z",
    verifiedAt: "2026-08-10T07:20:00.000Z",
    title: "Volvo market data",
    summary: "Contradicting candidate evidence.",
  },
  {
    id: "unused",
    kind: "news" as const,
    publisher: "Example",
    publishedAt: "2026-08-10T06:00:00.000Z",
    verifiedAt: "2026-08-10T07:00:00.000Z",
    title: "Unused",
    summary: "Should not be persisted on this decision.",
  },
];

const rankedCandidates = [
  {
    symbol: "INVE-B",
    exchange: "ST",
    deterministicScore: 0.77,
    reasons: ["kvalitet"],
    technicalAnalysis: undefined,
  },
];

describe("model portfolio decision audit", () => {
  it("freezes the actual AI decision and only referenced evidence", () => {
    const row = buildDecisionAuditRow({
      runId: "run-1",
      portfolioId: "portfolio-1",
      strategyKey: "balanced",
      decision: {
        action: "buy",
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        proposedPortfolioPct: 12,
        convictionScore: 0.81,
        materialThesisBreak: false,
        thesis: "Investor offers a diversified quality exposure with a durable long-term compounding case.",
        bearCase: "A broad valuation compression and weak underlying holdings could pressure net asset value.",
        catalyst: "Continued compounding and narrowing discount can support the case.",
        valuationView: "Valuation is acceptable relative to quality and diversification.",
        keyRisks: ["Holding-company discount can widen"],
        evidenceIds: ["market:INVE-B"],
        disconfirmingEvidenceIds: ["market:VOLV-B"],
        rationale: "The model prefers a starter position because the mandate fit, trend and downside profile are stronger than the alternatives.",
      },
      evidence,
      rankedCandidates,
      modelName: "openai/gpt-5.6-luna",
      estimatedCostUsdMicros: 1234,
      usage: {
        provider: "vercel-ai-gateway",
        model: "openai/gpt-5.6-luna",
        inputTokens: 1000,
        cachedInputTokens: 100,
        outputTokens: 200,
        totalTokens: 1300,
        estimatedCostUsdMicros: 1234,
        costSource: "catalog_estimate",
        timestamp: "2026-08-10T12:00:00.000Z",
        runId: "run-1",
      },
      portfolioSnapshot: "cash=1000000",
      executionAllowed: false,
    });

    assert.equal(row.status, "proposed");
    assert.equal(row.decision_type, "buy");
    assert.equal(row.prompt_version, MODEL_PORTFOLIO_PROMPT_VERSION);
    assert.equal(row.evidence.length, 2);
    assert.deepEqual(row.evidence.map((item) => item.id), ["market:INVE-B", "market:VOLV-B"]);
    assert.equal(row.market_data_as_of, "2026-08-10T07:06:00.000Z");
    assert.equal(row.input_snapshot.execution_allowed_at_decision_time, false);
    assert.deepEqual(row.input_snapshot.ai_usage, {
      provider: "vercel-ai-gateway",
      model: "openai/gpt-5.6-luna",
      input_tokens: 1000,
      cached_input_tokens: 100,
      output_tokens: 200,
      total_tokens: 1300,
      estimated_cost_usd_micros: 1234,
      estimated_cost_usd: 0.001234,
      cost_source: "catalog_estimate",
      timestamp: "2026-08-10T12:00:00.000Z",
      run_id: "run-1",
    });
  });

  it("preserves trim semantics while using the existing database decision type", () => {
    const row = buildDecisionAuditRow({
      runId: "run-2",
      portfolioId: "portfolio-2",
      strategyKey: "high_risk",
      decision: {
        action: "trim",
        symbol: "EVO",
        exchange: "ST",
        instrumentName: "Evolution AB",
        proposedPortfolioPct: 5,
        convictionScore: 0.72,
        materialThesisBreak: false,
        thesis: "The underlying case remains positive but portfolio risk has risen enough to reduce exposure.",
        bearCase: "Momentum deterioration can accelerate if the market reprices growth risk further.",
        catalyst: "A smaller weight preserves upside while reducing concentration risk.",
        valuationView: "The valuation leaves less room for execution misses than before.",
        keyRisks: ["High stock-specific volatility"],
        evidenceIds: ["market:INVE-B"],
        disconfirmingEvidenceIds: ["market:VOLV-B"],
        rationale: "A partial reduction is preferred over a full exit because the thesis remains intact but the risk/reward has weakened.",
      },
      evidence,
      rankedCandidates,
      modelName: "openai/gpt-5.6-luna",
      estimatedCostUsdMicros: 1000,
      usage: {
        provider: "vercel-ai-gateway",
        model: "openai/gpt-5.6-luna",
        inputTokens: 800,
        cachedInputTokens: null,
        outputTokens: 150,
        totalTokens: 950,
        estimatedCostUsdMicros: 1000,
        costSource: "catalog_estimate",
        timestamp: "2026-08-10T12:00:00.000Z",
        runId: "run-2",
      },
      portfolioSnapshot: "holding=EVO",
      executionAllowed: false,
    });

    assert.equal(row.decision_type, "rebalance");
    assert.equal(row.input_snapshot.original_action, "trim");
  });
});
