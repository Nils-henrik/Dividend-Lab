import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDecisionFramework,
  modelPortfolioDecisionSchema,
  normalizeDecisionEvidenceReferences,
  validateEvidenceReferences,
  type ModelPortfolioEvidence,
} from "../lib/model-portfolios/engine/decision";

const evidence: ModelPortfolioEvidence[] = [
  {
    id: "research:AKER:OL:2026-08-17T07:04:51.000Z",
    kind: "market_data",
    publisher: "Yahoo Finance + DivLab deterministic TA",
    publishedAt: "2026-08-17T07:04:51.000Z",
    verifiedAt: "2026-08-17T07:20:03.157Z",
    title: "Aker ASA – marknadsdata, teknisk analys och fundamentals",
    summary: "Verifierat testunderlag.",
  },
];

function decision(evidenceId: string) {
  return modelPortfolioDecisionSchema.parse({
    action: "buy",
    symbol: "AKER",
    exchange: "OL",
    instrumentName: "Aker ASA",
    proposedPortfolioPct: 10,
    convictionScore: 0.72,
    materialThesisBreak: false,
    thesis: "Kvalitet, balansräkning och vinstrevideringar ger ett tillräckligt starkt förstacase.",
    bearCase: "Hög RSI och svagare entry kan ge kortsiktig rekyl och sämre risk/reward än väntat.",
    catalyst: "Fortsatt positiv vinstutveckling kan bära caset.",
    valuationView: "Värderingen är försvarbar relativt kvalitet och utsikter.",
    keyRisks: ["Överköpt teknisk entry", "Värderingsrisk"],
    evidenceIds: [evidenceId],
    disconfirmingEvidenceIds: [],
    rationale: "Ett begränsat förstaköp är motiverat trots normal osäkerhet eftersom flera oberoende delar av caset samverkar.",
  });
}

describe("model portfolio evidence reference normalization", () => {
  it("repairs a unique research-id stem to the exact supplied timestamped id", () => {
    const normalized = normalizeDecisionEvidenceReferences(
      decision("research:AKER:OL"),
      evidence,
    );
    assert.equal(normalized.unknownEvidenceIds.length, 0);
    assert.deepEqual(normalized.repaired, [
      {
        from: "research:AKER:OL",
        to: evidence[0]!.id,
      },
    ]);
    assert.deepEqual(validateEvidenceReferences(normalized.decision, evidence), { ok: true });
  });

  it("repairs harmless brackets and case differences but never invents a match", () => {
    const repaired = normalizeDecisionEvidenceReferences(
      decision("[RESEARCH:AKER:OL:2026-08-17T07:04:51.000Z]"),
      evidence,
    );
    assert.deepEqual(validateEvidenceReferences(repaired.decision, evidence), { ok: true });

    const unknown = normalizeDecisionEvidenceReferences(
      decision("research:FAKE:OL"),
      evidence,
    );
    assert.deepEqual(unknown.unknownEvidenceIds, ["research:FAKE:OL"]);
    assert.deepEqual(validateEvidenceReferences(unknown.decision, evidence), {
      ok: false,
      reason: "unknown_evidence",
    });
  });
});

describe("model portfolio decision neutrality", () => {
  it("does not frame HOLD as the default decision", () => {
    const framework = buildDecisionFramework("balanced");
    assert.match(framework, /KÖP, HOLD och SÄLJ är likvärdiga aktiva beslut/i);
    assert.match(framework, /HOLD är inte ett standardläge/i);
    assert.match(framework, /Kräv inte perfekt information/i);
    assert.doesNotMatch(framework, /finns det tillräckligt stark evidens för att INTE välja HOLD/i);
  });

  it("requires exact copied evidence IDs in the manager output discipline", () => {
    const framework = buildDecisionFramework("balanced");
    assert.match(framework, /exakt kopiera ID-strängar/i);
    assert.match(framework, /Förkorta, omskriv eller hitta aldrig på ett evidens-ID/i);
  });
});
