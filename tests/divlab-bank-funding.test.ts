import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractBankFundingContext } from "../lib/analysis/bank-funding";
import type { AnalysisEvidence } from "../lib/analysis/evidence";

const SOURCE_ID = "bank-report:q2";

function report(
  excerpt: string,
  sourceId = SOURCE_ID,
  publishedAt = "2026-07-15T06:00:00.000Z",
): AnalysisEvidence {
  return {
    id: `evidence:${sourceId}`,
    sourceId,
    kind: "official_report_excerpt",
    title: "Bank funding report",
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

describe("DivLab bank funding v1", () => {
  it("accepts a clearly reported LCR as standardized liquidity context", () => {
    const result = extractBankFundingContext([
      report("Liquidity Coverage Ratio 145%"),
    ]);
    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.liquidityCoverageRatio.valuePct, 145);
    assert.equal(result.metrics.netStableFundingRatio.status, "not_found");
  });

  it("accepts NSFR and unit-first financial table format", () => {
    const result = extractBankFundingContext([
      report("Net Stable Funding Ratio, % 121.5"),
    ]);
    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.netStableFundingRatio.valuePct, 121.5);
  });

  it("combines regulatory liquidity metrics from separate verified report excerpts", () => {
    const current = report(
      "Lending growth 4.3%\nDeposit growth 5.1%",
      "primary:seb-q2",
      "2026-07-15T06:30:00.000Z",
    );
    const factBook = report(
      "Liquidity Coverage Ratio (LCR), % 145\nNet Stable Funding Ratio (NSFR), % 121.5",
      "primary:seb-q2-factbook",
      "2026-07-15T06:29:00.000Z",
    );

    const result = extractBankFundingContext([factBook, current]);
    assert.equal(result.status, "evidence_ready");
    assert.equal(result.sourceId, "primary:seb-q2");
    assert.equal(result.metrics.liquidityCoverageRatio.valuePct, 145);
    assert.equal(result.metrics.liquidityCoverageRatio.sourceId, "primary:seb-q2-factbook");
    assert.equal(result.metrics.netStableFundingRatio.valuePct, 121.5);
    assert.equal(result.metrics.netStableFundingRatio.sourceId, "primary:seb-q2-factbook");
    assert.equal(result.metrics.lendingGrowthReported.sourceId, "primary:seb-q2");
    assert.equal(result.metrics.depositGrowthReported.sourceId, "primary:seb-q2");
  });

  it("does not use an older clean liquidity row when the newer verified row is ambiguous", () => {
    const current = report(
      "LCR, % 145 151 160",
      "primary:seb-q2",
      "2026-07-15T06:30:00.000Z",
    );
    const older = report(
      "Liquidity Coverage Ratio 140%",
      "primary:seb-q1",
      "2026-04-29T06:30:00.000Z",
    );

    const result = extractBankFundingContext([older, current]);
    assert.equal(result.metrics.liquidityCoverageRatio.status, "ambiguous");
    assert.equal(result.metrics.liquidityCoverageRatio.sourceId, "primary:seb-q2");
  });

  it("accepts lending and deposit growth together as bounded funding context", () => {
    const result = extractBankFundingContext([
      report("Lending growth 4.3%\nDeposit growth 5.1%"),
    ]);
    assert.equal(result.status, "evidence_ready");
    assert.equal(result.metrics.lendingGrowthReported.valuePct, 4.3);
    assert.equal(result.metrics.depositGrowthReported.valuePct, 5.1);
  });

  it("does not pretend one isolated growth number is full funding evidence", () => {
    const result = extractBankFundingContext([
      report("Lending growth 4.3%"),
    ]);
    assert.equal(result.status, "partial");
    assert.equal(result.metrics.lendingGrowthReported.valuePct, 4.3);
    assert.equal(result.metrics.depositGrowthReported.valuePct, null);
  });

  it("marks multi-period liquidity table rows ambiguous", () => {
    const result = extractBankFundingContext([
      report("LCR, % 145 151 160\nNSFR, % 121 123 125"),
    ]);
    assert.equal(result.metrics.liquidityCoverageRatio.status, "ambiguous");
    assert.equal(result.metrics.netStableFundingRatio.status, "ambiguous");
    assert.equal(result.status, "insufficient");
  });

  it("filters implausible values and requires primary retrieved report text", () => {
    const implausible = extractBankFundingContext([
      report("Liquidity Coverage Ratio 5000%"),
    ]);
    assert.equal(implausible.metrics.liquidityCoverageRatio.status, "not_found");

    const nonPrimary = report("Liquidity Coverage Ratio 145%");
    nonPrimary.primary = false;
    assert.equal(extractBankFundingContext([nonPrimary]).status, "not_applicable");

    assert.equal(extractBankFundingContext([]).status, "not_applicable");
  });
});
