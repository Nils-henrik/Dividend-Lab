import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBankResearch } from "../lib/analysis/bank-research";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import type { AnalysisSource } from "../lib/analysis/quality-gate";

const RELEASE_ID = "nordic-release:SEB-A:2026-07-15T06:30:00.000Z";
const FACT_BOOK_ID = "nordic-primary:SEB-A:2026-07-15T06:30:01.000Z:0";
const MARKET_ID = "market:SEB-A.ST";
const FUNDAMENTAL_ID = "fundamental:SEB-A.ST";

function evidence(): AnalysisEvidence[] {
  return [
    {
      id: `evidence:${FACT_BOOK_ID}`,
      sourceId: FACT_BOOK_ID,
      kind: "official_report_excerpt",
      title: "SEB Q2 2026 Fact Book",
      content: "Officiell CNS-bilaga med strikt projicerad aktuell Q2-kolumn.",
      documentExcerpt: [
        "Net ECL level 0.05%",
        "Cost/income ratio 40%",
        "Liquidity Coverage Ratio 125%",
        "Net Stable Funding Ratio 110%",
      ].join("\n"),
      publishedAt: "2026-07-15T06:30:01.000Z",
      primary: true,
      documentRetrieved: true,
      reportPeriod: "Q2",
      reportYear: 2026,
      documentType: "half_year_report",
    },
    {
      id: `evidence:${RELEASE_ID}`,
      sourceId: RELEASE_ID,
      kind: "official_report_excerpt",
      title: "SEB's results for the second quarter 2026",
      content: "Officiell Nasdaq-release.",
      documentExcerpt:
        "SEB's operating profit for the second quarter 2026 amounted to SEK 10.8bn, with a return on equity of 15.7 per cent, a CET1 capital ratio of 17.2 per cent, and a capital buffer of 250 basis points.",
      publishedAt: "2026-07-15T06:30:00.000Z",
      primary: true,
      documentRetrieved: true,
      reportPeriod: "Q2",
      reportYear: 2026,
      documentType: "half_year_report",
    },
  ];
}

function sources(): AnalysisSource[] {
  return [
    {
      id: FACT_BOOK_ID,
      kind: "quarterly_report",
      publisher: "news.eu.nasdaq.com",
      url: "https://attachment.news.eu.nasdaq.com/seb-q2-2026-fact-book.pdf",
      publishedAt: "2026-07-15T06:30:01.000Z",
      verifiedAt: "2026-08-22T21:00:00.000Z",
      primary: true,
    },
    {
      id: RELEASE_ID,
      kind: "quarterly_report",
      publisher: "news.eu.nasdaq.com",
      url: "https://view.news.eu.nasdaq.com/view?id=seb-q2-2026",
      publishedAt: "2026-07-15T06:30:00.000Z",
      verifiedAt: "2026-08-22T21:00:00.000Z",
      primary: true,
    },
    {
      id: MARKET_ID,
      kind: "market_data",
      publisher: "Yahoo Finance",
      url: "https://finance.yahoo.com/quote/SEB-A.ST",
      publishedAt: "2026-08-22T15:30:00.000Z",
      verifiedAt: "2026-08-22T21:00:00.000Z",
      primary: false,
    },
    {
      id: FUNDAMENTAL_ID,
      kind: "fundamental_data",
      publisher: "Yahoo Finance",
      url: "https://finance.yahoo.com/quote/SEB-A.ST",
      publishedAt: "2026-08-22T15:30:00.000Z",
      verifiedAt: "2026-08-22T21:00:00.000Z",
      primary: false,
    },
  ];
}

describe("SEB specialist multi-source Research readiness", () => {
  it("assembles a newer Fact Book and the real release narrative without losing metric provenance", () => {
    const result = buildBankResearch({
      evidence: evidence(),
      fundamentals: {
        equity: 230_000_000_000,
        sharesOutstanding: 1_945_000_000,
      },
      currentPrice: 170,
      marketCurrency: "SEK",
      reportingCurrency: "SEK",
      sources: sources(),
    });

    assert.equal(result.status, "research_ready");
    assert.deepEqual(result.blockers, []);

    assert.equal(result.reportMetrics.metrics.cet1Ratio.valuePct, 17.2);
    assert.equal(result.reportMetrics.metrics.cet1Ratio.sourceId, RELEASE_ID);
    assert.equal(result.reportMetrics.metrics.returnOnEquity.valuePct, 15.7);
    assert.equal(result.reportMetrics.metrics.returnOnEquity.sourceId, RELEASE_ID);
    assert.equal(result.capital.reportedCapitalBuffer.valuePctPoints, 2.5);
    assert.equal(result.capital.reportedCapitalBuffer.sourceId, RELEASE_ID);

    assert.equal(result.reportMetrics.metrics.creditLossRatio.valuePct, 0.05);
    assert.equal(result.reportMetrics.metrics.creditLossRatio.sourceId, FACT_BOOK_ID);
    assert.equal(result.reportMetrics.metrics.costIncomeRatio.valuePct, 40);
    assert.equal(result.reportMetrics.metrics.costIncomeRatio.sourceId, FACT_BOOK_ID);
    assert.equal(result.funding.metrics.liquidityCoverageRatio.valuePct, 125);
    assert.equal(result.funding.metrics.liquidityCoverageRatio.sourceId, FACT_BOOK_ID);
    assert.equal(result.funding.metrics.netStableFundingRatio.valuePct, 110);
    assert.equal(result.funding.metrics.netStableFundingRatio.sourceId, FACT_BOOK_ID);

    assert.equal(result.valuation.status, "traceable");
    assert.equal(result.valuation.provenance.traceable, true);
  });
});
