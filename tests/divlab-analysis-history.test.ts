import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { FundamentalSnapshot } from "../lib/analysis/fundamental-analysis";

describe("DivLab research packet audit trail", () => {
  it("retains a cloned normalized multi-year fundamental snapshot", () => {
    const fundamentals: FundamentalSnapshot = {
      asOf: "2026-06-30",
      currency: "SEK",
      revenueTtm: 450,
      revenueGrowthYoy: 0.12,
      operatingMarginTtm: 0.15,
      profitMarginTtm: 0.1,
      freeCashFlowTtm: 48,
      netIncomeTtm: 45,
      ebitdaTtm: 82,
      totalDebt: 48,
      cash: 30,
      sharesOutstanding: 101,
      epsTtm: 4.55,
      historicalPeriods: [
        { period: "2025-12-31", revenue: 400, freeCashFlow: 40, eps: 4 },
        { period: "2024-12-31", revenue: 360, freeCashFlow: 34, eps: 3.4 },
      ],
    };

    const packet = buildDivLabResearchPacket({
      symbol: "TEST",
      exchange: "ST",
      name: "Testbolaget AB",
      currency: "SEK",
      currentPrice: 118.5,
      history: [],
      fundamentals,
      valuationScenarios: [],
      sources: [],
      now: new Date("2026-08-14T16:00:00.000Z"),
    });

    assert.equal(packet.fundamentalSnapshot.historicalPeriods?.length, 2);
    assert.equal(packet.fundamentalSnapshot.historicalPeriods?.[0]?.revenue, 400);
    assert.notEqual(packet.fundamentalSnapshot, fundamentals);
    assert.notEqual(packet.fundamentalSnapshot.historicalPeriods, fundamentals.historicalPeriods);

    fundamentals.historicalPeriods![0]!.revenue = 999;
    assert.equal(packet.fundamentalSnapshot.historicalPeriods?.[0]?.revenue, 400);
  });
});
