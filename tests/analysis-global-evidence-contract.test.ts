import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGlobalEvidenceBundle,
  extractBoundedSecFilingText,
  GLOBAL_EVIDENCE_BOUNDS,
  isAllowedSecTextContentType,
  validateSecArchiveUrl,
  type SecFilingDocument,
} from "../lib/analysis/global-evidence-contract";
import type { GlobalPrimarySource } from "../lib/analysis/global-primary-source-contract";

const NOW = "2026-08-21T20:00:00.000Z";
const LONG_TEXT = "Microsoft generated operating income and cash flow from continuing operations during the reporting period. ".repeat(20);

function sources(): GlobalPrimarySource[] {
  return [
    {
      id: "sec:789019:0000950170-25-070001",
      kind: "regulatory_annual_filing",
      publisher: "U.S. Securities and Exchange Commission",
      url: "https://www.sec.gov/Archives/edgar/data/789019/000095017025070001/msft-20250630.htm",
      publishedAt: "2025-07-30T00:00:00.000Z",
      verifiedAt: NOW,
      primary: true,
      form: "10-K",
    },
    {
      id: "sec:789019:0000950170-26-100001",
      kind: "regulatory_interim_filing",
      publisher: "U.S. Securities and Exchange Commission",
      url: "https://www.sec.gov/Archives/edgar/data/789019/000095017026100001/msft-20260630.htm",
      publishedAt: "2026-07-31T00:00:00.000Z",
      verifiedAt: NOW,
      primary: true,
      form: "10-Q",
    },
  ];
}

function documents(): SecFilingDocument[] {
  return sources().map((source) => ({
    sourceId: source.id,
    finalUrl: source.url,
    contentType: "text/html",
    bytes: 120_000,
    text: LONG_TEXT.slice(0, GLOBAL_EVIDENCE_BOUNDS.maxTextChars),
    truncated: false,
  }));
}

describe("Global Evidence Extraction v1 contract", () => {
  it("accepts only canonical SEC archive HTTPS URLs", () => {
    assert.equal(validateSecArchiveUrl(sources()[0]!.url).ok, true);
    assert.equal(validateSecArchiveUrl("http://www.sec.gov/Archives/edgar/data/1/a.htm").ok, false);
    assert.equal(validateSecArchiveUrl("https://sec.gov/Archives/edgar/data/1/a.htm").ok, false);
    assert.equal(validateSecArchiveUrl("https://www.sec.gov/ixviewer/doc/action?doc=x").ok, false);
    assert.equal(validateSecArchiveUrl("https://evil.example/Archives/edgar/data/1/a.htm").ok, false);
    assert.equal(validateSecArchiveUrl("https://user:pass@www.sec.gov/Archives/edgar/data/1/a.htm").ok, false);
  });

  it("allowlists SEC text-like filing content types only", () => {
    assert.equal(isAllowedSecTextContentType("text/html; charset=utf-8"), true);
    assert.equal(isAllowedSecTextContentType("application/xhtml+xml"), true);
    assert.equal(isAllowedSecTextContentType("text/plain"), true);
    assert.equal(isAllowedSecTextContentType("application/pdf"), false);
    assert.equal(isAllowedSecTextContentType("application/octet-stream"), false);
    assert.equal(isAllowedSecTextContentType(null), false);
  });

  it("extracts bounded plain text without executing or retaining active markup", () => {
    const result = extractBoundedSecFilingText({
      document: `
        <html><head><style>.secret{display:none}</style><script>steal()</script></head>
        <body>
          <h1>Quarterly Report &amp; Results</h1>
          <ix:hidden>Hidden XBRL instruction must disappear</ix:hidden>
          <p>Revenue &gt; prior year.</p>
          <div>${LONG_TEXT}</div>
        </body></html>
      `,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.text, /Quarterly Report & Results/);
    assert.match(result.text, /Revenue > prior year/);
    assert.doesNotMatch(result.text, /steal\(\)/);
    assert.doesNotMatch(result.text, /Hidden XBRL instruction/);
    assert.doesNotMatch(result.text, /<h1>|<p>|<div>/);
    assert.ok(result.text.length >= GLOBAL_EVIDENCE_BOUNDS.minMeaningfulTextChars);
  });

  it("hard-truncates extracted text at the configured bound", () => {
    const result = extractBoundedSecFilingText({
      document: `<p>${"A".repeat(GLOBAL_EVIDENCE_BOUNDS.maxTextChars + 500)}</p>`,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.text.length, GLOBAL_EVIDENCE_BOUNDS.maxTextChars);
    assert.equal(result.truncated, true);
  });

  it("builds sourceId-linked AnalysisSource + AnalysisEvidence only after both filings were retrieved", () => {
    const bundle = buildGlobalEvidenceBundle({
      companyName: "MICROSOFT CORP",
      sources: sources(),
      documents: documents(),
    });

    assert.equal(bundle.qualityGate.ready, true);
    assert.equal(bundle.qualityGate.score, 100);
    assert.equal(bundle.analysisSources.length, 2);
    assert.deepEqual(bundle.analysisSources.map((source) => source.kind).sort(), ["annual_report", "quarterly_report"]);
    assert.equal(bundle.evidence.length, 2);
    assert.equal(bundle.evidence.every((item) => item.kind === "official_report_excerpt"), true);
    assert.equal(bundle.evidence.every((item) => item.primary && item.documentRetrieved), true);
    assert.equal(bundle.evidence.every((item) => bundle.analysisSources.some((source) => source.id === item.sourceId)), true);
    assert.equal(bundle.evidence.every((item) => (item.documentExcerpt?.length ?? 0) >= 800), true);
  });

  it("fails closed when one filing is missing even if the remaining document is valid", () => {
    const bundle = buildGlobalEvidenceBundle({
      companyName: "MICROSOFT CORP",
      sources: sources(),
      documents: documents().slice(0, 1),
    });

    assert.equal(bundle.qualityGate.ready, false);
    assert.equal(bundle.qualityGate.checks.interimDocumentCoverage, false);
    assert.match(bundle.qualityGate.blockers.join(" "), /10-Q/i);
  });

  it("fails closed when extracted SEC text is too thin for evidence credit", () => {
    const thin = documents().map((document) => ({ ...document, text: "Short filing text." }));
    const bundle = buildGlobalEvidenceBundle({
      companyName: "MICROSOFT CORP",
      sources: sources(),
      documents: thin,
    });

    assert.equal(bundle.qualityGate.ready, false);
    assert.equal(bundle.qualityGate.checks.boundedDocumentText, false);
  });
});
