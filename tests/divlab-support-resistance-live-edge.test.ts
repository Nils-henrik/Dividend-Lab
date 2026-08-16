import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

function date(index: number): string {
  return new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10);
}

function atlasLikeRightEdgeBars(count = 220): DailyBar[] {
  const bars = Array.from({ length: count }, (_, index) => {
    const close = 198 + Math.sin(index / 8) * 5;
    return {
      date: date(index),
      open: close - 0.4,
      high: close + 1,
      low: close - 1,
      close,
      adjustedClose: close,
      volume: 2_500_000,
    } satisfies DailyBar;
  });

  const highs = [205, 206, 212, 208, 207, 209, 212.2, 210.5, 209.9, 212.3, 211.5, 210.8];
  const closes = [203, 204, 209, 207, 206, 208, 210.4, 209.6, 210.7, 210, 209.7, 208.4];
  const start = count - highs.length;

  for (let offset = 0; offset < highs.length; offset += 1) {
    const index = start + offset;
    const close = closes[offset]!;
    bars[index] = {
      date: date(index),
      open: close - 0.5,
      high: highs[offset]!,
      low: close - 2,
      close,
      adjustedClose: close,
      volume: 2_500_000 + offset * 40_000,
    };
  }

  return bars;
}

describe("DivLab live-edge support/resistance", () => {
  it("uses available completed sessions to confirm a repeated right-edge resistance zone", () => {
    const analysis = analyzeSupportResistance(atlasLikeRightEdgeBars());
    const resistance = analysis.resistances.find(
      (zone) => zone.center >= 211 && zone.center <= 213,
    );

    assert.ok(resistance);
    assert.ok(resistance.touches >= 2);
    assert.equal(analysis.resistanceState, "zones");
  });
});
