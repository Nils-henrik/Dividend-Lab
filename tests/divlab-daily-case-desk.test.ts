import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import {
  runDailyCaseDeskSelection,
  type DailyCaseDeskInputCandidate,
} from "../lib/analysis/daily-case-desk";
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
    volume: { volumeRatio20: 2.2 },
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

function researchCandidate(symbol: string, exchange = "ST"): ResearchCandidate {
  return {
    symbol,
    exchange,
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

function deskInput(symbol: string, exchange = "ST"): DailyCaseDeskInputCandidate {
  return {
    candidate: researchCandidate(symbol, exchange),
    yahooSymbol: `${symbol}.${exchange}`,
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

function preflight(yahooSymbol: string, type: "operating" | "bank" = "operating") {
  return buildCompanyProfilePreflightFromYahooPayload({
    yahooSymbol,
    fetchedAt: new Date(AS_OF),
    payload: {
      quoteSummary: {
        result: [
          {
            assetProfile:
              type === "bank"
                ? { sector: "Financial Services", industry: "Banks - Regional" }
                : { sector: "Industrials", industry: "Specialty Industrial Machinery" },
            price: { quoteType: "EQUITY" },
          },
        ],
      },
    },
  });
}

describe("DivLab Daily Case Desk", () => {
  it("returns an auditable selection funnel and stops at the Deep Research boundary", async () => {
    const inputs = [
      deskInput("ONE", "ST"),
      deskInput("TWO", "ST"),
      deskInput("THREE", "CO"),
      deskInput("FOUR", "HE"),
      deskInput("FIVE", "US"),
    ];
    const calls: string[] = [];

    const result = await runDailyCaseDeskSelection({
      candidates: inputs,
      preflightLoader: async (yahooSymbol) => {
        calls.push(yahooSymbol);
        return preflight(yahooSymbol);
      },
      config: {
        preflightConcurrency: 2,
        selection: { now: NOW, maxSamePrimaryDriver: 4 },
      },
    });

    assert.equal(result.version, "daily-case-desk-v1");
    assert.equal(result.stats.shortlisted, 5);
    assert.equal(result.stats.preflightReady, 5);
    assert.equal(result.stats.preflightMissing, 0);
    assert.equal(result.stats.selectedForDeepResearch, 4);
    assert.equal(result.selection.selected.length, 4);
    assert.equal(result.selection.eligibleNotSelected.length, 1);
    assert.equal(result.selection.eligibleNotSelected[0]?.notSelectedReason, "daily_budget_exhausted");
    assert.equal(calls.length, 5);
    assert.equal(new Set(calls).size, 5);
  });

  it("keeps a failed company-profile preflight explicit instead of guessing methodology", async () => {
    const result = await runDailyCaseDeskSelection({
      candidates: [deskInput("READY"), deskInput("MISSING")],
      preflightLoader: async (yahooSymbol) =>
        yahooSymbol === "MISSING.ST" ? null : preflight(yahooSymbol),
      config: { selection: { now: NOW } },
    });

    assert.equal(result.stats.preflightReady, 1);
    assert.equal(result.stats.preflightMissing, 1);
    assert.deepEqual(result.missingPreflights, [
      {
        symbol: "MISSING",
        exchange: "ST",
        yahooSymbol: "MISSING.ST",
        reason: "company_profile_preflight_missing",
      },
    ]);
    assert.equal(result.selection.selected[0]?.symbol, "READY");
  });

  it("lets methodology classification block a bank before Deep Research", async () => {
    const result = await runDailyCaseDeskSelection({
      candidates: [deskInput("BANK")],
      preflightLoader: async (yahooSymbol) => preflight(yahooSymbol, "bank"),
      config: { selection: { now: NOW } },
    });

    assert.equal(result.stats.preflightReady, 1);
    assert.equal(result.stats.selectedForDeepResearch, 0);
    assert.equal(result.selection.blocked[0]?.symbol, "BANK");
    assert.ok(result.selection.blocked[0]?.blockers.includes("methodology_not_supported"));
  });

  it("rejects duplicate canonical identities before any provider call", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        runDailyCaseDeskSelection({
          candidates: [deskInput("DUP"), { ...deskInput("dup"), yahooSymbol: "OTHER.ST" }],
          preflightLoader: async (yahooSymbol) => {
            calls += 1;
            return preflight(yahooSymbol);
          },
        }),
      /daily_case_desk_duplicate_identity:DUP@ST/,
    );
    assert.equal(calls, 0);
  });
});
