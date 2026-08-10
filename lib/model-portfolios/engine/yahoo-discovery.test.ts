import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverYahooCandidates } from "./yahoo-discovery";

function responseFor(symbols: Array<Record<string, unknown>>): Response {
  return new Response(JSON.stringify({ finance: { result: [{ quotes: symbols }] } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("Yahoo market discovery", () => {
  it("shortlists liquid movers without crawling the full market", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      calls.push(String(input));
      return responseFor([
        {
          symbol: "AAA",
          shortName: "Alpha",
          fullExchangeName: "NasdaqGS",
          currency: "USD",
          regularMarketPrice: 110,
          regularMarketChangePercent: 12,
          regularMarketVolume: 4_000_000,
          averageDailyVolume3Month: 1_000_000,
          marketCap: 5_000_000_000,
        },
        {
          symbol: "TINY",
          shortName: "Tiny",
          regularMarketPrice: 2,
          regularMarketChangePercent: 40,
          regularMarketVolume: 20_000,
          averageDailyVolume3Month: 10_000,
          marketCap: 20_000_000,
        },
      ]);
    };

    const result = await discoverYahooCandidates({
      screens: ["day_gainers"],
      fetchImpl,
      now: new Date("2026-08-10T15:50:00.000Z"),
    });

    assert.equal(calls.length, 1);
    assert.equal(result.length, 1);
    assert.equal(result[0]?.symbol, "AAA");
    assert.equal(result[0]?.source, "yahoo_finance");
  });

  it("deduplicates symbols found on more than one screen", async () => {
    const fetchImpl: typeof fetch = async () =>
      responseFor([
        {
          symbol: "AAA",
          shortName: "Alpha",
          regularMarketChangePercent: 8,
          regularMarketVolume: 3_000_000,
          averageDailyVolume3Month: 1_000_000,
          marketCap: 5_000_000_000,
        },
      ]);

    const result = await discoverYahooCandidates({
      screens: ["day_gainers", "most_actives"],
      fetchImpl,
    });

    assert.equal(result.length, 1);
    assert.equal(result[0]?.symbol, "AAA");
  });
});
