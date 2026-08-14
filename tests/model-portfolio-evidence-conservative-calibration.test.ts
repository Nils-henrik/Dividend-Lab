import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDecisionFramework,
  modelPortfolioDecisionSchema,
  validateEvidenceReferences,
  type ModelPortfolioEvidence,
} from "../lib/model-portfolios/engine/decision";
import { evaluateNewEntryAttention } from "../lib/model-portfolios/engine/strategy-attention";

const evidence: ModelPortfolioEvidence[] = [
  {
    id: "research:CALM:ST:2026-08-14T09:20:00Z",
    kind: "market_data",
    publisher: "DivLab deterministic research",
    publishedAt: "2026-08-14T09:20:00Z",
    verifiedAt: "2026-08-14T09:20:01Z",
    title: "Calm AB – verified research",
    summary: "Quality, balance sheet, valuation and market data are available.",
  },
];

function tradeDecision() {
  return modelPortfolioDecisionSchema.parse({
    action: "buy",
    symbol: "CALM",
    exchange: "ST",
    instrumentName: "Calm AB",
    proposedPortfolioPct: 8,
    convictionScore: 0.68,
    materialThesisBreak: false,
    thesis: "Bolaget har tillräcklig kvalitet och balansräkning för ett begränsat första innehav.",
    bearCase: "Vinstutvecklingen kan bli svagare än väntat och värderingen kan då komprimeras.",
    catalyst: "Stabil vinstutveckling och förbättrade estimat kan stärka caset.",
    valuationView: "Värderingen är rimlig relativt kvalitet och risk i nuläget.",
    keyRisks: ["Svagare vinstutveckling", "Värderingsrisk"],
    evidenceIds: [evidence[0]!.id],
    disconfirmingEvidenceIds: [],
    rationale: "Köp kan föreslås efter en aktiv nedsideskontroll även när underlaget saknar en separat motbeviskälla.",
  });
}

describe("model portfolio evidence calibration", () => {
  it("allows a trade after an active bear-case check without inventing a contradictory source", () => {
    assert.deepEqual(validateEvidenceReferences(tradeDecision(), evidence), { ok: true });
  });

  it("still rejects invented disconfirming evidence ids", () => {
    const decision = tradeDecision();
    decision.disconfirmingEvidenceIds = ["invented-risk-source"];
    assert.deepEqual(validateEvidenceReferences(decision, evidence), {
      ok: false,
      reason: "unknown_evidence",
    });
  });

  it("explicitly tells the manager not to fabricate or recycle a source for the disconfirming list", () => {
    const framework = buildDecisionFramework("balanced");
    assert.match(framework, /återanvända en stödkälla/i);
    assert.match(framework, /Lämna listan tom/i);
  });
});

describe("Försiktig 10-percent activity calibration", () => {
  const base = {
    symbol: "CALM",
    exchange: "ST",
    marketCapSek: 90_000_000_000,
    avgDailyTurnoverSek: 50_000_000,
    qualityScore: 0.66,
    balanceSheetScore: 0.6,
    valuationScore: 0.64,
    volatility20d: 0.2,
  } as const;

  it("admits a stable mid/large-cap case that sat just below the old 0.72/0.62 floors", () => {
    const decision = evaluateNewEntryAttention(base, "conservative");
    assert.equal(decision.eligible, true);
    assert.ok(decision.reasons.includes("quality_stability_fit"));
  });

  it("keeps the new quality floor at 0.65", () => {
    const decision = evaluateNewEntryAttention({ ...base, qualityScore: 0.64 }, "conservative");
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_weak_quality"));
  });

  it("keeps the new balance-sheet floor at 0.56", () => {
    const decision = evaluateNewEntryAttention({ ...base, balanceSheetScore: 0.55 }, "conservative");
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_weak_balance_sheet"));
  });

  it("raises ordinary volatility tolerance only to 0.44", () => {
    const allowed = evaluateNewEntryAttention({ ...base, volatility20d: 0.43 }, "conservative");
    const blocked = evaluateNewEntryAttention({ ...base, volatility20d: 0.45 }, "conservative");
    assert.equal(allowed.eligible, true);
    assert.equal(blocked.eligible, false);
    assert.ok(blocked.reasons.includes("rejected_high_volatility"));
  });

  it("does not weaken the speculative-small-cap safety guard", () => {
    const decision = evaluateNewEntryAttention(
      {
        ...base,
        symbol: "SMALL",
        marketCapSek: 2_000_000_000,
        qualityScore: 0.7,
        balanceSheetScore: 0.65,
      },
      "conservative",
    );
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_speculative_small_cap"));
  });
});
