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

  it("uses investor-facing research narrative and keeps ops diagnostics off the public rationale", () => {
    const row = buildDecisionAuditRow({
      runId: "run-narrative",
      portfolioId: "portfolio-narrative",
      strategyKey: "conservative",
      decision: {
        action: "hold",
        symbol: null,
        exchange: null,
        instrumentName: null,
        proposedPortfolioPct: 0,
        convictionScore: 0.42,
        materialThesisBreak: false,
        thesis: "Inget nytt case passerade mandatets tröskel med tillräckligt underlag.",
        bearCase: "Forcerad omsättning skulle öka friktion utan tydlig edge.",
        catalyst: "Väntar på starkare kombinerad signal.",
        valuationView: "Inga kandidater erbjöd tillräcklig marginal.",
        keyRisks: ["Otillräckligt underlag"],
        evidenceIds: ["market:INVE-B"],
        disconfirmingEvidenceIds: [],
        rationale: "Inga kandidater klarade strategins och riskreglernas tröskel.",
      },
      evidence,
      rankedCandidates,
      modelName: "openai/gpt-5.6-luna",
      estimatedCostUsdMicros: 100,
      usage: {
        provider: "vercel-ai-gateway",
        model: "openai/gpt-5.6-luna",
        inputTokens: 100,
        cachedInputTokens: null,
        outputTokens: 50,
        totalTokens: 150,
        estimatedCostUsdMicros: 100,
        costSource: "catalog_estimate",
        timestamp: "2026-08-10T12:00:00.000Z",
        runId: "run-narrative",
      },
      portfolioSnapshot: "cash=1000000",
      executionAllowed: false,
      researchSummary:
        "Nordiska morgonpasset (09.20) granskade 8 aktier mer i detalj. Mest relevanta kandidater: Investor AB ser. B (INVE-B.ST).",
      operationalSummary: "ops[nordic_morning] cacheHits=3 googleHits=0 eodhdBudget=0/0",
    });

    assert.match(row.rationale, /Nordiska morgonpasset/);
    assert.match(row.rationale, /AVVAKTA \(HOLD\)/);
    assert.doesNotMatch(row.rationale, /cacheHits|eodhdBudget|Google/i);
    assert.equal(row.input_snapshot.research_summary?.toString().includes("Nordiska"), true);
    assert.equal(row.input_snapshot.operational_summary, "ops[nordic_morning] cacheHits=3 googleHits=0 eodhdBudget=0/0");
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

    assert.equal(row.decision_type, "sell");
    assert.equal(row.input_snapshot.original_action, "trim");
  });

  it("stores rebalance on the sell side while preserving the original action", () => {
    const row = buildDecisionAuditRow({
      runId: "run-rebalance",
      portfolioId: "portfolio-rebalance",
      strategyKey: "balanced",
      decision: {
        action: "rebalance",
        symbol: "EVO",
        exchange: "ST",
        instrumentName: "Evolution AB",
        proposedPortfolioPct: 7,
        convictionScore: 0.68,
        materialThesisBreak: false,
        thesis: "Portfolio concentration has risen enough to justify reducing the position toward its target weight.",
        bearCase: "Leaving concentration unchanged can make portfolio risk depend too heavily on one holding.",
        catalyst: "Rebalancing restores the intended portfolio risk distribution.",
        valuationView: "The case remains investable, but the current weight is above the preferred risk allocation.",
        keyRisks: ["Concentration risk remains elevated without a reduction"],
        evidenceIds: ["market:INVE-B"],
        disconfirmingEvidenceIds: ["market:VOLV-B"],
        rationale: "Reduce the position toward its intended portfolio weight while retaining exposure to the underlying thesis.",
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
        timestamp: "2026-08-12T09:00:00.000Z",
        runId: "run-rebalance",
      },
      portfolioSnapshot: "holding=EVO",
      executionAllowed: false,
    });

    assert.equal(row.decision_type, "sell");
    assert.equal(row.input_snapshot.original_action, "rebalance");
  });

  it("caps rationale at the database character limit without splitting Unicode characters", () => {
    const longRationale = "🚀".repeat(2100);
    const row = buildDecisionAuditRow({
      runId: "run-long-rationale",
      portfolioId: "portfolio-long-rationale",
      strategyKey: "balanced",
      decision: {
        action: "hold",
        symbol: null,
        exchange: null,
        instrumentName: null,
        proposedPortfolioPct: 0,
        convictionScore: 0.5,
        materialThesisBreak: false,
        thesis: "Long rationale regression test.",
        bearCase: "No trade is executed in this test.",
        catalyst: "None.",
        valuationView: "Neutral.",
        keyRisks: ["Oversized audit text"],
        evidenceIds: [],
        disconfirmingEvidenceIds: [],
        rationale: longRationale,
      },
      evidence,
      rankedCandidates,
      modelName: "openai/gpt-5.6-luna",
      estimatedCostUsdMicros: 0,
      usage: {
        provider: "vercel-ai-gateway",
        model: "openai/gpt-5.6-luna",
        inputTokens: 0,
        cachedInputTokens: null,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsdMicros: 0,
        costSource: "catalog_estimate",
        timestamp: "2026-08-12T09:00:00.000Z",
        runId: "run-long-rationale",
      },
      portfolioSnapshot: "cash=1000000",
      executionAllowed: false,
    });

    assert.equal(Array.from(row.rationale).length, 2000);
    assert.equal(row.rationale, "🚀".repeat(2000));
  });
});
