import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabAnalystDraft } from "@/lib/analysis/analyst-schema";
import { buildApprovedDivLabAnalysisRecord } from "./record";
import { buildDivBrainSourcesFromApprovedAnalysis } from "./to-source";

const ANALYSIS_ID = "11111111-1111-4111-8111-111111111111";
const VERSION_ID = "22222222-2222-4222-8222-222222222222";
const REPORT_ID = "report:q2";
const MARKET_ID = "market:test";

function claim(text: string, sourceIds = [REPORT_ID]) {
  return { text, sourceIds };
}

function known(assessment: "strong" | "neutral" | "weak" = "neutral") {
  return {
    assessment,
    rationale: "Bedömningen stöds av verifierat analysunderlag.",
    sourceIds: [REPORT_ID],
  };
}

function draft(): DivLabAnalystDraft {
  return {
    view: "positive",
    riskLevel: "medium",
    confidence: "medium",
    horizonMonths: { min: 12, max: 36 },
    executiveSummary:
      "Bolaget har en stark verifierad profil, men värdering och efterfrågerisk måste följas löpande.",
    investmentCase: [claim("Kassaflödet stödjer investeringscaset.")],
    latestReport: [claim("Senaste rapporten visar stabil lönsamhet.")],
    fundamentalInterpretation: [claim("Flerårstrenden är stabil.")],
    valuationInterpretation: [
      {
        measure: "pe",
        text: "P/E används som ett spårbart värderingsmått.",
        sourceIds: [REPORT_ID, MARKET_ID],
      },
    ],
    qualityFactors: {
      competitiveAdvantage: known("strong"),
      pricingPower: known(),
      marketPosition: known("strong"),
      managementAndCapitalAllocation: known(),
      reinvestmentRunway: known(),
      cyclicality: known(),
      customerConcentration: {
        assessment: "unknown",
        rationale: "Otillräckligt underlag.",
        sourceIds: [],
      },
      regulatoryRisk: {
        assessment: "unknown",
        rationale: "Otillräckligt underlag.",
        sourceIds: [],
      },
      currencyRisk: known(),
      acquisitionRisk: {
        assessment: "unknown",
        rationale: "Otillräckligt underlag.",
        sourceIds: [],
      },
      disruptionRisk: {
        assessment: "unknown",
        rationale: "Otillräckligt underlag.",
        sourceIds: [],
      },
    },
    catalysts: [claim("Förbättrad efterfrågan kan bli en katalysator.")],
    risks: [
      claim("Svagare efterfrågan kan pressa tillväxten."),
      claim("Högre riskpremie kan pressa värderingen.", [MARKET_ID]),
    ],
    contradictions: [
      claim("Stark kvalitet måste vägas mot värderingsrisken.", [REPORT_ID, MARKET_ID]),
    ],
    thesisBreakers: [claim("Ett bestående kassaflödesbrott skulle bryta tesen.")],
    technicalInterpretation: [
      claim("Tekniken används bara som risk- och timingstöd.", [MARKET_ID]),
    ],
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
  };
}

function validRows() {
  return {
    analysisRow: {
      id: ANALYSIS_ID,
      instrument_symbol: "TEST",
      exchange: "ST",
      instrument_name: "Test AB",
      slug: "test-ab",
      status: "draft",
    },
    versionRow: {
      id: VERSION_ID,
      analysis_id: ANALYSIS_ID,
      version_number: 2,
      engine_version: "deep-research-v2",
      data_as_of: "2026-08-15T00:00:00.000Z",
      current_price: 100,
      currency: "SEK",
      published_at: null,
      publishable: true,
      research_packet: {
        valuation: {
          scenarios: [
            { name: "bear", valuePerShare: 80, upsideDownsidePct: -20 },
            { name: "base", valuePerShare: 120, upsideDownsidePct: 20 },
            { name: "bull", valuePerShare: 160, upsideDownsidePct: 60 },
          ],
        },
        technical: {
          levels: {
            supports: [{ lower: 91, upper: 94 }],
            resistances: [{ lower: 108, upper: 111 }],
            resistanceState: "zones",
          },
        },
      },
    },
    contentRow: {
      analyst_schema_version: "analyst-v2",
      analyst_draft: draft(),
      analyst_quality_gate: {
        version: "analyst-quality-v1",
        publishable: true,
        score: 100,
        blockers: [],
        warnings: [],
        metrics: {
          knownQualityFactors: 7,
          totalQualityFactors: 11,
          uniqueSourceIds: 2,
          unknownQualityFactors: 4,
        },
        checks: {
          qualityFactorCoverage: true,
          confidenceCalibration: true,
          sourceDiversity: true,
          scenarioDifferentiation: true,
          assumptionDifferentiation: true,
          viewValuationConsistency: true,
        },
      },
    },
    sourceRows: [
      {
        source_id: REPORT_ID,
        kind: "quarterly_report",
        publisher: "Test AB",
        url: "https://example.com/q2.pdf",
        published_at: "2026-07-20T06:00:00.000Z",
        verified_at: "2026-08-15T00:00:00.000Z",
        primary: true,
      },
      {
        source_id: MARKET_ID,
        kind: "market_data",
        publisher: "Market Provider",
        url: "https://example.com/market",
        published_at: "2026-08-15T00:00:00.000Z",
        verified_at: "2026-08-15T00:00:00.000Z",
        primary: false,
      },
    ],
  };
}

