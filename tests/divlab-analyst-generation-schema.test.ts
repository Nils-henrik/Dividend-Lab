import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  divLabAnalystDraftSchema,
  divLabAnalystGenerationSchema,
} from "../lib/analysis/analyst-schema";

const claim = (text: string) => ({ text, sourceIds: ["source-1"] });
const factor = () => ({
  assessment: "strong" as const,
  rationale: "Verifierat underlag stödjer bedömningen.",
  sourceIds: ["source-1"],
});

function validDraft() {
  return {
    view: "positive" as const,
    riskLevel: "medium" as const,
    confidence: "medium" as const,
    horizonMonths: { min: 12, max: 24 },
    executiveSummary:
      "Bolaget visar en tillräckligt tydlig kombination av kvalitet, värdering och teknisk struktur för testet.",
    investmentCase: [claim("Investeringscase ett."), claim("Investeringscase två.")],
    latestReport: [claim("Senaste rapporten visar verifierade datapunkter.")],
    fundamentalInterpretation: [
      claim("Fundamental tolkning ett."),
      claim("Fundamental tolkning två."),
    ],
    valuationInterpretation: [
      { measure: "pe" as const, text: "P/E är spårbart i underlaget.", sourceIds: ["source-1"] },
    ],
    qualityFactors: {
      competitiveAdvantage: factor(),
      pricingPower: factor(),
      marketPosition: factor(),
      managementAndCapitalAllocation: factor(),
      reinvestmentRunway: factor(),
      cyclicality: factor(),
      customerConcentration: factor(),
      regulatoryRisk: factor(),
      currencyRisk: factor(),
      acquisitionRisk: factor(),
      disruptionRisk: factor(),
    },
    catalysts: [claim("En möjlig katalysator finns i underlaget.")],
    risks: [claim("Risk ett är verifierad."), claim("Risk två är verifierad.")],
    contradictions: [claim("En motsägande signal finns i underlaget.")],
    thesisBreakers: [claim("Den här datapunkten skulle bryta tesen.")],
    technicalInterpretation: [claim("Den tekniska bilden bygger på givna nivåer.")],
    valuationScenarios: [
      {
        name: "bear" as const,
        label: "Bear",
        currency: "SEK",
        eps: 5,
        peMultiple: 12,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Svagare utveckling."],
        sourceIds: ["source-1"],
      },
      {
        name: "base" as const,
        label: "Base",
        currency: "SEK",
        eps: 6,
        peMultiple: 15,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Normaliserad utveckling."],
        sourceIds: ["source-1"],
      },
      {
        name: "bull" as const,
        label: "Bull",
        currency: "SEK",
        eps: 7,
        peMultiple: 18,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Starkare utveckling."],
        sourceIds: ["source-1"],
      },
    ],
  };
}

describe("DivLab Analyst provider transport schema", () => {
  it("accepts a structurally valid object while domain validation retains source rules", () => {
    const draft = validDraft();
    draft.qualityFactors.competitiveAdvantage.sourceIds = [];

    assert.equal(divLabAnalystGenerationSchema.safeParse(draft).success, true);
    const domain = divLabAnalystDraftSchema.safeParse(draft);
    assert.equal(domain.success, false);
    if (!domain.success) {
      assert.ok(
        domain.error.issues.some(
          (issue) => issue.message === "non_unknown_factor_requires_source",
        ),
      );
    }
  });

  it("keeps paired valuation semantics in DivLab rather than provider JSON schema", () => {
    const draft = validDraft();
    draft.valuationScenarios[0]!.peMultiple = null;

    assert.equal(divLabAnalystGenerationSchema.safeParse(draft).success, true);
    const domain = divLabAnalystDraftSchema.safeParse(draft);
    assert.equal(domain.success, false);
    if (!domain.success) {
      assert.ok(
        domain.error.issues.some(
          (issue) => issue.message === "eps_and_pe_multiple_must_be_paired",
        ),
      );
    }
  });

  it("accepts the same fully valid object through both gates", () => {
    const draft = validDraft();
    assert.equal(divLabAnalystGenerationSchema.safeParse(draft).success, true);
    assert.equal(divLabAnalystDraftSchema.safeParse(draft).success, true);
  });
});
