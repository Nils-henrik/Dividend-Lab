import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveModelPortfolioMarketDataConfig } from "./config";
import {
  EODHD_EXCHANGE_BY_MARKET,
  parseDailyBar,
  parseDelayedQuote,
  parseInstrument,
  toEodhdTicker,
} from "./eodhd";

describe("EODHD model portfolio adapter", () => {
  it("uses EODHD automatically when the API key exists", () => {
    assert.deepEqual(resolveModelPortfolioMarketDataConfig({ EODHD_API_KEY: " secret " }), {
      configured: true,
      provider: "eodhd",
      apiKey: "secret",
    });
  });

  it("rejects an explicitly unsupported provider", () => {
    assert.deepEqual(
      resolveModelPortfolioMarketDataConfig({
        EODHD_API_KEY: "secret",
        MODEL_PORTFOLIO_MARKET_DATA_PROVIDER: "other",
      }),
      { configured: false, reason: "provider_unsupported" },
    );
  });

  it("maps every supported market to the EODHD exchange code", () => {
    assert.deepEqual(EODHD_EXCHANGE_BY_MARKET, {
      US: "US",
      SE: "ST",
      DK: "CO",
      FI: "HE",
      NO: "OL",
    });
    assert.equal(toEodhdTicker("INVE-B", "SE"), "INVE-B.ST");
  });

  it("normalizes delayed quotes without pretending they are realtime", () => {
    const quote = parseDelayedQuote({
      code: "INVE-B.ST",
      timestamp: 1786356000,
      open: 300,
      high: 304,
      low: 299,
      close: 303,
      previousClose: 301,
      volume: 1200000,
      change_p: 0.664,
    });
    assert.equal(quote?.symbol, "INVE-B");
    assert.equal(quote?.market, "SE");
    assert.equal(quote?.close, 303);
    assert.equal(quote?.delayed, true);
    assert.equal(quote?.provider, "eodhd");
  });

  it("normalizes exchange instruments", () => {
    assert.deepEqual(
      parseInstrument(
        {
          Code: "INVE-B",
          Name: "Investor AB ser. B",
          Country: "Sweden",
          Exchange: "ST",
          Currency: "SEK",
          Type: "Common Stock",
          Isin: "SE0015811963",
        },
        "ST",
      ),
      {
        code: "INVE-B",
        name: "Investor AB ser. B",
        country: "Sweden",
        exchange: "ST",
        currency: "SEK",
        type: "Common Stock",
        isin: "SE0015811963",
      },
    );
  });

  it("rejects malformed historical bars", () => {
    assert.equal(parseDailyBar({ date: "2026-08-07", close: 100 }), null);
    assert.deepEqual(
      parseDailyBar({
        date: "2026-08-07",
        open: 98,
        high: 102,
        low: 97,
        close: 101,
        adjusted_close: 101,
        volume: 500000,
      }),
      {
        date: "2026-08-07",
        open: 98,
        high: 102,
        low: 97,
        close: 101,
        adjustedClose: 101,
        volume: 500000,
      },
    );
  });
});
