import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT,
  MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS,
  MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS,
  canFetchHistoryWithFundamentalsReserve,
  createDryRunEodhdBudget,
} from "./eodhd-budget";
import { buildMarketResearchCandidate } from "./research-market";
import { mergeFundamentalScores, scoreEodhdFundamentals } from "./research-fundamentals";

function makeBars(count: number, start = 100, drift = 0.4, volume = 1_000_000) {
  return Array.from({ length: count }, (_, index) => ({
    date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    open: start + index * drift,
    high: start + index * drift + 1,
    low: start + index * drift - 1,
    close: start + index * drift,
    adjustedClose: start + index * drift,
    volume,
  }));
}

// The orchestrator is intentionally integration-heavy (Supabase + EODHD + AI Gateway).
// Budget + candidate semantics are covered here without live provider calls.
describe("model portfolio dry-run orchestration budget", () => {
  it("fits one batched quote request, three history requests and one fundamentals enrichment", () => {
    const expectedCalls =
      1 + MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS + MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS;
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 5);
    assert.equal(expectedCalls, MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT);
  });

  it("keeps the last EODHD call available for fundamentals after quote + max histories", () => {
    const budget = createDryRunEodhdBudget();
    budget.consume(); // quote batch
    for (let index = 0; index < 7; index += 1) {
      if (!canFetchHistoryWithFundamentalsReserve(budget.snapshot())) break;
      budget.consume();
    }
    assert.equal(budget.snapshot().remaining, 1);
    assert.equal(canFetchHistoryWithFundamentalsReserve(budget.snapshot()), false);
    budget.consume(); // fundamentals
    assert.equal(budget.snapshot().remaining, 0);
  });

  it("does not treat technical-only candidates as fundamentals evidence", () => {
    const technicalOnly = buildMarketResearchCandidate({
      symbol: "INVE-B",
      exchange: "ST",
      history: makeBars(80),
      quote: {
        symbol: "INVE-B",
        exchange: "ST",
        market: "SE",
        timestamp: "2026-08-10T12:00:00.000Z",
        open: 300,
        high: 305,
        low: 298,
        close: 302,
        previousClose: 299,
        volume: 2_000_000,
        changePct: 1,
        delayed: true,
        provider: "eodhd",
      },
      fxToSek: 1,
    });

    assert.ok(technicalOnly.technicalAnalysis);
    assert.equal(technicalOnly.marketCapSek, undefined);
    assert.equal(technicalOnly.qualityScore, undefined);
    assert.equal(technicalOnly.valuationScore, undefined);
    assert.equal(technicalOnly.earningsRevisionScore, undefined);
    assert.equal(technicalOnly.dividendQualityScore, undefined);
    assert.equal(technicalOnly.catalystScore, undefined);
    assert.equal(technicalOnly.balanceSheetScore, undefined);

    const fundamentalsSource = "market_only" as const;
    assert.notEqual(fundamentalsSource, "eodhd");
    assert.notEqual(fundamentalsSource, "market_derived");

    const enriched = mergeFundamentalScores(
      technicalOnly,
      scoreEodhdFundamentals(
        {
          marketCap: 400_000_000_000,
          peRatio: 16,
          profitMargin: 0.25,
          operatingMarginTtm: 0.28,
          returnOnEquityTtm: 0.2,
          returnOnAssetsTtm: 0.09,
          quarterlyEarningsGrowthYoy: 0.05,
          quarterlyRevenueGrowthYoy: 0.04,
          dividendYield: 0.025,
          payoutRatio: 0.5,
          trailingPe: 15,
          priceBookMrq: 2,
          priceSalesTtm: 4,
        },
        1,
      ),
    );
    assert.equal(enriched.marketCapSek, 400_000_000_000);
    assert.ok((enriched.qualityScore ?? 0) > 0);
    assert.equal(mergeFundamentalScores(technicalOnly, null).qualityScore, undefined);
  });
});
