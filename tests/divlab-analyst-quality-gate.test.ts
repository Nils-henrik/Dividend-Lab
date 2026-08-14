import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAnalystContentQuality } from "../lib/analysis/analyst-quality-gate";
import { divLabAnalystDraftSchema } from "../lib/analysis/analyst-schema";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import { operatingCompanyClassification } from "./helpers/divlab-company-classification";

const REPORT_ID = "report:q2";
const MARKET_ID = "market:test";
const FUNDAMENTAL_ID = "fundamental:test";

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin(index / 11) * 5 + index * 0.02;
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

function packet(values = { bear: 80, base: 120, bull: 160 }) {
  return buildDivLabResearchPacket({
    symbol: "TEST",
    exchange: "ST",
    name: "Test AB",
    currency: "SEK",
    currentPrice: 100,
    history: bars(),
    fundamentals: {
      asOf: "2026-06-30",
      currency: "SEK",
      revenueTtm: 1_200,
      revenueGrowthYoy: 0.08,
      operatingMarginTtm: 0.18,
      profitMarginTtm: 0.12,
      ebitdaTtm: 240,
      netIncomeTtm: 120,
      epsTtm: 8,
      operatingCashFlowTtm: 190,
      freeCashFlowTtm: 150,
      cash: 100,
      totalDebt: 120,
      sharesOutstanding: 100,
      returnOnEquity: 0.18,
      historicalPeriods: [
        { period: "2023-12-31", revenue: 900 },
        { period: "2024-12-31", revenue: 1_000 },
        { period: "2025-12-31", revenue: 1_100 },
      ],
    },
    companyClassification: operatingCompanyClassification(FUNDAMENTAL_ID),
    valuationScenarios: [
      {
        name: "bear",
        label: "Bear",
        currency: "SEK",
        explicitValuePerShare: values.bear,
        assumptions: ["Svagare efterfrågan"],
      },
      {
        name: "base",
        label: "Base",
        currency: "SEK",
        explicitValuePerShare: values.base,
        assumptions: ["Normaliserad utveckling"],
      },
      {
        name: "bull",
        label: "Bull",
        currency: "SEK",
        explicitValuePerShare: values.bull,
        assumptions: ["Högre tillväxt och marginal"],
      },
    ],
    sources: [
      {
        id: REPORT_ID,
        kind: "quarterly_report",
        publisher: "Test AB",
        url: "https://example.com/q2.pdf",
        publishedAt: "2026-07-20T06:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: true,
      },
      {
        id: MARKET_ID,
        kind: "market_data",
        publisher: "Market provider",
        url: "https://example.com/market",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
      {
        id: FUNDAMENTAL_ID,
        kind: "fundamental_data",
        publisher: "Fundamental provider",
        url: "https://example.com/fundamentals",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [
      {
        id: "evidence:report:q2",
        sourceId: REPORT_ID,
        kind: "official_report_excerpt",
        title: "Q2 2026",
        content: "Verifierat officiellt rapportutdrag med tillräckligt innehåll om omsättning, marginaler, kassaflöde, balansräkning och ledningens kommentarer. Detta är en kontrollerad testfixture som medvetet är längre än miniminivån för primär rapport-evidens i DivLab Deep Research.",
        publishedAt: "2026-07-20T06:00:00.000Z",
        primary: true,
        documentRetrieved: true,
        reportPeriod: "Q2",
        reportYear: 2026,
        documentType: "quarterly_report",
      },
    ],
    now: new Date("2026-08-14T17:00:00.000Z"),
  });
}

function draft() {
  const claim = (text: string, sourceIds = [REPORT_ID]) => ({ text, sourceIds });
  const known = (assessment: "strong" | "neutral" | "weak" = "neutral") => ({
    assessment,
    rationale: "Bedömningen stöds av verifierat rapportunderlag.",
    sourceIds: [REPORT_ID],
  });
  const unknown = {
    assessment: "unknown" as const,
    rationale: "Underlaget räcker inte för en säker bedömning.",
    sourceIds: [] as string[],
  };

  return divLabAnalystDraftSchema.parse({
    view: "positive",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary: "Bolaget visar en tillräckligt stark verifierad profil för en positiv aktiesyn, men riskerna och värderingen måste fortsatt följas.",
    investmentCase: [
      claim("Kassaflödet ger stöd åt investeringscaset."),
      claim("Lönsamheten är tillräckligt stark för fortsatt analys."),
    ],
    latestReport: [claim("Den senaste rapporten är analysens primära fundamentala källa.")],
    fundamentalInterpretation: [
      claim("Omsättningen visar en stabil flerårig utveckling."),
      claim("Kassaflödet ger stöd åt den redovisade vinsten."),
    ],
    valuationInterpretation: [
      {
        measure: "pe",
        text: "Trailing P/E används som ett spårbart värderingsmått.",
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
      },
    ],
    qualityFactors: {
      competitiveAdvantage: known("strong"),
      pricingPower: known(),
      marketPosition: known("strong"),
      managementAndCapitalAllocation: known(),
      reinvestmentRunway: known(),
      cyclicality: known(),
      customerConcentration: unknown,
      regulatoryRisk: unknown,
      currencyRisk: known(),
      acquisitionRisk: unknown,
      disruptionRisk: unknown,
    },
    catalysts: [claim("Förbättrad efterfrågan kan bli en katalysator.")],
    risks: [
      claim("Svagare efterfrågan kan pressa tillväxten."),
      claim("En högre riskpremie kan pressa värderingen.", [MARKET_ID]),
    ],
    contradictions: [claim("Stark kvalitet måste vägas mot värderingsrisken.", [REPORT_ID, MARKET_ID])],
    thesisBreakers: [claim("Ett bestående brott i kassaflödesutvecklingen skulle bryta tesen.")],
    technicalInterpretation: [claim("Tekniken används endast som risk- och timingstöd.", [MARKET_ID])],
    valuationScenarios: [
      {
        name: "bear",
        label: "Bear",
        currency: "SEK",
        eps: null,
        peMultiple: null,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: 80,
        assumptions: ["Svagare efterfrågan"],
        sourceIds: [REPORT_ID, MARKET_ID],
      },
      {
        name: "base",
        label: "Base",
        currency: "SEK",
        eps: null,
        peMultiple: null,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: 120,
        assumptions: ["Normaliserad utveckling"],
        sourceIds: [REPORT_ID, MARKET_ID],
      },
      {
        name: "bull",
        label: "Bull",
        currency: "SEK",
        eps: null,
        peMultiple: null,
        freeCashFlowPerShare: null,
        pFcfMultiple: null,
        explicitValuePerShare: 160,
        assumptions: ["Högre tillväxt och marginal"],
        sourceIds: [REPORT_ID, MARKET_ID],
      },
    ],
  });
}

describe("DivLab analyst content quality gate", () => {
  it("accepts a differentiated, source-diverse and confidence-calibrated analyst draft", () => {
    const result = evaluateAnalystContentQuality({ packet: packet(), draft: draft() });
    assert.equal(result.publishable, true);
    assert.equal(result.score, 100);
    assert.equal(result.metrics.knownQualityFactors, 7);
    assert.equal(result.metrics.uniqueSourceIds, 3);
  });

  it("rejects thin qualitative coverage and overconfident unknowns", () => {
    const analystDraft = draft();
    analystDraft.confidence = "high";
    for (const key of Object.keys(analystDraft.qualityFactors) as Array<keyof typeof analystDraft.qualityFactors>) {
      analystDraft.qualityFactors[key] = {
        assessment: "unknown",
        rationale: "Otillräckligt underlag.",
        sourceIds: [],
      };
    }
    const result = evaluateAnalystContentQuality({ packet: packet(), draft: analystDraft });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.qualityFactorCoverage, false);
    assert.equal(result.checks.confidenceCalibration, false);
  });

  it("rejects repeated scenario assumptions even when scenario values differ", () => {
    const analystDraft = draft();
    for (const scenario of analystDraft.valuationScenarios) {
      scenario.assumptions = ["Samma antagande i alla scenarier"];
    }
    const result = evaluateAnalystContentQuality({ packet: packet(), draft: analystDraft });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.assumptionDifferentiation, false);
  });

  it("rejects a positive stock view when the base case has downside", () => {
    const result = evaluateAnalystContentQuality({
      packet: packet({ bear: 60, base: 90, bull: 140 }),
      draft: draft(),
    });
    assert.equal(result.publishable, false);
    assert.equal(result.checks.viewValuationConsistency, false);
  });
});
