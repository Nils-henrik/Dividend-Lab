import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

function isoDate(index: number): string {
  return new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
}

function nearbyPivotBars(count = 180): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 0.31) * 0.45;
    const close = 100 + wave;
    const high = index === 45 ? 110 : index === 92 ? 111.1 : close + 0.55;
    const low = close - 0.55;
    return {
      date: isoDate(index),
      open: close - 0.1,
      high,
      low,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    };
  });
}

function priceDiscoveryWithOldWick(count = 180): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const close = 80 + index * 0.15;
    return {
      date: isoDate(index),
      open: close - 0.05,
      high: index === 40 ? close + 30 : close + 0.45,
      low: close - 0.45,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    };
  });
}

function dividendAdjustedMismatchBars(count = 220): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index / 18) * Math.PI * 2);
    const close = 100 + wave * 7 + index * 0.01;
    return {
      date: isoDate(index),
      open: close - wave * 0.2,
      high: close + 0.9,
      low: close - 0.9,
      close,
      // Simulate dividend-adjusted Yahoo closes while OHLC remains raw.
      adjustedClose: close * 0.92,
      volume: Math.round(1_000_000 * (Math.abs(wave) > 0.9 ? 1.5 : 1)),
    };
  });
}

describe("DivLab support/resistance real-market regressions", () => {
  it("merges nearby repeated pivots into one bounded volatility zone", () => {
    const analysis = analyzeSupportResistance(nearbyPivotBars());
    const resistance = analysis.resistances.find(
      (zone) => zone.center > 109 && zone.center < 112,
    );

    assert.ok(resistance);
    assert.ok(resistance.touches >= 2);
    assert.ok(resistance.upper - resistance.lower < 4);
  });

  it("does not let one isolated historical wick block a valid price-discovery state", () => {
    const analysis = analyzeSupportResistance(priceDiscoveryWithOldWick());

    assert.equal(analysis.resistances.length, 0);
    assert.equal(analysis.resistanceState, "no_validated_resistance_above");
    assert.ok((analysis.priorHigh ?? 0) > (analysis.currentPrice ?? 0));
  });

  it("keeps technical levels on the raw OHLC price plane when adjusted close differs", () => {
    const bars = dividendAdjustedMismatchBars();
    const analysis = analyzeSupportResistance(bars);
    const lastRawClose = bars.at(-1)!.close;

    assert.ok(Math.abs((analysis.currentPrice ?? 0) - lastRawClose) < 0.0001);
    assert.ok(analysis.supports.length >= 1);
    assert.ok(
      analysis.resistances.length >= 1 ||
        analysis.resistanceState === "no_validated_resistance_above",
    );
  });
});
