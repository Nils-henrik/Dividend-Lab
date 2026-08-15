import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const SOURCE_ID = "bank-report:q2";

function reportEvidence(excerpt: string): AnalysisEvidence {
  return {
    id: "evidence:bank-q2",
    sourceId: SOURCE_ID,
    kind: "official_report_excerpt",
    title: "Bank Q2 report",
    content: "Verifierat rapportutdrag.",
    documentExcerpt: excerpt,
    publishedAt: "2026-07-18T06:00:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "Q2",
    reportYear: 2026,
    documentType: "quarterly_report",
  };
}

describe("DivLab bank analysis v1", () => {
  it("confirms clearly labelled bank ratios from one primary report", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "CET1 ratio 18.7%",
        "Return on equity 14.2%",
        "Net interest margin 2.05%",
        "Credit loss ratio 12 bp",
        "Cost/income ratio 42.1%",
      ].join("\n")),
    ]);

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.sourceId, SOURCE_ID);
    assert.equal(result.confirmedMetrics, 5);
    assert.equal(result.requiredCoreConfirmed, true);
    assert.equal(result.coverage, 1);
    assert.equal(result.metrics.cet1Ratio.valuePct, 18.7);
    assert.equal(result.metrics.returnOnEquity.valuePct, 14.2);
    assert.equal(result.metrics.netInterestMargin.valuePct, 2.05);
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.12);
    assert.equal(result.metrics.costIncomeRatio.valuePct, 42.1);
  });

  it("supports Swedish labels, decimal comma and basis points", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "Kärnprimärkapitalrelation 19,4%",
        "Avkastning på eget kapital 15,1%",
        "Kreditförlustnivå 8 baspunkter",
      ].join("\n")),
    ]);

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.cet1Ratio.valuePct, 19.4);
    assert.equal(result.metrics.returnOnEquity.valuePct, 15.1);
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.08);
  });

  it("refuses ambiguous current/prior values instead of guessing which column is current", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "CET1 ratio 18.7% 17.9%",
        "Return on equity 14.2%",
        "Net interest margin 2.05%",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.cet1Ratio.status, "ambiguous");
    assert.equal(result.metrics.cet1Ratio.valuePct, null);
    assert.equal(result.requiredCoreConfirmed, false);
    assert.equal(result.status, "partial");
  });

  it("does not treat basis points as CET1 or ROE percentages", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "CET1 ratio 1870 bp",
        "Return on equity 1420 bp",
        "Credit loss ratio 12 bp",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.cet1Ratio.status, "not_found");
    assert.equal(result.metrics.returnOnEquity.status, "not_found");
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.12);
    assert.equal(result.status, "insufficient");
  });

  it("rejects implausible percentages instead of accepting a malformed report token", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "CET1 ratio 400%",
        "Return on equity 14.2%",
        "Cost/income ratio 42.1%",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.cet1Ratio.status, "not_found");
    assert.equal(result.metrics.returnOnEquity.status, "confirmed");
    assert.equal(result.metrics.costIncomeRatio.status, "confirmed");
    assert.equal(result.requiredCoreConfirmed, false);
  });

  it("requires a clean retrieved primary report excerpt", () => {
    const nonPrimary = reportEvidence("CET1 ratio 18.7%\nReturn on equity 14.2%");
    nonPrimary.primary = false;
    const missing = extractBankReportMetrics([nonPrimary]);
    assert.equal(missing.status, "not_applicable");
    assert.equal(missing.confirmedMetrics, 0);

    const noDocument = reportEvidence("CET1 ratio 18.7%\nReturn on equity 14.2%");
    noDocument.documentRetrieved = false;
    assert.equal(extractBankReportMetrics([noDocument]).status, "not_applicable");

    assert.equal(extractBankReportMetrics([]).status, "not_applicable");
  });
});
