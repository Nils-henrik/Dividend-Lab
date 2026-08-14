import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analystDraftToValuationScenarios,
  validateAnalystDraftAgainstPacket,
} from "../lib/analysis/analyst";
import {
  divLabAnalystDraftSchema,
  type DivLabAnalystDraft,
} from "../lib/analysis/analyst-schema";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

const REPORT_SOURCE = "report:q2";
const MARKET_SOURCE = "market:test";

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const cycle = Math.sin((index / 18) * Math.PI * 2);
    const close = 100 + cycle * 7 + index * 0.015;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    };
  });
}

function factsPacket() {
  const history = bars();
  return buildDivLabResearchPacket({
    symbol: "TEST",
    exchange: "ST",
    name: "Testbolaget AB",
    currency: "SEK",
    currentPrice: history.at(-1)!.close,
    history,
    fundamentals: {
      asOf: "2026-08-14T12:00:00.000Z",
      currency: "SEK",
      revenueTtm: 12_000,
      revenueGrowthYoy: 0.08,
      operatingMarginTtm: 0.16,
      profitMarginTtm: 0.1,
      ebitdaTtm: 2_200,
      netIncomeTtm: 1_200,
      epsTtm: 8,
      operatingCashFlowTtm: 1_900,
      freeCashFlowTtm: 1_500,
      cash: 900,
      totalDebt: 1_400,
      sharesOutstanding: 180,
      returnOnEquity: 0.18,
      historicalPeriods: [
        { period: "2023-12-31", revenue: 9_000, operatingIncome: 1_200, netIncome: 800, freeCashFlow: 950, eps: 5, sharesOutstanding: 176 },
        { period: "2024-12-31", revenue: 10_000, operatingIncome: 1_400, netIncome: 920, freeCashFlow: 1_100, eps: 5.8, sharesOutstanding: 178 },
        { period: "2025-12-31", revenue: 11_000, operatingIncome: 1_650, netIncome: 1_050, freeCashFlow: 1_300, eps: 6.8, sharesOutstanding: 179 },
      ],
    },
    valuationScenarios: [],
    sources: [
      {
        id: REPORT_SOURCE,
        kind: "quarterly_report",
        publisher: "Testbolaget AB",
        url: "https://example.com/q2.pdf",
        publishedAt: "2026-07-20T06:00:00.000Z",
        verifiedAt: "2026-08-14T12:00:00.000Z",
        primary: true,
      },
      {
        id: MARKET_SOURCE,
        kind: "market_data",
        publisher: "Market provider",
        url: "https://example.com/market",
        publishedAt: "2026-08-14T12:00:00.000Z",
        verifiedAt: "2026-08-14T12:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [
      {
        id: `evidence:${REPORT_SOURCE}`,
        sourceId: REPORT_SOURCE,
        kind: "official_report_excerpt",
        title: "Q2 2026",
        content: "Verifierat officiellt rapportutdrag med omsättning, marginal, kassaflöde, balansräkning och ledningens kommentar. Innehållet är tillräckligt långt för att analystjänsten ska kunna tolka den senaste rapporten utan att använda rubriken som ersättning för dokumenttext. Den här texten är en testfixture och representerar bounded primärkälleevidens.",
        publishedAt: "2026-07-20T06:00:00.000Z",
        primary: true,
        documentRetrieved: true,
        reportPeriod: "Q2",
        reportYear: 2026,
        documentType: "quarterly_report",
      },
    ],
    now: new Date("2026-08-14T16:00:00.000Z"),
  });
}

function factor(assessment: "strong" | "neutral" | "weak" | "unknown" = "neutral") {
  return {
    assessment,
    rationale: "Bedömningen bygger endast på det verifierade underlaget.",
    sourceIds: assessment === "unknown" ? [] : [REPORT_SOURCE],
  };
}

function validDraft(): DivLabAnalystDraft {
  const claim = (text: string, sourceIds = [REPORT_SOURCE]) => ({ text, sourceIds });
  return divLabAnalystDraftSchema.parse({
    view: "positive",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary: "Bolaget visar en positiv fundamental utveckling men värderingen måste vägas mot riskerna och scenarioantagandena.",
    investmentCase: [claim("Lönsamheten är stabil."), claim("Kassaflödet stödjer investeringscaset.")],
    latestReport: [claim("Senaste rapporten visar fortsatt stabil utveckling.")],
    fundamentalInterpretation: [claim("Omsättningen växer över fler år."), claim("Per-aktie-utvecklingen är positiv.")],
    qualityFactors: {
      competitiveAdvantage: factor("strong"),
      pricingPower: factor(),
      marketPosition: factor(),
      managementAndCapitalAllocation: factor(),
      reinvestmentRunway: factor(),
      cyclicality: factor(),
      customerConcentration: factor("unknown"),
      regulatoryRisk: factor(),
      currencyRisk: factor(),
      acquisitionRisk: factor(),
      disruptionRisk: factor(),
    },
    catalysts: [claim("En fortsatt marginalförbättring kan vara en katalysator.")],
    risks: [claim("Svagare efterfrågan är en risk."), claim("Multipelkontraktion är en risk.", [MARKET_SOURCE])],
    contradictions: [claim("Stark historik motsägs delvis av värderingsrisken.", [REPORT_SOURCE, MARKET_SOURCE])],
    thesisBreakers: [claim("Ett tydligt och bestående kassaflödesbrott skulle bryta tesen.")],
    technicalInterpretation: [claim("Den tekniska bilden ska endast tolkas från givna nivåer.", [MARKET_SOURCE])],
    valuationScenarios: [
      {
        name: "bear",
        label: "Bear",
        currency: "SEK",
        eps: 7,
        peMultiple: 12,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Svagare efterfrågan"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
      {
        name: "base",
        label: "Base",
        currency: "SEK",
        eps: 8.5,
        peMultiple: 16,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Normaliserad tillväxt"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
      {
        name: "bull",
        label: "Bull",
        currency: "SEK",
        eps: 10,
        peMultiple: 19,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: null,
        assumptions: ["Högre marginal"],
        sourceIds: [REPORT_SOURCE, MARKET_SOURCE],
      },
    ],
  });
}

describe("DivLab analyst contract", () => {
  it("accepts a source-grounded draft and converts assumptions for deterministic valuation", () => {
    const packet = factsPacket();
    const draft = validDraft();
    validateAnalystDraftAgainstPacket({ packet, draft });
    const scenarios = analystDraftToValuationScenarios(draft);
    assert.equal(scenarios.length, 3);
    assert.equal(scenarios[1]?.currency, "SEK");
    assert.equal(scenarios[1]?.eps, 8.5);
  });

  it("rejects invented source ids", () => {
    const packet = factsPacket();
    const draft = validDraft();
    draft.risks[0]!.sourceIds = ["invented:source"];
    assert.throws(
      () => validateAnalystDraftAgainstPacket({ packet, draft }),
      /divlab_analyst_unknown_source_id/,
    );
  });

  it("rejects scenario currency that differs from the market currency", () => {
    const packet = factsPacket();
    const draft = validDraft();
    draft.valuationScenarios[0]!.currency = "EUR";
    assert.throws(
      () => validateAnalystDraftAgainstPacket({ packet, draft }),
      /divlab_analyst_scenario_currency_mismatch/,
    );
  });

  it("rejects invalid horizon ordering and duplicate scenarios at schema level", () => {
    const draft = validDraft();
    const raw = {
      ...draft,
      horizonMonths: { min: 36, max: 12 },
      valuationScenarios: [
        draft.valuationScenarios[0],
        draft.valuationScenarios[0],
        draft.valuationScenarios[2],
      ],
    };
    assert.equal(divLabAnalystDraftSchema.safeParse(raw).success, false);
  });
});
