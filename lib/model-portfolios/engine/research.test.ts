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
    assert.equal(classifyResearchMarketCap({ exchange: "ST" }), "unknown");
    assert.equal(classifyResearchMarketCap({ exchange: "US", marketCapSek: 0 }), "unknown");
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

  it("does not give high-risk a synthetic size bonus when market cap is unknown", () => {
    const { marketCapSek: _ignoredCap, ...baseWithoutCap } = base;
    const common = {
      ...baseWithoutCap,
      qualityScore: 0.8,
      balanceSheetScore: 0.8,
      valuationScore: 0.75,
      earningsRevisionScore: 0.75,
      catalystScore: 0.75,
      technicalAnalysis: technical({ distanceFromHigh: -0.04 }),
    };

    const rankOne = (
      symbol: string,
      marketCapSek?: number,
    ) => rankResearchUniverse(
      [marketCapSek === undefined ? { ...common, symbol } : { ...common, symbol, marketCapSek }],
      "high_risk",
    )[0];

    const small = rankOne("SMALL", 8_000_000_000);
    const mid = rankOne("MID", 40_000_000_000);
    const large = rankOne("LARGE", 120_000_000_000);
    const unknown = rankOne("UNKNOWN");

    assert.ok(small && mid && large && unknown);
    assert.equal(small.marketCapSegment, "small_cap");
    assert.equal(mid.marketCapSegment, "mid_cap");
    assert.equal(large.marketCapSegment, "large_cap");
    assert.equal(unknown.marketCapSegment, "unknown");

    assert.ok(small.deterministicScore > mid.deterministicScore);
    assert.ok(mid.deterministicScore > large.deterministicScore);
    assert.match(small.reasons.join(" "), /small\/mid-cap-preferens/);
    assert.match(mid.reasons.join(" "), /small\/mid-cap-preferens/);
    assert.doesNotMatch(large.reasons.join(" "), /small\/mid-cap-preferens/);
    assert.doesNotMatch(unknown.reasons.join(" "), /small\/mid-cap-preferens/);

    // Coverage-aware scoring: verified mid-cap keeps preference 0.9.
    // Unknown cap is absent (not a synthetic 0.5). The mid→unknown gap must
    // therefore be ~9× the small→mid step (0.9 vs 0.1), not ~4× (0.9−0.5).
    const smallMinusMid = small.deterministicScore - mid.deterministicScore;
    const midMinusUnknown = mid.deterministicScore - unknown.deterministicScore;
    const largeMinusUnknown = large.deterministicScore - unknown.deterministicScore;
    assert.ok(smallMinusMid > 0);
    assert.ok(
      midMinusUnknown > 6 * smallMinusMid,
      `unknown cap must not receive a synthetic 0.5 size contribution (gap ${midMinusUnknown} vs small/mid step ${smallMinusMid})`,
    );
    assert.ok(midMinusUnknown > largeMinusUnknown);
    assert.ok(unknown.deterministicScore <= large.deterministicScore);
    assert.ok(unknown.deterministicScore <= mid.deterministicScore);
    assert.ok(unknown.deterministicScore <= small.deterministicScore);

    const eligible = rankResearchUniverse(
      [
        { ...common, symbol: "MIDELIGIBLE", marketCapSek: 40_000_000_000 },
        { ...common, symbol: "UNKNOWNELIGIBLE" },
        { ...common, symbol: "TINY", marketCapSek: 50_000_000 },
      ],
      "high_risk",
    );
    assert.deepEqual(
      eligible.map((item) => item.symbol).sort(),
      ["MIDELIGIBLE", "UNKNOWNELIGIBLE"],
    );

    const first = rankResearchUniverse([{ ...common, symbol: "SAME" }], "high_risk");
    const second = rankResearchUniverse([{ ...common, symbol: "SAME" }], "high_risk");
    assert.deepEqual(
      first.map((item) => [item.symbol, item.deterministicScore, item.marketCapSegment]),
      second.map((item) => [item.symbol, item.deterministicScore, item.marketCapSegment]),
    );
  });

  it("does not treat a missing score as a synthetic 0.5 and does not let deleting data raise rank", () => {
    const supportive = {
      ...base,
      technicalAnalysis: technical({ trend: 0.8, stability: 0.8, composite: 0.8 }),
      volatility20d: 0.16,
      priceMomentum60d: 0.12,
    };
    const genuineNeutralQuality = rankResearchUniverse(
      [{ ...supportive, symbol: "NEUTRALQ", qualityScore: 0.5 }],
      "conservative",
    )[0];
    const missingQuality = rankResearchUniverse(
      [{ ...supportive, symbol: "MISSINGQ", qualityScore: undefined }],
      "conservative",
    )[0];
    assert.ok(genuineNeutralQuality);
    assert.ok(missingQuality);
    assert.ok(
      missingQuality.deterministicScore < genuineNeutralQuality.deterministicScore,
      `missing quality (${missingQuality.deterministicScore}) must score below a genuine 0.5 (${genuineNeutralQuality.deterministicScore})`,
    );

    const full = rankResearchUniverse([{ ...supportive, symbol: "FULL", qualityScore: 0.2 }], "conservative")[0];
    const afterRemoval = rankResearchUniverse(
      [{ ...supportive, symbol: "REMOVED", qualityScore: undefined }],
      "conservative",
    )[0];
    assert.ok(full);
    assert.ok(afterRemoval);
    assert.ok(
      afterRemoval.deterministicScore <= full.deterministicScore,
      `removing a known component must not increase score (${afterRemoval.deterministicScore} > ${full.deterministicScore})`,
    );
  });

  it("applies a coverage penalty so broad verified data outranks a sparse strong print", () => {
    const sparse = {
      symbol: "SPARSE",
      exchange: "ST",
      marketCapSek: 40_000_000_000,
      avgDailyTurnoverSek: 80_000_000,
      qualityScore: 0.99,
    };
    const broad = {
      symbol: "BROAD",
      exchange: "ST",
      marketCapSek: 40_000_000_000,
      avgDailyTurnoverSek: 80_000_000,
      qualityScore: 0.72,
      balanceSheetScore: 0.72,
      valuationScore: 0.72,
      earningsRevisionScore: 0.72,
      volatility20d: 0.16,
      priceMomentum60d: 0.12,
      technicalAnalysis: technical({ trend: 0.72, stability: 0.72, composite: 0.72 }),
    };
    const ranked = rankResearchUniverse([sparse, broad], "conservative");
    assert.equal(ranked[0]?.symbol, "BROAD");
    assert.ok((ranked[0]?.deterministicScore ?? 0) > (ranked[1]?.deterministicScore ?? 1));
  });

  it("does not qualify a large-drawdown technical recovery when fundamentals are missing", () => {
    const recovery = assessRecoverySetup({
      symbol: "TECHRECOVERY",
      exchange: "ST",
      marketCapSek: 9_000_000_000,
      avgDailyTurnoverSek: 20_000_000,
      priceMomentum20d: 0.08,
      technicalAnalysis: technical({
        distanceFromHigh: -0.35,
        trend: 0.85,
        momentum: 0.88,
        volume: 0.9,
        breakout: 0.86,
        stability: 0.7,
        composite: 0.88,
      }),
    });
    assert.notEqual(recovery.state, "qualified");
    assert.notEqual(recovery.state, "watch");
    assert.ok(recovery.fundamentalIntegrityScore < 0.6);
  });

  it("is deterministic for identical ranking and recovery inputs", () => {
    const universe = [
      { ...base, symbol: "A", qualityScore: 0.91, technicalAnalysis: technical() },
      { ...base, symbol: "B", catalystScore: 0.97, qualityScore: 0.4, technicalAnalysis: technical({ breakout: 0.9 }) },
    ];
    const first = rankResearchUniverse(universe, "high_risk");
    const second = rankResearchUniverse(universe, "high_risk");
    assert.deepEqual(
      first.map((item) => [item.symbol, item.deterministicScore, item.recoverySetup]),
      second.map((item) => [item.symbol, item.deterministicScore, item.recoverySetup]),
    );
    assert.deepEqual(
      assessRecoverySetup(universe[0]!),
      assessRecoverySetup({ ...universe[0]! }),
    );
  });

  it("hard caps shortlist, deep research and final proposals", () => {
    const universe = Array.from({ length: 400 }, (_, index) => ({
      ...base,
      symbol: `S${index}`,
      qualityScore: (index % 100) / 100,
    }));
    const ranked = rankResearchUniverse(universe, "balanced");
    assert.equal(RESEARCH_BUDGET.maxUniverseSize, 300);
    assert.equal(RESEARCH_BUDGET.maxShortlistSize, 20);
    assert.equal(RESEARCH_BUDGET.maxDeepResearchCandidates, 6);
    assert.equal(RESEARCH_BUDGET.maxTradeProposalsPerRun, 3);
    assert.equal(RESEARCH_BUDGET.maxAiCallsPerPortfolioRun, 2);
    assert.equal(ranked.length, RESEARCH_BUDGET.maxShortlistSize);
    assert.equal(selectDeepResearchCandidates(ranked).length, RESEARCH_BUDGET.maxDeepResearchCandidates);
    assert.equal(capTradeProposals(Array.from({ length: 10 }, (_, i) => i)).length, RESEARCH_BUDGET.maxTradeProposalsPerRun);
  });
});
