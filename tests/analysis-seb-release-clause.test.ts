import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

function evidence(excerpt: string): AnalysisEvidence {
  return {
    id: "evidence:seb-release",
    sourceId: "nordic-release:SEB-A:2026-07-15T06:30:00.000Z",
    kind: "official_report_excerpt",
    title: "SEB's results for the second quarter 2026",
    content: excerpt,
    documentExcerpt: excerpt,
    publishedAt: "2026-07-15T06:30:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "Q2",
    reportYear: 2026,
    documentType: "half_year_report",
  };
}

describe("SEB-style flattened narrative bank ratios", () => {
  it("binds ROE and CET1 to their own clauses instead of mixing adjacent ratios", () => {
    const result = extractBankReportMetrics([
      evidence(
        "Operating profit amounted to SEK 10.8bn. Return on equity was 15.7 per cent, and the CET1 capital ratio was 17.2 per cent. The capital buffer was 250 bp.",
      ),
    ]);

    assert.equal(result.metrics.returnOnEquity.status, "confirmed");
    assert.equal(result.metrics.returnOnEquity.valuePct, 15.7);
    assert.equal(result.metrics.cet1Ratio.status, "confirmed");
    assert.equal(result.metrics.cet1Ratio.valuePct, 17.2);
  });

  it("still refuses a multi-period unit-first table row", () => {
    const result = extractBankReportMetrics([
      evidence(
        "Return on equity, % 15.7 13.1 14.2\nCommon Equity Tier 1 capital ratio, % 17.2 17.4 19.1",
      ),
    ]);

    assert.equal(result.metrics.returnOnEquity.status, "ambiguous");
    assert.equal(result.metrics.cet1Ratio.status, "ambiguous");
  });
});
