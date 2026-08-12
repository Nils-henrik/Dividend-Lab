import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RESEARCH_BUDGET,
  assessRecoverySetup,
  capTradeProposals,
  classifyResearchMarketCap,
  rankResearchUniverse,
  selectDeepResearchCandidates,
} from "./research";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

const base = {
  exchange: "ST",
  marketCapSek: 10_000_000_000,
  avgDailyTurnoverSek: 50_000_000,
  qualityScore: 0.7,
  valuationScore: 0.6,
  earningsRevisionScore: 0.6,
  dividendQualityScore: 0.5,
  catalystScore: 0.5,
  balanceSheetScore: 0.7,
  volatility20d: 0.25,
  priceMomentum20d: 0.03,
  priceMomentum60d: 0.08,
};

function technical(input: {
  distanceFromHigh?: number;
  regime?: TechnicalAnalysisSnapshot["trend"]["regime"];
  trend?: number;
  momentum?: number;
  volume?: number;
  breakout?: number;
  stability?: number;
  composite?: number;
} = {}): TechnicalAnalysisSnapshot {
  return {
    version: "ta-v1",
    asOf: "2026-08-12",
    sessions: 252,
    toolsUsed: [],
    trend: { regime: input.regime ?? "uptrend" },
    momentum: {},
    volatility: {},
    volume: {},
    levels: { distanceFrom52WeekHighPct: input.distanceFromHigh ?? -0.25 },
    meanReversion: {},
    patterns: { doji: false, hammer: false, bullishEngulfing: false, bearishEngulfing: false },
    scores: {
      trend: input.trend ?? 0.7,
      momentum: input.momentum ?? 0.65,
      volume: input.volume ?? 0.65,
      breakout: input.breakout ?? 0.6,
      meanReversion: 0.6,
      stability: input.stability ?? 0.65,
      composite: input.composite ?? 0.66,
    },
    signals: [],
  };
}

