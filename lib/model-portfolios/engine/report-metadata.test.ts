import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPrimaryEvidenceKind,
  extractReportPeriod,
  extractReportYear,
  parseReportMetadata,
} from "./report-metadata";

describe("report metadata parsing", () => {
  it("extracts Q1/Q2/H1/H2/FY only when explicit", () => {
    assert.equal(extractReportPeriod("Investor Q2 report 2026"), "Q2");
    assert.equal(extractReportPeriod("Delårsrapport Q1 2025"), "Q1");
    assert.equal(extractReportPeriod("Investor H1 halvårsrapport"), "H1");
    assert.equal(extractReportPeriod("Interim report January-June 2026"), "H1");
    assert.equal(extractReportPeriod("Half-year report July-December 2026"), "H2");
    assert.equal(extractReportPeriod("Årsredovisning 2025"), "FY");
    assert.equal(extractReportPeriod("Bokslutskommuniké 2025"), "FY");
    assert.equal(extractReportPeriod("Investor pressmeddelande"), null);
    assert.equal(extractReportPeriod("Half year financial report"), null);
  });

  it("extracts year only when unambiguous", () => {
    assert.equal(extractReportYear("Interim report January-June 2026"), 2026);
    assert.equal(extractReportYear("Q2 2026 rapport"), 2026);
    assert.equal(extractReportYear("Comparison 2024 vs 2025 report"), null);
    assert.equal(extractReportYear("No year here"), null);
  });

  it("marks report-like CNS categories without inventing a read report", () => {
    const parsed = parseReportMetadata({
      title: "Interim report January-June 2026",
      category: "Half Year financial report",
      fileName: "07169373.pdf",
    });
    assert.equal(parsed.looksLikeReportDocument, true);
    assert.equal(parsed.reportPeriod, "H1");
    assert.equal(parsed.reportYear, 2026);
    assert.equal(parsed.documentType, "half_year_report");

    assert.equal(
      classifyPrimaryEvidenceKind({
        title: parsed.documentType,
        category: "Half Year financial report",
        documentRetrieved: false,
        looksLikeReportDocument: true,
      }),
      "company_release",
    );
    assert.equal(
      classifyPrimaryEvidenceKind({
        title: "Interim report January-June 2026",
        category: "Half Year financial report",
        documentRetrieved: true,
        looksLikeReportDocument: true,
      }),
      "company_report",
    );
  });
});
