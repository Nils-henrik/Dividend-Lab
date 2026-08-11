import assert from "node:assert/strict";
import { test } from "node:test";

import {
  convertNativeMinorToSek,
  currencyForExchange,
  type FxRateQuote,
} from "../lib/model-portfolios/engine/fx";

test("model portfolio exchange mapping uses native Nordic currencies", () => {
  assert.equal(currencyForExchange("ST"), "SEK");
  assert.equal(currencyForExchange("Oslo Børs"), "NOK");
  assert.equal(currencyForExchange("CO"), "DKK");
  assert.equal(currencyForExchange("HE"), "EUR");
  assert.equal(currencyForExchange("NASDAQ"), "USD");
});

test("model portfolio FX conversion accepts NOK, DKK and EUR reference rates", () => {
  const cases: Array<{ base: "NOK" | "DKK" | "EUR"; rate: number; nativeMinor: number }> = [
    { base: "NOK", rate: 0.91, nativeMinor: 25_000 },
    { base: "DKK", rate: 1.46, nativeMinor: 10_000 },
    { base: "EUR", rate: 10.9, nativeMinor: 10_000 },
  ];

  for (const item of cases) {
    const fx: FxRateQuote = {
      base: item.base,
      quote: "SEK",
      rate: item.rate,
      asOf: "2026-08-11T16:00:00.000Z",
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    };
    const result = convertNativeMinorToSek({
      nativeCurrency: item.base,
      nativeAmountMinor: item.nativeMinor,
      fxRateToSek: fx,
    });

    assert.equal(result.ok, true);
    if (!result.ok) continue;
    assert.equal(result.nativeCurrency, item.base);
    assert.equal(result.sekAmountMinor, Math.round(item.nativeMinor * item.rate));
  }
});

test("model portfolio FX conversion fails closed on a mismatched base currency", () => {
  const result = convertNativeMinorToSek({
    nativeCurrency: "NOK",
    nativeAmountMinor: 25_000,
    fxRateToSek: {
      base: "USD",
      quote: "SEK",
      rate: 9.5,
      asOf: "2026-08-11T16:00:00.000Z",
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    },
  });

  assert.deepEqual(result, { ok: false, reason: "fx_unavailable" });
});
