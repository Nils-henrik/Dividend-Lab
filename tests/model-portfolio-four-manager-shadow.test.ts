import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RESEARCH_BUDGET, type ResearchCandidate } from "../lib/model-portfolios/engine/research";
import {
  compareFourManagerAttentionSets,
  selectDryRunAttentionSnapshot,
} from "../lib/model-portfolios/engine/strategy-attention";
import type { TechnicalAnalysisSnapshot } from "../lib/model-portfolios/engine/technical-analysis";

function technical(input: {
  distanceFromHigh?: number;
  regime?: TechnicalAnalysisSnapshot["trend"]["regime"];
  trend?: number;
  momentum?: number;
  volume?: number;
  breakout?: number;
  stability?: number;
  composite?: number;
  rsi14?: number;
} = {}): TechnicalAnalysisSnapshot {
  return {
    version: "ta-v1",
    asOf: "2026-08-14",
    sessions: 252,
    toolsUsed: [],
    trend: { regime: input.regime ?? "uptrend" },
    momentum: { rsi14: input.rsi14 },
    volatility: {},
    volume: {},
    levels: { distanceFrom52WeekHighPct: input.distanceFromHigh ?? -0.08 },
    meanReversion: {},
    patterns: { doji: false, hammer: false, bullishEngulfing: false, bearishEngulfing: false },
    scores: {
      trend: input.trend ?? 0.68,
      momentum: input.momentum ?? 0.6,
      volume: input.volume ?? 0.58,
      breakout: input.breakout ?? 0.55,
      meanReversion: 0.55,
      stability: input.stability ?? 0.7,
      composite: input.composite ?? 0.64,
    },
    signals: [],
  };
}

const base = {
  exchange: "ST",
  marketCapSek: 40_000_000_000,
  avgDailyTurnoverSek: 80_000_000,
  qualityScore: 0.7,
  valuationScore: 0.62,
  earningsRevisionScore: 0.6,
  catalystScore: 0.5,
  balanceSheetScore: 0.7,
  volatility20d: 0.22,
  priceMomentum20d: 0.03,
  priceMomentum60d: 0.06,
} satisfies Omit<ResearchCandidate, "symbol">;

/**
 * Saved deterministic research fixture. No model call, no settlement, no live APIs.
 */
const FIXTURE_UNIVERSE: ResearchCandidate[] = [
  {
    ...base,
    symbol: "QUALITY",
    marketCapSek: 120_000_000_000,
    qualityScore: 0.93,
    balanceSheetScore: 0.91,
    valuationScore: 0.72,
    volatility20d: 0.12,
    catalystScore: 0.34,
    earningsRevisionScore: 0.56,
    technicalAnalysis: technical({ stability: 0.88, trend: 0.7, distanceFromHigh: -0.06 }),
  },
  {
    ...base,
    symbol: "SPEC",
    marketCapSek: 8_000_000_000,
    qualityScore: 0.48,
    balanceSheetScore: 0.42,
    valuationScore: 0.4,
    volatility20d: 0.56,
    catalystScore: 0.96,
    earningsRevisionScore: 0.4,
    priceMomentum20d: 0.19,
    technicalAnalysis: technical({
      rsi14: 78,
      breakout: 0.88,
      momentum: 0.9,
      volume: 0.86,
      trend: 0.84,
      distanceFromHigh: -0.02,
    }),
  },
  {
    ...base,
    symbol: "SAGA-D",
    marketCapSek: 18_000_000_000,
    qualityScore: 0.68,
    balanceSheetScore: 0.66,
    valuationScore: 0.64,
    dividendQualityScore: 0.74,
    catalystScore: 0.32,
    technicalAnalysis: technical({ stability: 0.72, distanceFromHigh: -0.07 }),
  },
  {
    ...base,
    symbol: "GARP",
    marketCapSek: 95_000_000_000,
    qualityScore: 0.64,
    valuationScore: 0.7,
    earningsRevisionScore: 0.71,
    catalystScore: 0.57,
    balanceSheetScore: 0.63,
    volatility20d: 0.24,
    technicalAnalysis: technical({ trend: 0.64, distanceFromHigh: -0.09 }),
  },
  {
    ...base,
    symbol: "RECOVERY",
    marketCapSek: 9_000_000_000,
    qualityScore: 0.82,
    balanceSheetScore: 0.8,
    valuationScore: 0.78,
    earningsRevisionScore: 0.76,
    catalystScore: 0.84,
    priceMomentum20d: 0.05,
    technicalAnalysis: technical({
      distanceFromHigh: -0.3,
      trend: 0.66,
      momentum: 0.64,
      volume: 0.68,
      breakout: 0.6,
      composite: 0.65,
    }),
  },
];

