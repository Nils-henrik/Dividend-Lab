import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyDividendInstrument } from "./dividend-universe";
import { NORDIC_RESEARCH_BOUNDS, NORDIC_SEED_UNIVERSE } from "./nordic-universe";
import { classifyNordicDiscoveryLane } from "./research-lanes";
import { discoverNordicYahooCandidates, discoverYahooCandidates } from "./yahoo-discovery";

function responseFor(symbols: Array<Record<string, unknown>>): Response {
  return new Response(JSON.stringify({ finance: { result: [{ quotes: symbols }] } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function quoteResponse(symbols: Array<Record<string, unknown>>): Response {
  return new Response(JSON.stringify({ quoteResponse: { result: symbols } }), {
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

  it("prefers a liquid US small-mid mover over an otherwise identical mega cap", async () => {
    const fetchImpl: typeof fetch = async () => responseFor([
      {
        symbol: "SMALLMID",
        shortName: "Small Mid",
        regularMarketChangePercent: -12,
        regularMarketVolume: 3_000_000,
        averageDailyVolume3Month: 1_000_000,
        marketCap: 5_000_000_000,
      },
      {
        symbol: "MEGA",
        shortName: "Mega",
        regularMarketChangePercent: -12,
        regularMarketVolume: 3_000_000,
        averageDailyVolume3Month: 1_000_000,
        marketCap: 500_000_000_000,
      },
    ]);

    const result = await discoverYahooCandidates({
      screens: ["day_losers"],
      shortlistLimit: 1,
      fetchImpl,
    });

    assert.equal(result[0]?.symbol, "SMALLMID");
  });

  it("screens a broad Nordic seed universe and returns a bounded four-country shortlist", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      calls.push(String(input));
      const url = new URL(String(input));
      const symbols = (url.searchParams.get("symbols") ?? "").split(",").filter(Boolean);
      return quoteResponse(
        symbols.map((yahooSymbol, index) => {
          const suffix = yahooSymbol.split(".").at(-1);
          const currency =
            suffix === "HE" ? "EUR" : suffix === "CO" ? "DKK" : suffix === "OL" ? "NOK" : "SEK";
          return {
            symbol: yahooSymbol,
            shortName: yahooSymbol,
            fullExchangeName:
              suffix === "ST"
                ? "Stockholm"
                : suffix === "CO"
                  ? "Copenhagen"
                  : suffix === "HE"
                    ? "Helsinki"
                    : "Oslo",
            currency,
            regularMarketPrice: 100 + index,
            regularMarketChangePercent: 10 - (index % 7),
            regularMarketVolume: 1_000_000 + index * 1_000,
            averageDailyVolume3Month: 800_000,
            marketCap: currency === "EUR" ? 2_000_000_000 : 40_000_000_000,
          };
        }),
      );
    };

    const result = await discoverNordicYahooCandidates({
      seeds: NORDIC_SEED_UNIVERSE,
      broadLimit: NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount,
      shortlistLimit: NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
      fetchImpl,
      now: new Date("2026-08-10T07:20:00.000Z"),
    });

    assert.ok(calls.length >= 1);
    assert.ok(result.screened.length > result.shortlist.length);
    assert.equal(result.shortlist.length, NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount);

    const countries = new Set(result.shortlist.map((item) => item.country));
    assert.deepEqual([...countries].sort(), ["DK", "FI", "NO", "SE"]);
    assert.ok(result.shortlist.every((item) => item.source === "yahoo_finance"));
    assert.ok(result.shortlist.every((item) => /\.(ST|CO|HE|OL)$/.test(item.yahooSymbol)));
  });

  it("includes the supplemental Nordic small-mid opportunity set by default", async () => {
    const requestedSymbols = new Set<string>();
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(String(input));
      const symbols = (url.searchParams.get("symbols") ?? "").split(",").filter(Boolean);
      for (const symbol of symbols) requestedSymbols.add(symbol);
      return quoteResponse([]);
    };

    await discoverNordicYahooCandidates({
      broadLimit: NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount,
      fetchImpl,
    });

    assert.ok(requestedSymbols.has("YUBICO.ST"));
    assert.ok(requestedSymbols.has("KIT.OL"));
    assert.ok(requestedSymbols.has("HARVIA.HE"));
    assert.ok(requestedSymbols.has("NETC.CO"));
  });

  it("falls back to deterministic seed ranking when Yahoo quotes are unavailable", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response("nope", { status: 500 });

    const balancedSeeds = (["SE", "NO", "FI", "DK"] as const).flatMap((country) =>
      NORDIC_SEED_UNIVERSE.filter((seed) => seed.country === country).slice(0, 6),
    );

    const result = await discoverNordicYahooCandidates({
      seeds: balancedSeeds,
      shortlistLimit: 8,
      perCountryMin: 2,
      perCountryMax: 2,
      fetchImpl,
    });

    assert.equal(result.shortlist.length, 8);
    const countries = new Set(result.shortlist.map((item) => item.country));
    assert.deepEqual([...countries].sort(), ["DK", "FI", "NO", "SE"]);
  });

  it("uses exactly three predefined Yahoo screener calls by default", async () => {
    const screens: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(String(input));
      screens.push(url.searchParams.get("scrIds") ?? "");
      return responseFor([]);
    };
    await discoverYahooCandidates({ fetchImpl });
    assert.deepEqual(screens, ["day_gainers", "day_losers", "most_actives"]);
  });

  it("reserves Nordic income and small/mid lanes inside the existing 14-name deep shortlist", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(String(input));
      const symbols = (url.searchParams.get("symbols") ?? "").split(",").filter(Boolean);
      return quoteResponse(
        symbols.map((yahooSymbol, index) => {
          const suffix = yahooSymbol.split(".").at(-1);
          const isIncome = /(?:-D|-PREF|XACTHDIV|MONTDIV)\.ST$/.test(yahooSymbol);
          return {
            symbol: yahooSymbol,
            shortName: yahooSymbol,
            fullExchangeName:
              suffix === "ST"
                ? "Stockholm"
                : suffix === "CO"
                  ? "Copenhagen"
                  : suffix === "HE"
                    ? "Helsinki"
                    : "Oslo",
            currency: suffix === "HE" ? "EUR" : suffix === "CO" ? "DKK" : "SEK",
            regularMarketPrice: 100,
            regularMarketChangePercent: isIncome ? 0.2 : 12 - (index % 5),
            regularMarketVolume: 1_000_000,
            averageDailyVolume3Month: 800_000,
            marketCap: isIncome ? 8_000_000_000 : 90_000_000_000,
          };
        }),
      );
    };

    const result = await discoverNordicYahooCandidates({
      broadLimit: NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount,
      shortlistLimit: NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount,
      fetchImpl,
      now: new Date("2026-08-13T07:20:00.000Z"),
    });

    assert.ok(result.shortlist.length <= 14);
    const prefD = result.shortlist.filter((item) => {
      const kind = classifyDividendInstrument(item)?.kind;
      return kind === "d_share" || kind === "preferred_share";
    });
    assert.ok(prefD.length >= 2, `pref/D missing: ${result.shortlist.map((item) => item.symbol).join(",")}`);
    assert.ok(
      result.shortlist.some((item) => classifyNordicDiscoveryLane(item) === "high_risk_opportunity"),
    );
    assert.ok(result.shortlist.some((item) => classifyNordicDiscoveryLane(item) === "quality_core"));
    assert.ok(result.shortlist.some((item) => classifyNordicDiscoveryLane(item) === "income"));
    assert.ok(
      result.shortlist.some((item) => classifyNordicDiscoveryLane(item) === "balanced_general"),
      `balanced/general missing from default Nordic shortlist: ${result.shortlist.map((item) => item.symbol).join(",")}`,
    );
    const countries = new Set(result.shortlist.map((item) => item.country));
    assert.deepEqual([...countries].sort(), ["DK", "FI", "NO", "SE"]);
  });
});
