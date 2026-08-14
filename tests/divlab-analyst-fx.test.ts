import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateAnalystDraftAgainstPacket } from "../lib/analysis/analyst-contract";
import { divLabAnalystDraftSchema } from "../lib/analysis/analyst-schema";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import { deriveAnalysisFxConversion } from "../lib/analysis/fx";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import { operatingCompanyClassification } from "./helpers/divlab-company-classification";

const REPORT_ID = "report:q2";
const MARKET_ID = "market:test";
const FUNDAMENTAL_ID = "fundamental:test";
const FX_ID = "fx:EUR:SEK:2026-08-14";

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin(index / 10) * 5 + index * 0.02;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      adjustedClose: close,
      volume: 900_000,
    };
  });
}

function packet() {
  const fx = deriveAnalysisFxConversion({
    fromCurrency: "EUR",
    toCurrency: "SEK",
    fromToSek: {
      base: "EUR",
      quote: "SEK",
      rate: 11,
      asOf: "2026-08-14T16:00:00.000Z",
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    },
    sourceIds: [FX_ID],
  });
  assert.ok(fx);

  const fundamentals: CurrencyAwareFundamentalSnapshot = {
    asOf: "2026-06-30",
    currency: "SEK",
    reportingCurrency: "EUR",
    epsTtmCurrency: "SEK",
    price: 110,
    revenueTtm: 1_000,
    revenueGrowthYoy: 0.08,
    operatingMarginTtm: 0.2,
    profitMarginTtm: 0.15,
    ebitdaTtm: 250,
    netIncomeTtm: 150,
    epsTtm: 10,
    operatingCashFlowTtm: 600,
    freeCashFlowTtm: 500,
    cash: 200,
    totalDebt: 100,
    sharesOutstanding: 100,
    returnOnEquity: 0.2,
    historicalPeriods: [
      { period: "2023-12-31", revenue: 800 },
      { period: "2024-12-31", revenue: 850 },
      { period: "2025-12-31", revenue: 900 },
    ],
  };

  return buildDivLabResearchPacket({
    symbol: "TEST",
    exchange: "ST",
    name: "Test AB",
    currency: "SEK",
    currentPrice: 110,
    history: bars(),
    fundamentals,
    companyClassification: operatingCompanyClassification(FUNDAMENTAL_ID),
    fxConversion: fx,
    valuationScenarios: [],
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
        url: "https://example.com/fundamental",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
      {
        id: FX_ID,
        kind: "fx_data",
        publisher: "European Central Bank via Frankfurter",
        url: "https://api.frankfurter.app/latest?from=EUR&to=SEK",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [
      {
        id: `evidence:${REPORT_ID}`,
        sourceId: REPORT_ID,
        kind: "official_report_excerpt",
        title: "Q2 2026",
        content: "Verifierat rapportutdrag med omsättning, lönsamhet, kassaflöde, balansräkning och ledningens kommentarer. Texten är avsiktligt längre än tvåhundra tecken så att primärkälleevidensen klarar samma minimigräns som den riktiga analystjänsten och kan användas i detta kontraktstest utan någon nätverksåtkomst.",
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
  const unknown = {
    assessment: "unknown" as const,
    rationale: "Underlaget räcker inte för en säker kvalitativ bedömning.",
    sourceIds: [] as string[],
  };
  const scenario = (
    name: "bear" | "base" | "bull",
    freeCashFlowPerShare: number,
    pFcfMultiple: number,
  ) => ({
    name,
    label: name,
    currency: "SEK",
    eps: null,
    peMultiple: null,
    freeCashFlowPerShare,
    pFcfMultiple,
    explicitValuePerShare: null,
    assumptions: ["Scenarioantagande baserat på verifierad FCF-bas."],
    sourceIds: [REPORT_ID, FX_ID],
  });

  return divLabAnalystDraftSchema.parse({
    view: "neutral",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary: "Bolaget har verifierad fundamental data men värderingen måste bedömas mot både scenarioantaganden och identifierade risker.",
    investmentCase: [
      claim("Kassaflödet ger en verifierad grund för värderingsarbetet."),
      claim("Rapporten ger stöd för en fortsatt men villkorad analys."),
    ],
    latestReport: [claim("Den senaste verifierade rapporten används som primärkälla.")],
    fundamentalInterpretation: [
      claim("Omsättningshistoriken är tillräcklig för flerårig jämförelse."),
      claim("Fritt kassaflöde används endast efter deterministisk valutaomräkning."),
    ],
    valuationInterpretation: [
      {
        measure: "priceToFcf",
        text: "P/FCF används först efter deterministisk EUR till SEK-normalisering.",
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID, FX_ID],
      },
    ],
    qualityFactors: {
      competitiveAdvantage: unknown,
      pricingPower: unknown,
      marketPosition: unknown,
      managementAndCapitalAllocation: unknown,
      reinvestmentRunway: unknown,
      cyclicality: unknown,
      customerConcentration: unknown,
      regulatoryRisk: unknown,
      currencyRisk: unknown,
      acquisitionRisk: unknown,
      disruptionRisk: unknown,
    },
    catalysts: [claim("Förbättrat kassaflöde kan vara en katalysator.")],
    risks: [
      claim("Svagare efterfrågan kan pressa kassaflödet."),
      claim("Valutaförändringar kan påverka omräknade per-aktie-värden.", [FX_ID]),
    ],
    contradictions: [claim("Stabil historik kan motverkas av högre värderingsrisk.")],
    thesisBreakers: [claim("Ett bestående kassaflödesbrott skulle bryta tesen.")],
    technicalInterpretation: [claim("Tekniska nivåer används endast som risk- och timingstöd.", [MARKET_ID])],
    valuationScenarios: [
      scenario("bear", 45, 8),
      scenario("base", 55, 10),
      scenario("bull", 65, 12),
    ],
  });
}

describe("DivLab analyst FX provenance", () => {
  it("accepts FCF scenarios and valuation interpretation only with required FX provenance", () => {
    const researchPacket = packet();
    const analystDraft = draft();
    assert.equal(researchPacket.valuationInputs.freeCashFlowPerShareTtm.converted, true);
    assert.doesNotThrow(() =>
      validateAnalystDraftAgainstPacket({
        packet: researchPacket,
        draft: analystDraft,
      }),
    );
  });

  it("rejects a converted FCF scenario that omits FX provenance", () => {
    const researchPacket = packet();
    const analystDraft = draft();
    analystDraft.valuationScenarios[1]!.sourceIds = [REPORT_ID];
    assert.throws(
      () =>
        validateAnalystDraftAgainstPacket({
          packet: researchPacket,
          draft: analystDraft,
        }),
      /divlab_analyst_fx_source_missing:base:fcf/,
    );
  });

  it("rejects a P\/FCF valuation interpretation that omits the FX source", () => {
    const researchPacket = packet();
    const analystDraft = draft();
    analystDraft.valuationInterpretation[0]!.sourceIds = [MARKET_ID, FUNDAMENTAL_ID];
    assert.throws(
      () => validateAnalystDraftAgainstPacket({ packet: researchPacket, draft: analystDraft }),
      new RegExp(`divlab_analyst_valuation_source_missing:priceToFcf:${FX_ID}`),
    );
  });
});
