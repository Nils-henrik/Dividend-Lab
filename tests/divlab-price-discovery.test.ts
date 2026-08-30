import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

function breakoutHistory(): DailyBar[] {
  const bars: DailyBar[] = [];
  for (let index = 0; index < 230; index += 1) {
    const cycle = Math.sin((index / 16) * Math.PI * 2);
    const close = 100 + cycle * 6 + index * 0.02;
    bars.push({
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    });
  }

  const oldHigh = Math.max(...bars.map((bar) => bar.high));
  for (let index = 0; index < 20; index += 1) {
    const close = oldHigh + 1.5 + index * 0.7;
    bars.push({
      date: new Date(Date.UTC(2025, 0, 1 + 230 + index)).toISOString().slice(0, 10),
      open: close - 0.4,
      high: close + 0.8,
      low: close - 0.9,
      close,
      adjustedClose: close,
      volume: 1_400_000,
    });
  }
  return bars;
}

describe("DivLab resistance state", () => {
  it("reports no validated resistance instead of inventing a level above a breakout", () => {
    const analysis = analyzeSupportResistance(breakoutHistory());
    assert.ok(analysis.supports.length > 0);
    assert.equal(analysis.resistances.length, 0);
    assert.equal(analysis.resistanceState, "no_validated_resistance_above");
    assert.ok((analysis.currentPrice ?? 0) >= (analysis.priorHigh ?? 0) - 5);
  });
});
