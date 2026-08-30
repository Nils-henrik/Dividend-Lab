import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import { buildBankCapitalContext } from "../lib/analysis/bank-capital";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const SOURCE_ID = "bank-report:q2";

function evidence(
  excerpt: string,
  options: { sourceId?: string; publishedAt?: string } = {},
): AnalysisEvidence {
  const sourceId = options.sourceId ?? SOURCE_ID;
  return {
    id: `evidence:${sourceId}`,
    sourceId,
    kind: "official_report_excerpt",
    title: "Bank capital report",
    content: "Verifierat rapportutdrag.",
    documentExcerpt: excerpt,
    publishedAt: options.publishedAt ?? "2026-07-15T06:00:00.000Z",
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

    assert.equal(result.actualCet1Pct, 19);
    assert.equal(result.regulatoryCet1Requirement.valuePctPoints, 15.6);
    assert.equal(result.derivedHeadroomPctPoints, 3.4);
    assert.equal(result.status, "evidence_ready");
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

  it("finds a source-bound capital buffer in the release when a newer Fact Book has no capital reference", () => {
    const factBook = evidence(
      [
        "Net ECL level 0.05%",
        "Cost/income ratio 40%",
        "Liquidity Coverage Ratio 125%",
        "Net Stable Funding Ratio 110%",
      ].join("\n"),
      {
        sourceId: "bank-fact-book:q2",
        publishedAt: "2026-07-15T06:01:00.000Z",
      },
    );
    const release = evidence(
      [
        "CET1 capital ratio 17.2%",
        "Return on equity 15.7%",
        "The bank reported a capital buffer of 250 basis points.",
      ].join("\n"),
      {
        sourceId: "bank-release:q2",
        publishedAt: "2026-07-15T06:00:00.000Z",
      },
    );
    const items = [factBook, release];
    const result = buildBankCapitalContext({
      evidence: items,
      reportMetrics: extractBankReportMetrics(items),
    });

    assert.equal(result.status, "evidence_ready");
    assert.equal(result.actualCet1Pct, 17.2);
    assert.equal(result.reportedCapitalBuffer.status, "confirmed");
    assert.equal(result.reportedCapitalBuffer.valuePctPoints, 2.5);
    assert.equal(result.reportedCapitalBuffer.sourceId, release.sourceId);
    assert.equal(result.sourceId, factBook.sourceId);
  });

  it("does not fall back to an older capital requirement when newer verified evidence is ambiguous", () => {
    const newer = evidence(
      [
        "CET1 capital ratio 18.0%",
        "Return on equity 14.0%",
        "Regulatory CET1 requirement 11.5%",
        "Regulatory CET1 requirement 12.1%",
      ].join("\n"),
      {
        sourceId: "bank-release:newer",
        publishedAt: "2026-07-15T06:01:00.000Z",
      },
    );
    const older = evidence(
      "Regulatory CET1 requirement 10.9%",
      {
        sourceId: "bank-release:older",
        publishedAt: "2026-07-14T06:00:00.000Z",
      },
    );
    const items = [older, newer];
    const result = buildBankCapitalContext({
      evidence: items,
      reportMetrics: extractBankReportMetrics(items),
    });

    assert.equal(result.regulatoryCet1Requirement.status, "ambiguous");
    assert.equal(result.regulatoryCet1Requirement.valuePctPoints, null);
    assert.equal(result.regulatoryCet1Requirement.sourceId, newer.sourceId);
    assert.equal(result.derivedHeadroomPctPoints, null);
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
