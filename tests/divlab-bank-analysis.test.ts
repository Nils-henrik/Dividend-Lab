import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const SOURCE_ID = "bank-report:q2";

function reportEvidence(
  excerpt: string,
  sourceId = SOURCE_ID,
  publishedAt = "2026-07-18T06:00:00.000Z",
): AnalysisEvidence {
  return {
    id: `evidence:${sourceId}`,
    sourceId,
    kind: "official_report_excerpt",
    title: "Bank Q2 report",
    content: "Verifierat rapportutdrag.",
    documentExcerpt: excerpt,
    publishedAt,
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

  it("supports the parenthesized CET1 wording used in Nordic bank releases", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "Common equity Tier 1 (CET1) capital ratio was 17.4 per cent",
        "Return on equity was 14.6 per cent",
        "Cost/income ratio was 40.3 per cent",
      ].join("\n")),
    ]);

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.cet1Ratio.valuePct, 17.4);
    assert.equal(result.metrics.returnOnEquity.valuePct, 14.6);
    assert.equal(result.metrics.costIncomeRatio.valuePct, 40.3);
  });

  it("supports table rows where percent is declared before a single value", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "Common Equity Tier 1 capital ratio, % 17.4",
        "Return on equity, % 14.2",
        "Credit impairment ratio, % 0.06",
      ].join("\n")),
    ]);

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.cet1Ratio.valuePct, 17.4);
    assert.equal(result.metrics.returnOnEquity.valuePct, 14.2);
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.06);
  });

  it("combines source-bound bank metrics across verified current report and Fact Book evidence", () => {
    const current = reportEvidence(
      "CET1 ratio 17.2%\nReturn on equity 15.7%",
      "primary:seb-q2",
      "2026-07-15T06:30:00.000Z",
    );
    const factBook = reportEvidence(
      "Net ECL level, % 0.04\nCost/income ratio 40.0%",
      "primary:seb-q2-factbook",
      "2026-07-15T06:29:00.000Z",
    );

    const result = extractBankReportMetrics([factBook, current]);
    assert.equal(result.status, "evidence_ready");
    assert.equal(result.sourceId, "primary:seb-q2");
    assert.equal(result.metrics.cet1Ratio.sourceId, "primary:seb-q2");
    assert.equal(result.metrics.returnOnEquity.sourceId, "primary:seb-q2");
    assert.equal(result.metrics.creditLossRatio.valuePct, 0.04);
    assert.equal(result.metrics.creditLossRatio.sourceId, "primary:seb-q2-factbook");
    assert.equal(result.metrics.costIncomeRatio.sourceId, "primary:seb-q2-factbook");
  });

  it("does not bypass an ambiguous newer metric by falling back to an older clean value", () => {
    const current = reportEvidence(
      "CET1 ratio 17.2%\nReturn on equity 15.7%\nNet ECL level, % 0.04 0.03",
      "primary:seb-q2",
      "2026-07-15T06:30:00.000Z",
    );
    const older = reportEvidence(
      "Net ECL level, % 0.04",
      "primary:seb-q1",
      "2026-04-29T06:30:00.000Z",
    );

    const result = extractBankReportMetrics([older, current]);
    assert.equal(result.metrics.creditLossRatio.status, "ambiguous");
    assert.equal(result.metrics.creditLossRatio.sourceId, "primary:seb-q2");
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

  it("also refuses multi-period table rows with a shared unit prefix", () => {
    const result = extractBankReportMetrics([
      reportEvidence([
        "Common Equity Tier 1 capital ratio, % 17.4 17.8 19.7",
        "Return on equity, % 14.2 14.7 15.2",
        "Credit impairment ratio, % 0.06 0.07 -0.03",
      ].join("\n")),
    ]);

    assert.equal(result.metrics.cet1Ratio.status, "ambiguous");
    assert.equal(result.metrics.returnOnEquity.status, "ambiguous");
    assert.equal(result.metrics.creditLossRatio.status, "ambiguous");
    assert.equal(result.confirmedMetrics, 0);
    assert.equal(result.status, "insufficient");
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
