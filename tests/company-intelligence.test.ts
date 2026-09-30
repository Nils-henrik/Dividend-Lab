import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { completedDividendYearDelta, deterministicDelta, latestConsecutiveAnnualDelta, reportMetricComparison } from "@/lib/companies/intelligence/report-dividend";
import type { AnnualFinancialPoint } from "@/lib/companies/financial-history";
import type { ReportSnapshotMetric } from "@/lib/companies/report-snapshot";

function point(fiscalYear: number, revenue: number | null, currency = "SEK"): AnnualFinancialPoint {
  return {
    fiscalYear,
    endDate: `${fiscalYear}-12-31`,
    currency,
    revenue,
    operatingIncome: null,
    netIncome: null,
    eps: null,
    freeCashFlow: null,
    freeCashFlowBasis: null,
    cash: null,
    debt: null,
    netDebt: null,
    operatingMargin: null,
    profitMargin: null,
  };
}

describe("deterministisk bolagsintelligens", () => {
  it("räknar bara en delta när båda värdena finns", () => {
    assert.equal(deterministicDelta(null, 10), null);
    assert.equal(deterministicDelta(10, null), null);
    assert.deepEqual(deterministicDelta(110, 100), {
      latest: 110,
      previous: 100,
      absoluteChange: 10,
      percentChange: 0.1,
    });
    assert.equal(deterministicDelta(5, 0)?.percentChange, null);

    const delta = latestConsecutiveAnnualDelta([
      point(2023, 100),
      point(2025, 80),
      point(2024, 120),
    ], "revenue");
    assert.equal(delta?.fiscalYear, 2025);
    assert.equal(delta?.previousFiscalYear, 2024);
    assert.equal(delta?.absoluteChange, -40);
    assert.equal(latestConsecutiveAnnualDelta([point(2022, 100), point(2024, 120)], "revenue"), null);
    assert.equal(latestConsecutiveAnnualDelta([point(2024, null), point(2025, 120)], "revenue"), null);
    assert.equal(latestConsecutiveAnnualDelta([
      point(2024, 100, "SEK"),
      point(2025, 120, "EUR"),
    ], "revenue"), null);
  });

  it("använder rapportens jämförelsetal och utelämnar saknade utdelningsår", () => {
    const metric: ReportSnapshotMetric = {
      id: "net-sales",
      label: "Nettoomsättning",
      amount: 250,
      comparisonAmount: 200,
      comparisonLabel: "Q1 2025",
      reportedChangePercent: 25,
      scale: "million",
    };
    assert.equal(reportMetricComparison(metric)?.absoluteChange, 50);
    assert.equal(reportMetricComparison(metric)?.reportedChangePercent, 25);
    assert.equal(reportMetricComparison({ ...metric, comparisonAmount: null }), null);

    const now = new Date("2026-09-30T12:00:00.000Z");
    const delta = completedDividendYearDelta([
      { exDate: "2024-04-10", amount: 4, currency: "SEK" },
      { exDate: "2025-04-10", amount: 5, currency: "SEK" },
    ], now);
    assert.equal(delta?.year, 2025);
    assert.equal(delta?.previousYear, 2024);
    assert.equal(delta?.absoluteChange, 1);
    assert.equal(completedDividendYearDelta([
      { exDate: "2025-04-10", amount: 5, currency: "SEK" },
    ], now), null);
    assert.equal(completedDividendYearDelta([
      { exDate: "2024-04-10", amount: 4, currency: "SEK" },
      { exDate: "2025-04-10", amount: 5, currency: "EUR" },
    ], now), null);
  });
});