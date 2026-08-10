import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

import { SIMULATED_BUY_BROKERAGE_FEE_MINOR } from "./fees";
import { convertNativeMinorToSek } from "./fx";
import { planDividendCredit, quantityHeldOnExDate } from "./dividends";
import { resolveMarketLiveStatus, resolveMarketSession } from "./market-status";
import { planSimulatedSettlement } from "./settlement";

const now = new Date("2026-08-10T10:00:00.000Z");

const baseBuyInput = {
  side: "buy" as const,
  portfolioStatus: "active" as const,
  executionAllowedAtDecisionTime: true,
  strategyKey: "balanced" as const,
  rules: {
    maxSinglePositionPct: 15,
    minCashPct: 5,
    maxEquityPct: 95,
  },
  now,
  cashMinor: 1_000_000,
  portfolioValueMinor: 1_000_000,
  investedMinor: 0,
  currentHolding: null,
  targetWeightPct: 8,
  quote: {
    symbol: "INVE-B",
    exchange: "ST",
    instrumentName: "Investor AB ser. B",
    nativeCurrency: "SEK",
    nativePriceMinor: 32_000,
    asOf: "2026-08-10T09:55:00.000Z",
    sourcePublisher: "EODHD delayed quote",
    delayed: true as const,
  },
  fxRateToSek: null,
  convictionScore: 0.85,
  materialThesisBreak: false,
  hoursSinceLastTradeInInstrument: null,
};

