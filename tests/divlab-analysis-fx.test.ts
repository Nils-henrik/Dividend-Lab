import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { CurrencyAwareFundamentalSnapshot } from "../lib/analysis/financial-statement-normalizer";
import {
  deriveAnalysisFxConversion,
  normalizeValuationInput,
} from "../lib/analysis/fx";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import type { FxRateQuote } from "../lib/model-portfolios/engine/fx";
import { operatingCompanyClassification } from "./helpers/divlab-company-classification";

function quote(base: "EUR" | "USD", rate: number, asOf = "2026-08-14T16:00:00.000Z"): FxRateQuote {
  return {
    base,
    quote: "SEK",
    rate,
    asOf,
    sourcePublisher: "European Central Bank via Frankfurter",
    provider: "frankfurter",
  };
}

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin(index / 9) * 6 + index * 0.02;
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

const FUNDAMENTAL_SOURCE = {
  id: "fundamental:test",
  kind: "fundamental_data" as const,
  publisher: "Fundamental provider",
  url: "https://example.com/fundamental",
  publishedAt: "2026-08-14T16:00:00.000Z",
  verifiedAt: "2026-08-14T16:00:00.000Z",
  primary: false,
};

describe("DivLab deterministic analysis FX", () => {
  it("derives direct and cross rates without inventing values", () => {
    const direct = deriveAnalysisFxConversion({
      fromCurrency: "EUR",
      toCurrency: "SEK",
      fromToSek: quote("EUR", 11),
      sourceIds: ["fx:eur"],
    });
    assert.ok(direct);
    assert.equal(direct.rate, 11);
    assert.deepEqual(direct.sourceIds, ["fx:eur"]);

    const cross = deriveAnalysisFxConversion({
      fromCurrency: "USD",
      toCurrency: "EUR",
      fromToSek: quote("USD", 10),
      toToSek: quote("EUR", 12),
      sourceIds: ["fx:usd", "fx:eur"],
    });
    assert.ok(cross);
    assert.equal(cross.rate, 10 / 12);
    assert.deepEqual(cross.sourceIds, ["fx:usd", "fx:eur"]);

    assert.equal(
      deriveAnalysisFxConversion({
        fromCurrency: "USD",
        toCurrency: "EUR",
        fromToSek: quote("USD", 10),
        sourceIds: ["fx:usd"],
      }),
      null,
    );
  });

  it("normalizes a per-share value only with a matching verified conversion", () => {
    const fx = deriveAnalysisFxConversion({
      fromCurrency: "EUR",
      toCurrency: "SEK",
      fromToSek: quote("EUR", 11),
      sourceIds: ["fx:eur"],
    });
    assert.ok(fx);

    const converted = normalizeValuationInput({
      value: 5,
      sourceCurrency: "EUR",
      marketCurrency: "SEK",
      fxConversion: fx,
    });
    assert.equal(converted.value, 55);
    assert.equal(converted.currency, "SEK");
    assert.equal(converted.sourceCurrency, "EUR");
    assert.equal(converted.converted, true);
    assert.deepEqual(converted.fxSourceIds, ["fx:eur"]);

    const unavailable = normalizeValuationInput({
      value: 5,
      sourceCurrency: "EUR",
      marketCurrency: "SEK",
      fxConversion: null,
    });
    assert.equal(unavailable.value, null);
    assert.equal(unavailable.currency, null);
    assert.equal(unavailable.sourceCurrency, "EUR");
  });

  it("uses converted FCF/share for valuation while retaining raw accounting currency", () => {
    const fxSourceId = "fx:EUR:SEK:2026-08-14";
    const fx = deriveAnalysisFxConversion({
      fromCurrency: "EUR",
      toCurrency: "SEK",
      fromToSek: quote("EUR", 11),
      sourceIds: [fxSourceId],
    });
    assert.ok(fx);

    const fundamentals: CurrencyAwareFundamentalSnapshot = {
      asOf: "2026-06-30",
      currency: "SEK",
      reportingCurrency: "EUR",
      epsTtmCurrency: "SEK",
      price: 110,
      revenueTtm: 1_000,
      revenueGrowthYoy: 0.1,
      operatingMarginTtm: 0.2,
      profitMarginTtm: 0.15,
      ebitdaTtm: 250,
      netIncomeTtm: 150,
      epsTtm: 10,
      operatingCashFlowTtm: 600,
      freeCashFlowTtm: 500,
      cash: 200,
      totalDebt: 100,
      sharesOutstanding: 100,
      returnOnEquity: 0.2,
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
      companyClassification: operatingCompanyClassification(FUNDAMENTAL_SOURCE.id),
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
        FUNDAMENTAL_SOURCE,
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

    const rawSnapshot = packet.fundamentalSnapshot as CurrencyAwareFundamentalSnapshot;
    assert.equal(rawSnapshot.reportingCurrency, "EUR");
    assert.equal(packet.fundamental.metrics.freeCashFlowPerShare, 5);
    assert.equal(packet.valuationInputs.freeCashFlowPerShareTtm.value, 55);
    assert.equal(packet.valuationInputs.freeCashFlowPerShareTtm.currency, "SEK");
    assert.equal(packet.valuationInputs.freeCashFlowPerShareTtm.converted, true);
    assert.equal(packet.valuation.trailing.priceToFcf, 2);
    assert.equal(packet.valuation.trailing.fcfYield, 0.5);
  });

  it("keeps cross-currency P/FCF unavailable when verified FX is missing", () => {
    const fundamentals: CurrencyAwareFundamentalSnapshot = {
      asOf: "2026-06-30",
      currency: "SEK",
      reportingCurrency: "EUR",
      epsTtmCurrency: "SEK",
      price: 100,
      revenueTtm: 1_000,
      netIncomeTtm: 100,
      epsTtm: 10,
      freeCashFlowTtm: 500,
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
      currentPrice: 100,
      history: bars(),
      fundamentals,
      companyClassification: operatingCompanyClassification(FUNDAMENTAL_SOURCE.id),
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
        FUNDAMENTAL_SOURCE,
      ],
      now: new Date("2026-08-14T17:00:00.000Z"),
    });

    assert.equal(packet.valuationInputs.freeCashFlowPerShareTtm.value, null);
    assert.equal(packet.valuationInputs.freeCashFlowPerShareTtm.sourceCurrency, "EUR");
    assert.equal(packet.valuation.trailing.priceToFcf, null);
    assert.equal(packet.valuation.trailing.freeCashFlowPerShareCurrency, null);
    assert.equal(packet.valuation.trailing.freeCashFlowCurrencyCompatible, false);
  });
});
