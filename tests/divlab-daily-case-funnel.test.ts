import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import { runDailyCaseSelectionFunnel } from "../lib/analysis/daily-case-funnel";
import type { DailyCaseDeskInputCandidate } from "../lib/analysis/daily-case-desk";
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
    volume: { volumeRatio20: 2.5 },
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
      momentum: 0.7,
      volume: 0.8,
      breakout: 0.8,
      meanReversion: 0.5,
      stability: 0.7,
      composite: 0.8,
    },
    signals: [],
  };
}

function researchCandidate(symbol: string): ResearchCandidate {
  return {
    symbol,
    exchange: "ST",
    marketCapSek: 20_000_000_000,
    avgDailyTurnoverSek: 100_000_000,
    earningsRevisionScore: 0.9,
    qualityScore: 0.85,
    valuationScore: 0.85,
    catalystScore: 0.8,
    balanceSheetScore: 0.85,
    technicalAnalysis: technical(),
  };
}

function deskInput(index: number): DailyCaseDeskInputCandidate {
  const symbol = `CASE${String(index).padStart(2, "0")}`;
  return {
    candidate: researchCandidate(symbol),
    yahooSymbol: `${symbol}.ST`,
    name: `${symbol} AB`,
    sources: {
      market: { id: `market:${symbol}`, asOf: AS_OF },
      fundamentals: { id: `fundamental:${symbol}`, asOf: AS_OF },
      revisions: { id: `revisions:${symbol}`, asOf: AS_OF },
      catalyst: { id: `catalyst:${symbol}`, asOf: AS_OF },
      report: { id: `report:${symbol}`, asOf: AS_OF },
    },
    dayChangePct: 5,
  };
}

function preflight(yahooSymbol: string) {
  return buildCompanyProfilePreflightFromYahooPayload({
    yahooSymbol,
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

describe("DivLab zero-AI Daily Case funnel", () => {
  it("reduces 25 strong names to exactly 20 preflights and at most 4 Deep Research selections", async () => {
    const candidates = Array.from({ length: 25 }, (_, index) => deskInput(index + 1));
    const calls: string[] = [];

    const result = await runDailyCaseSelectionFunnel({
      candidates,
      preflightLoader: async (yahooSymbol) => {
        calls.push(yahooSymbol);
        return preflight(yahooSymbol);
      },
      config: {
        marketShortlist: {
          now: NOW,
          maxSameExchange: 20,
          maxSamePrimaryDriver: 20,
        },
        desk: {
          preflightConcurrency: 3,
          selection: {
            now: NOW,
            maxSameExchange: 4,
            maxSamePrimaryDriver: 4,
          },
        },
      },
    });

    assert.equal(result.version, "daily-case-funnel-v1");
    assert.equal(result.stats.universe, 25);
    assert.equal(result.stats.selectedForMethodologyPreflight, 20);
    assert.equal(result.stats.methodologyPreflightReady, 20);
    assert.equal(result.stats.selectedForDeepResearch, 4);
    assert.equal(calls.length, 20);
    assert.equal(new Set(calls).size, 20);
    assert.equal(result.marketShortlist.eligibleNotSelected.length, 5);
    assert.equal(result.desk.selection.selected.length, 4);
  });

  it("never spends a preflight call on a case that fails the market shortlist", async () => {
    const strong = deskInput(1);
    const weak = deskInput(2);
    weak.sources = { market: weak.sources.market };
    weak.candidate = {
      ...weak.candidate,
      earningsRevisionScore: undefined,
      catalystScore: undefined,
      technicalAnalysis: undefined,
    };
    weak.dayChangePct = 0;

    const calls: string[] = [];
    const result = await runDailyCaseSelectionFunnel({
      candidates: [strong, weak],
      preflightLoader: async (yahooSymbol) => {
        calls.push(yahooSymbol);
        return preflight(yahooSymbol);
      },
      config: {
        marketShortlist: { now: NOW },
        desk: { selection: { now: NOW } },
      },
    });

    assert.deepEqual(calls, [strong.yahooSymbol]);
    assert.equal(result.marketShortlist.blocked[0]?.symbol, weak.candidate.symbol);
    assert.equal(result.stats.selectedForMethodologyPreflight, 1);
  });

  it("keeps a missing methodology preflight explicit and never substitutes another case", async () => {
    const candidates = [deskInput(1), deskInput(2)];
    const result = await runDailyCaseSelectionFunnel({
      candidates,
      preflightLoader: async (yahooSymbol) =>
        yahooSymbol === candidates[1]?.yahooSymbol ? null : preflight(yahooSymbol),
      config: {
        marketShortlist: { now: NOW },
        desk: { selection: { now: NOW } },
      },
    });

    assert.equal(result.stats.selectedForMethodologyPreflight, 2);
    assert.equal(result.stats.methodologyPreflightReady, 1);
    assert.equal(result.desk.missingPreflights.length, 1);
    assert.equal(result.desk.missingPreflights[0]?.symbol, candidates[1]?.candidate.symbol);
  });
});
