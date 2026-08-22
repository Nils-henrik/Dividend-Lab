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

function investorPacketWithExcerpt(excerpt: string): DivLabResearchPacket {
  const evidence: AnalysisEvidence = {
    id: "evidence:investor-q2",
    sourceId: "nordic-release:INVE-B:2026-07-16T08:15:37.000Z",
    kind: "official_report_excerpt",
    title: "Interim report January-June 2026",
    content: "Official Nasdaq issuer release.",
    documentExcerpt: excerpt,
    publishedAt: "2026-07-16T08:15:37.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "H1",
    reportYear: 2026,
    documentType: "half_year_report",
  };

  return {
    companyClassification: { type: "investment_company" },
    evidence: [evidence],
    instrument: { currency: "SEK", currentPrice: 330 },
    valuation: { trailing: { pe: null } },
    valuationProvenance: {
      measures: { pe: { sourceIds: [] } },
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

  it("normalizes invisible Unicode format controls without weakening explicit EUR/scale requirements", () => {
    const research = buildFinancialSpecialistResearch({
      basePacket: packetWithExcerpt(
        "Gross inflows €17.8bn. FAUM amounted to €\u200c\u200b155\u200bbn (€141bn) and Total AUM was €\u200c291\u200bbn (€266bn).",
      ),
    });

    assert.equal(research.status, "research_ready");
    assert.equal(research.metrics.feeGeneratingAumEurBn.value, 155);
    assert.equal(research.metrics.totalAumEurBn.value, 291);
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

  it("extracts Investor adjusted NAV per share from the verified issuer-release wording and derives discount deterministically", () => {
    const research = buildFinancialSpecialistResearch({
      basePacket: investorPacketWithExcerpt(
        "Adjusted net asset value (NAV) was SEK 1,214.7bn (SEK 397 per share) on June 30, 2026.",
      ),
    });

    assert.equal(research.status, "research_ready");
    assert.equal(research.metrics.navPerShare.value, 397);
    assert.deepEqual(research.metrics.navPerShare.sourceIds, [
      "nordic-release:INVE-B:2026-07-16T08:15:37.000Z",
    ]);
    assert.ok(Math.abs((research.metrics.discountToNavPct.value ?? 0) - 16.8765743) < 0.0001);
    assert.deepEqual(research.metrics.discountToNavPct.sourceIds, research.metrics.navPerShare.sourceIds);
    assert.deepEqual(research.blockers, []);
  });

  it("does not infer Investor NAV per share from unrelated equity or market-cap values", () => {
    const research = buildFinancialSpecialistResearch({
      basePacket: investorPacketWithExcerpt(
        "Total equity was SEK 397bn. Market capitalization was SEK 1,010bn. Earnings per share were SEK 12.4.",
      ),
    });

    assert.equal(research.status, "insufficient");
    assert.equal(research.metrics.navPerShare.status, "missing");
    assert.equal(research.metrics.discountToNavPct.status, "missing");
    assert.ok(research.blockers.includes("investment_company_nav_per_share_missing"));
  });
});
