import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveModelPortfolioMarketDataConfig } from "./config";
import { validateModelPortfolioBuyRisk } from "./risk";
import { resolveModelPortfolioEvaluationSlot } from "./schedule";

describe("model portfolio engine safety", () => {
  it("keeps market data fail-closed until both provider and key are present", () => {
    assert.deepEqual(resolveModelPortfolioMarketDataConfig({}), {
      configured: false,
      reason: "provider_missing",
    });
    assert.deepEqual(
      resolveModelPortfolioMarketDataConfig({
        MODEL_PORTFOLIO_MARKET_DATA_PROVIDER: "eodhd",
      }),
      { configured: false, reason: "api_key_missing" },
    );
    assert.deepEqual(
      resolveModelPortfolioMarketDataConfig({
        MODEL_PORTFOLIO_MARKET_DATA_PROVIDER: "other",
        EODHD_API_KEY: "secret",
      }),
      { configured: false, reason: "provider_unsupported" },
    );

    const configured = resolveModelPortfolioMarketDataConfig({
      MODEL_PORTFOLIO_MARKET_DATA_PROVIDER: "eodhd",
      EODHD_API_KEY: "secret",
    });
    assert.equal(configured.configured, true);
    if (configured.configured) {
      assert.equal(configured.provider, "eodhd");
    }
  });

  it("resolves exactly the four Stockholm market-day windows", () => {
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-07T07:20:00Z"))?.slotId,
      "open",
    );
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-07T10:00:00Z"))?.slotId,
      "midday",
    );
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-07T13:45:00Z"))?.slotId,
      "us-open",
    );
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-07T15:15:00Z"))?.slotId,
      "close",
    );
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-07T07:10:00Z")),
      null,
    );
    assert.equal(
      resolveModelPortfolioEvaluationSlot(new Date("2026-08-08T07:20:00Z")),
      null,
    );
  });

  it("blocks stale quotes, missing FX and concentration breaches before AI execution", () => {
    const base = {
      now: new Date("2026-08-07T10:00:00Z"),
      quote: {
        symbol: "INVESTOR-B",
        exchange: "ST",
        currency: "SEK",
        priceMinor: 32000,
        asOf: "2026-08-07T09:55:00Z",
        sourcePublisher: "Verified Market Data",
      },
      rules: {
        maxSinglePositionPct: 15,
        minCashPct: 5,
        maxEquityPct: 95,
      },
      portfolioValueMinor: 1_000_000,
      cashMinor: 1_000_000,
      investedMinor: 0,
      currentPositionValueMinor: 0,
      proposedTradeGrossMinor: 100_000,
    };

    assert.deepEqual(validateModelPortfolioBuyRisk(base), {
      ok: true,
      tradeValueSekMinor: 100_000,
    });

    assert.equal(
      validateModelPortfolioBuyRisk({
        ...base,
        quote: { ...base.quote, asOf: "2026-08-07T08:00:00Z" },
      }).ok,
      false,
    );

    assert.deepEqual(
      validateModelPortfolioBuyRisk({
        ...base,
        quote: { ...base.quote, currency: "USD" },
      }),
      { ok: false, reason: "fx_required" },
    );

    assert.deepEqual(
      validateModelPortfolioBuyRisk({
        ...base,
        currentPositionValueMinor: 100_000,
        proposedTradeGrossMinor: 100_000,
      }),
      { ok: false, reason: "max_position_breached" },
    );
  });
});
