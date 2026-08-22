import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseSecPrimarySources,
  parseSecTickerDirectory,
  safeHttpsUrl,
  summarizeGlobalSourceDiscovery,
  type GlobalPrimarySource,
} from "../lib/analysis/global-primary-source-contract";

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

  it("extracts one latest annual and one latest 10-Q as primary sources", () => {
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

  it("does not treat a generic 6-K as interim financial coverage", () => {
    const sources = parseSecPrimarySources({
      cik: 123456,
      ticker: "ADR",
      now: NOW,
      payload: {
        filings: {
          recent: {
            accessionNumber: ["0000123456-26-000001", "0000123456-25-000010"],
            filingDate: ["2026-08-20", "2025-12-31"],
            form: ["6-K", "20-F"],
            primaryDocument: ["current-event.htm", "annual-report.htm"],
          },
        },
      },
    });

    assert.equal(sources.length, 1);
    assert.equal(sources[0]?.kind, "regulatory_annual_filing");
    const summary = summarizeGlobalSourceDiscovery({
      yahooSymbol: "ADR",
      symbol: "ADR",
      exchange: "US",
      companyName: "Foreign Issuer",
      sources,
    });
    assert.equal(summary.interimPrimaryCount, 0);
    assert.equal(summary.readyForEvidenceExtraction, false);
  });

  it("rejects unsafe SEC accession/document paths instead of building arbitrary URLs", () => {
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
            primaryDocument: ["..secret.htm", "report.htm"],
          },
        },
      },
    });

    assert.deepEqual(sources, []);
  });

  it("accepts only credential-free HTTPS issuer anchors", () => {
    assert.equal(safeHttpsUrl("http://example.com/investors"), null);
    assert.equal(safeHttpsUrl("https://user:pass@example.com/investors"), null);
    assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpsUrl("https://www.microsoft.com/en-us/Investor/"), "https://www.microsoft.com/en-us/Investor/");
  });

  it("marks annual + interim primary coverage ready only for the next evidence gate", () => {
    const sources: GlobalPrimarySource[] = [
      {
        id: "sec:789019:annual",
        kind: "regulatory_annual_filing",
        publisher: "U.S. Securities and Exchange Commission",
        url: "https://www.sec.gov/Archives/edgar/data/789019/annual/msft.htm",
        publishedAt: "2025-07-30T00:00:00.000Z",
        verifiedAt: NOW.toISOString(),
        primary: true,
        form: "10-K",
      },
      {
        id: "sec:789019:interim",
        kind: "regulatory_interim_filing",
        publisher: "U.S. Securities and Exchange Commission",
        url: "https://www.sec.gov/Archives/edgar/data/789019/interim/msft.htm",
        publishedAt: "2026-07-31T00:00:00.000Z",
        verifiedAt: NOW.toISOString(),
        primary: true,
        form: "10-Q",
      },
      {
        id: "sec-issuer:MSFT:issuer_ir_candidate",
        kind: "issuer_ir_candidate",
        publisher: "microsoft.com",
        url: "https://www.microsoft.com/en-us/Investor/",
        publishedAt: null,
        verifiedAt: NOW.toISOString(),
        primary: false,
        form: null,
      },
    ];

    const result = summarizeGlobalSourceDiscovery({
      yahooSymbol: "MSFT",
      symbol: "MSFT",
      exchange: "US",
      companyName: "MICROSOFT CORP",
      sources,
    });

    assert.equal(result.status, "verified_primary");
    assert.equal(result.primarySourceCount, 2);
    assert.equal(result.annualPrimaryCount, 1);
    assert.equal(result.interimPrimaryCount, 1);
    assert.equal(result.readyForEvidenceExtraction, true);
    assert.match(result.reason, /separat.*evidence-extraction/i);
  });

  it("keeps non-US discovery fail-closed when only an issuer-domain candidate exists", () => {
    const result = summarizeGlobalSourceDiscovery({
      yahooSymbol: "7203.T",
      symbol: "7203.T",
      exchange: "JPX",
      companyName: "Toyota Motor Corporation",
      sources: [{
        id: "issuer-website:7203.T",
        kind: "issuer_website_candidate",
        publisher: "global.toyota",
        url: "https://global.toyota/en/",
        publishedAt: null,
        verifiedAt: NOW.toISOString(),
        primary: false,
        form: null,
      }],
    });

    assert.equal(result.primarySourceCount, 0);
    assert.equal(result.readyForEvidenceExtraction, false);
    assert.equal(result.status, "candidate_only");
    assert.match(result.reason, /saknar ännu komplett verifierad/i);
  });
});
