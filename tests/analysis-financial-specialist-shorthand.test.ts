import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import { buildFinancialSpecialistResearch } from "../lib/analysis/financial-specialist-research";

function packetWithExcerpt(excerpt: string): DivLabResearchPacket {
  const evidence: AnalysisEvidence = {
    id: "evidence:eqt-h1",
    sourceId: "primary:eqt-h1",
    kind: "official_report_excerpt",
    title: "EQT AB (publ) Half-year Report 2026",
    content: "Officiell halvårsrapport.",
    documentExcerpt: excerpt,
    publishedAt: "2026-07-17T07:00:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "H1",
    reportYear: 2026,
    documentType: "half_year_report",
  };

  return {
    companyClassification: { type: "asset_manager" },
    evidence: [evidence],
    instrument: { currency: "SEK", currentPrice: 336.8 },
    valuation: { trailing: { pe: 34.332 } },
    valuationProvenance: {
      measures: { pe: { sourceIds: ["fundamental:eqt"] } },
    },
  } as unknown as DivLabResearchPacket;
}

describe("DivLab financial-specialist issuer shorthand", () => {
  it("extracts source-bound EQT FAUM and total AUM shorthand with explicit EUR units", () => {
    const research = buildFinancialSpecialistResearch({
      basePacket: packetWithExcerpt(
        "FAUM uppgick till €155mdr (€141mdr) och totalt AUM uppgick till €291mdr (€266mdr).",
      ),
    });

    assert.equal(research.status, "research_ready");
    assert.equal(research.metrics.feeGeneratingAumEurBn.value, 155);
    assert.equal(research.metrics.totalAumEurBn.value, 291);
    assert.equal(research.metrics.feeGeneratingAumEurBn.sourceIds[0], "primary:eqt-h1");
    assert.equal(research.metrics.totalAumEurBn.sourceIds[0], "primary:eqt-h1");
    assert.ok((research.metrics.feeAumSharePct.value ?? 0) > 53);
    assert.deepEqual(research.blockers, []);
  });

  it("does not accept bare AUM shorthand without explicit currency and scale", () => {
    const research = buildFinancialSpecialistResearch({
      basePacket: packetWithExcerpt("FAUM 155 and total AUM 291."),
    });

    assert.equal(research.status, "insufficient");
    assert.equal(research.metrics.feeGeneratingAumEurBn.status, "missing");
    assert.equal(research.metrics.totalAumEurBn.status, "missing");
  });
});
