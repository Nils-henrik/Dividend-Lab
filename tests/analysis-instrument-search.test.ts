import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeYahooSearchQuotes,
  resolveGlobalEquityAnalysisTarget,
  searchAnalysisInstruments,
} from "@/lib/analysis/instrument-search";

test("analysis instrument search marks Nordic equities as runnable", () => {
  const [result] = normalizeYahooSearchQuotes([
    {
      symbol: "ATCO-A.ST",
      longname: "Atlas Copco AB",
      quoteType: "EQUITY",
      exchange: "STO",
      exchDisp: "Stockholm",
      currency: "SEK",
    },
  ]);

  assert.ok(result);
  assert.equal(result.symbol, "ATCO-A");
  assert.equal(result.exchange, "ST");
  assert.equal(result.kind, "equity");
  assert.equal(result.canPreflight, true);
  assert.equal(result.canRunAnalysis, true);
  assert.equal(result.supported, true);
});

test("analysis instrument search discovers US equities without bypassing research coverage", () => {
  const [result] = normalizeYahooSearchQuotes([
    {
      symbol: "MSFT",
      longname: "Microsoft Corporation",
      quoteType: "EQUITY",
      exchange: "NMS",
      exchDisp: "NASDAQ",
      currency: "USD",
    },
  ]);

  assert.ok(result);
  assert.equal(result.yahooSymbol, "MSFT");
  assert.equal(result.symbol, "MSFT");
  assert.equal(result.exchange, "US");
  assert.equal(result.exchangeLabel, "NASDAQ");
  assert.equal(result.canPreflight, true);
  assert.equal(result.canRunAnalysis, false);
  assert.equal(result.supported, false);
  assert.match(result.unsupportedReason ?? "", /global primärkälle/i);
});

test("analysis instrument search preserves exact Yahoo identity for non-US global markets", () => {
  const [result] = normalizeYahooSearchQuotes([
    {
      symbol: "7203.T",
      longname: "Toyota Motor Corporation",
      quoteType: "EQUITY",
      exchange: "JPX",
      exchDisp: "Tokyo",
      currency: "JPY",
    },
  ]);

  assert.ok(result);
  assert.equal(result.yahooSymbol, "7203.T");
  assert.equal(result.symbol, "7203.T");
  assert.equal(result.exchange, "JPX");
  assert.equal(result.canPreflight, true);
  assert.equal(result.canRunAnalysis, false);
});

test("global resolver accepts an exact equity candidate even before full research coverage exists", async () => {
  const resolved = await resolveGlobalEquityAnalysisTarget({
    yahooSymbol: "MSFT",
    fetchImpl: async () =>
      new Response(JSON.stringify({
        quotes: [
          {
            symbol: "MSFT",
            longname: "Microsoft Corporation",
            quoteType: "EQUITY",
            exchange: "NMS",
            exchDisp: "NASDAQ",
            currency: "USD",
          },
        ],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });

  assert.ok(resolved);
  assert.equal(resolved.yahooSymbol, "MSFT");
  assert.equal(resolved.exchange, "US");
  assert.equal(resolved.canRunAnalysis, false);
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
  assert.equal(result.canPreflight, false);
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
  assert.equal(results[0]?.canPreflight, false);
  assert.equal(results[0]?.supported, false);
});
