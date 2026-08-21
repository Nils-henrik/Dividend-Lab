import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  divLabBankAnalystDraftSchema,
  type DivLabBankAnalystDraft,
} from "../lib/analysis/bank-analyst-schema";
import { validateBankAnalystDraftAgainstResearch } from "../lib/analysis/bank-analyst-contract";
import { buildBankScenarioSet } from "../lib/analysis/bank-scenarios";
import { buildBankResearch } from "../lib/analysis/bank-research";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import type { AnalysisSource } from "../lib/analysis/quality-gate";

const REPORT_ID = "bank-report:q2";
const MARKET_ID = "market:bank";
const FUNDAMENTAL_ID = "fundamental:bank";

function sources(): AnalysisSource[] {
  return [
    {
      id: REPORT_ID,
      kind: "quarterly_report",
      publisher: "Bank AB",
      url: "https://example.com/q2.pdf",
      publishedAt: "2026-07-15T06:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: true,
    },
    {
      id: MARKET_ID,
      kind: "market_data",
      publisher: "Market Provider",
      url: "https://example.com/market",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    },
    {
      id: FUNDAMENTAL_ID,
      kind: "fundamental_data",
      publisher: "Fundamental Provider",
      url: "https://example.com/fundamentals",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    },
  ];
}

function evidence(): AnalysisEvidence[] {
  return [
    {
      id: "evidence:bank",
      sourceId: REPORT_ID,
      kind: "official_report_excerpt",
      title: "Bank Q2 report",
      content: "Verifierat rapportutdrag.",
      documentExcerpt: [
        "CET1 capital ratio 17.2%",
        "Return on equity 15.7%",
        "Credit impairment ratio 0.06%",
        "Cost/income ratio 40.3%",
        "The bank reported a capital buffer of 250 basis points.",
        "Liquidity Coverage Ratio 145%",
        "Net Stable Funding Ratio 121%",
      ].join("\n"),
      publishedAt: "2026-07-15T06:00:00.000Z",
      primary: true,
      documentRetrieved: true,
      reportPeriod: "Q2",
      reportYear: 2026,
      documentType: "quarterly_report",
    },
  ];
}

function bankResearch() {
  return buildBankResearch({
    evidence: evidence(),
    fundamentals: { equity: 100_000, sharesOutstanding: 1_000 },
    currentPrice: 120,
    marketCurrency: "SEK",
    reportingCurrency: "SEK",
    sources: sources(),
  });
}

function packet(): DivLabResearchPacket {
  return {
    version: "deep-research-v2",
    instrument: {
      symbol: "BANK",
      exchange: "ST",
      name: "Bank AB",
      currency: "SEK",
      currentPrice: 120,
    },
    companyClassification: {
      version: "company-classification-v1",
      type: "bank",
      confidence: "high",
      sector: "Financial Services",
      industry: "Banks - Regional",
      quoteType: "EQUITY",
      basis: ["sector_financial_services", "industry_bank"],
      sourceIds: [FUNDAMENTAL_ID],
    },
    valuationInputs: {
      epsTtm: {
        value: 10,
        currency: "SEK",
        sourceCurrency: "SEK",
        converted: false,
        fxRate: null,
        fxAsOf: null,
        fxSourceIds: [],
      },
      freeCashFlowPerShareTtm: {
        value: null,
        currency: null,
        sourceCurrency: "SEK",
        converted: false,
        fxRate: null,
        fxAsOf: null,
        fxSourceIds: [],
      },
    },
    valuationProvenance: {
      version: "valuation-provenance-v1",
      measures: {
        pe: {
          available: true,
          traceable: true,
          sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
          primaryConfirmedMetrics: ["eps"],
        },
        priceToFcf: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        fcfYield: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        enterpriseValue: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        evToEbit: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
        evToEbitda: { available: false, traceable: false, sourceIds: [], primaryConfirmedMetrics: [] },
      },
    },
    sources: sources(),
  } as unknown as DivLabResearchPacket;
}

function factor(
  assessment: "strong" | "neutral" | "weak" | "unknown" = "neutral",
  sourceIds = [REPORT_ID],
) {
  return {
    assessment,
    rationale:
      assessment === "unknown"
        ? "Underlaget räcker inte för säker bedömning."
        : "Bedömningen bygger på verifierat bankunderlag.",
    sourceIds: assessment === "unknown" ? [] : sourceIds,
  };
}

