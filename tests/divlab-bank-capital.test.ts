import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import { buildBankCapitalContext } from "../lib/analysis/bank-capital";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const SOURCE_ID = "bank-report:q2";

function evidence(excerpt: string): AnalysisEvidence {
  return {
    id: "evidence:bank-capital",
    sourceId: SOURCE_ID,
    kind: "official_report_excerpt",
    title: "Bank capital report",
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

function context(excerpt: string) {
  const items = [evidence(excerpt)];
  return buildBankCapitalContext({
    evidence: items,
    reportMetrics: extractBankReportMetrics(items),
  });
}

describe("DivLab bank capital v1", () => {
  it("retains an explicitly reported capital buffer without inventing a requirement", () => {
    const result = context([
      "CET1 capital ratio 17.2%",
      "Return on equity 15.7%",
      "The bank reported a capital buffer of 250 basis points.",
    ].join("\n"));

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.actualCet1Pct, 17.2);
    assert.equal(result.regulatoryCet1Requirement.status, "not_found");
    assert.equal(result.reportedCapitalBuffer.status, "confirmed");
    assert.equal(result.reportedCapitalBuffer.valuePctPoints, 2.5);
    assert.equal(result.derivedHeadroomPctPoints, null);
  });

  it("derives CET1 headroom only from an explicit regulatory CET1 requirement", () => {
    const result = context([
      "CET1 capital ratio 17.9%",
      "Return on equity 15.8%",
      "Regulatory CET1 capital requirement was 15.6%.",
    ].join("\n"));

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.regulatoryCet1Requirement.valuePctPoints, 15.6);
    assert.equal(result.derivedHeadroomPctPoints, 2.3);
    assert.equal(result.reportedCapitalBuffer.status, "not_found");
  });

  it("supports issuer prose that states CET1 and the regulatory requirement on one line", () => {
    const result = context([
      "CET1 ratio 19.0%, while the regulatory requirement was 15.6%.",
      "Return on equity 18.9%",
    ].join("\n"));

    // The general CET1 metric parser deliberately sees two percentages after
    // the CET1 label and will not guess the current-period value. The capital
    // parser can still identify the explicitly labelled regulatory requirement.
    assert.equal(result.actualCet1Pct, null);
    assert.equal(result.regulatoryCet1Requirement.valuePctPoints, 15.6);
    assert.equal(result.derivedHeadroomPctPoints, null);
    assert.equal(result.status, "partial");
  });

  it("never treats a management CET1 target as the regulatory requirement", () => {
    const result = context([
      "CET1 capital ratio 17.4%",
      "Return on equity 14.6%",
      "The long-term CET1 target is above 16.6%.",
    ].join("\n"));

    assert.equal(result.actualCet1Pct, 17.4);
    assert.equal(result.regulatoryCet1Requirement.status, "not_found");
    assert.equal(result.reportedCapitalBuffer.status, "not_found");
    assert.equal(result.derivedHeadroomPctPoints, null);
    assert.equal(result.status, "partial");
  });

  it("fails closed when more than one distinct regulatory requirement is present", () => {
    const result = context([
      "CET1 capital ratio 18.0%",
      "Return on equity 14.0%",
      "Regulatory CET1 requirement 11.5%",
      "Regulatory CET1 requirement 12.1%",
    ].join("\n"));

    assert.equal(result.regulatoryCet1Requirement.status, "ambiguous");
    assert.equal(result.regulatoryCet1Requirement.valuePctPoints, null);
    assert.equal(result.derivedHeadroomPctPoints, null);
    assert.equal(result.status, "partial");
  });

  it("requires a clean primary report", () => {
    const item = evidence("CET1 capital ratio 18.0%\nRegulatory CET1 requirement 12.0%");
    item.primary = false;
    const result = buildBankCapitalContext({
      evidence: [item],
      reportMetrics: extractBankReportMetrics([item]),
    });

    assert.equal(result.status, "not_applicable");
    assert.equal(result.actualCet1Pct, null);
    assert.equal(result.derivedHeadroomPctPoints, null);
  });
});
