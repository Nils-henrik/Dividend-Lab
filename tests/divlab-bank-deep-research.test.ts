import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDivLabBankResearchPacket } from "../lib/analysis/bank-deep-research";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import type { DivLabBankResearch } from "../lib/analysis/bank-research";
import type { DivLabBankScenarioSet } from "../lib/analysis/bank-scenarios";

const REPORT = "report:q2";
const MARKET = "market:bank";
const FUNDAMENTAL = "fundamental:bank";

function basePacket(): DivLabResearchPacket {
  return {
    version: "deep-research-v2",
    instrument: {
      symbol: "BANK",
      exchange: "ST",
      name: "Bank AB",
      currency: "SEK",
      currentPrice: 120,
    },
    createdAt: "2026-08-15T05:00:00.000Z",
    dataAsOf: "2026-08-15T05:00:00.000Z",
    companyClassification: {
      version: "company-classification-v1",
      type: "bank",
      confidence: "high",
      sector: "Financial Services",
      industry: "Banks - Regional",
      quoteType: "EQUITY",
      basis: ["sector_financial_services", "industry_bank"],
      sourceIds: [FUNDAMENTAL],
    },
    fundamentalSnapshot: {
      asOf: "2026-08-15T05:00:00.000Z",
      currency: "SEK",
      historicalPeriods: [
        { period: "2023-12-31", eps: 8, netIncome: 80_000 },
        { period: "2024-12-31", eps: 9, netIncome: 90_000 },
        { period: "2025-12-31", eps: 10, netIncome: 100_000 },
      ],
    },
    sources: [
      {
        id: REPORT,
        kind: "quarterly_report",
        publisher: "Bank AB",
        url: "https://example.com/q2.pdf",
        publishedAt: "2026-07-15T06:00:00.000Z",
        verifiedAt: "2026-08-15T05:00:00.000Z",
        primary: true,
      },
      {
        id: MARKET,
        kind: "market_data",
        publisher: "Market Provider",
        url: "https://example.com/market",
        publishedAt: "2026-08-15T05:00:00.000Z",
        verifiedAt: "2026-08-15T05:00:00.000Z",
        primary: false,
      },
      {
        id: FUNDAMENTAL,
        kind: "fundamental_data",
        publisher: "Fundamental Provider",
        url: "https://example.com/fundamentals",
        publishedAt: "2026-08-15T05:00:00.000Z",
        verifiedAt: "2026-08-15T05:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [
      {
        id: "evidence:q2",
        sourceId: REPORT,
        kind: "official_report_excerpt",
        title: "Q2 report",
        content: "Verifierat primärrapportunderlag ".repeat(20),
        documentExcerpt: "Verifierat primärrapportunderlag.",
        publishedAt: "2026-07-15T06:00:00.000Z",
        primary: true,
        documentRetrieved: true,
        reportPeriod: "Q2",
        reportYear: 2026,
        documentType: "quarterly_report",
      },
    ],
    qualityGate: {
      publishable: false,
      score: 64,
      blockers: ["Bolagstypen bank kräver specialiserad fundamental metodik."],
      warnings: [],
      checks: {
        companyClassificationCoverage: true,
        fundamentalMethodologyCoverage: false,
        fundamentalCoverage: false,
        multiYearFundamentalCoverage: false,
        freshPrimarySource: true,
        sourceTraceability: true,
        primaryEvidenceCoverage: true,
        valuationTraceability: true,
        valuationScenarioCoverage: false,
        technicalHistoryCoverage: true,
        technicalLevelCoverage: true,
      },
    },
  } as unknown as DivLabResearchPacket;
}

function bankResearch(): DivLabBankResearch {
  return {
    version: "bank-research-v1",
    status: "research_ready",
    analystReady: false,
    blockers: [],
    analystBlockers: ["bank_analyst_schema_v3_required"],
    warnings: [],
    capital: {
      regulatoryCet1Requirement: { status: "not_found" },
    },
    funding: {
      metrics: {
        liquidityCoverageRatio: { status: "confirmed", valuePct: 145 },
        netStableFundingRatio: { status: "confirmed", valuePct: 121 },
      },
    },
    valuation: {
      status: "traceable",
      provenance: { traceable: true },
    },
  } as unknown as DivLabBankResearch;
}

function scenarios(): DivLabBankScenarioSet {
  return {
    version: "bank-scenarios-v1",
    currentPrice: 120,
    currency: "SEK",
    scenarios: [
      {
        name: "bear",
        valuePerShare: 90,
        priceToBookValue: 90,
        methodsUsed: ["P/B"],
        assumptions: ["Svagare vinst", "Lägre P/B"],
        currency: "SEK",
      },
      {
        name: "base",
        valuePerShare: 130,
        priceToBookValue: 130,
        methodsUsed: ["P/B"],
        assumptions: ["Normal vinst", "Stabil P/B"],
        currency: "SEK",
      },
      {
        name: "bull",
        valuePerShare: 170,
        priceToBookValue: 170,
        methodsUsed: ["P/B"],
        assumptions: ["Starkare vinst", "Högre P/B"],
        currency: "SEK",
      },
    ],
    baseCaseValue: 130,
    baseCaseUpsideDownsidePct: 130 / 120 - 1,
  } as unknown as DivLabBankScenarioSet;
}

function build(
  packet = basePacket(),
  research = bankResearch(),
  scenarioSet = scenarios(),
) {
  return buildDivLabBankResearchPacket({
    now: new Date("2026-08-15T06:00:00.000Z"),
    basePacket: packet,
    bankResearch: research,
    bankScenarios: scenarioSet,
  });
}

describe("DivLab deep research v3 bank", () => {
  it("can certify bank-v3 while preserving the original generic specialized-methodology failure", () => {
    const result = build();
    assert.equal(result.version, "deep-research-v3-bank");
    assert.equal(result.qualityGate.publishable, true);
    assert.equal(result.qualityGate.score, 100);
    assert.equal(result.baseResearchQualityGate.publishable, false);
    assert.equal(result.baseResearchQualityGate.checks.fundamentalMethodologyCoverage, false);
    assert.ok(result.baseResearchQualityGate.blockers[0]?.includes("specialiserad"));
  });

  it("does not mutate the original v2 quality gate", () => {
    const packet = basePacket();
    const before = structuredClone(packet.qualityGate);
    build(packet);
    assert.deepEqual(packet.qualityGate, before);
  });

  it("blocks bank-v3 when multi-year owner economics are too thin", () => {
    const packet = basePacket();
    packet.fundamentalSnapshot.historicalPeriods = [
      { period: "2024-12-31", eps: 9 },
      { period: "2025-12-31", eps: 10 },
    ];
    const result = build(packet);
    assert.equal(result.qualityGate.publishable, false);
    assert.equal(result.qualityGate.checks.historicalAccountingCoverage, false);
  });

  it("blocks bank-v3 when P/B is not traceable", () => {
    const research = bankResearch();
    research.valuation.status = "available_untraceable";
    research.valuation.provenance.traceable = false;
    const result = build(basePacket(), research);
    assert.equal(result.qualityGate.publishable, false);
    assert.equal(result.qualityGate.checks.bankValuationTraceability, false);
  });

  it("blocks bank-v3 without fresh primary evidence", () => {
    const packet = basePacket();
    packet.sources[0]!.publishedAt = "2025-01-01T00:00:00.000Z";
    packet.evidence = [];
    const result = build(packet);
    assert.equal(result.qualityGate.publishable, false);
    assert.equal(result.qualityGate.checks.freshPrimarySource, false);
    assert.equal(result.qualityGate.checks.primaryEvidenceCoverage, false);
  });

  it("blocks bank-v3 when deterministic bank scenarios lose P/B or ordering", () => {
    const values = scenarios();
    values.scenarios[0]!.priceToBookValue = null;
    values.scenarios[1]!.valuePerShare = 80;
    const result = build(basePacket(), bankResearch(), values);
    assert.equal(result.qualityGate.publishable, false);
    assert.equal(result.qualityGate.checks.bankScenarioCoverage, false);
  });

  it("inherits the generic technical-history and level invariants without inheriting generic methodology", () => {
    const packet = basePacket();
    packet.qualityGate.checks.technicalHistoryCoverage = false;
    packet.qualityGate.checks.technicalLevelCoverage = false;
    const result = build(packet);
    assert.equal(result.qualityGate.publishable, false);
    assert.equal(result.qualityGate.checks.technicalHistoryCoverage, false);
    assert.equal(result.qualityGate.checks.technicalLevelCoverage, false);
    assert.equal(result.qualityGate.checks.bankResearchReady, true);
  });
});
