import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabAnalystDraft } from "../lib/analysis/analyst-schema";
import {
  buildDeterministicPeerInterpretation,
  composePeerAnalystDraft,
} from "../lib/analysis/peer-analyst-composition";
import type { DivLabPeerAnalystContext } from "../lib/analysis/peer-analyst-context";

const AUDIT_ID = "30000000-0000-4000-8000-000000000001";

function context(): DivLabPeerAnalystContext {
  return {
    version: "peer-analyst-context-v1",
    auditId: AUDIT_ID,
    targetAnalysisVersionId: "30000000-0000-4000-8000-000000000002",
    peerSetId: "30000000-0000-4000-8000-000000000003",
    peerSetVersionNumber: 1,
    dataAsOf: "2026-08-15T09:00:00.000Z",
    target: { symbol: "TEST", exchange: "ST", name: "Test AB" },
    peerCount: 3,
    readyMetricCount: 3,
    metrics: [
      { metric: "pe", status: "ready", targetValue: 20, peerSampleSize: 3, peerMedian: 18, peerMin: 15, peerMax: 22, targetVsMedianPct: 0.111111 },
      { metric: "priceToFcf", status: "ready", targetValue: 15, peerSampleSize: 3, peerMedian: 16, peerMin: 14, peerMax: 19, targetVsMedianPct: -0.0625 },
      { metric: "evToEbit", status: "insufficient", targetValue: 14, peerSampleSize: 2, peerMedian: 13, peerMin: 12, peerMax: 14, targetVsMedianPct: 0.076923 },
      { metric: "evToEbitda", status: "ready", targetValue: 13.01, peerSampleSize: 3, peerMedian: 13, peerMin: 11, peerMax: 15, targetVsMedianPct: 0.000769 },
    ],
    notes: [],
  };
}

function baseDraft(): DivLabAnalystDraft {
  const claim = (text: string) => ({ text, sourceIds: ["report:test"] });
  return {
    view: "neutral",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary: "Test summary med tillräcklig längd för Analyst-schemat.",
    investmentCase: [claim("Case one."), claim("Case two.")],
    latestReport: [claim("Latest report.")],
    fundamentalInterpretation: [claim("Fundamental one."), claim("Fundamental two.")],
    valuationInterpretation: [
      { measure: "pe", text: "Target P/E.", sourceIds: ["report:test"] },
    ],
    qualityFactors: {
      competitiveAdvantage: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      pricingPower: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      marketPosition: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      managementAndCapitalAllocation: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      reinvestmentRunway: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      cyclicality: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      customerConcentration: { assessment: "unknown", rationale: "Test", sourceIds: [] },
      regulatoryRisk: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      currencyRisk: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      acquisitionRisk: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
      disruptionRisk: { assessment: "neutral", rationale: "Test", sourceIds: ["report:test"] },
    },
    catalysts: [claim("Catalyst.")],
    risks: [claim("Risk one."), claim("Risk two.")],
    contradictions: [claim("Contradiction.")],
    thesisBreakers: [claim("Thesis breaker.")],
    technicalInterpretation: [claim("Technical context.")],
    valuationScenarios: [
      { name: "bear", label: "Bear", currency: "SEK", eps: 5, peMultiple: 12, freeCashFlowPerShare: null, pFcfMultiple: null, explicitValuePerShare: null, assumptions: ["Bear"], sourceIds: ["report:test"] },
      { name: "base", label: "Base", currency: "SEK", eps: 7, peMultiple: 16, freeCashFlowPerShare: null, pFcfMultiple: null, explicitValuePerShare: null, assumptions: ["Base"], sourceIds: ["report:test"] },
      { name: "bull", label: "Bull", currency: "SEK", eps: 9, peMultiple: 20, freeCashFlowPerShare: null, pFcfMultiple: null, explicitValuePerShare: null, assumptions: ["Bull"], sourceIds: ["report:test"] },
    ],
  };
}

describe("DivLab deterministic peer analyst composition", () => {
  it("covers every ready metric and excludes insufficient metrics", () => {
    const claims = buildDeterministicPeerInterpretation(context());
    assert.deepEqual(claims.map((claim) => claim.metric), ["pe", "priceToFcf", "evToEbitda"]);
    assert.ok(claims.every((claim) => claim.peerAuditId === AUDIT_ID));
    assert.ok(claims.every((claim) => /inte en köp- eller säljsignal/i.test(claim.text)));
    assert.match(claims[0]!.text, /11,1 % över peer-medianen/i);
    assert.match(claims[1]!.text, /6,3 % under peer-medianen/i);
    assert.match(claims[2]!.text, /nära peer-medianen/i);
  });

  it("upgrades the base draft without rewriting the AI-written target thesis", () => {
    const base = baseDraft();
    const result = composePeerAnalystDraft({ baseDraft: base, peerContext: context() });
    assert.equal(result.executiveSummary, base.executiveSummary);
    assert.deepEqual(result.valuationScenarios, base.valuationScenarios);
    assert.equal(result.peerContextVersion, "peer-analyst-context-v1");
    assert.equal(result.peerAuditId, AUDIT_ID);
    assert.equal(result.peerInterpretation.length, 3);
  });

  it("fails closed when readyMetricCount does not match the actual ready set", () => {
    const invalid = context();
    invalid.readyMetricCount = 4;
    assert.throws(() => buildDeterministicPeerInterpretation(invalid), /divlab_peer_analyst_composition_ready_metric_count_invalid/);
  });
});
