import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBankValuation } from "../lib/analysis/bank-valuation";
import type { AnalysisFxConversion } from "../lib/analysis/fx";
import type { AnalysisSource } from "../lib/analysis/quality-gate";

const MARKET_ID = "market:bank";
const FUNDAMENTAL_ID = "fundamental:bank";
const FX_ID = "fx:eur-sek";

function sources(includeFundamental = true, includeFx = false): AnalysisSource[] {
  const result: AnalysisSource[] = [
    {
      id: MARKET_ID,
      kind: "market_data",
      publisher: "Market Provider",
      url: "https://example.com/market",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    },
  ];
  if (includeFundamental) {
    result.push({
      id: FUNDAMENTAL_ID,
      kind: "fundamental_data",
      publisher: "Fundamental Provider",
      url: "https://example.com/fundamentals",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    });
  }
  if (includeFx) {
    result.push({
      id: FX_ID,
      kind: "fx_data",
      publisher: "ECB/Frankfurter",
      url: "https://example.com/fx",
      publishedAt: "2026-08-14T14:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    });
  }
  return result;
}

const eurSek: AnalysisFxConversion = {
  fromCurrency: "EUR",
  toCurrency: "SEK",
  rate: 11,
  asOf: "2026-08-14T14:00:00.000Z",
  sourcePublisher: "ECB/Frankfurter",
  provider: "Frankfurter",
  sourceIds: [FX_ID],
};

describe("DivLab bank valuation v1", () => {
  it("calculates traceable same-currency P/B from equity and shares", () => {
    const result = buildBankValuation({
      currentPrice: 150,
      marketCurrency: "SEK",
      equity: 100_000,
      sharesOutstanding: 1_000,
      reportingCurrency: "SEK",
      sources: sources(),
    });

    assert.equal(result.status, "traceable");
    assert.equal(result.rawBookValuePerShare, 100);
    assert.equal(result.bookValuePerShare.value, 100);
    assert.equal(result.bookValuePerShare.converted, false);
    assert.equal(result.priceToBook, 1.5);
    assert.equal(result.provenance.traceable, true);
    assert.deepEqual(result.provenance.sourceIds, [FUNDAMENTAL_ID, MARKET_ID].sort());
  });

  it("normalizes book value per share through the audited FX chain before P/B", () => {
    const result = buildBankValuation({
      currentPrice: 220,
      marketCurrency: "SEK",
      equity: 1_000,
      sharesOutstanding: 100,
      reportingCurrency: "EUR",
      fxConversion: eurSek,
      sources: sources(true, true),
    });

    assert.equal(result.status, "traceable");
    assert.equal(result.rawBookValuePerShare, 10);
    assert.equal(result.rawBookValueCurrency, "EUR");
    assert.equal(result.bookValuePerShare.value, 110);
    assert.equal(result.bookValuePerShare.currency, "SEK");
    assert.equal(result.bookValuePerShare.converted, true);
    assert.equal(result.priceToBook, 2);
    assert.deepEqual(result.provenance.fxSourceIds, [FX_ID]);
    assert.equal(result.provenance.sourceIds.includes(FX_ID), true);
  });

  it("fails closed on cross-currency book value when FX is missing", () => {
    const result = buildBankValuation({
      currentPrice: 220,
      marketCurrency: "SEK",
      equity: 1_000,
      sharesOutstanding: 100,
      reportingCurrency: "EUR",
      sources: sources(),
    });

    assert.equal(result.status, "unavailable");
    assert.equal(result.bookValuePerShare.value, null);
    assert.equal(result.priceToBook, null);
    assert.equal(result.provenance.available, false);
  });

  it("does not produce P/B from non-positive equity or missing shares", () => {
    const negativeEquity = buildBankValuation({
      currentPrice: 100,
      marketCurrency: "SEK",
      equity: -100,
      sharesOutstanding: 10,
      reportingCurrency: "SEK",
      sources: sources(),
    });
    assert.equal(negativeEquity.priceToBook, null);

    const noShares = buildBankValuation({
      currentPrice: 100,
      marketCurrency: "SEK",
      equity: 100,
      sharesOutstanding: null,
      reportingCurrency: "SEK",
      sources: sources(),
    });
    assert.equal(noShares.priceToBook, null);
  });

  it("marks a numeric P/B untraceable when the fundamental source is absent", () => {
    const result = buildBankValuation({
      currentPrice: 150,
      marketCurrency: "SEK",
      equity: 100_000,
      sharesOutstanding: 1_000,
      reportingCurrency: "SEK",
      sources: sources(false),
    });

    assert.equal(result.priceToBook, 1.5);
    assert.equal(result.status, "available_untraceable");
    assert.equal(result.provenance.available, true);
    assert.equal(result.provenance.traceable, false);
  });

  it("validates the listed price and market currency before doing bank valuation", () => {
    assert.throws(
      () =>
        buildBankValuation({
          currentPrice: 0,
          marketCurrency: "SEK",
          equity: 100,
          sharesOutstanding: 10,
          reportingCurrency: "SEK",
          sources: sources(),
        }),
      /bank_valuation_current_price_required/,
    );
    assert.throws(
      () =>
        buildBankValuation({
          currentPrice: 100,
          marketCurrency: "",
          equity: 100,
          sharesOutstanding: 10,
          reportingCurrency: "SEK",
          sources: sources(),
        }),
      /bank_valuation_market_currency_required/,
    );
  });
});
