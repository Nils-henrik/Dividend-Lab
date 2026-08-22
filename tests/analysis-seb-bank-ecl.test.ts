import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const evidence: AnalysisEvidence = {
  id: "evidence:seb-q2",
  sourceId: "primary:seb-q2",
  kind: "official_report_excerpt",
  title: "SEB's results for the second quarter 2026",
  content: "Officiell kvartalsrapport.",
  documentExcerpt: [
    "CET1 capital ratio 17.2%",
    "Return on equity 15.7%",
    "Net ECL level 0.04%",
    "Cost/income ratio 0.40%",
  ].join("\n"),
  publishedAt: "2026-07-15T06:30:00.000Z",
  primary: true,
  documentRetrieved: true,
  reportPeriod: "Q2",
  reportYear: 2026,
  documentType: "quarterly_report",
};

describe("SEB bank report metric terminology", () => {
  it("treats explicit Net ECL level as the source-bound credit-loss ratio context", () => {
    const result = extractBankReportMetrics([evidence]);
    assert.equal(result.metrics.creditLossRatio.status, "confirmed");
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.04);
    assert.equal(result.metrics.creditLossRatio.sourceId, "primary:seb-q2");
    assert.equal(result.requiredCoreConfirmed, true);
    assert.equal(result.status, "evidence_ready");
  });
});