function approvedRecord() {
  const rows = validRows();
  const record = buildApprovedDivLabAnalysisRecord({
    expectedSymbol: "TEST",
    expectedExchange: "ST",
    ...rows,
  });
  assert.ok(record);
  return record;
}

describe("DivBrain approved DivLab Analysis provider", () => {
  it("accepts only a publishable v2 analysis with a passing immutable analyst gate", () => {
    const record = approvedRecord();
    assert.equal(record.symbol, "TEST");
    assert.equal(record.engineVersion, "deep-research-v2");
    assert.equal(record.analystQualityGate.publishable, true);
    assert.equal(record.researchSummary.baseScenarioValue, 120);
    assert.equal(record.researchSummary.baseScenarioUpsideDownsidePct, 20);
    assert.deepEqual(record.researchSummary.nearestSupport, { lower: 91, upper: 94 });
    assert.deepEqual(record.researchSummary.nearestResistance, { lower: 108, upper: 111 });
  });

  it("returns no record for archived, unpublishable or identity-mismatched data", () => {
    const archived = validRows();
    archived.analysisRow.status = "archived";
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...archived,
      }),
      null,
    );

    const unpublishable = validRows();
    unpublishable.versionRow.publishable = false;
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...unpublishable,
      }),
      null,
    );

    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "OTHER",
        expectedExchange: "ST",
        ...validRows(),
      }),
      null,
    );
  });

  it("returns no record for a failed quality gate or malformed analyst-v2 content", () => {
    const failedGate = validRows();
    failedGate.contentRow.analyst_quality_gate.publishable = false;
    failedGate.contentRow.analyst_quality_gate.blockers = ["quality failed"];
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...failedGate,
      }),
      null,
    );

    const malformedDraft = validRows();
    malformedDraft.contentRow.analyst_draft = {
      ...draft(),
      executiveSummary: "",
    } as DivLabAnalystDraft;
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...malformedDraft,
      }),
      null,
    );
  });

  it("returns no record when a stored source row is malformed or missing", () => {
    const malformedSource = validRows();
    malformedSource.sourceRows[0]!.url = "";
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...malformedSource,
      }),
      null,
    );

    const noSources = validRows();
    noSources.sourceRows = [];
    assert.equal(
      buildApprovedDivLabAnalysisRecord({
        expectedSymbol: "TEST",
        expectedExchange: "ST",
        ...noSources,
      }),
      null,
    );
  });

  it("maps the approved analysis plus underlying evidence into validated DivBrain sources", () => {
    const result = buildDivBrainSourcesFromApprovedAnalysis({
      record: approvedRecord(),
      now: new Date("2026-08-15T01:00:00.000Z"),
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.data.length, 3);
    const main = result.data[0]!;
    assert.equal(main.category, "internal_structured_data");
    assert.equal(main.verificationState, "internally_curated");
    assert.equal(main.freshnessState, "current");
    assert.equal(main.internalRoute, undefined);
    assert.ok(main.excerpt?.includes("DivLab-syn: Positiv"));
    assert.ok(main.excerpt?.includes("Basscenario: 120 SEK"));
    assert.ok(main.excerpt?.includes("Närmaste stöd: 91–94 SEK"));
    assert.ok((main.excerpt?.length ?? 0) <= 1_500);

    const report = result.data.find((source) => source.id === `analysis-src:${REPORT_ID}`);
    assert.equal(report?.category, "official_company_report");
    assert.equal(report?.verificationState, "verified");
    const market = result.data.find((source) => source.id === `analysis-src:${MARKET_ID}`);
    assert.equal(market?.category, "market_data_provider");
    assert.equal(market?.verificationState, "internally_curated");
  });

  it("marks an old approved analysis as stale instead of pretending it is current", () => {
    const record = approvedRecord();
    record.dataAsOf = "2026-07-01T00:00:00.000Z";
    const result = buildDivBrainSourcesFromApprovedAnalysis({
      record,
      now: new Date("2026-08-15T01:00:00.000Z"),
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data[0]?.freshnessState, "stale");
  });
});
