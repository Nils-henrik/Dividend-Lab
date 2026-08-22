import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { extractBankReportMetrics } from "../lib/analysis/bank-analysis";
import { extractBankFundingContext } from "../lib/analysis/bank-funding";
import type { AnalysisEvidence } from "../lib/analysis/evidence";
import {
  isSebFactBookFileName,
  isSebIssuerName,
  projectSebFactBookCurrentPeriod,
} from "../lib/model-portfolios/engine/seb-fact-book";

const enrichmentSource = readFileSync(
  new URL("../lib/model-portfolios/engine/primary-source-enrichment.ts", import.meta.url),
  "utf8",
);
const documentSource = readFileSync(
  new URL("../lib/model-portfolios/engine/official-document.ts", import.meta.url),
  "utf8",
);

const FACT_BOOK_TABLE = [
  "Key figures - SEB Group, nine quarters",
  "Q2 Q3 Q4 Q1 Q2 Q3 Q4 Q1 Q2",
  "2024 2024 2024 2025 2025 2025 2025 2026 2026",
  "Return on equity, % 17.6 17.0 13.2 13.4 15.0 14.0 12.9 13.1 15.7",
  "Cost/income ratio 0.36 0.37 0.43 0.42 0.41 0.42 0.45 0.41 0.40",
  "Basic earnings per share, SEK 4.58 4.63 3.69 3.89 4.13 3.87 3.71 3.83 4.44",
  "Net ECL level, % 0.01 0.05 0.05 0.09 0.04 0.03 0.05 0.07 0.05",
  "Liquidity Coverage Ratio (LCR) 4), % 130 133 160 132 130 136 150 135 125",
  "Net Stable Funding Ratio (NSFR) 5), % 112 113 111 113 112 116 113 112 110",
  "Own funds requirement, Basel III",
].join("\n");

function projectedEvidence(): AnalysisEvidence {
  const projection = projectSebFactBookCurrentPeriod({
    text: FACT_BOOK_TABLE,
    reportPeriod: "Q2",
    reportYear: 2026,
  });
  assert.ok(projection);
  return {
    id: "evidence:seb-fact-book-q2-2026",
    sourceId: "nordic-primary:SEB-A:2026-07-15T06:30:00.000Z:0",
    kind: "official_report_excerpt",
    title: "SEB's results for the second quarter 2026",
    content: "Officiell Nasdaq CNS Fact Book med deterministiskt current-column-utdrag.",
    documentExcerpt: projection.excerpt,
    publishedAt: "2026-07-15T06:30:00.000Z",
    primary: true,
    documentRetrieved: true,
    reportPeriod: "Q2",
    reportYear: 2026,
    documentType: "half_year_report",
  };
}

