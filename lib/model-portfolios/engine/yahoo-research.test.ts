import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DailyBar } from "./eodhd";
import {
  changePctFromPrices,
  clearYahooCrumbSessionCache,
  fetchYahooFundamentals,
  fetchYahooHistoryResearch,
  normalizeYahooYield,
  resolvePreviousSessionClose,
} from "./yahoo-research";

function bar(date: string, close: number, adjustedClose?: number): DailyBar {
  return {
    date,
    open: close,
    high: close,
    low: close,
    close,
    adjustedClose: adjustedClose ?? close,
    volume: 1_000_000,
  };
}

describe("Yahoo previous-session change percentage", () => {
  it("ignores long-range chartPreviousClose that caused Atlas/DNB-style false moves", () => {
    // Production-shaped 18mo chart meta: chartPreviousClose is ~18 months ago.
    const history = [
      bar("2026-08-07", 308.7),
      bar("2026-08-08", 308.2),
      bar("2026-08-11", 306.7),
    ];
    const previousClose = resolvePreviousSessionClose({
      meta: {
        previousClose: null,
        chartPreviousClose: 241.2, // must not be used
        regularMarketPrice: 306.7,
      },
      history,
      regularPrice: 306.7,
    });
    assert.equal(previousClose, 308.2);
    const changePct = changePctFromPrices(306.7, previousClose);
    assert.ok(changePct !== null);
    assert.ok(Math.abs(changePct!) < 3, `expected plausible daily move, got ${changePct}`);
    assert.ok(changePct! > -3);

    const atlasPrevious = resolvePreviousSessionClose({
      meta: {
        previousClose: null,
        chartPreviousClose: 184.6,
        regularMarketPrice: 210.1,
      },
      history: [bar("2026-08-08", 210.4), bar("2026-08-10", 209.6), bar("2026-08-11", 210.1)],
      regularPrice: 210.1,
    });
    assert.equal(atlasPrevious, 209.6);
    const atlasMove = changePctFromPrices(210.1, atlasPrevious);
    assert.ok(atlasMove !== null && Math.abs(atlasMove) < 5);
    // The buggy formula would have been ~+13.8%.
    assert.notEqual(Math.round(((210.1 / 184.6) - 1) * 1000) / 10, Math.round(atlasMove! * 10) / 10);
  });

  it("prefers meta.previousClose when Yahoo provides a true session prior close", () => {
    const previousClose = resolvePreviousSessionClose({
      meta: {
        previousClose: 100,
        chartPreviousClose: 70,
        regularMarketPrice: 101,
      },
      history: [bar("2026-08-10", 100), bar("2026-08-11", 101)],
      regularPrice: 101,
    });
    assert.equal(previousClose, 100);
    assert.ok(Math.abs((changePctFromPrices(101, previousClose) ?? 0) - 1) < 1e-9);
  });

  it("uses split-safe prior close when raw bars jump on a corporate action", () => {
    const previousClose = resolvePreviousSessionClose({
      meta: {
        previousClose: null,
        chartPreviousClose: 400,
        regularMarketPrice: 205,
      },
      history: [
        bar("2026-08-08", 400, 200),
        bar("2026-08-11", 205, 205), // 2-for-1 split into current share class
      ],
      regularPrice: 205,
    });
    assert.equal(previousClose, 200);
    const move = changePctFromPrices(205, previousClose);
    assert.ok(move !== null && Math.abs(move) < 10);
  });

  it("parses chart payloads without using chartPreviousClose for changePct", async () => {
    const body = {
      chart: {
        result: [
          {
            meta: {
              currency: "NOK",
              regularMarketPrice: 306.7,
              regularMarketTime: 1_786_432_371,
              chartPreviousClose: 241.2,
              previousClose: null,
              fullExchangeName: "Oslo",
            },
            timestamp: [1_786_262_400, 1_786_348_800, 1_786_435_200],
            indicators: {
              quote: [
                {
                  open: [308, 308, 307],
                  high: [309, 309, 308],
                  low: [307, 307, 306],
                  close: [308.7, 308.2, 306.7],
                  volume: [1, 1, 1],
                },
              ],
              adjclose: [{ adjclose: [308.7, 308.2, 306.7] }],
            },
          },
        ],
      },
    };

    const result = await fetchYahooHistoryResearch("DNB.OL", async () =>
      Response.json(body),
    );
    assert.ok(result?.quote);
    assert.equal(result!.quote!.previousClose, 308.2);
    assert.ok(Math.abs(result!.quote!.changePct ?? 99) < 3);
  });
});

