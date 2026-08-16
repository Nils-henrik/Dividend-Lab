import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateBankAnalystContentQuality,
} from "../lib/analysis/bank-analyst-quality-gate";
import type { DivLabBankAnalystDraft } from "../lib/analysis/bank-analyst-schema";
import type { DivLabBankResearch } from "../lib/analysis/bank-research";
import type { DivLabBankScenarioSet } from "../lib/analysis/bank-scenarios";

const REPORT = "report:q2";
const MARKET = "market:bank";
const FUNDAMENTAL = "fundamental:bank";

function factor(
  assessment: "strong" | "neutral" | "weak" | "unknown",
  sourceIds = [REPORT],
) {
  return {
    assessment,
    rationale:
      assessment === "unknown"
        ? "Otillräckligt underlag."
        : "Bedömningen stöds av verifierade bankfakta.",
    sourceIds: assessment === "unknown" ? [] : sourceIds,
  };
}

function draft(): DivLabBankAnalystDraft {
  return {
    view: "positive",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary: "Banken har ett verifierat bankunderlag och en spårbar värderingsram.",
    investmentCase: [
      { text: "Kapitalet stödjer caset.", sourceIds: [REPORT] },
      { text: "Lönsamheten stödjer caset.", sourceIds: [REPORT] },
    ],
    latestReport: [
      { text: "Rapportens CET1 är verifierad.", sourceIds: [REPORT] },
      { text: "Rapportens kreditdata är verifierad.", sourceIds: [REPORT] },
    ],
    bankFundamentalInterpretation: [
      { text: "Kapitalet är centralt.", sourceIds: [REPORT] },
      { text: "Kreditkvalitet är centralt.", sourceIds: [REPORT] },
      { text: "Funding är centralt.", sourceIds: [REPORT] },
    ],
    valuationInterpretation: [
      { measure: "pe", text: "P/E används som komplement.", sourceIds: [MARKET, FUNDAMENTAL] },
      { measure: "priceToBook", text: "P/B är bankens värderingsankare.", sourceIds: [MARKET, FUNDAMENTAL] },
    ],
    bankFactors: {
      franchiseAndDepositBase: factor("neutral"),
      profitability: factor("strong"),
      capitalStrength: factor("strong"),
      creditQuality: factor("neutral"),
      fundingAndLiquidity: factor("strong"),
      efficiency: factor("neutral"),
      rateSensitivity: factor("unknown"),
      feeIncomeDiversification: factor("unknown"),
      regulatoryRisk: factor("unknown"),
      capitalDistribution: factor("unknown"),
    },
    catalysts: [
      { text: "Stabil kreditkvalitet kan stödja en omvärdering.", sourceIds: [REPORT, MARKET] },
    ],
    risks: [
      { text: "Kreditförluster kan öka.", sourceIds: [REPORT] },
      { text: "Räntenettot kan försvagas.", sourceIds: [REPORT] },
      { text: "Multiplar kan falla.", sourceIds: [MARKET] },
    ],
    contradictions: [
      { text: "Kapitalstyrka måste vägas mot kreditcykeln.", sourceIds: [REPORT] },
    ],
    thesisBreakers: [
      { text: "Ett kapital- eller kreditkvalitetsbrott bryter tesen.", sourceIds: [REPORT] },
    ],
    technicalInterpretation: [
      { text: "Tekniken används endast för timing.", sourceIds: [MARKET] },
    ],
    valuationScenarios: [
      {
        name: "bear",
        label: "Bear",
        currency: "SEK",
        forecastYears: 2,
        epsGrowthPct: -0.1,
        peMultiple: 10,
        bookValueGrowthPct: 0,
        priceToBookMultiple: 0.9,
        assumptions: ["Svag vinst", "Lägre P/B"],
        sourceIds: [MARKET, FUNDAMENTAL],
      },
      {
        name: "base",
        label: "Base",
        currency: "SEK",
        forecastYears: 2,
        epsGrowthPct: 0.05,
        peMultiple: 12,
        bookValueGrowthPct: 0.04,
        priceToBookMultiple: 1.2,
        assumptions: ["Normal vinst", "Stabil P/B"],
        sourceIds: [MARKET, FUNDAMENTAL],
      },
      {
        name: "bull",
        label: "Bull",
        currency: "SEK",
        forecastYears: 2,
        epsGrowthPct: 0.1,
        peMultiple: 14,
        bookValueGrowthPct: 0.08,
        priceToBookMultiple: 1.5,
        assumptions: ["Stark vinst", "Högre P/B"],
        sourceIds: [MARKET, FUNDAMENTAL],
      },
    ],
  };
}

