import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveResearchMarketSignals } from "./research-market";

function makeBars(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    open: 100 + index,
    high: 101 + index,
    low: 99 + index,
    close: 100 + index,
    adjustedClose: 100 + index,
    volume: 1_000_000,
  }));
}

describe("research market signals", () => {
  it("derives momentum, liquidity and annualized volatility from EOD data", () => {
    const signals = deriveResearchMarketSignals({ history: makeBars(65), quote: null, fxToSek: 1 });
    assert.ok((signals.avgDailyTurnoverSek ?? 0) > 100_000_000);
    assert.ok((signals.priceMomentum20d ?? 0) > 0);
    assert.ok((signals.priceMomentum60d ?? 0) > 0);
    assert.ok((signals.volatility20d ?? 0) >= 0);
  });

  it("converts turnover to SEK before liquidity screening", () => {
    const sek = deriveResearchMarketSignals({ history: makeBars(25), quote: null, fxToSek: 1 });
    const usd = deriveResearchMarketSignals({ history: makeBars(25), quote: null, fxToSek: 10 });
    assert.ok((usd.avgDailyTurnoverSek ?? 0) > (sek.avgDailyTurnoverSek ?? 0) * 9.9);
  });

  it("fails closed on invalid FX", () => {
    assert.throws(() => deriveResearchMarketSignals({ history: makeBars(25), quote: null, fxToSek: 0 }), /invalid_fx_to_sek/);
  });
});
