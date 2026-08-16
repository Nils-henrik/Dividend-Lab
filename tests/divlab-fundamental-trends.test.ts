import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeFundamentals } from "../lib/analysis/fundamental-analysis";

describe("DivLab multi-year fundamental trends", () => {
  it("separates company growth from per-share owner growth and dilution", () => {
    const analysis = analyzeFundamentals({
      asOf: "2026-06-30",
      currency: "SEK",
      revenueTtm: 1_500,
      revenueGrowthYoy: 0.1,
      operatingMarginTtm: 0.16,
      profitMarginTtm: 0.11,
      netIncomeTtm: 165,
      epsTtm: 5.3,
      operatingCashFlowTtm: 210,
      freeCashFlowTtm: 170,
      capexTtm: -40,
      cash: 100,
      totalDebt: 250,
      ebitdaTtm: 300,
      sharesOutstanding: 120,
      sharesOutstandingGrowthYoy: 0.025,
      returnOnEquity: 0.18,
      returnOnAssets: 0.1,
      payoutRatio: 0.45,
      historicalPeriods: [
        {
          period: "2022-12-31",
          revenue: 1_000,
          operatingIncome: 120,
          netIncome: 100,
          freeCashFlow: 90,
          eps: 4,
          sharesOutstanding: 100,
        },
        {
          period: "2023-12-31",
          revenue: 1_100,
          operatingIncome: 143,
          netIncome: 106,
          freeCashFlow: 100,
          eps: 4.08,
          sharesOutstanding: 104,
        },
        {
          period: "2024-12-31",
          revenue: 1_220,
          operatingIncome: 171,
          netIncome: 118,
          freeCashFlow: 115,
          eps: 4.37,
          sharesOutstanding: 108,
        },
        {
          period: "2025-12-31",
          revenue: 1_350,
          operatingIncome: 216,
          netIncome: 145,
          freeCashFlow: 150,
          eps: 5.04,
          sharesOutstanding: 115,
        },
      ],
    });

    assert.equal(analysis.trends.periodsAnalyzed, 4);
    assert.ok((analysis.trends.yearsCovered ?? 0) > 2.9);
    assert.ok((analysis.trends.revenueCagr ?? 0) > 0.1);
    assert.ok((analysis.trends.epsCagr ?? 0) > 0.07);
    assert.ok((analysis.trends.freeCashFlowPerShareCagr ?? 0) > 0.08);
    assert.ok((analysis.trends.sharesOutstandingCagr ?? 0) > 0.04);
    assert.ok((analysis.trends.operatingMarginChange ?? 0) > 0.03);
    assert.ok(analysis.concerns.some((item) => item.includes("utspädningen")));
    assert.ok(analysis.strengths.some((item) => item.includes("Fritt kassaflöde per aktie")));
  });

  it("does not fabricate CAGR across negative or missing bases", () => {
    const analysis = analyzeFundamentals({
      asOf: "2026-06-30",
      currency: "SEK",
      historicalPeriods: [
        { period: "2024-12-31", revenue: 100, eps: -2, freeCashFlow: -10, sharesOutstanding: 10 },
        { period: "2025-12-31", revenue: 110, eps: 1, freeCashFlow: 8, sharesOutstanding: 10 },
      ],
    });

    assert.ok((analysis.trends.revenueCagr ?? 0) > 0);
    assert.equal(analysis.trends.epsCagr, null);
    assert.equal(analysis.trends.freeCashFlowPerShareCagr, null);
  });
});
