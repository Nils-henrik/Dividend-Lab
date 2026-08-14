import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseYahooFinancialStatements } from "../lib/analysis/financial-statement-normalizer";

const raw = (value: number) => ({ raw: value });
const date = (value: string) => ({
  raw: Math.floor(new Date(`${value}T00:00:00.000Z`).getTime() / 1_000),
  fmt: value,
});

function fixture() {
  return {
    quoteSummary: {
      result: [
        {
          incomeStatementHistory: {
            incomeStatementHistory: [
              {
                endDate: date("2025-12-31"),
                totalRevenue: raw(400),
                operatingIncome: raw(60),
                netIncome: raw(40),
                dilutedEPS: raw(4),
              },
              {
                endDate: date("2024-12-31"),
                totalRevenue: raw(360),
                operatingIncome: raw(50),
                netIncome: raw(34),
                dilutedEPS: raw(3.4),
              },
            ],
          },
          incomeStatementHistoryQuarterly: {
            incomeStatementHistory: [
              { endDate: date("2026-06-30"), totalRevenue: raw(120), operatingIncome: raw(20), netIncome: raw(13) },
              { endDate: date("2026-03-31"), totalRevenue: raw(115), operatingIncome: raw(18), netIncome: raw(12) },
              { endDate: date("2025-12-31"), totalRevenue: raw(110), operatingIncome: raw(17), netIncome: raw(11) },
              { endDate: date("2025-09-30"), totalRevenue: raw(105), operatingIncome: raw(15), netIncome: raw(10) },
            ],
          },
          cashflowStatementHistory: {
            cashflowStatements: [
              {
                endDate: date("2025-12-31"),
                totalCashFromOperatingActivities: raw(58),
                capitalExpenditures: raw(-18),
              },
              {
                endDate: date("2024-12-31"),
                totalCashFromOperatingActivities: raw(50),
                capitalExpenditures: raw(-16),
              },
            ],
          },
          cashflowStatementHistoryQuarterly: {
            cashflowStatements: [
              { endDate: date("2026-06-30"), totalCashFromOperatingActivities: raw(18), capitalExpenditures: raw(-5) },
              { endDate: date("2026-03-31"), totalCashFromOperatingActivities: raw(17), capitalExpenditures: raw(-5) },
              { endDate: date("2025-12-31"), totalCashFromOperatingActivities: raw(16), capitalExpenditures: raw(-4) },
              { endDate: date("2025-09-30"), totalCashFromOperatingActivities: raw(15), capitalExpenditures: raw(-4) },
            ],
          },
          balanceSheetHistory: {
            balanceSheetStatements: [
              {
                endDate: date("2025-12-31"),
                cashAndCashEquivalents: raw(25),
                totalDebt: raw(50),
                totalStockholderEquity: raw(180),
                commonStockSharesOutstanding: raw(100),
              },
              {
                endDate: date("2024-12-31"),
                cashAndCashEquivalents: raw(20),
                totalDebt: raw(52),
                totalStockholderEquity: raw(165),
                commonStockSharesOutstanding: raw(98),
              },
            ],
          },
          balanceSheetHistoryQuarterly: {
            balanceSheetStatements: [
              {
                endDate: date("2026-06-30"),
                cashAndCashEquivalents: raw(30),
                totalDebt: raw(48),
                totalStockholderEquity: raw(190),
                commonStockSharesOutstanding: raw(101),
              },
            ],
          },
          financialData: {
            totalRevenue: raw(450),
            revenueGrowth: raw(0.12),
            operatingMargins: raw(0.155),
            profitMargins: raw(0.102),
            operatingCashflow: raw(66),
            freeCashflow: raw(48),
            totalCash: raw(30),
            totalDebt: raw(48),
            ebitda: raw(82),
            returnOnEquity: raw(0.19),
            returnOnAssets: raw(0.11),
          },
          defaultKeyStatistics: {
            sharesOutstanding: raw(101),
            trailingEps: raw(4.55),
          },
          price: {
            marketCap: raw(12_000),
          },
          summaryDetail: {
            payoutRatio: raw(0.42),
            dividendRate: raw(1.8),
          },
        },
      ],
    },
  };
}

describe("DivLab Yahoo financial statement normalization", () => {
  it("builds a real fundamental snapshot from income, balance and cash-flow statements", () => {
    const snapshot = parseYahooFinancialStatements({
      payload: fixture(),
      symbol: "TEST.ST",
      currency: "SEK",
      currentPrice: 118.5,
      now: new Date("2026-08-14T16:00:00.000Z"),
    });

    assert.ok(snapshot);
    assert.equal(snapshot.currency, "SEK");
    assert.equal(snapshot.revenueTtm, 450);
    assert.equal(snapshot.operatingCashFlowTtm, 66);
    assert.equal(snapshot.freeCashFlowTtm, 48);
    assert.equal(snapshot.totalDebt, 48);
    assert.equal(snapshot.cash, 30);
    assert.equal(snapshot.netDebt, 18);
    assert.equal(snapshot.sharesOutstanding, 101);
    assert.equal(snapshot.epsTtm, 4.55);
    assert.equal(snapshot.operatingMarginTtm, 0.155);
    assert.equal(snapshot.payoutRatio, 0.42);
    assert.ok(Math.abs((snapshot.sharesOutstandingGrowthYoy ?? 0) - (100 / 98 - 1)) < 1e-9);
    assert.equal(snapshot.historicalPeriods?.length, 2);
    assert.equal(snapshot.historicalPeriods?.[0]?.freeCashFlow, 40);
    assert.equal(snapshot.historicalPeriods?.[0]?.revenue, 400);
  });

  it("derives TTM cash flow from four quarters when summary values are absent", () => {
    const payload = fixture();
    const result = payload.quoteSummary.result[0]!;
    delete (result as { financialData?: unknown }).financialData;

    const snapshot = parseYahooFinancialStatements({
      payload,
      symbol: "TEST.ST",
      currency: "SEK",
      currentPrice: 118.5,
    });

    assert.ok(snapshot);
    assert.equal(snapshot.revenueTtm, 450);
    assert.equal(snapshot.operatingCashFlowTtm, 66);
    assert.equal(snapshot.capexTtm, -18);
    assert.equal(snapshot.freeCashFlowTtm, 48);
    assert.equal(snapshot.netDebt, 18);
  });

  it("fails closed when no useful financial values are present", () => {
    const snapshot = parseYahooFinancialStatements({
      payload: { quoteSummary: { result: [{}] } },
      symbol: "EMPTY.ST",
      currency: "SEK",
      currentPrice: 100,
    });
    assert.equal(snapshot, null);
  });
});