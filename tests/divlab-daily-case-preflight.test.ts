import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import {
  DAILY_CASE_PREFLIGHT_BUDGET,
  runDailyCaseMethodologyPreflight,
} from "../lib/analysis/daily-case-preflight";

function profile(yahooSymbol: string) {
  return buildCompanyProfilePreflightFromYahooPayload({
    yahooSymbol,
    fetchedAt: new Date("2026-08-15T00:30:00.000Z"),
    payload: {
      quoteSummary: {
        result: [
          {
            assetProfile: {
              sector: "Industrials",
              industry: "Specialty Industrial Machinery",
            },
            price: { quoteType: "EQUITY" },
          },
        ],
      },
    },
  });
}

function request(index: number) {
  return {
    symbol: `TEST${index}`,
    exchange: "ST",
    yahooSymbol: `TEST${index}.ST`,
  };
}

describe("DivLab daily case methodology preflight", () => {
  it("keeps missing classifications explicit and preserves request ordering", async () => {
    const result = await runDailyCaseMethodologyPreflight({
      requests: [request(1), request(2), request(3)],
      loader: async (yahooSymbol) =>
        yahooSymbol === "TEST2.ST" ? null : profile(yahooSymbol),
    });

    assert.deepEqual(result.map((item) => item.yahooSymbol), ["TEST1.ST", "TEST2.ST", "TEST3.ST"]);
    assert.deepEqual(result.map((item) => item.status), ["ready", "missing", "ready"]);
    assert.equal(result[0]?.preflight?.methodology.status, "supported");
    assert.equal(result[1]?.preflight, null);
  });

  it("rejects a loader that substitutes another instrument", async () => {
    await assert.rejects(
      () =>
        runDailyCaseMethodologyPreflight({
          requests: [request(1)],
          loader: async () => profile("OTHER.ST"),
        }),
      /daily_case_preflight_substitution:TEST1\.ST:OTHER\.ST/,
    );
  });

  it("bounds concurrent lightweight provider calls", async () => {
    let active = 0;
    let maxActive = 0;
    let calls = 0;
    const requests = Array.from({ length: 6 }, (_, index) => request(index + 1));

    const result = await runDailyCaseMethodologyPreflight({
      requests,
      maxConcurrency: 2,
      loader: async (yahooSymbol) => {
        calls += 1;
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return profile(yahooSymbol);
      },
    });

    assert.equal(result.length, 6);
    assert.equal(calls, 6);
    assert.ok(maxActive <= 2);
  });

  it("rejects duplicate canonical identities before calling the provider", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        runDailyCaseMethodologyPreflight({
          requests: [request(1), { symbol: "test1", exchange: "st", yahooSymbol: "ALT.ST" }],
          loader: async (yahooSymbol) => {
            calls += 1;
            return profile(yahooSymbol);
          },
        }),
      /daily_case_preflight_duplicate_identity:TEST1@ST/,
    );
    assert.equal(calls, 0);
  });

  it("enforces a hard shortlist and concurrency budget", async () => {
    const tooMany = Array.from(
      { length: DAILY_CASE_PREFLIGHT_BUDGET.maxCandidates + 1 },
      (_, index) => request(index + 1),
    );

    await assert.rejects(
      () =>
        runDailyCaseMethodologyPreflight({
          requests: tooMany,
          loader: async (yahooSymbol) => profile(yahooSymbol),
        }),
      /daily_case_preflight_budget_exceeded/,
    );
    await assert.rejects(
      () =>
        runDailyCaseMethodologyPreflight({
          requests: [request(1)],
          maxConcurrency: DAILY_CASE_PREFLIGHT_BUDGET.maxConcurrency + 1,
          loader: async (yahooSymbol) => profile(yahooSymbol),
        }),
      /daily_case_preflight_concurrency_invalid/,
    );
  });
});
