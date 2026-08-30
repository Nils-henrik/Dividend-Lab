import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDailyCaseMarketShortlistCandidate } from "../lib/analysis/daily-case-market-candidate-builder";
import { shortlistDailyCasePreflights } from "../lib/analysis/daily-case-market-shortlist";
import type { ResearchCandidate } from "../lib/model-portfolios/engine/research";
import type { TechnicalAnalysisSnapshot } from "../lib/model-portfolios/engine/technical-analysis";

const AS_OF = "2026-08-15T00:00:00.000Z";
const NOW = new Date("2026-08-15T01:00:00.000Z");

function technical(): TechnicalAnalysisSnapshot {
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
  };
}

function researchCandidate(overrides: Partial<ResearchCandidate> = {}): ResearchCandidate {
  return {
    symbol: "TEST",
    exchange: "ST",
    qualityScore: 1,
    valuationScore: 1,
    balanceSheetScore: 1,
    earningsRevisionScore: 0.1,
    catalystScore: 0.8,
    technicalAnalysis: technical(),
    ...overrides,
  };
}

const SOURCES = {
  market: { id: "market:test", asOf: AS_OF },
  revisions: { id: "revisions:test", asOf: AS_OF },
  catalyst: { id: "catalyst:test", asOf: AS_OF },
  report: { id: "report:test", asOf: AS_OF },
} as const;

describe("DivLab cheap market candidate builder", () => {
  it("uses the same market-signal math without leaking fundamental scores into 300-to-20", () => {
    const built = buildDailyCaseMarketShortlistCandidate({
      candidate: researchCandidate(),
      yahooSymbol: "TEST.ST",
      name: "Test AB",
      sources: SOURCES,
      dayChangePct: -8,
    });

    assert.equal(built.signals.freshReport?.value, 1);
    assert.equal(built.signals.catalyst?.value, 0.8);
    assert.equal(built.signals.estimateRevisions?.value, 0.8);
    assert.equal(built.signals.technicalSetup?.value, 0.8);
    assert.equal(built.signals.abnormalVolume?.value, 1);
    assert.equal(built.signals.priceMove?.value, 1);
    assert.equal("fundamentalOpportunity" in built.signals, false);
    assert.equal("valuationDislocation" in built.signals, false);

    const result = shortlistDailyCasePreflights([built], { now: NOW });
    assert.equal(result.selected.length, 1);
  });

  it("does not surface revision or catalyst scores without their explicit source refs", () => {
    const built = buildDailyCaseMarketShortlistCandidate({
      candidate: researchCandidate({
        earningsRevisionScore: 0,
        catalystScore: 1,
        technicalAnalysis: undefined,
      }),
      yahooSymbol: "TEST.ST",
      sources: { market: SOURCES.market },
      dayChangePct: 0,
    });

    assert.equal(built.signals.estimateRevisions, undefined);
    assert.equal(built.signals.catalyst, undefined);
    const result = shortlistDailyCasePreflights([built], { now: NOW });
    assert.equal(result.selected.length, 0);
  });

  it("allows a verified report event to reach preflight even without fundamentals", () => {
    const built = buildDailyCaseMarketShortlistCandidate({
      candidate: researchCandidate({
        qualityScore: undefined,
        valuationScore: undefined,
        balanceSheetScore: undefined,
        earningsRevisionScore: undefined,
        catalystScore: undefined,
        technicalAnalysis: undefined,
      }),
      yahooSymbol: "REPORT.ST",
      sources: { market: SOURCES.market, report: SOURCES.report },
    });

    const result = shortlistDailyCasePreflights([built], { now: NOW });
    assert.deepEqual(result.selected.map((item) => item.symbol), ["TEST"]);
  });
});
