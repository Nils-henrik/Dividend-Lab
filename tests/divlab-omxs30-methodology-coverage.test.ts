import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analysisEngineForCompanyType } from "../lib/analysis/analysis-engine-dispatch";
import type { DivLabCompanyClassification } from "../lib/analysis/company-classification";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildFinancialSpecialistResearch } from "../lib/analysis/financial-specialist-research";
import { buildFinancialSpecialistScenarioSet } from "../lib/analysis/financial-specialist-scenarios";
import type { DivLabFinancialSpecialistAnalystDraft } from "../lib/analysis/financial-specialist-schema";
import {
  applyOmxs30SpecialClassification,
  getOmxs30SpecialMethodologyTarget,
  OMXS30_SPECIAL_METHODOLOGY_TARGETS,
} from "../lib/analysis/omxs30-methodology-registry";

function providerFinancial(): DivLabCompanyClassification {
  return {
    version: "company-classification-v1",
    type: "financial_other",
    confidence: "medium",
    sector: "Financial Services",
    industry: "Asset Management",
    quoteType: "EQUITY",
    basis: ["sector=Financial Services"],
    sourceIds: ["yahoo:profile"],
  };
}

function packet(input: {
  type: "investment_company" | "asset_manager";
  price: number;
  evidence: string;
  eps?: number;
}): DivLabResearchPacket {
  return {
    instrument: { symbol: "TEST", exchange: "ST", name: "Test", currency: "SEK", currentPrice: input.price },
    companyClassification: { ...providerFinancial(), type: input.type, confidence: "high" },
    evidence: [{ id: "e1", sourceId: "primary:1", kind: "official_report_excerpt", title: "Report", content: input.evidence, documentExcerpt: input.evidence, publishedAt: "2026-06-30T00:00:00.000Z", primary: true, documentRetrieved: true, reportPeriod: "Q2", reportYear: 2026, documentType: "interim_report" }],
    valuation: { trailing: { pe: input.eps ? input.price / input.eps : null } },
    valuationProvenance: { measures: { pe: { sourceIds: ["market:1", "fundamental:1"] } } },
  } as unknown as DivLabResearchPacket;
}

function draft(type: "investment_company" | "asset_manager"): DivLabFinancialSpecialistAnalystDraft {
  const scenarios = type === "investment_company"
    ? [
        { name: "bear" as const, label: "Bear", currency: "SEK", forecastYears: 1, navGrowthPct: -0.05, discountPct: 0.22, epsGrowthPct: null, peMultiple: null, assumptions: ["svagare NAV", "större rabatt"], sourceIds: ["primary:1"] },
        { name: "base" as const, label: "Base", currency: "SEK", forecastYears: 1, navGrowthPct: 0.05, discountPct: 0.12, epsGrowthPct: null, peMultiple: null, assumptions: ["normal NAV", "normal rabatt"], sourceIds: ["primary:1"] },
        { name: "bull" as const, label: "Bull", currency: "SEK", forecastYears: 1, navGrowthPct: 0.12, discountPct: 0.05, epsGrowthPct: null, peMultiple: null, assumptions: ["stark NAV", "lägre rabatt"], sourceIds: ["primary:1"] },
      ]
    : [
        { name: "bear" as const, label: "Bear", currency: "SEK", forecastYears: 1, navGrowthPct: null, discountPct: null, epsGrowthPct: -0.1, peMultiple: 16, assumptions: ["svagare vinst", "lägre multipel"], sourceIds: ["primary:1"] },
        { name: "base" as const, label: "Base", currency: "SEK", forecastYears: 1, navGrowthPct: null, discountPct: null, epsGrowthPct: 0.08, peMultiple: 20, assumptions: ["normal vinst", "normal multipel"], sourceIds: ["primary:1"] },
        { name: "bull" as const, label: "Bull", currency: "SEK", forecastYears: 1, navGrowthPct: null, discountPct: null, epsGrowthPct: 0.18, peMultiple: 24, assumptions: ["stark vinst", "högre multipel"], sourceIds: ["primary:1"] },
      ];
  return { specialistType: type, valuationScenarios: scenarios } as unknown as DivLabFinancialSpecialistAnalystDraft;
}