describe("SEB Fact Book current-quarter projection", () => {
  it("accepts only the explicit final Q2 2026 column and normalizes the ratio scale", () => {
    const projection = projectSebFactBookCurrentPeriod({
      text: FACT_BOOK_TABLE,
      reportPeriod: "Q2",
      reportYear: 2026,
    });
    assert.ok(projection);
    assert.deepEqual(projection.values, {
      netEclLevelPct: 0.05,
      costIncomeRatioPct: 40,
      liquidityCoverageRatioPct: 125,
      netStableFundingRatioPct: 110,
    });
    assert.equal(
      projection.excerpt,
      [
        "Net ECL level 0.05%",
        "Cost/income ratio 40%",
        "Liquidity Coverage Ratio 125%",
        "Net Stable Funding Ratio 110%",
      ].join("\n"),
    );
  });

  it("accepts the same nine periods when a PDF text layer splits the header into exact quarter/year pairs", () => {
    const splitHeader = FACT_BOOK_TABLE.replace(
      [
        "Q2 Q3 Q4 Q1 Q2 Q3 Q4 Q1 Q2",
        "2024 2024 2024 2025 2025 2025 2025 2026 2026",
      ].join("\n"),
      [
        "Q2", "2024",
        "Q3", "2024",
        "Q4", "2024",
        "Q1", "2025",
        "Q2", "2025",
        "Q3", "2025",
        "Q4", "2025",
        "Q1", "2026",
        "Q2", "2026",
      ].join("\n"),
    );
    const projection = projectSebFactBookCurrentPeriod({
      text: splitHeader,
      reportPeriod: "Q2",
      reportYear: 2026,
    });
    assert.ok(projection);
    assert.equal(projection.values.netEclLevelPct, 0.05);
    assert.equal(projection.values.costIncomeRatioPct, 40);
    assert.equal(projection.values.liquidityCoverageRatioPct, 125);
    assert.equal(projection.values.netStableFundingRatioPct, 110);
  });

  it("accepts a required row whose exact label and nine values are split onto adjacent PDF text lines", () => {
    const splitRow = FACT_BOOK_TABLE.replace(
      "Net ECL level, % 0.01 0.05 0.05 0.09 0.04 0.03 0.05 0.07 0.05",
      "Net ECL level, %\n0.01 0.05 0.05 0.09 0.04 0.03 0.05 0.07 0.05",
    );
    const projection = projectSebFactBookCurrentPeriod({
      text: splitRow,
      reportPeriod: "Q2",
      reportYear: 2026,
    });
    assert.ok(projection);
    assert.equal(projection.values.netEclLevelPct, 0.05);
  });

  it("feeds the existing bank extractors with the Fact Book sourceId intact", () => {
    const evidence = projectedEvidence();
    const report = extractBankReportMetrics([evidence]);
    const funding = extractBankFundingContext([evidence]);

    assert.equal(report.metrics.creditLossRatio.valuePct, 0.05);
    assert.equal(report.metrics.creditLossRatio.sourceId, evidence.sourceId);
    assert.equal(report.metrics.costIncomeRatio.valuePct, 40);
    assert.equal(report.metrics.costIncomeRatio.sourceId, evidence.sourceId);
    assert.equal(funding.status, "evidence_ready");
    assert.equal(funding.metrics.liquidityCoverageRatio.valuePct, 125);
    assert.equal(funding.metrics.liquidityCoverageRatio.sourceId, evidence.sourceId);
    assert.equal(funding.metrics.netStableFundingRatio.valuePct, 110);
    assert.equal(funding.metrics.netStableFundingRatio.sourceId, evidence.sourceId);
  });

  it("fails closed when asked for a period that is present but is not the final current column", () => {
    assert.equal(
      projectSebFactBookCurrentPeriod({
        text: FACT_BOOK_TABLE,
        reportPeriod: "Q1",
        reportYear: 2026,
      }),
      null,
    );
  });

  it("fails closed when the nine-quarter header is not contiguous", () => {
    const broken = FACT_BOOK_TABLE.replace(
      "2024 2024 2024 2025 2025 2025 2025 2026 2026",
      "2024 2024 2024 2025 2025 2025 2026 2026 2026",
    );
    assert.equal(
      projectSebFactBookCurrentPeriod({
        text: broken,
        reportPeriod: "Q2",
        reportYear: 2026,
      }),
      null,
    );
  });

  it("fails closed when a required row does not expose exactly nine values", () => {
    const broken = FACT_BOOK_TABLE.replace(
      "130 133 160 132 130 136 150 135 125",
      "130 133 160 132 130 136 150 125",
    );
    assert.equal(
      projectSebFactBookCurrentPeriod({
        text: broken,
        reportPeriod: "Q2",
        reportYear: 2026,
      }),
      null,
    );
  });

  it("keeps the specialist attachment rule exact to SEB and dedicated Deep Research", () => {
    assert.equal(isSebIssuerName("Skandinaviska Enskilda Banken AB"), true);
    assert.equal(isSebIssuerName("Skandinaviska Enskilda Banken AB (publ)"), true);
    assert.equal(isSebIssuerName("SEB Investment Management AB"), false);
    assert.equal(isSebFactBookFileName("SEB Q2 2026 Fact Book.pdf"), true);
    assert.equal(isSebFactBookFileName("SEB Q2 2026 Result Presentation.pdf"), false);

    assert.match(
      enrichmentSource,
      /maxDocuments > OFFICIAL_DOCUMENT_BOUNDS\.maxDocumentsPerCompanyPass/,
    );
    assert.match(enrichmentSource, /isSebIssuerName\(input\.hit\.company\)/);
    assert.match(enrichmentSource, /isSebFactBookFileName\(item\.fileName\)/);
    assert.match(enrichmentSource, /return pdfs\[0\] \?\? null/);
    assert.match(enrichmentSource, /SEB_FACT_BOOK_FOCUS_ANCHOR/);
    assert.match(enrichmentSource, /focusAnchor:\s*selectedSebFactBook/);
    assert.match(enrichmentSource, /if \(projection\) analysisExcerpt = projection\.excerpt/);

    assert.match(documentSource, /maxPagesExtracted:\s*6/);
    assert.match(documentSource, /maxTextChars:\s*4_500/);
    assert.match(documentSource, /focusAnchor\?:\s*string/);
    assert.match(documentSource, /text:\s*text\.slice\(0, maxChars\)/);
  });
});
