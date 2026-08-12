import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PortfolioValuePoint } from "../lib/model-portfolios/transparency";
import {
  MODEL_PORTFOLIO_CHART_RANGES,
  filterPortfolioValueHistory,
} from "../lib/model-portfolios/value-history";

function point(snapshotAt: string, totalValueMinor: number): PortfolioValuePoint {
  return {
    snapshotAt,
    totalValueMinor,
    cashValueMinor: totalValueMinor,
    investedValueMinor: 0,
    contributedCapitalMinor: 1_000_000,
    marketDataAsOf: snapshotAt,
  };
}

const history = [
  point("2025-08-01T10:00:00.000Z", 900_000),
  point("2026-01-01T10:00:00.000Z", 920_000),
  point("2026-05-01T10:00:00.000Z", 950_000),
  point("2026-07-20T10:00:00.000Z", 980_000),
  point("2026-08-11T10:00:00.000Z", 990_000),
  point("2026-08-12T10:00:00.000Z", 1_000_000),
];

describe("model portfolio value-history ranges", () => {
  it("exposes the requested public range set", () => {
    assert.deepEqual(MODEL_PORTFOLIO_CHART_RANGES, ["1D", "1M", "3M", "YTD", "1Y", "ALL"]);
  });

  it("keeps ALL identical to persisted history", () => {
    assert.deepEqual(filterPortfolioValueHistory(history, "ALL"), history);
  });

  it("filters 1D from the latest persisted valuation timestamp", () => {
    const filtered = filterPortfolioValueHistory(history, "1D");
    assert.deepEqual(filtered.map((item) => item.snapshotAt), [
      "2026-08-11T10:00:00.000Z",
      "2026-08-12T10:00:00.000Z",
    ]);
  });

  it("uses calendar ranges and keeps enough context to draw a line", () => {
    const oneMonth = filterPortfolioValueHistory(history, "1M");
    assert.deepEqual(oneMonth.map((item) => item.snapshotAt), [
      "2026-07-20T10:00:00.000Z",
      "2026-08-11T10:00:00.000Z",
      "2026-08-12T10:00:00.000Z",
    ]);

    const ytd = filterPortfolioValueHistory(history, "YTD");
    assert.equal(ytd[0]?.snapshotAt, "2026-01-01T10:00:00.000Z");
    assert.equal(ytd.at(-1)?.snapshotAt, "2026-08-12T10:00:00.000Z");
  });
});
