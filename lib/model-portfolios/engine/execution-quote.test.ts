import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSimulationExecutionQuote } from "./execution-quote";

describe("simulation execution quote validation", () => {
  const now = new Date("2026-08-10T10:00:00.000Z");

  it("accepts an explicit delayed execution fetch within freshness window", () => {
    const result = validateSimulationExecutionQuote(
      {
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        nativeCurrency: "SEK",
        nativePriceMajor: 312.4,
        asOf: "2026-08-10T09:50:00.000Z",
        sourcePublisher: "eodhd",
        purpose: "execution",
        providerMode: "delayed_validated",
      },
      now,
    );
    assert.equal(result.ok, true);
    if (!result.ok) throw new Error("expected ok");
    assert.equal(result.quote.nativePriceMinor, 31_240);
  });

  it("rejects stale quotes and forbids missing execution purpose", () => {
    const stale = validateSimulationExecutionQuote(
      {
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        nativeCurrency: "SEK",
        nativePriceMajor: 312.4,
        asOf: "2026-08-10T08:00:00.000Z",
        sourcePublisher: "eodhd",
        purpose: "execution",
        providerMode: "delayed_validated",
      },
      now,
    );
    assert.equal(stale.ok, false);
    if (stale.ok) throw new Error("expected failure");
    assert.equal(stale.reason, "stale_execution_quote");
  });
});
