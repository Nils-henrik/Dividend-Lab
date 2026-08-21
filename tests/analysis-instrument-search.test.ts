import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeYahooSearchQuotes,
  searchAnalysisInstruments,
} from "@/lib/analysis/instrument-search";

test("analysis instrument search marks Nordic equities as runnable", () => {
  const [result] = normalizeYahooSearchQuotes([
    {
      symbol: "ATCO-A.ST",
      longname: "Atlas Copco AB",
      quoteType: "EQUITY",
      exchange: "STO",
      currency: "SEK",
    },
  ]);

  assert.ok(result);
  assert.equal(result.symbol, "ATCO-A");
  assert.equal(result.exchange, "ST");
  assert.equal(result.kind, "equity");
  assert.equal(result.supported, true);
});

test("analysis instrument search keeps indexes separate from company methodology", () => {
  const [result] = normalizeYahooSearchQuotes([
    {
      symbol: "^OMX",
      longname: "OMX Stockholm 30 Index",
      quoteType: "INDEX",
      exchange: "STO",
      currency: "SEK",
    },
  ]);

  assert.ok(result);
  assert.equal(result.kind, "index");
  assert.equal(result.supported, false);
  assert.match(result.unsupportedReason ?? "", /Index/i);
});

test("OMXS30 query has a deterministic index fallback when Yahoo search is empty", async () => {
  const results = await searchAnalysisInstruments({
    query: "OMXS30",
    fetchImpl: async () =>
      new Response(JSON.stringify({ quotes: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  assert.equal(results[0]?.yahooSymbol, "^OMX");
  assert.equal(results[0]?.kind, "index");
  assert.equal(results[0]?.supported, false);
});
