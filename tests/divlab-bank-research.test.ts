import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBankResearch } from "../lib/analysis/bank-research";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import type { AnalysisSource } from "../lib/analysis/quality-gate";

const REPORT_ID = "bank-report:q2";
const MARKET_ID = "market:bank";
const FUNDAMENTAL_ID = "fundamental:bank";

function evidence(excerpt: string): AnalysisEvidence {
  return {
    id: "evidence:bank-research",
    sourceId: REPORT_ID,
    kind: "official_report_excerpt",
    title: "Bank Q2 report",
    content: "Verifierat rapportutdrag.",
    documentExcerpt: excerpt,
    publishedAt: "2026-07-15T06:00:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "Q2",
    reportYear: 2026,
    documentType: "quarterly_report",
  };
}

function sources(includeFundamental = true): AnalysisSource[] {
  const rows: AnalysisSource[] = [
    {
      id: REPORT_ID,
      kind: "quarterly_report",
      publisher: "Bank AB",
      url: "https://example.com/report.pdf",
      publishedAt: "2026-07-15T06:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: true,
    },
    {
      id: MARKET_ID,
      kind: "market_data",
      publisher: "Market Provider",
      url: "https://example.com/market",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    },
  ];
  if (includeFundamental) {
    rows.push({
      id: FUNDAMENTAL_ID,
      kind: "fundamental_data",
      publisher: "Fundamental Provider",
      url: "https://example.com/fundamentals",
      publishedAt: "2026-08-15T05:00:00.000Z",
      verifiedAt: "2026-08-15T05:00:00.000Z",
      primary: false,
    });
  }
  return rows;
}

const completeExcerpt = [
  "CET1 capital ratio 17.2%",
  "Return on equity 15.7%",
  "Credit impairment ratio 0.06%",
  "Cost/income ratio 40.3%",
  "The bank reported a capital buffer of 250 basis points.",
  "Liquidity Coverage Ratio 145%",
  "Net Stable Funding Ratio 121%",
].join("\n");

function build(excerpt = completeExcerpt, includeFundamental = true) {
  return buildBankResearch({
    evidence: [evidence(excerpt)],
    fundamentals: { equity: 100_000, sharesOutstanding: 1_000 },
    currentPrice: 150,
    marketCurrency: "SEK",
    reportingCurrency: "SEK",
    sources: sources(includeFundamental),
  });
}

describe("DivLab bank research v1", () => {
  it("marks broad source-bound bank facts research-ready without enabling analyst-v2", () => {
    const result = build();

    assert.equal(result.status, "research_ready");
    assert.deepEqual(result.blockers, []);
    assert.equal(result.reportMetrics.metrics.cet1Ratio.valuePct, 17.2);
    assert.equal(result.reportMetrics.metrics.returnOnEquity.valuePct, 15.7);
    assert.equal(result.reportMetrics.metrics.creditLossRatio.valuePct, 0.06);
    assert.equal(result.capital.reportedCapitalBuffer.valuePctPoints, 2.5);
    assert.equal(result.funding.metrics.liquidityCoverageRatio.valuePct, 145);
    assert.equal(result.valuation.priceToBook, 1.5);
    assert.equal(result.valuation.provenance.traceable, true);
    assert.equal(result.analystReady, false);
    assert.equal(result.analystBlockers.includes("bank_analyst_schema_v3_required"), true);
  });

  it("blocks research readiness when credit-loss evidence is missing", () => {
    const result = build(completeExcerpt.replace("Credit impairment ratio 0.06%\n", ""));
    assert.equal(result.status, "partial");
    assert.equal(result.blockers.includes("bank_credit_loss_not_confirmed"), true);
  });

  it("blocks research readiness when no capital reference is confirmed", () => {
    const result = build(
      completeExcerpt.replace("The bank reported a capital buffer of 250 basis points.\n", ""),
    );
    assert.equal(result.status, "partial");
    assert.equal(result.blockers.includes("bank_capital_reference_missing"), true);
  });

  it("blocks research readiness when funding/liquidity context is insufficient", () => {
    const result = build(
      completeExcerpt
        .replace("Liquidity Coverage Ratio 145%\n", "")
        .replace("Net Stable Funding Ratio 121%", ""),
    );
    assert.equal(result.status, "partial");
    assert.equal(result.blockers.includes("bank_funding_context_insufficient"), true);
  });

  it("blocks research readiness when P/B exists numerically but lacks provenance", () => {
    const result = build(completeExcerpt, false);
    assert.equal(result.valuation.priceToBook, 1.5);
    assert.equal(result.valuation.status, "available_untraceable");
    assert.equal(result.blockers.includes("bank_price_to_book_not_traceable"), true);
  });

  it("classifies an almost empty bank packet as insufficient rather than forcing a view", () => {
    const result = build("CET1 capital ratio 17.2%", false);
    assert.equal(result.status, "insufficient");
    assert.ok(result.blockers.length >= 4);
    assert.equal(result.analystReady, false);
  });
});
