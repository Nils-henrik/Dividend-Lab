import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DailyBar } from "./eodhd";
import { analyzeTechnicalSignals, TECHNICAL_ANALYSIS_TOOLS } from "./technical-analysis";

function risingBars(count = 260): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const base = 100 + index * 0.35;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: base - 0.2,
      high: base + 1,
      low: base - 1,
      close: base,
      adjustedClose: base,
      volume: 1_000_000 + index * 1_000,
    };
  });
}

function fallingBars(count = 260): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const base = 220 - index * 0.35;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: base + 0.2,
      high: base + 1,
      low: base - 1,
      close: base,
      adjustedClose: base,
      volume: 1_100_000,
    };
  });
}

describe("technical analysis toolkit", () => {
  it("derives a broad signal set from one historical series", () => {
    const result = analyzeTechnicalSignals(risingBars());
    assert.equal(result.sessions, 260);
    assert.equal(result.toolsUsed.length, TECHNICAL_ANALYSIS_TOOLS.length);
    assert.ok((result.trend.sma20 ?? 0) > 0);
    assert.ok((result.trend.sma50 ?? 0) > 0);
    assert.ok((result.trend.sma200 ?? 0) > 0);
    assert.ok(Number.isFinite(result.momentum.rsi14));
    assert.ok(Number.isFinite(result.volatility.atr14));
    assert.ok(Number.isFinite(result.volume.chaikinMoneyFlow20));
    assert.ok(Number.isFinite(result.levels.high252));
    assert.ok(result.scores.composite >= 0 && result.scores.composite <= 1);
  });

  it("distinguishes rising and falling trend regimes", () => {
    const rising = analyzeTechnicalSignals(risingBars());
    const falling = analyzeTechnicalSignals(fallingBars());
    assert.ok(["uptrend", "strong_uptrend"].includes(rising.trend.regime));
    assert.ok(["downtrend", "strong_downtrend"].includes(falling.trend.regime));
    assert.ok(rising.scores.trend > falling.scores.trend);
  });

  it("fails safely when history is empty", () => {
    const result = analyzeTechnicalSignals([]);
    assert.equal(result.trend.regime, "insufficient_data");
    assert.equal(result.sessions, 0);
    assert.equal(result.scores.composite, 0.5);
  });
});