function bankResearch(): DivLabBankResearch {
  return {
    status: "research_ready",
    valuation: { status: "traceable" },
    capital: {
      regulatoryCet1Requirement: { status: "not_found" },
    },
  } as unknown as DivLabBankResearch;
}

function scenarioSet(): DivLabBankScenarioSet {
  return {
    version: "bank-scenarios-v1",
    currentPrice: 120,
    currency: "SEK",
    scenarios: [
      { name: "bear", valuePerShare: 90 },
      { name: "base", valuePerShare: 130 },
      { name: "bull", valuePerShare: 170 },
    ],
    baseCaseValue: 130,
    baseCaseUpsideDownsidePct: 130 / 120 - 1,
  } as unknown as DivLabBankScenarioSet;
}

describe("DivLab bank analyst quality gate v1", () => {
  it("certifies a complete bank analysis only when every generic and bank-specific check passes", () => {
    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: draft(),
      scenarios: scenarioSet(),
    });

    assert.equal(result.publishable, true);
    assert.equal(result.score, 100);
    assert.equal(result.metrics.knownQualityFactors, 6);
    assert.equal(result.metrics.uniqueSourceIds, 3);
    assert.ok(Object.values(result.checks).every(Boolean));
    assert.equal(
      result.warnings.some((warning) => warning.includes("Regulatoriskt CET1-krav")),
      true,
    );
  });

  it("blocks when a core bank factor is unknown", () => {
    const value = draft();
    value.bankFactors.creditQuality = factor("unknown");
    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: value,
      scenarios: scenarioSet(),
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.bankCoreFactorCoverage, false);
    assert.ok(result.score < 100);
  });

  it("blocks when any scenario drops the P/B anchor", () => {
    const value = draft();
    value.valuationScenarios[0]!.bookValueGrowthPct = null;
    value.valuationScenarios[0]!.priceToBookMultiple = null;
    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: value,
      scenarios: scenarioSet(),
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.bankScenarioBasisCoverage, false);
  });

  it("blocks high confidence when too many bank factors remain unknown", () => {
    const value = draft();
    value.confidence = "high";
    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: value,
      scenarios: scenarioSet(),
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.confidenceCalibration, false);
  });

  it("blocks when source diversity falls below three", () => {
    const value = draft();
    const replaceIds = (items: Array<{ sourceIds: string[] }>) => {
      for (const item of items) item.sourceIds = [REPORT];
    };
    replaceIds(value.investmentCase);
    replaceIds(value.latestReport);
    replaceIds(value.bankFundamentalInterpretation);
    replaceIds(value.valuationInterpretation);
    replaceIds(value.catalysts);
    replaceIds(value.risks);
    replaceIds(value.contradictions);
    replaceIds(value.thesisBreakers);
    replaceIds(value.technicalInterpretation);
    replaceIds(value.valuationScenarios);
    for (const factorValue of Object.values(value.bankFactors)) {
      if (factorValue.assessment !== "unknown") factorValue.sourceIds = [REPORT];
    }

    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: value,
      scenarios: scenarioSet(),
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.sourceDiversity, false);
  });

  it("blocks a positive view when the deterministic base case has downside", () => {
    const scenarios = scenarioSet();
    scenarios.baseCaseUpsideDownsidePct = -0.1;
    const result = evaluateBankAnalystContentQuality({
      bankResearch: bankResearch(),
      draft: draft(),
      scenarios,
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.viewValuationConsistency, false);
  });
});
