import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDecisionFramework,
  modelPortfolioDecisionSchema,
  validateEvidenceReferences,
  type ModelPortfolioEvidence,
} from "./decision";

const evidence: ModelPortfolioEvidence[] = [
  {
    id: "report-q2",
    kind: "company_report",
    publisher: "Example AB",
    publishedAt: "2026-08-07T06:00:00Z",
    verifiedAt: "2026-08-07T06:05:00Z",
    title: "Q2",
    summary: "Omsättning och marginal förbättrades.",
  },
  {
    id: "risk-note",
    kind: "news",
    publisher: "Verified News",
    publishedAt: "2026-08-07T06:10:00Z",
    verifiedAt: "2026-08-07T06:12:00Z",
    title: "Risk",
    summary: "Efterfrågan i en viktig marknad försvagades.",
  },
];

function validDecision() {
  return modelPortfolioDecisionSchema.parse({
    action: "buy",
    symbol: "EXAMPLE",
    exchange: "ST",
    instrumentName: "Example AB",
    proposedPortfolioPct: 8,
    convictionScore: 0.78,
    materialThesisBreak: false,
    thesis: "Bolagets lönsamhet förbättras samtidigt som balansräkningen är fortsatt stark.",
    bearCase: "Efterfrågan kan försvagas snabbare än väntat och pressa marginalerna kommande kvartal.",
    catalyst: "Fortsatt marginalförbättring och stabil orderingång kan driva vinstrevideringar.",
    valuationView: "Värderingen bedöms rimlig relativt kvalitet och väntad vinsttillväxt.",
    keyRisks: ["Svagare efterfrågan", "Marginalpress"],
    evidenceIds: ["report-q2"],
    disconfirmingEvidenceIds: ["risk-note"],
    rationale: "Köp föreslås eftersom förbättrad lönsamhet stöds av rapportdata samtidigt som den tydligaste motrisken har vägts in.",
  });
}

describe("model portfolio AI decision contract", () => {
  it("requires structured thesis, bear case, valuation, risks and evidence", () => {
    const decision = validDecision();
    assert.equal(decision.action, "buy");
    assert.equal(decision.convictionScore, 0.78);
  });

  it("rejects invented evidence ids", () => {
    const decision = validDecision();
    decision.evidenceIds = ["invented-source"];
    assert.deepEqual(validateEvidenceReferences(decision, evidence), {
      ok: false,
      reason: "unknown_evidence",
    });
  });

  it("requires explicit disconfirming evidence before a trade proposal", () => {
    const decision = validDecision();
    decision.disconfirmingEvidenceIds = [];
    assert.deepEqual(validateEvidenceReferences(decision, evidence), {
      ok: false,
      reason: "missing_disconfirming_check",
    });
  });

  it("allows hold without forcing a contradictory source", () => {
    const decision = validDecision();
    decision.action = "hold";
    decision.disconfirmingEvidenceIds = [];
    assert.deepEqual(validateEvidenceReferences(decision, evidence), { ok: true });
  });

  it("gives high risk a catalyst/asymmetry focus and conservative a downside focus", () => {
    assert.match(buildDecisionFramework("high_risk"), /asymmetri/i);
    assert.match(buildDecisionFramework("high_risk"), /katalysator/i);
    assert.match(buildDecisionFramework("conservative"), /nedsiderisk/i);
    assert.match(buildDecisionFramework("dividend"), /utdelningstäckning/i);
  });
});