describe("OMXS30 methodology coverage", () => {
  it("has exact specialist registry entries for the current non-operating OMXS30 families", () => {
    assert.equal(OMXS30_SPECIAL_METHODOLOGY_TARGETS.length, 7);
    assert.equal(getOmxs30SpecialMethodologyTarget("INVE-B.ST")?.companyType, "investment_company");
    assert.equal(getOmxs30SpecialMethodologyTarget("INDU-C.ST")?.companyType, "investment_company");
    assert.equal(getOmxs30SpecialMethodologyTarget("EQT.ST")?.companyType, "asset_manager");
    for (const symbol of ["NDA-SE.ST", "SHB-A.ST", "SEB-A.ST", "SWED-A.ST"]) {
      assert.equal(getOmxs30SpecialMethodologyTarget(symbol)?.companyType, "bank");
    }
  });

  it("routes all current OMXS30 methodology families to an engine", () => {
    assert.equal(analysisEngineForCompanyType("operating_company"), "operating_company");
    assert.equal(analysisEngineForCompanyType("bank"), "bank");
    assert.equal(analysisEngineForCompanyType("investment_company"), "financial_specialist");
    assert.equal(analysisEngineForCompanyType("asset_manager"), "financial_specialist");
    assert.equal(analysisEngineForCompanyType("unknown"), null);
  });

  it("promotes exact Investor, Industrivärden and EQT symbols without broad financial-sector guessing", () => {
    assert.equal(applyOmxs30SpecialClassification({ yahooSymbol: "INVE-B.ST", classification: providerFinancial() }).type, "investment_company");
    assert.equal(applyOmxs30SpecialClassification({ yahooSymbol: "INDU-C.ST", classification: providerFinancial() }).type, "investment_company");
    assert.equal(applyOmxs30SpecialClassification({ yahooSymbol: "EQT.ST", classification: providerFinancial() }).type, "asset_manager");
    assert.equal(applyOmxs30SpecialClassification({ yahooSymbol: "RANDOM.ST", classification: providerFinancial() }).type, "financial_other");
  });

  it("extracts investment-company NAV and builds ordered NAV-discount scenarios", () => {
    const base = packet({ type: "investment_company", price: 350, evidence: "Adjusted net asset value (NAV) was SEK 397 per share. Net debt ratio was 1.9 percent." });
    const research = buildFinancialSpecialistResearch({ basePacket: base });
    assert.equal(research.status, "research_ready");
    assert.equal(research.metrics.navPerShare.value, 397);
    assert.ok((research.metrics.discountToNavPct.value ?? 0) > 11 && (research.metrics.discountToNavPct.value ?? 0) < 12);
    const scenarios = buildFinancialSpecialistScenarioSet({ currentPrice: 350, currency: "SEK", research, trailingEps: null, draft: draft("investment_company") });
    assert.equal(scenarios.scenarios[0]?.method, "NAV_discount");
    assert.ok(scenarios.scenarios[0]!.valuePerShare! < scenarios.scenarios[1]!.valuePerShare!);
    assert.ok(scenarios.scenarios[1]!.valuePerShare! < scenarios.scenarios[2]!.valuePerShare!);
  });

  it("extracts alternative-asset-manager AUM and uses a deterministic P/E scenario basis", () => {
    const base = packet({ type: "asset_manager", price: 330, eps: 15, evidence: "EQT had EUR 270 billion in total assets under management and EUR 141 billion in fee-generating assets under management." });
    const research = buildFinancialSpecialistResearch({ basePacket: base });
    assert.equal(research.status, "research_ready");
    assert.equal(research.metrics.totalAumEurBn.value, 270);
    assert.equal(research.metrics.feeGeneratingAumEurBn.value, 141);
    const scenarios = buildFinancialSpecialistScenarioSet({ currentPrice: 330, currency: "SEK", research, trailingEps: 15, draft: draft("asset_manager") });
    assert.equal(scenarios.scenarios[1]?.method, "P/E");
    assert.ok(scenarios.scenarios[0]!.valuePerShare! < scenarios.scenarios[2]!.valuePerShare!);
  });
});
