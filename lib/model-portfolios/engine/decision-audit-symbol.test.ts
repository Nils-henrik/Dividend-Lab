import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDecisionAuditRow } from "./decision-audit";

const usage = {
  provider: "vercel-ai-gateway" as const,
  model: "openai/gpt-5.6-luna",
  inputTokens: 100,
  cachedInputTokens: 10,
  outputTokens: 20,
  totalTokens: 130,
  estimatedCostUsdMicros: 100,
  costSource: "catalog_estimate" as const,
  timestamp: "2026-08-11T09:52:00.000Z",
  runId: "run-symbol-normalization",
};

describe("decision audit settlement symbol normalization", () => {
  it("stores Nordic decision symbols in canonical base+exchange form for settlement lookup", () => {
    const row = buildDecisionAuditRow({
      runId: "run-symbol-normalization",
      portfolioId: "portfolio-high-risk",
      strategyKey: "high_risk",
      decision: {
        action: "buy",
        symbol: "EQNR.OL",
        exchange: "OL",
        instrumentName: "Equinor ASA",
        proposedPortfolioPct: 15,
        convictionScore: 0.74,
        materialThesisBreak: false,
        thesis: "Verified catalyst and momentum support the case.",
        bearCase: "Momentum and catalyst can fade.",
        catalyst: "Positive revisions and trend.",
        valuationView: "Acceptable for the mandate.",
        keyRisks: ["Volatility"],
        evidenceIds: [],
        disconfirmingEvidenceIds: [],
        rationale: "Buy candidate.",
      },
      evidence: [],
      rankedCandidates: [],
      modelName: usage.model,
      estimatedCostUsdMicros: usage.estimatedCostUsdMicros,
      usage,
      portfolioSnapshot: "cash=1000000",
      executionAllowed: true,
    });

    assert.equal(row.instrument_symbol, "EQNR");
    assert.equal(row.exchange, "OL");
    assert.notEqual(`${row.instrument_symbol}.${row.exchange}`, "EQNR.OL.OL");
    assert.equal(`${row.instrument_symbol}.${row.exchange}`, "EQNR.OL");
  });
});