describe("four-manager non-settling shadow comparison", () => {
  it("shows four different attention sets from the same fetched pool and why they differ", () => {
    const comparison = compareFourManagerAttentionSets({
      universe: FIXTURE_UNIVERSE,
      holdingsByStrategy: {
        conservative: [{ symbol: "SPEC", exchange: "ST" }],
        dividend: [{ symbol: "QUALITY", exchange: "ST" }],
      },
    });

    assert.notDeepEqual(comparison.conservative.newEntrySymbols, comparison.high_risk.newEntrySymbols);
    assert.notDeepEqual(comparison.conservative.newEntrySymbols, comparison.dividend.newEntrySymbols);
    assert.notDeepEqual(comparison.balanced.newEntrySymbols, comparison.high_risk.newEntrySymbols);

    assert.ok(comparison.conservative.newEntrySymbols.includes("QUALITY"), "Försiktig hunts established quality");
    assert.ok(!comparison.conservative.newEntrySymbols.includes("SPEC"), "Försiktig rejects speculative new entries");
    assert.deepEqual(comparison.conservative.heldMonitoringSymbols, ["SPEC"]);

    assert.ok(comparison.balanced.newEntrySymbols.includes("GARP"), "Medelrisk hunts GARP alignment");
    assert.ok(!comparison.conservative.newEntrySymbols.includes("GARP"), "Försiktig still rejects medium-quality GARP");

    assert.ok(comparison.high_risk.newEntrySymbols.includes("RECOVERY"), "Högrisk hunts qualified recovery/small-mid");
    assert.ok(comparison.high_risk.newEntrySymbols.includes("SPEC"), "Högrisk can take a catalyst small-cap");
    assert.ok(!comparison.high_risk.newEntrySymbols.includes("QUALITY"), "generic mega-cap quality is not Högrisk default");

    assert.ok(comparison.dividend.newEntrySymbols.includes("SAGA-D"), "Utdelning hunts genuine income names");
    assert.ok(!comparison.dividend.newEntrySymbols.includes("QUALITY"), "non-held QUALITY is not a Dividend new entry");
    assert.deepEqual(comparison.dividend.heldMonitoringSymbols, ["QUALITY"]);

    const conservativeSnapshot = selectDryRunAttentionSnapshot({
      universe: FIXTURE_UNIVERSE,
      strategyKey: "conservative",
      heldInstruments: [{ symbol: "SPEC", exchange: "ST" }],
    });
    assert.ok(conservativeSnapshot.snapshot.some((item) => item.symbol === "SPEC"));
    assert.ok(conservativeSnapshot.newEntryCandidates.length <= RESEARCH_BUDGET.maxDeepResearchCandidates);

    const again = compareFourManagerAttentionSets({
      universe: FIXTURE_UNIVERSE,
      holdingsByStrategy: {
        conservative: [{ symbol: "SPEC", exchange: "ST" }],
        dividend: [{ symbol: "QUALITY", exchange: "ST" }],
      },
    });
    assert.deepEqual(again, comparison);
  });
});
