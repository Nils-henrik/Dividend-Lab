import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCashFlowAdjustedPerformanceSeries,
  latestCashFlowAdjustedPerformancePct,
} from "../lib/model-portfolios/performance";

function point(
  snapshotAt: string,
  totalValueMinor: number,
  contributedCapitalMinor: number,
) {
  return { snapshotAt, totalValueMinor, contributedCapitalMinor };
}

describe("cash-flow-adjusted model portfolio performance", () => {
  it("does not turn the monthly contribution into return", () => {
    const series = buildCashFlowAdjustedPerformanceSeries([
      point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      point("2026-08-20T08:00:00Z", 1_050_000, 1_000_000),
      point("2026-08-25T08:00:00Z", 1_550_000, 1_500_000),
      point("2026-08-26T08:00:00Z", 1_581_000, 1_500_000),
    ]);

    assert.equal(series[0]?.performancePct, 0);
    assert.ok(Math.abs((series[1]?.performancePct ?? 0) - 5) < 1e-10);
    assert.ok(Math.abs((series[2]?.performancePct ?? 0) - 5) < 1e-10);
    assert.ok(Math.abs((series[3]?.performancePct ?? 0) - 7.1) < 1e-10);
    assert.equal(series[2]?.externalFlowMinor, 500_000);
    assert.deepEqual(
      series.map((item) => item.totalValueMinor),
      [1_000_000, 1_050_000, 1_550_000, 1_581_000],
    );
  });

  it("chains negative performance across several contributions", () => {
    const series = buildCashFlowAdjustedPerformanceSeries([
      point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      point("2026-08-20T08:00:00Z", 1_100_000, 1_000_000),
      point("2026-08-25T08:00:00Z", 1_600_000, 1_500_000),
      point("2026-09-25T08:00:00Z", 2_100_000, 2_000_000),
      point("2026-09-26T08:00:00Z", 1_890_000, 2_000_000),
    ]);

    assert.ok(Math.abs((series.at(-1)?.performancePct ?? 0) - -1) < 1e-10);
  });

  it("keeps fees and dividends in portfolio performance", () => {
    const feeSeries = buildCashFlowAdjustedPerformanceSeries([
      point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      point("2026-08-10T08:01:00Z", 999_000, 1_000_000),
    ]);
    const dividendSeries = buildCashFlowAdjustedPerformanceSeries([
      point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      point("2026-08-11T08:00:00Z", 1_020_000, 1_000_000),
    ]);

    assert.ok(Math.abs((feeSeries.at(-1)?.performancePct ?? 0) - -0.1) < 1e-10);
    assert.ok(Math.abs((dividendSeries.at(-1)?.performancePct ?? 0) - 2) < 1e-10);
  });

  it("handles empty, short, flat and zero-value history safely", () => {
    assert.equal(latestCashFlowAdjustedPerformancePct([]), 0);
    assert.equal(
      latestCashFlowAdjustedPerformancePct([
        point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      ]),
      0,
    );
    assert.equal(
      latestCashFlowAdjustedPerformancePct([
        point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
        point("2026-08-11T08:00:00Z", 1_000_000, 1_000_000),
      ]),
      0,
    );

    const zeroSeries = buildCashFlowAdjustedPerformanceSeries([
      point("2026-08-10T08:00:00Z", 0, 0),
      point("2026-08-11T08:00:00Z", 500_000, 500_000),
    ]);
    assert.ok(zeroSeries.every((item) => Number.isFinite(item.performancePct)));
  });

  it("sorts snapshots chronologically without mutating the input", () => {
    const input = [
      point("2026-08-12T08:00:00Z", 1_020_000, 1_000_000),
      point("2026-08-10T08:00:00Z", 1_000_000, 1_000_000),
      point("2026-08-11T08:00:00Z", 1_010_000, 1_000_000),
    ];
    const series = buildCashFlowAdjustedPerformanceSeries(input);

    assert.deepEqual(
      series.map((item) => item.snapshotAt),
      [
        "2026-08-10T08:00:00Z",
        "2026-08-11T08:00:00Z",
        "2026-08-12T08:00:00Z",
      ],
    );
    assert.equal(input[0]?.snapshotAt, "2026-08-12T08:00:00Z");
  });
});
