import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin(index / 12) * 4 + index * 0.02;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    };
  });
}

test("DivLab packet separates market, reporting and EPS currencies", () => {
  const fundamentals: CurrencyAwareFundamentalSnapshot = {
    asOf: "2026-06-30",
    currency: "SEK",
    reportingCurrency: "EUR",
    epsTtmCurrency: "SEK",
    price: 100,
    revenueTtm: 1_000,
    revenueGrowthYoy: 0.08,
    operatingMarginTtm: 0.2,
    profitMarginTtm: 0.15,
    netIncomeTtm: 150,
    epsTtm: 10,
    operatingCashFlowTtm: 600,
    freeCashFlowTtm: 500,
    cash: 200,
    totalDebt: 100,
    sharesOutstanding: 100,
    historicalPeriods: [
      { period: "2023-12-31", revenue: 800 },
      { period: "2024-12-31", revenue: 900 },
      { period: "2025-12-31", revenue: 1_000 },
    ],
  };

  const packet = buildDivLabResearchPacket({
    symbol: "TEST",
    exchange: "ST",
    name: "Test AB",
    currency: "SEK",
    currentPrice: 100,
    history: bars(),
    fundamentals,
    valuationScenarios: [],
    sources: [
      {
        id: "market:test",
        kind: "market_data",
        publisher: "Test market",
        url: "https://example.com/market",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
    ],
    now: new Date("2026-08-14T17:00:00.000Z"),
  });

  assert.deepEqual(packet.currencyContext, {
    marketCurrency: "SEK",
    reportingCurrency: "EUR",
    epsTtmCurrency: "SEK",
  });
  assert.equal(packet.instrument.currency, "SEK");
  assert.equal(packet.fundamental.currency, "EUR");

  const snapshot = packet.fundamentalSnapshot as CurrencyAwareFundamentalSnapshot;
  assert.equal(snapshot.currency, "SEK");
  assert.equal(snapshot.reportingCurrency, "EUR");
  assert.equal(snapshot.epsTtmCurrency, "SEK");
});
