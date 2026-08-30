import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseYahooFinancialStatements,
  type CurrencyAwareFundamentalSnapshot,
} from "../lib/analysis/financial-statement-normalizer";
import { buildValuationAnalysis } from "../lib/analysis/valuation";

const raw = (value: number | string) => ({ raw: value });
const date = (value: string) => ({
  raw: Math.floor(new Date(`${value}T00:00:00.000Z`).getTime() / 1_000),
  fmt: value,
});

describe("DivLab valuation currency safety", () => {
  it("tracks reporting currency separately from quote currency and period-average shares", () => {
    const snapshot = parseYahooFinancialStatements({
      symbol: "TEST.ST",
      currency: "SEK",
      currentPrice: 100,
      payload: {
        quoteSummary: {
          result: [
            {
              financialData: {
                financialCurrency: raw("EUR"),
                totalRevenue: raw(1_000),
                freeCashflow: raw(120),
                operatingCashflow: raw(150),
                totalCash: raw(300),
                totalDebt: raw(100),
              },
              defaultKeyStatistics: {
                trailingEps: raw(10),
                sharesOutstanding: raw(100),
              },
              price: { marketCap: raw(10_000) },
              summaryDetail: {},
              incomeStatementHistory: {
                incomeStatementHistory: [
                  {
                    endDate: date("2025-12-31"),
                    totalRevenue: raw(900),
                    netIncome: raw(90),
                    dilutedAverageShares: raw(90),
                  },
                  {
                    endDate: date("2024-12-31"),
                    totalRevenue: raw(800),
                    netIncome: raw(72),
                    dilutedAverageShares: raw(80),
                  },
                ],
              },
              incomeStatementHistoryQuarterly: { incomeStatementHistory: [] },
              cashflowStatementHistory: { cashflowStatements: [] },
              cashflowStatementHistoryQuarterly: { cashflowStatements: [] },
              balanceSheetHistory: { balanceSheetStatements: [] },
              balanceSheetHistoryQuarterly: { balanceSheetStatements: [] },
            },
          ],
        },
      },
    }) as CurrencyAwareFundamentalSnapshot | null;

    assert.ok(snapshot);
    assert.equal(snapshot.currency, "SEK");
    assert.equal(snapshot.reportingCurrency, "EUR");
    assert.equal(snapshot.epsTtmCurrency, "SEK");
    assert.equal(snapshot.historicalPeriods?.[0]?.sharesOutstanding, 90);
    assert.equal(snapshot.historicalPeriods?.[1]?.sharesOutstanding, 80);
    assert.equal(snapshot.historicalPeriods?.[0]?.eps, 1);
  });

  it("omits trailing P/FCF and incompatible scenarios instead of mixing currencies", () => {
    const valuation = buildValuationAnalysis({
      currentPrice: 100,
      currency: "SEK",
      epsTtm: 10,
      epsCurrency: "SEK",
      freeCashFlowPerShareTtm: 5,
      freeCashFlowPerShareCurrency: "EUR",
      scenarios: [
        {
          name: "bear",
          label: "Bear",
          currency: "EUR",
          eps: 8,
          peMultiple: 10,
          assumptions: ["Reporting-currency case"],
        },
        {
          name: "base",
          label: "Base",
          currency: "SEK",
          explicitValuePerShare: 120,
          assumptions: ["FX-converted upstream"],
        },
        {
          name: "bull",
          label: "Bull",
          currency: "SEK",
          explicitValuePerShare: 150,
          assumptions: ["FX-converted upstream"],
        },
      ],
    });

    assert.equal(valuation.trailing.pe, 10);
    assert.equal(valuation.trailing.priceToFcf, null);
    assert.equal(valuation.trailing.fcfYield, null);
    assert.equal(valuation.trailing.freeCashFlowCurrencyCompatible, false);
    assert.equal(valuation.scenarios[0]?.currencyCompatible, false);
    assert.equal(valuation.scenarios[0]?.valuePerShare, null);
    assert.equal(valuation.scenarios[1]?.currencyCompatible, true);
    assert.equal(valuation.scenarios[1]?.valuePerShare, 120);
  });

  it("marks omitted scenario currency as assumed so publication can reject it", () => {
    const valuation = buildValuationAnalysis({
      currentPrice: 100,
      currency: "SEK",
      scenarios: [
        {
          name: "base",
          label: "Base",
          explicitValuePerShare: 120,
          assumptions: ["Missing explicit currency"],
        },
      ],
    });
    assert.equal(valuation.scenarios[0]?.currencyAssumed, true);
  });
});
