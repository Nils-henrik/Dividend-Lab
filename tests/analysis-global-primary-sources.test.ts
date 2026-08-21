import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  discoverGlobalPrimarySources,
  parseSecPrimarySources,
  parseSecTickerDirectory,
} from "../lib/analysis/global-primary-sources";

const NOW = new Date("2026-08-21T19:45:00.000Z");

describe("Global Source Discovery v1", () => {
  it("maps an exact SEC ticker to CIK without fuzzy guessing", () => {
    const result = parseSecTickerDirectory({
      0: { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
      1: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
    }, "msft");

    assert.deepEqual(result, {
      cik: 789019,
      ticker: "MSFT",
      title: "MICROSOFT CORP",
    });
    assert.equal(parseSecTickerDirectory({
      0: { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
    }, "MSF"), null);
  });

  it("extracts one latest annual and one latest interim SEC filing as primary sources", () => {
    const sources = parseSecPrimarySources({
      cik: 789019,
      ticker: "MSFT",
      now: NOW,
      payload: {
        filings: {
          recent: {
            accessionNumber: [
              "0000950170-26-100001",
              "0000950170-26-090001",
              "0000950170-26-080001",
              "0000950170-25-070001",
            ],
            filingDate: ["2026-07-31", "2026-04-30", "2026-01-30", "2025-07-30"],
            form: ["10-Q", "10-Q", "8-K", "10-K"],
            primaryDocument: ["msft-20260630.htm", "msft-20260331.htm", "event.htm", "msft-20250630.htm"],
          },
        },
      },
    });

    assert.equal(sources.length, 2);
    assert.equal(sources[0]?.kind, "regulatory_interim_filing");
    assert.equal(sources[1]?.kind, "regulatory_annual_filing");
    assert.equal(sources.every((source) => source.primary), true);
    assert.match(sources[0]?.url ?? "", /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\/789019\//);
    assert.match(sources[1]?.url ?? "", /msft-20250630\.htm$/);
  });

  it("rejects unsafe SEC primary-document paths instead of building arbitrary URLs", () => {
    const sources = parseSecPrimarySources({
      cik: 789019,
      ticker: "MSFT",
      now: NOW,
      payload: {
        filings: {
          recent: {
            accessionNumber: ["0000950170-26-100001", "bad/accession"],
            filingDate: ["2026-07-31", "2026-07-30"],
            form: ["10-Q", "10-K"],
            primaryDocument: ["../../secret", "report.htm"],
          },
        },
      },
    });

    assert.deepEqual(sources, []);
  });

  it("discovers a US annual + interim filing and keeps Deep Research behind a separate evidence gate", async () => {
    const requested: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url === "https://www.sec.gov/files/company_tickers.json") {
        return new Response(JSON.stringify({
          0: { cik_str: 789019, ticker: "MSFT", title: "MICROSOFT CORP" },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "https://data.sec.gov/submissions/CIK0000789019.json") {
        return new Response(JSON.stringify({
          name: "MICROSOFT CORP",
          website: "https://www.microsoft.com/",
          investorWebsite: "https://www.microsoft.com/en-us/Investor/",
          filings: {
            recent: {
              accessionNumber: ["0000950170-26-100001", "0000950170-25-070001"],
              filingDate: ["2026-07-31", "2025-07-30"],
              form: ["10-Q", "10-K"],
              primaryDocument: ["msft-20260630.htm", "msft-20250630.htm"],
            },
          },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const result = await discoverGlobalPrimarySources({
      yahooSymbol: "MSFT",
      symbol: "MSFT",
      exchange: "US",
      companyName: "Microsoft Corporation",
      fetchImpl,
      now: NOW,
    });

    assert.equal(result.status, "verified_primary");
    assert.equal(result.primarySourceCount, 2);
    assert.equal(result.annualPrimaryCount, 1);
    assert.equal(result.interimPrimaryCount, 1);
    assert.equal(result.readyForEvidenceExtraction, true);
    assert.equal(result.sources.some((source) => source.kind === "issuer_ir_candidate"), true);
    assert.equal(requested.length, 2, "US discovery must stay bounded to ticker directory + submissions");
    assert.match(result.reason, /separat.*evidence-extraction/i);
  });

  it("fails closed for an unimplemented non-US regulator instead of pretending a source is verified", async () => {
    const fetchImpl = (async () => new Response(null, { status: 503 })) as typeof fetch;
    const result = await discoverGlobalPrimarySources({
      yahooSymbol: "7203.T",
      symbol: "7203.T",
      exchange: "JPX",
      companyName: "Toyota Motor Corporation",
      fetchImpl,
      now: NOW,
    });

    assert.equal(result.primarySourceCount, 0);
    assert.equal(result.readyForEvidenceExtraction, false);
    assert.equal(result.status, "unavailable");
    assert.match(result.reason, /förblir låst/i);
  });
});