describe("Yahoo fundamentals crumb path", () => {
  it("returns null when crumb/session cannot be established", async () => {
    clearYahooCrumbSessionCache();
    const result = await fetchYahooFundamentals(
      "DNB.OL",
      1,
      async () => new Response("nope", { status: 401 }),
      new Date("2026-08-11T07:20:00.000Z"),
    );
    assert.equal(result, null);
  });

  it("scores Nordic fundamentals from quoteSummary when crumb auth succeeds", async () => {
    clearYahooCrumbSessionCache();
    let sawCrumb = false;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      if (url.includes("finance.yahoo.com/") && !url.includes("query")) {
        const headers = new Headers({ "content-type": "text/html" });
        const response = new Response("<html></html>", { status: 200, headers });
        Object.defineProperty(response.headers, "getSetCookie", {
          value: () => [
            "A1=aaa; Domain=.yahoo.com; Path=/",
            "A1S=bbb; Domain=.yahoo.com; Path=/",
            "A3=ccc; Domain=.yahoo.com; Path=/",
          ],
        });
        return response;
      }
      if (url.includes("/v1/test/getcrumb")) {
        assert.match(headers.get("cookie") ?? "", /A1=/);
        return new Response("test-crumb", { status: 200 });
      }
      if (url.includes("quoteSummary")) {
        sawCrumb = url.includes("crumb=test-crumb");
        assert.match(headers.get("cookie") ?? "", /A1=/);
        return Response.json({
          quoteSummary: {
            result: [
              {
                summaryDetail: {
                  trailingPE: { raw: 11.1 },
                  dividendYield: { raw: 0.058 },
                  payoutRatio: { raw: 0.65 },
                  priceToSalesTrailing12Months: { raw: 3.2 },
                },
                defaultKeyStatistics: {
                  pegRatio: { raw: 1.4 },
                  priceToBook: { raw: 1.7 },
                },
                financialData: {
                  profitMargins: { raw: 0.32 },
                  operatingMargins: { raw: 0.4 },
                  returnOnEquity: { raw: 0.15 },
                  returnOnAssets: { raw: 0.05 },
                  earningsGrowth: { raw: -0.04 },
                  revenueGrowth: { raw: 0.01 },
                },
                price: { marketCap: { raw: 400_000_000_000 } },
              },
            ],
          },
        });
      }
      return new Response("unexpected", { status: 500 });
    };

    const result = await fetchYahooFundamentals(
      "DNB.OL",
      1,
      fetchImpl,
      new Date("2026-08-11T07:20:00.000Z"),
    );
    assert.equal(sawCrumb, true);
    assert.ok(result);
    assert.ok(Number.isFinite(result!.scores.qualityScore));
    assert.ok(Number.isFinite(result!.scores.valuationScore));
    assert.ok(Number.isFinite(result!.scores.dividendQualityScore));
    assert.equal(result!.snapshot.dividendYield, 0.058);
  });

  it("normalizes percent-form dividend yields from the quote endpoint", () => {
    assert.equal(normalizeYahooYield(5.84), 0.0584);
    assert.equal(normalizeYahooYield(0.0584), 0.0584);
    assert.equal(normalizeYahooYield(null), null);
  });
});
