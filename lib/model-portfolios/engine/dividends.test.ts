import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planDividendCredit } from "./dividends";

describe("model portfolio dividends", () => {
  it("credits a SEK dividend to cash", () => {
    const result = planDividendCredit({
      alreadyCredited: false,
      payment: {
        portfolioId: "port-1",
        instrumentSymbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        paymentEventId: "eodhd:div:INVE-B.ST:2026-05-15",
        paymentDate: "2026-05-15T00:00:00.000Z",
        nativeAmountMinor: 425, // 4.25 SEK per share
        nativeCurrency: "SEK",
        quantity: 10,
        sourcePublisher: "eodhd",
        verifiedAt: "2026-05-14T12:00:00.000Z",
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok || !("plan" in result)) throw new Error("expected plan");
    assert.equal(result.plan.grossAmountMinor, 4_250);
    assert.equal(result.plan.feeMinor, 0);
    assert.equal(result.plan.fxToSek, 1);
    assert.equal(result.plan.nativeAmountMinor, 4_250);
    assert.match(result.plan.idempotencyKey, /^dividend:port-1:INVE-B:ST:/);
  });

  it("converts a foreign dividend with FX", () => {
    const result = planDividendCredit({
      alreadyCredited: false,
      payment: {
        portfolioId: "port-1",
        instrumentSymbol: "AAPL",
        exchange: "US",
        instrumentName: "Apple Inc",
        paymentEventId: "eodhd:div:AAPL.US:2026-05-15",
        paymentDate: "2026-05-15T00:00:00.000Z",
        nativeAmountMinor: 25, // $0.25 per share
        nativeCurrency: "USD",
        quantity: 4,
        fxRateToSek: {
          rate: 10.2,
          asOf: "2026-05-15T07:00:00.000Z",
          sourcePublisher: "eodhd-fx",
          pair: "USDSEK",
        },
        sourcePublisher: "eodhd",
        verifiedAt: "2026-05-14T12:00:00.000Z",
      },
    });

    assert.equal(result.ok, true);
    if (!result.ok || !("plan" in result)) throw new Error("expected plan");
    // 25 * 4 = 100 USD minor = $1.00 → * 10.2 = 1020 SEK minor
    assert.equal(result.plan.nativeAmountMinor, 100);
    assert.equal(result.plan.grossAmountMinor, 1_020);
    assert.equal(result.plan.fxToSek, 10.2);
    assert.equal(result.plan.nativeCurrency, "USD");
  });

  it("prevents duplicate dividend credits", () => {
    const payment = {
      portfolioId: "port-1",
      instrumentSymbol: "INVE-B",
      exchange: "ST",
      instrumentName: "Investor AB ser. B",
      paymentEventId: "eodhd:div:INVE-B.ST:2026-05-15",
      paymentDate: "2026-05-15T00:00:00.000Z",
      nativeAmountMinor: 425,
      nativeCurrency: "SEK",
      quantity: 10,
      sourcePublisher: "eodhd",
      verifiedAt: "2026-05-14T12:00:00.000Z",
    };

    const first = planDividendCredit({ payment, alreadyCredited: false });
    assert.equal(first.ok, true);

    const second = planDividendCredit({ payment, alreadyCredited: true });
    assert.equal(second.ok, true);
    if (!second.ok || !("alreadyCredited" in second)) throw new Error("expected alreadyCredited");
    assert.equal(second.alreadyCredited, true);
  });

  it("does not invent unverified dividends", () => {
    const result = planDividendCredit({
      alreadyCredited: false,
      payment: {
        portfolioId: "port-1",
        instrumentSymbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        paymentEventId: "",
        paymentDate: "2026-05-15T00:00:00.000Z",
        nativeAmountMinor: 425,
        nativeCurrency: "SEK",
        quantity: 10,
        sourcePublisher: "",
        verifiedAt: "",
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.equal(result.reason, "unverified");
  });
});
