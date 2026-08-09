import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFollowerTradePayload, selectExecutionPrice } from "./pricing";
import { INSTRUMENT_UNIVERSE_SOURCES, canExecuteWithMarketData } from "./sources";

const quote = {
  market: "US" as const,
  symbol: "AAPL",
  exchange: "NASDAQ",
  currency: "USD",
  bidMinor: 20_000,
  askMinor: 20_010,
  lastTradeMinor: 20_005,
  marketTimestamp: "2026-08-10T13:30:00.000Z",
  receivedAt: "2026-08-10T13:30:00.100Z",
  provider: "eodhd",
  providerMode: "realtime_quote" as const,
};

describe("model portfolio market-data contract", () => {
  it("uses official listing sources for every supported market", () => {
    assert.deepEqual(
      new Set(INSTRUMENT_UNIVERSE_SOURCES.map((source) => source.market)),
      new Set(["US", "SE", "DK", "FI", "NO"]),
    );
  });

  it("does not treat delayed Nordic data as executable realtime data", () => {
    assert.equal(canExecuteWithMarketData("US"), true);
    assert.equal(canExecuteWithMarketData("SE"), false);
    assert.equal(canExecuteWithMarketData("NO"), false);
  });

  it("models buys at the best ask and sells at the best bid", () => {
    const now = new Date("2026-08-10T13:30:02.000Z");
    const buy = selectExecutionPrice("buy", quote, now);
    const sell = selectExecutionPrice("sell", quote, now);
    assert.equal(buy.ok && buy.snapshot.executionPriceMinor, 20_010);
    assert.equal(buy.ok && buy.snapshot.priceBasis, "best_ask");
    assert.equal(sell.ok && sell.snapshot.executionPriceMinor, 20_000);
    assert.equal(sell.ok && sell.snapshot.priceBasis, "best_bid");
  });

  it("fails closed when an execution quote is stale", () => {
    assert.deepEqual(
      selectExecutionPrice("buy", quote, new Date("2026-08-10T13:31:00.000Z")),
      { ok: false, reason: "stale_execution_quote" },
    );
  });

  it("publishes the immutable execution price and provenance to followers", () => {
    const price = selectExecutionPrice("buy", quote, new Date("2026-08-10T13:30:02.000Z"));
    assert.equal(price.ok, true);
    if (!price.ok) return;
    const payload = buildFollowerTradePayload({
      ...price.snapshot,
      transactionId: "tx-1",
      portfolioId: "portfolio-1",
      quantity: 5,
      executedAt: "2026-08-10T13:30:02.100Z",
      rationale: "Verifierad modellaffär.",
    });
    assert.equal(payload.executionPriceMinor, 20_010);
    assert.equal(payload.provider, "eodhd");
    assert.equal(payload.publicationTargetMs, 30_000);
  });
});
