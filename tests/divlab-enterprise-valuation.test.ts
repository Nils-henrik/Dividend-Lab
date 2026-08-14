import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import {
  deriveAnalysisFxConversion,
  normalizeValuationAmount,
} from "../lib/analysis/fx";
import { buildValuationAnalysis } from "../lib/analysis/valuation";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import type { FxRateQuote } from "../lib/model-portfolios/engine/fx";

function quote(rate = 11): FxRateQuote {
  return {
    base: "EUR",
    quote: "SEK",
    rate,
    asOf: "2026-08-14T16:00:00.000Z",
    sourcePublisher: "European Central Bank via Frankfurter",
    provider: "frankfurter",
  };
}

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin(index / 10) * 4 + index * 0.03;
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

describe("DivLab enterprise valuation", () => {
  it("normalizes absolute zero and negative accounting amounts without inventing FX", () => {
    const fx = deriveAnalysisFxConversion({
      fromCurrency: "EUR",
      toCurrency: "SEK",
      fromToSek: quote(11),
      sourceIds: ["fx:eur"],
    });
    assert.ok(fx);

    const zero = normalizeValuationAmount({
      value: 0,
      sourceCurrency: "EUR",
      marketCurrency: "SEK",
      fxConversion: fx,
    });
    assert.equal(zero.value, 0);
    assert.equal(zero.currency, "SEK");
    assert.equal(zero.converted, true);

    const loss = normalizeValuationAmount({
      value: -20,
      sourceCurrency: "EUR",
      marketCurrency: "SEK",
      fxConversion: fx,
    });
    assert.equal(loss.value, -220);
    assert.equal(loss.currency, "SEK");
    assert.deepEqual(loss.fxSourceIds, ["fx:eur"]);

    const unavailable = normalizeValuationAmount({
      value: 10,
      sourceCurrency: "EUR",
      marketCurrency: "SEK",
      fxConversion: null,
    });
    assert.equal(unavailable.value, null);
    assert.equal(unavailable.sourceCurrency, "EUR");
  });

  it("converts statement amounts before calculating cross-currency EV/EBIT and EV/EBITDA", () => {
    const fxSourceId = "fx:EUR:SEK:2026-08-14";
    const fx = deriveAnalysisFxConversion({
      fromCurrency: "EUR",
      toCurrency: "SEK",
      fromToSek: quote(11),
      sourceIds: [fxSourceId],
    });
    assert.ok(fx);

    const fundamentals: CurrencyAwareFundamentalSnapshot = {
      asOf: "2026-06-30",
      currency: "SEK",
      reportingCurrency: "EUR",
      epsTtmCurrency: "SEK",
      marketCap: 20_000,
      revenueTtm: 1_000,
      ebitTtm: 200,
      ebitdaTtm: 250,
      netIncomeTtm: 150,
      epsTtm: 10,
      operatingCashFlowTtm: 600,
      freeCashFlowTtm: 500,
      cash: 200,
      totalDebt: 100,
      sharesOutstanding: 100,
      historicalPeriods: [
        { period: "2023-12-31", revenue: 800 },
        { period: "2024-12-31", revenue: 850 },
        { period: "2025-12-31", revenue: 900 },
      ],
    };

    const packet = buildDivLabResearchPacket({
      symbol: "TEST",
      exchange: "ST",
      name: "Test AB",
      currency: "SEK",
      currentPrice: 110,
      history: bars(),
      fundamentals,
      fxConversion: fx,
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
        {
          id: fxSourceId,
          kind: "fx_data",
          publisher: "European Central Bank via Frankfurter",
          url: "https://api.frankfurter.app/latest?from=EUR&to=SEK",
          publishedAt: "2026-08-14T16:00:00.000Z",
          verifiedAt: "2026-08-14T16:00:00.000Z",
          primary: false,
        },
      ],
      now: new Date("2026-08-14T17:00:00.000Z"),
    });

    assert.equal(packet.enterpriseValuationInputs.marketCap.value, 20_000);
    assert.equal(packet.enterpriseValuationInputs.marketCap.converted, false);
    assert.equal(packet.enterpriseValuationInputs.cash.value, 2_200);
    assert.equal(packet.enterpriseValuationInputs.totalDebt.value, 1_100);
    assert.equal(packet.enterpriseValuationInputs.ebitTtm.value, 2_200);
    assert.equal(packet.enterpriseValuationInputs.ebitdaTtm.value, 2_750);
    assert.ok(packet.enterpriseValuationInputs.cash.converted);
    assert.deepEqual(packet.enterpriseValuationInputs.ebitdaTtm.fxSourceIds, [fxSourceId]);

    assert.equal(packet.valuation.trailing.enterpriseValue, 18_900);
    assert.equal(packet.valuation.trailing.evToEbit, 8.591);
    assert.equal(packet.valuation.trailing.evToEbitda, 6.873);

    // Raw accounting facts remain EUR and are not rewritten by valuation.
    const raw = packet.fundamentalSnapshot as CurrencyAwareFundamentalSnapshot;
    assert.equal(raw.reportingCurrency, "EUR");
    assert.equal(raw.cash, 200);
    assert.equal(raw.totalDebt, 100);
    assert.equal(raw.ebitTtm, 200);
    assert.equal(raw.ebitdaTtm, 250);
  });

  it("fails closed on enterprise multiples when cross-currency FX is unavailable", () => {
    const fundamentals: CurrencyAwareFundamentalSnapshot = {
      asOf: "2026-06-30",
      currency: "SEK",
      reportingCurrency: "EUR",
      epsTtmCurrency: "SEK",
      marketCap: 20_000,
      ebitTtm: 200,
      ebitdaTtm: 250,
      cash: 200,
      totalDebt: 100,
      epsTtm: 10,
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
      sources: [],
    });

    assert.equal(packet.enterpriseValuationInputs.marketCap.value, 20_000);
    assert.equal(packet.enterpriseValuationInputs.cash.value, null);
    assert.equal(packet.enterpriseValuationInputs.totalDebt.value, null);
    assert.equal(packet.valuation.trailing.enterpriseValue, null);
    assert.equal(packet.valuation.trailing.evToEbit, null);
    assert.equal(packet.valuation.trailing.evToEbitda, null);
  });

  it("accepts zero debt but does not produce a multiple from a non-positive earnings base", () => {
    const valuation = buildValuationAnalysis({
      currentPrice: 100,
      currency: "SEK",
      marketCap: 1_000,
      cash: 100,
      totalDebt: 0,
      ebitTtm: 100,
      ebitdaTtm: -20,
      scenarios: [],
    });

    assert.equal(valuation.trailing.enterpriseValue, 900);
    assert.equal(valuation.trailing.evToEbit, 9);
    assert.equal(valuation.trailing.evToEbitda, null);
  });
});
