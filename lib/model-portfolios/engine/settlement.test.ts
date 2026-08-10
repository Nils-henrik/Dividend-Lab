import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODEL_PORTFOLIO_COURTAGE_MINOR } from "./fees";
import {
  planBuySettlement,
  planSellSettlement,
  sizeWholeShareBuy,
  type BuySettlementInput,
  type SellSettlementInput,
} from "./settlement";

const NOW = new Date("2026-08-10T10:00:00.000Z");

const LOOSE_RULES = {
  maxSinglePositionPct: 100,
  minCashPct: 0,
  maxEquityPct: 100,
};

function sekBuyInput(overrides: Partial<BuySettlementInput> = {}): BuySettlementInput {
  return {
    now: NOW,
    decision: { decisionId: "dec-sek-1", alreadyExecuted: false },
    quote: {
      symbol: "INVE-B",
      exchange: "ST",
      instrumentName: "Investor AB ser. B",
      nativeCurrency: "SEK",
      nativePriceMinor: 30_000, // 300.00 SEK
      asOf: "2026-08-10T09:55:00.000Z",
      sourcePublisher: "eodhd",
    },
    rules: LOOSE_RULES,
    portfolioValueMinor: 1_000_000,
    cashMinor: 1_000_000,
    investedMinor: 0,
    currentPositionValueMinor: 0,
    currentHoldingQuantity: 0,
    proposedPortfolioPct: 30,
    rationale: "Verifierat startcase i Investor efter riskkontroll.",
    ...overrides,
  };
}