describe("model portfolio simulated settlement", () => {
  it("applies exactly SEK 10 courtage on a SEK buy and includes it in average cost", () => {
    const plan = planSimulatedSettlement(baseBuyInput);
    assert.equal(plan.ok, true);
    if (!plan.ok) return;

    assert.equal(plan.feeSekMinor, SIMULATED_BUY_BROKERAGE_FEE_MINOR);
    assert.equal(plan.feeSekMinor, 1_000);
    assert.equal(plan.cashDeltaMinor, -(plan.grossAmountSekMinor + 1_000));
    assert.equal(
      plan.averageCostMinorAfter,
      Math.round((plan.grossAmountSekMinor + plan.feeSekMinor) / plan.quantity),
    );
    assert.equal(plan.fillLabel, "SIMULATED");
    assert.equal(plan.fxRateToSek, 1);
  });

  it("rejects buys when cash cannot cover gross plus SEK 10 fee", () => {
    const plan = planSimulatedSettlement({
      ...baseBuyInput,
      cashMinor: 1_000,
      portfolioValueMinor: 1_000,
      targetWeightPct: 100,
      quote: { ...baseBuyInput.quote, nativePriceMinor: 50_000 },
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.reason, "insufficient_cash");
  });

  it("converts USD buys to SEK ledger values with FX audit fields", () => {
    const plan = planSimulatedSettlement({
      ...baseBuyInput,
      targetWeightPct: 10,
      quote: {
        symbol: "AAPL",
        exchange: "US",
        instrumentName: "Apple Inc",
        nativeCurrency: "USD",
        nativePriceMinor: 2_000,
        asOf: "2026-08-10T09:55:00.000Z",
        sourcePublisher: "EODHD delayed quote",
        delayed: true,
      },
      fxRateToSek: {
        base: "USD",
        quote: "SEK",
        rate: 10.5,
        asOf: "2026-08-10T09:00:00.000Z",
        sourcePublisher: "European Central Bank via Frankfurter",
        provider: "frankfurter",
      },
    });

    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.priceSekMinor, 21_000);
    assert.equal(plan.nativeCurrency, "USD");
    assert.equal(plan.fxRateToSek, 10.5);
    assert.equal(plan.feeSekMinor, 1_000);
    assert.equal(plan.cashDeltaMinor, -(plan.grossAmountSekMinor + 1_000));
  });

  it("rejects settlement when execution was not allowed at decision time", () => {
    const plan = planSimulatedSettlement({
      ...baseBuyInput,
      executionAllowedAtDecisionTime: false,
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.reason, "execution_not_allowed");
  });

  it("enforces the conservative 8% minimum trade and 120-hour cooldown in settlement", () => {
    const tooSmall = planSimulatedSettlement({
      ...baseBuyInput,
      strategyKey: "conservative",
      targetWeightPct: 5,
      convictionScore: 0.95,
    });
    assert.equal(tooSmall.ok, false);
    if (!tooSmall.ok) assert.equal(tooSmall.reason, "trade_too_small");

    const coolingDown = planSimulatedSettlement({
      ...baseBuyInput,
      strategyKey: "conservative",
      targetWeightPct: 10,
      convictionScore: 0.95,
      hoursSinceLastTradeInInstrument: 100,
    });
    assert.equal(coolingDown.ok, false);
    if (!coolingDown.ok) assert.equal(coolingDown.reason, "instrument_cooldown");

    const allowed = planSimulatedSettlement({
      ...baseBuyInput,
      strategyKey: "conservative",
      targetWeightPct: 10,
      convictionScore: 0.95,
      hoursSinceLastTradeInInstrument: 120,
    });
    assert.equal(allowed.ok, true);
  });

  it("rejects when FX is unavailable for USD", () => {
    const plan = planSimulatedSettlement({
      ...baseBuyInput,
      quote: {
        ...baseBuyInput.quote,
        symbol: "AAPL",
        exchange: "US",
        nativeCurrency: "USD",
      },
      fxRateToSek: null,
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.reason, "fx_unavailable");
  });

  it("updates holdings and cash on sell and charges exactly SEK 10 courtage", () => {
    const plan = planSimulatedSettlement({
      ...baseBuyInput,
      side: "sell",
      targetWeightPct: 0,
      investedMinor: 320_000,
      currentHolding: {
        quantity: 10,
        averageCostMinor: 32_100,
        lastPriceMinor: 32_000,
      },
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.quantity, 10);
    assert.equal(plan.quantityAfter, 0);
    assert.equal(plan.feeSekMinor, 1_000);
    assert.equal(plan.cashDeltaMinor, plan.grossAmountSekMinor - 1_000);
  });

  it("treats duplicate settlement plans as identical for the same inputs", () => {
    const first = planSimulatedSettlement(baseBuyInput);
    const second = planSimulatedSettlement(baseBuyInput);
    assert.deepEqual(first, second);
  });
});

describe("model portfolio FX conversion", () => {
  it("keeps SEK identity conversion at rate 1.0", () => {
    const result = convertNativeMinorToSek({
      nativeCurrency: "SEK",
      nativeAmountMinor: 12_345,
      fxRateToSek: null,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sekAmountMinor, 12_345);
    assert.equal(result.fxRateToSek, 1);
  });

  it("fails closed without inventing FX for USD", () => {
    assert.deepEqual(
      convertNativeMinorToSek({
        nativeCurrency: "USD",
        nativeAmountMinor: 100,
        fxRateToSek: null,
      }),
      { ok: false, reason: "fx_unavailable" },
    );
  });
});

describe("model portfolio dividends", () => {
  const transactions = [
    {
      instrumentSymbol: "INVE-B",
      exchange: "ST",
      transactionType: "buy" as const,
      quantity: 10,
      executedAt: "2026-03-01T10:00:00.000Z",
    },
    {
      instrumentSymbol: "INVE-B",
      exchange: "ST",
      transactionType: "sell" as const,
      quantity: 4,
      executedAt: "2026-03-20T10:00:00.000Z",
    },
    {
      instrumentSymbol: "INVE-B",
      exchange: "ST",
      transactionType: "buy" as const,
      quantity: 5,
      executedAt: "2026-04-10T10:00:00.000Z",
    },
  ];

  it("uses ex-date holdings rather than current holdings", () => {
    assert.equal(quantityHeldOnExDate(transactions, "INVE-B", "ST", "2026-03-15"), 10);
    assert.equal(quantityHeldOnExDate(transactions, "INVE-B", "ST", "2026-03-25"), 6);
    assert.equal(quantityHeldOnExDate(transactions, "INVE-B", "ST", "2026-04-15"), 11);
  });

  it("credits SEK dividends exactly once via deterministic idempotency key", () => {
    const plan = planDividendCredit({
      event: {
        portfolioId: "portfolio-1",
        instrumentSymbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        exDate: "2026-03-15",
        paymentDate: "2026-03-20",
        nativeAmountPerShareMinor: 250,
        nativeCurrency: "SEK",
        sourcePublisher: "Bolagsverket verified feed",
        sourceEventKey: "INVE-B:ST:2026-03-15:cash",
      },
      transactions,
      fxRateToSek: null,
      now: new Date("2026-03-20T12:00:00.000Z"),
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.eligibleQuantity, 10);
    assert.equal(plan.grossAmountSekMinor, 2_500);
    assert.equal(plan.cashDeltaMinor, 2_500);
    assert.equal(plan.idempotencyKey, "dividend:portfolio-1:INVE-B:ST:2026-03-15:cash");
  });

  it("converts USD dividends to SEK with FX audit metadata", () => {
    const plan = planDividendCredit({
      event: {
        portfolioId: "portfolio-2",
        instrumentSymbol: "AAPL",
        exchange: "US",
        instrumentName: "Apple Inc",
        exDate: "2026-03-01",
        paymentDate: "2026-03-10",
        nativeAmountPerShareMinor: 25,
        nativeCurrency: "USD",
        sourcePublisher: "SEC verified feed",
        sourceEventKey: "AAPL:US:2026-03-01:cash",
      },
      transactions: [
        {
          instrumentSymbol: "AAPL",
          exchange: "US",
          transactionType: "buy",
          quantity: 8,
          executedAt: "2026-02-01T15:00:00.000Z",
        },
      ],
      fxRateToSek: {
        base: "USD",
        quote: "SEK",
        rate: 10,
        asOf: "2026-03-10T12:00:00.000Z",
        sourcePublisher: "European Central Bank via Frankfurter",
        provider: "frankfurter",
      },
      now: new Date("2026-03-10T15:00:00.000Z"),
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.nativeGrossMinor, 200);
    assert.equal(plan.grossAmountSekMinor, 2_000);
    assert.equal(plan.fxRateToSek, 10);
  });
});

describe("model portfolio market live status", () => {
  it("shows green LIVE SE during a normal Swedish session", () => {
    const status = resolveMarketLiveStatus(new Date("2026-08-10T08:00:00.000Z"));
    assert.equal(status.tone, "live");
    assert.match(status.label, /LIVE/);
    assert.match(status.label, /SE/);
    assert.equal(status.stockholmOpen, true);
  });

  it("waits in red before US open on a Swedish holiday", () => {
    const when = new Date("2026-05-01T10:00:00.000Z");
    assert.equal(resolveMarketSession("SE", when).isHoliday, true);
    assert.equal(resolveMarketSession("US", when).isHoliday, false);
    const status = resolveMarketLiveStatus(when);
    assert.equal(status.tone, "waiting");
    assert.match(status.label, /USA/);
  });

  it("shows LIVE USA once US opens on a Swedish holiday", () => {
    const status = resolveMarketLiveStatus(new Date("2026-05-01T16:00:00.000Z"));
    assert.equal(status.tone, "live");
    assert.equal(status.usOpen, true);
    assert.equal(status.stockholmOpen, false);
    assert.match(status.label, /USA/);
  });

  it("keeps Sweden live on a US holiday while XSTO is open", () => {
    const status = resolveMarketLiveStatus(new Date("2026-02-16T09:00:00.000Z"));
    assert.equal(resolveMarketSession("US", new Date("2026-02-16T09:00:00.000Z")).isHoliday, true);
    assert.equal(status.tone, "live");
    assert.equal(status.stockholmOpen, true);
    assert.equal(status.usOpen, false);
  });

  it("is closed on weekends", () => {
    const status = resolveMarketLiveStatus(new Date("2026-08-08T12:00:00.000Z"));
    assert.equal(status.tone, "closed");
  });

  it("shows SE + USA overlap when both sessions are open", () => {
    const status = resolveMarketLiveStatus(new Date("2026-08-10T13:45:00.000Z"));
    assert.equal(status.tone, "live");
    assert.equal(status.stockholmOpen, true);
    assert.equal(status.usOpen, true);
    assert.match(status.label, /SE \+ USA/);
  });

  it("handles DST transition periods for Stockholm and New York", () => {
    const beforeEuDst = resolveMarketSession("SE", new Date("2026-03-10T08:00:00.000Z"));
    assert.equal(beforeEuDst.localMinutes, 9 * 60);
    const us = resolveMarketSession("US", new Date("2026-03-10T13:30:00.000Z"));
    assert.equal(us.isOpen, true);
  });
});

describe("model portfolio mutation grants", () => {
  it("keeps settlement and dividend credit RPCs service-role only", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260810120000_model_portfolio_live_simulation.sql"),
      "utf8",
    );
    assert.match(sql, /revoke all on function public\.settle_model_portfolio_decision\(uuid, jsonb\)\s+from public, anon, authenticated;/i);
    assert.match(sql, /grant execute on function public\.settle_model_portfolio_decision\(uuid, jsonb\)\s+to service_role;/i);
    assert.match(sql, /revoke all on function public\.credit_model_portfolio_dividend_event\(uuid, jsonb\)\s+from public, anon, authenticated;/i);
    assert.match(sql, /grant execute on function public\.credit_model_portfolio_dividend_event\(uuid, jsonb\)\s+to service_role;/i);
    assert.doesNotMatch(sql, /grant execute on function public\.settle_model_portfolio_decision[\s\S]*to (anon|authenticated)/i);
  });
});