describe("model portfolio research funnel", () => {
  it("ranks the same universe differently by portfolio mandate", () => {
    const universe = [
      {
        ...base,
        symbol: "STABLE",
        qualityScore: 0.95,
        balanceSheetScore: 0.98,
        volatility20d: 0.12,
        catalystScore: 0.35,
      },
      {
        ...base,
        symbol: "FAST",
        qualityScore: 0.58,
        balanceSheetScore: 0.55,
        catalystScore: 0.98,
        earningsRevisionScore: 0.94,
        priceMomentum20d: 0.16,
      },
    ];

    assert.equal(rankResearchUniverse(universe, "conservative")[0]?.symbol, "STABLE");
    assert.equal(rankResearchUniverse(universe, "high_risk")[0]?.symbol, "FAST");
  });

  it("filters obvious illiquid microcaps before any AI work", () => {
    const ranked = rankResearchUniverse(
      [
        { ...base, symbol: "GOOD" },
        { ...base, symbol: "TINY", marketCapSek: 50_000_000 },
        { ...base, symbol: "DRY", avgDailyTurnoverSek: 200_000 },
      ],
      "balanced",
    );
    assert.deepEqual(ranked.map((item) => item.symbol), ["GOOD"]);
  });

  it("classifies Nordic and US market caps for the high-risk size preference", () => {
    assert.equal(classifyResearchMarketCap({ exchange: "ST", marketCapSek: 8_000_000_000 }), "small_cap");
    assert.equal(classifyResearchMarketCap({ exchange: "ST", marketCapSek: 40_000_000_000 }), "mid_cap");
    assert.equal(classifyResearchMarketCap({ exchange: "ST", marketCapSek: 100_000_000_000 }), "large_cap");
    assert.equal(classifyResearchMarketCap({ exchange: "US", marketCapSek: 20_000_000_000 }), "small_cap");
    assert.equal(classifyResearchMarketCap({ exchange: "US", marketCapSek: 80_000_000_000 }), "mid_cap");
    assert.equal(classifyResearchMarketCap({ exchange: "US", marketCapSek: 300_000_000_000 }), "large_cap");
  });

  it("recognizes a fallen-quality setup only after fundamentals and entry are confirmed", () => {
    const recovery = assessRecoverySetup({
      ...base,
      symbol: "RECOVERY",
      qualityScore: 0.86,
      balanceSheetScore: 0.85,
      valuationScore: 0.82,
      earningsRevisionScore: 0.7,
      catalystScore: 0.72,
      priceMomentum20d: 0.04,
      technicalAnalysis: technical({ distanceFromHigh: -0.31, trend: 0.66, momentum: 0.62, volume: 0.67, breakout: 0.58 }),
    });

    assert.equal(recovery.state, "qualified");
    assert.ok((recovery.drawdownFrom52WeekHigh ?? 0) >= 0.3);
    assert.ok(recovery.fundamentalIntegrityScore >= 0.6);
    assert.ok(recovery.entryConfirmationScore >= 0.52);
  });

  it("marks an unconfirmed selloff as a falling knife instead of rewarding the drawdown", () => {
    const recovery = assessRecoverySetup({
      ...base,
      symbol: "KNIFE",
      qualityScore: 0.8,
      balanceSheetScore: 0.78,
      valuationScore: 0.75,
      earningsRevisionScore: 0.45,
      priceMomentum20d: -0.18,
      priceMomentum60d: -0.28,
      technicalAnalysis: technical({
        distanceFromHigh: -0.42,
        regime: "strong_downtrend",
        trend: 0.18,
        momentum: 0.2,
        volume: 0.3,
        breakout: 0.18,
        composite: 0.22,
      }),
    });

    assert.equal(recovery.state, "falling_knife");
    assert.ok(recovery.entryConfirmationScore < 0.46);
  });

  it("gives high-risk a real small/mid and qualified-recovery bias without banning exceptional large caps", () => {
    const common = {
      ...base,
      qualityScore: 0.8,
      balanceSheetScore: 0.8,
      valuationScore: 0.75,
      earningsRevisionScore: 0.75,
      catalystScore: 0.75,
      technicalAnalysis: technical({ distanceFromHigh: -0.26 }),
    };
    const ranked = rankResearchUniverse([
      { ...common, symbol: "SMALL", marketCapSek: 8_000_000_000 },
      { ...common, symbol: "LARGE", marketCapSek: 120_000_000_000 },
    ], "high_risk");

    assert.equal(ranked[0]?.symbol, "SMALL");
    assert.match(ranked[0]?.reasons.join(" ") ?? "", /small\/mid-cap-preferens/);
    assert.match(ranked[0]?.reasons.join(" ") ?? "", /fallen-quality\/recovery-entry/);

    const exceptionalLarge = rankResearchUniverse([
      {
        ...base,
        symbol: "WEAKSMALL",
        marketCapSek: 7_000_000_000,
        qualityScore: 0.5,
        balanceSheetScore: 0.5,
        valuationScore: 0.45,
        earningsRevisionScore: 0.4,
        catalystScore: 0.42,
        priceMomentum20d: -0.03,
      },
      {
        ...base,
        symbol: "EXCEPTIONAL",
        marketCapSek: 200_000_000_000,
        qualityScore: 0.98,
        balanceSheetScore: 0.95,
        valuationScore: 0.83,
        earningsRevisionScore: 0.98,
        catalystScore: 0.99,
        priceMomentum20d: 0.18,
        priceMomentum60d: 0.2,
        technicalAnalysis: technical({ distanceFromHigh: -0.04, trend: 0.95, momentum: 0.94, volume: 0.9, breakout: 0.94, composite: 0.94 }),
      },
    ], "high_risk");

    assert.equal(exceptionalLarge[0]?.symbol, "EXCEPTIONAL");
  });

  it("hard caps shortlist, deep research and final proposals", () => {
    const universe = Array.from({ length: 400 }, (_, index) => ({
      ...base,
      symbol: `S${index}`,
      qualityScore: (index % 100) / 100,
    }));
    const ranked = rankResearchUniverse(universe, "balanced");
    assert.equal(ranked.length, RESEARCH_BUDGET.maxShortlistSize);
    assert.equal(selectDeepResearchCandidates(ranked).length, RESEARCH_BUDGET.maxDeepResearchCandidates);
    assert.equal(capTradeProposals(Array.from({ length: 10 }, (_, i) => i)).length, RESEARCH_BUDGET.maxTradeProposalsPerRun);
  });
});
