import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import { buildDailyCaseSelectionCandidate } from "../lib/analysis/daily-case-candidate-builder";
import { selectDailyAnalysisCases } from "../lib/analysis/daily-case-selection";
import type { ResearchCandidate } from "../lib/model-portfolios/engine/research";
import type { TechnicalAnalysisSnapshot } from "../lib/model-portfolios/engine/technical-analysis";

const NOW = new Date("2026-08-15T01:00:00.000Z");
const AS_OF = "2026-08-15T00:00:00.000Z";

function preflight() {
  return buildCompanyProfilePreflightFromYahooPayload({
    yahooSymbol: "TEST.ST",
    fetchedAt: new Date(AS_OF),
    payload: {
      quoteSummary: {
        result: [
          {
            assetProfile: {
              sector: "Industrials",
              industry: "Specialty Industrial Machinery",
            },
            price: { quoteType: "EQUITY" },
          },
        ],
      },
    },
  });
}

function technical(overrides: Partial<TechnicalAnalysisSnapshot> = {}): TechnicalAnalysisSnapshot {
  return {
    version: "ta-v1",
    asOf: AS_OF,
    sessions: 220,
    toolsUsed: [],
    trend: { regime: "uptrend" },
    momentum: {},
    volatility: {},
    volume: { volumeRatio20: 3 },
    levels: {},
    meanReversion: {},
    patterns: {
      doji: false,
      hammer: false,
      bullishEngulfing: false,
      bearishEngulfing: false,
    },
    scores: {
      trend: 0.9,
      momentum: 0.5,
      volume: 0.8,
      breakout: 0.5,
      meanReversion: 0.5,
      stability: 0.7,
      composite: 0.72,
    },
    signals: [],
    ...overrides,
  };
}

function researchCandidate(overrides: Partial<ResearchCandidate> = {}): ResearchCandidate {
  return {
    symbol: "TEST",
    exchange: "ST",
    marketCapSek: 50_000_000_000,
    avgDailyTurnoverSek: 200_000_000,
    earningsRevisionScore: 0.1,
    qualityScore: 0.9,
    valuationScore: 0.9,
    catalystScore: 0.8,
    balanceSheetScore: 0.8,
    technicalAnalysis: technical(),
    ...overrides,
  };
}

const SOURCES = {
  market: { id: "market:test", asOf: AS_OF },
  fundamentals: { id: "fundamental:test", asOf: AS_OF },
  revisions: { id: "revisions:test", asOf: AS_OF },
  catalyst: { id: "catalyst:test", asOf: AS_OF },
  report: { id: "report:test", asOf: AS_OF },
  analytics: { id: "analytics:test", asOf: AS_OF },
} as const;

describe("DivLab daily case candidate builder", () => {
  it("builds source-backed editorial signals without reusing a portfolio trade score", () => {
    const candidate = buildDailyCaseSelectionCandidate({
      candidate: researchCandidate(),
      name: "Test AB",
      preflight: preflight(),
      sources: SOURCES,
      dayChangePct: -8,
      readerInterestScore: 0.7,
    });

    assert.equal(candidate.methodologyStatus, "supported");
    assert.equal(candidate.signals.freshReport?.value, 1);
    assert.equal(candidate.signals.valuationDislocation?.value, 0.8);
    assert.equal(candidate.signals.estimateRevisions?.value, 0.8);
    assert.equal(candidate.signals.technicalSetup?.value, 0.8);
    assert.equal(candidate.signals.abnormalVolume?.value, 1);
    assert.equal(candidate.signals.priceMove?.value, 1);
    assert.ok(
      candidate.signals.fundamentalOpportunity?.value !== undefined &&
        Math.abs(candidate.signals.fundamentalOpportunity.value - 0.86) < 1e-12,
    );
    assert.equal(candidate.signals.readerInterest?.value, 0.7);
    assert.equal(candidate.signals.dataReadiness?.value, 1);
    assert.deepEqual(candidate.signals.estimateRevisions?.sourceIds, ["revisions:test"]);
    assert.deepEqual(candidate.signals.catalyst?.sourceIds, ["catalyst:test"]);
    assert.ok(candidate.knownSourceIds.includes(preflight().source.id));

    const selected = selectDailyAnalysisCases([candidate], { now: NOW });
    assert.equal(selected.selected.length, 1);
    assert.equal(selected.selected[0]?.symbol, "TEST");
  });

  it("does not invent catalyst or revision provenance when their source refs are missing", () => {
    const candidate = buildDailyCaseSelectionCandidate({
      candidate: researchCandidate({
        catalystScore: 1,
        earningsRevisionScore: 0,
        valuationScore: 0.5,
        technicalAnalysis: technical({
          volume: { volumeRatio20: 1 },
          scores: {
            trend: 0.5,
            momentum: 0.5,
            volume: 0.5,
            breakout: 0.5,
            meanReversion: 0.5,
            stability: 0.7,
            composite: 0.5,
          },
        }),
      }),
      preflight: preflight(),
      sources: {
        market: SOURCES.market,
        fundamentals: SOURCES.fundamentals,
        analytics: SOURCES.analytics,
      },
      dayChangePct: 0,
      readerInterestScore: 1,
    });

    assert.equal(candidate.signals.catalyst, undefined);
    assert.equal(candidate.signals.estimateRevisions, undefined);
    const result = selectDailyAnalysisCases([candidate], { now: NOW });
    assert.equal(result.selected.length, 0);
    assert.ok(result.blocked[0]?.blockers.includes("missing_why_now_signal"));
  });

  it("fails readiness instead of treating sparse upstream data as complete", () => {
    const candidate = buildDailyCaseSelectionCandidate({
      candidate: researchCandidate({
        qualityScore: undefined,
        valuationScore: undefined,
        earningsRevisionScore: undefined,
        catalystScore: undefined,
        balanceSheetScore: undefined,
        technicalAnalysis: undefined,
      }),
      preflight: preflight(),
      sources: { market: SOURCES.market },
      dayChangePct: 8,
    });

    assert.equal(candidate.signals.dataReadiness?.value, 0.25);
    const result = selectDailyAnalysisCases([candidate], { now: NOW });
    assert.equal(result.selected.length, 0);
    assert.ok(result.blocked[0]?.blockers.includes("data_readiness_insufficient"));
  });

  it("inherits the methodology preflight and blocks unsupported company types", () => {
    const bankPreflight = buildCompanyProfilePreflightFromYahooPayload({
      yahooSymbol: "BANK.ST",
      fetchedAt: new Date(AS_OF),
      payload: {
        quoteSummary: {
          result: [
            {
              assetProfile: {
                sector: "Financial Services",
                industry: "Banks - Regional",
              },
              price: { quoteType: "EQUITY" },
            },
          ],
        },
      },
    });

    const candidate = buildDailyCaseSelectionCandidate({
      candidate: researchCandidate({ symbol: "BANK" }),
      preflight: bankPreflight,
      sources: SOURCES,
      dayChangePct: 8,
    });
    assert.equal(candidate.methodologyStatus, "specialized_required");
    const result = selectDailyAnalysisCases([candidate], { now: NOW });
    assert.equal(result.selected.length, 0);
    assert.ok(result.blocked[0]?.blockers.includes("methodology_not_supported"));
  });
});
