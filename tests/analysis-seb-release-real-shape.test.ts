import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

function evidence(excerpt: string): AnalysisEvidence {
  return {
    id: "evidence:seb-release-real-shape",
    sourceId: "nordic-release:SEB-A:2026-07-15T06:30:00.000Z",
    kind: "official_report_excerpt",
    title: "SEB's results for the second quarter 2026",
    content: "Officiell Nasdaq-release.",
    documentExcerpt: excerpt,
    publishedAt: "2026-07-15T06:30:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "Q2",
    reportYear: 2026,
    documentType: "half_year_report",
  };
}

describe("SEB official release narrative plus comparison table", () => {
  it("keeps explicit current ROE/CET1 narrative confirmed without guessing a table column", () => {
    const result = extractBankReportMetrics([
      evidence([
        "SEB's operating profit for the second quarter 2026 amounted to SEK 10.8bn, with a return on equity of 15.7 per cent, a CET1 capital ratio of 17.2 per cent, and a capital buffer of 250 basis points.",
        "Return on equity, % | 15,7 | 13,1 | 15,0 | 14,3 | 14,2 | 13,8",
        "Common Equity Tier 1 capital ratio, % | 17.2 | 17.5 | 17.7 | 18.2 | 17.7 | 19.0",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.returnOnEquity.status, "confirmed");
    assert.equal(result.metrics.returnOnEquity.valuePct, 15.7);
    assert.equal(result.metrics.returnOnEquity.sourceId, "nordic-release:SEB-A:2026-07-15T06:30:00.000Z");
    assert.equal(result.metrics.cet1Ratio.status, "confirmed");
    assert.equal(result.metrics.cet1Ratio.valuePct, 17.2);
    assert.equal(result.metrics.cet1Ratio.sourceId, "nordic-release:SEB-A:2026-07-15T06:30:00.000Z");
  });

  it("still refuses the same comparison rows when no explicit one-value narrative exists", () => {
    const result = extractBankReportMetrics([
      evidence([
        "Return on equity, % | 15,7 | 13,1 | 15,0 | 14,3 | 14,2 | 13,8",
        "Common Equity Tier 1 capital ratio, % | 17.2 | 17.5 | 17.7 | 18.2 | 17.7 | 19.0",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.returnOnEquity.status, "ambiguous");
    assert.equal(result.metrics.cet1Ratio.status, "ambiguous");
  });
});