describe("model portfolio settlement", () => {
  it("sizes a SEK buy with 10 SEK courtage and whole shares", () => {
    const sized = sizeWholeShareBuy({
      cashMinor: 1_000_000,
      portfolioValueMinor: 1_000_000,
      proposedPortfolioPct: 30,
      priceSekMinor: 30_000,
    });
    // target 300_000, cash for shares 999_000 → min = 300_000 → floor(300000/30000)=10
    assert.equal(sized.quantity, 10);

    const result = planBuySettlement(sekBuyInput());
    assert.equal(result.ok, true);
    if (!result.ok || !("plan" in result)) throw new Error("expected plan");
    assert.equal(result.plan.quantity, 10);
    assert.equal(result.plan.feeMinor, MODEL_PORTFOLIO_COURTAGE_MINOR);
    assert.equal(result.plan.grossAmountMinor, 300_000);
    assert.equal(result.plan.cashDeltaMinor, -(300_000 + 1_000));
    assert.equal(result.plan.cashAfterMinor, 699_000);
    assert.equal(result.plan.nativeCurrency, "SEK");
    assert.equal(result.plan.fxToSek, 1);
  });

  it("converts a USD buy to SEK and includes courtage", () => {
    const result = planBuySettlement(
      sekBuyInput({
        decision: { decisionId: "dec-usd-1", alreadyExecuted: false },
        quote: {
          symbol: "AAPL",
          exchange: "US",
          instrumentName: "Apple Inc",
          nativeCurrency: "USD",
          nativePriceMinor: 20_000, // $200.00
          asOf: "2026-08-10T09:55:00.000Z",
          sourcePublisher: "eodhd",
          fxRateToSek: {
            rate: 10,
            asOf: "2026-08-10T09:50:00.000Z",
            sourcePublisher: "eodhd-fx",
            pair: "USDSEK",
          },
        },
        proposedPortfolioPct: 40,
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || !("plan" in result)) throw new Error("expected plan");
    // price SEK = 2000.00 → 200_000 minor; target 400_000 → qty 2
    assert.equal(result.plan.priceMinor, 200_000);
    assert.equal(result.plan.quantity, 2);
    assert.equal(result.plan.grossAmountMinor, 400_000);
    assert.equal(result.plan.grossNativeMinor, 40_000);
    assert.equal(result.plan.fxToSek, 10);
    assert.equal(result.plan.feeMinor, 1_000);
    assert.equal(result.plan.cashDeltaMinor, -401_000);
  });

  it("rejects buys that cannot afford courtage", () => {
    const result = planBuySettlement(
      sekBuyInput({
        decision: { decisionId: "dec-fee-1", alreadyExecuted: false },
        cashMinor: 900,
        proposedPortfolioPct: 100,
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.equal(result.reason, "insufficient_cash_for_fee");
  });

  it("rejects buys when cash covers shares but not fee after sizing edge", () => {
    // Exactly 1 share at 300 SEK = 30000 + need 1000 fee = 31000. Cash 30500 → zero qty path or insufficient.
    const result = planBuySettlement(
      sekBuyInput({
        decision: { decisionId: "dec-fee-2", alreadyExecuted: false },
        cashMinor: 30_500,
        portfolioValueMinor: 30_500,
        proposedPortfolioPct: 100,
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.ok(
      result.reason === "zero_quantity" || result.reason === "insufficient_cash",
      result.reason,
    );
  });

  it("credits sell proceeds minus 10 SEK courtage", () => {
    const input: SellSettlementInput = {
      now: NOW,
      decision: { decisionId: "dec-sell-1", alreadyExecuted: false },
      quote: {
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        nativeCurrency: "SEK",
        nativePriceMinor: 31_000,
        asOf: "2026-08-10T09:55:00.000Z",
        sourcePublisher: "eodhd",
      },
      cashMinor: 100_000,
      currentHoldingQuantity: 5,
      currentAverageCostMinor: 30_000,
      quantityToSell: 2,
      rationale: "Minskar position efter koncentrationskontroll.",
    };
    const result = planSellSettlement(input);
    assert.equal(result.ok, true);
    if (!result.ok || !("plan" in result)) throw new Error("expected plan");
    assert.equal(result.plan.grossAmountMinor, 62_000);
    assert.equal(result.plan.feeMinor, 1_000);
    assert.equal(result.plan.cashDeltaMinor, 61_000);
    assert.equal(result.plan.cashAfterMinor, 161_000);
    assert.equal(result.plan.holdingQuantityAfter, 3);
  });

  it("never sells more than the current holding", () => {
    const result = planSellSettlement({
      now: NOW,
      decision: { decisionId: "dec-sell-over", alreadyExecuted: false },
      quote: {
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        nativeCurrency: "SEK",
        nativePriceMinor: 31_000,
        asOf: "2026-08-10T09:55:00.000Z",
        sourcePublisher: "eodhd",
      },
      cashMinor: 100_000,
      currentHoldingQuantity: 2,
      currentAverageCostMinor: 30_000,
      quantityToSell: 5,
      rationale: "Försök till överförsäljning ska stoppas.",
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.equal(result.reason, "oversell");
  });

  it("prevents duplicate settlement for the same decision", () => {
    const first = planBuySettlement(sekBuyInput({ decision: { decisionId: "dec-dup", alreadyExecuted: false } }));
    assert.equal(first.ok, true);

    const second = planBuySettlement(
      sekBuyInput({ decision: { decisionId: "dec-dup", alreadyExecuted: true } }),
    );
    assert.equal(second.ok, true);
    if (!second.ok || !("alreadySettled" in second)) throw new Error("expected alreadySettled");
    assert.equal(second.alreadySettled, true);
    assert.equal(second.idempotencyKey, "settle:decision:dec-dup");
  });

  it("requires FX for non-SEK instruments", () => {
    const result = planBuySettlement(
      sekBuyInput({
        decision: { decisionId: "dec-nofx", alreadyExecuted: false },
        quote: {
          symbol: "AAPL",
          exchange: "US",
          instrumentName: "Apple Inc",
          nativeCurrency: "USD",
          nativePriceMinor: 20_000,
          asOf: "2026-08-10T09:55:00.000Z",
          sourcePublisher: "eodhd",
          fxRateToSek: null,
        },
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("expected failure");
    assert.equal(result.reason, "fx_required");
  });
});