function draft(): DivLabBankAnalystDraft {
  return {
    view: "positive",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary:
      "Banken visar verifierad lönsamhet, kapitalstyrka och likviditet, medan kreditkvalitet och värderingsantaganden måste följas löpande.",
    investmentCase: [
      { text: "Kapitaliseringen ger handlingsutrymme.", sourceIds: [REPORT_ID] },
      { text: "Lönsamheten stödjer bankcaset.", sourceIds: [REPORT_ID] },
    ],
    latestReport: [
      { text: "CET1 och ROE är verifierade i rapporten.", sourceIds: [REPORT_ID] },
      { text: "Likviditetsmåtten är verifierade i rapporten.", sourceIds: [REPORT_ID] },
    ],
    bankFundamentalInterpretation: [
      { text: "Kapitalbasen är central för riskbilden.", sourceIds: [REPORT_ID] },
      { text: "Kreditförlusterna måste följas mot konjunkturen.", sourceIds: [REPORT_ID] },
      { text: "Funding och likviditet är en separat bankrisk.", sourceIds: [REPORT_ID] },
    ],
    valuationInterpretation: [
      {
        measure: "pe",
        text: "P/E används som ett spårbart lönsamhetsmått.",
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
      },
      {
        measure: "priceToBook",
        text: "P/B används som bankspecifikt värderingsmått.",
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
      },
    ],
    bankFactors: {
      franchiseAndDepositBase: factor("unknown"),
      profitability: factor("strong"),
      capitalStrength: factor("strong"),
      creditQuality: factor("neutral"),
      fundingAndLiquidity: factor("strong"),
      efficiency: factor("strong"),
      rateSensitivity: factor("unknown"),
      feeIncomeDiversification: factor("unknown"),
      regulatoryRisk: factor("neutral"),
      capitalDistribution: factor("unknown"),
    },
    catalysts: [
      { text: "Stabil kreditkvalitet kan stödja omvärdering.", sourceIds: [REPORT_ID, MARKET_ID] },
    ],
    risks: [
      { text: "Högre kreditförluster är en central risk.", sourceIds: [REPORT_ID] },
      { text: "Svagare räntenetto kan pressa lönsamheten.", sourceIds: [REPORT_ID] },
      { text: "Högre riskpremie kan pressa multiplarna.", sourceIds: [MARKET_ID] },
    ],
    contradictions: [
      { text: "Stark kapitalisering måste vägas mot cyklisk kreditrisk.", sourceIds: [REPORT_ID] },
    ],
    thesisBreakers: [
      { text: "Ett tydligt kapital- eller kreditkvalitetsbrott skulle bryta tesen.", sourceIds: [REPORT_ID] },
    ],
    technicalInterpretation: [
      { text: "Tekniken används som timing- och riskstöd, inte som banktes.", sourceIds: [MARKET_ID] },
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
        assumptions: ["Svagare vinst", "Lägre värderingsmultipel"],
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
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
        assumptions: ["Normaliserad vinsttillväxt", "Stabil kapitalavkastning"],
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
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
        assumptions: ["Starkare vinsttillväxt", "Högre P/B-premie"],
        sourceIds: [MARKET_ID, FUNDAMENTAL_ID],
      },
    ],
  };
}

describe("DivLab bank analyst v3", () => {
  it("accepts the bank-specific schema and deterministic scenario model", () => {
    const parsed = divLabBankAnalystDraftSchema.parse(draft());
    validateBankAnalystDraftAgainstResearch({ packet: packet(), bankResearch: bankResearch(), draft: parsed });

    const scenarios = buildBankScenarioSet({
      currentPrice: 120,
      currency: "SEK",
      trailingEps: 10,
      bookValuePerShare: bankResearch().valuation.bookValuePerShare.value,
      scenarios: parsed.valuationScenarios,
    });
    const bear = scenarios.scenarios.find((item) => item.name === "bear")!;
    const base = scenarios.scenarios.find((item) => item.name === "base")!;
    const bull = scenarios.scenarios.find((item) => item.name === "bull")!;

    assert.deepEqual(bear.methodsUsed, ["P/E", "P/B"]);
    assert.ok(bear.valuePerShare! < base.valuePerShare!);
    assert.ok(base.valuePerShare! < bull.valuePerShare!);
    assert.equal(base.projectedEps, 11.025);
    assert.equal(base.projectedBookValuePerShare, 108.16);
    assert.equal(base.valuePerShare, 131.046);
  });

  it("rejects mismatched scenario horizons", () => {
    const value = draft();
    value.valuationScenarios[2]!.forecastYears = 3;
    assert.equal(divLabBankAnalystDraftSchema.safeParse(value).success, false);
  });

  it("rejects a scenario with no P/E or P/B method", () => {
    const value = draft();
    value.valuationScenarios[0]!.epsGrowthPct = null;
    value.valuationScenarios[0]!.peMultiple = null;
    value.valuationScenarios[0]!.bookValueGrowthPct = null;
    value.valuationScenarios[0]!.priceToBookMultiple = null;
    assert.equal(divLabBankAnalystDraftSchema.safeParse(value).success, false);
  });

  it("rejects missing exact P/B provenance", () => {
    const value = draft();
    value.valuationInterpretation.find((item) => item.measure === "priceToBook")!.sourceIds = [MARKET_ID];
    assert.throws(
      () => validateBankAnalystDraftAgainstResearch({ packet: packet(), bankResearch: bankResearch(), draft: value }),
      /bank_analyst_pb_source_missing/,
    );
  });

  it("rejects scenario P/E basis when required provenance is omitted", () => {
    const value = draft();
    value.valuationScenarios[1]!.sourceIds = [MARKET_ID];
    assert.throws(
      () => validateBankAnalystDraftAgainstResearch({ packet: packet(), bankResearch: bankResearch(), draft: value }),
      /bank_analyst_scenario_pe_source_missing/,
    );
  });

  it("requires bank-specific report sources for non-unknown capital, credit and funding factors", () => {
    const value = draft();
    value.bankFactors.capitalStrength.sourceIds = [MARKET_ID];
    assert.throws(
      () => validateBankAnalystDraftAgainstResearch({ packet: packet(), bankResearch: bankResearch(), draft: value }),
      /bank_analyst_capital_strength_requires_capital_source/,
    );
  });

  it("refuses a non-bank packet even when all other data looks valid", () => {
    const nonBank = packet();
    nonBank.companyClassification.type = "operating_company";
    assert.throws(
      () => validateBankAnalystDraftAgainstResearch({ packet: nonBank, bankResearch: bankResearch(), draft: draft() }),
      /bank_analyst_requires_bank_classification/,
    );
  });
});
