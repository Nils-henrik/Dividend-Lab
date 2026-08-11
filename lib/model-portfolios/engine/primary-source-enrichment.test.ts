import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enrichNordicPrimarySourceHits } from "./primary-source-enrichment";
import type { NordicPrimarySourceHit } from "./nordic-primary-sources";

function buildFixturePdf(text: string): Uint8Array {
  const stream = `BT /F1 12 Tf 50 700 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objs: string[] = [];
  objs[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objs[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  objs[3] =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  objs[4] =
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`;
  objs[5] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += objs[i]!;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf));
}

function baseHit(overrides: Partial<NordicPrimarySourceHit> = {}): NordicPrimarySourceHit {
  return {
    title: "Interim report January-June 2026",
    snippet: "Officiellt börsmeddelande",
    url: "https://view.news.eu.nasdaq.com/view?id=abc&lang=en&src=listed",
    publisher: "view.news.eu.nasdaq.com",
    company: "Investor AB",
    sourceKind: "company_primary",
    publishedAt: "2026-07-16T06:15:37.000Z",
    fetchedAt: "2026-08-11T07:20:00.000Z",
    category: "Half Year financial report",
    market: "Main Market, Stockholm",
    attachments: [
      {
        url: "https://attachment.news.eu.nasdaq.com/report-doc",
        mimeType: "application/pdf",
        fileName: "q2.pdf",
      },
    ],
    ...overrides,
  };
}

describe("primary source enrichment", () => {
  it("classifies a successfully retrieved official report PDF as company_report", async () => {
    const pdf = buildFixturePdf("Investor AB Interim report January-June 2026 Adjusted NAV SEK 100");
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [baseHit()],
      fetchImpl: async () =>
        new Response(Buffer.from(pdf), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
    });
    assert.equal(enriched.length, 1);
    assert.equal(enriched[0]?.kind, "company_report");
    assert.equal(enriched[0]?.documentRetrieved, true);
    assert.equal(enriched[0]?.reportPeriod, "H1");
    assert.equal(enriched[0]?.reportYear, 2026);
    assert.equal(enriched[0]?.sourceType, "official_company_report");
    assert.equal(enriched[0]?.evidenceKind, "company_report");
    assert.match(enriched[0]?.summary ?? "", /Adjusted NAV SEK 100/i);
    assert.match(enriched[0]?.summary ?? "", /Externt evidensmaterial/i);
  });

  it("does not claim company_report when the document is unavailable", async () => {
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [baseHit()],
      fetchImpl: async () => new Response("missing", { status: 404 }),
    });
    assert.equal(enriched[0]?.kind, "company_release");
    assert.equal(enriched[0]?.documentRetrieved, false);
    assert.match(enriched[0]?.summary ?? "", /ingen rapporttext har lästs/i);
    assert.doesNotMatch(enriched[0]?.summary ?? "", /Adjusted NAV/i);
  });

  it("keeps ordinary releases as company_release even with an attachment", async () => {
    const pdf = buildFixturePdf("Invitation to webcast tomorrow");
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [
        baseHit({
          title: "Invitation to Investor's Q2 2026 webcast",
          category: "Investor News",
        }),
      ],
      fetchImpl: async () =>
        new Response(Buffer.from(pdf), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        }),
    });
    // Title mentions Q2 but category/document are not a report document body claim
    // when looksLikeReportDocument is false for invitation/news.
    assert.equal(enriched[0]?.kind, "company_release");
    assert.equal(enriched[0]?.reportPeriod, "Q2");
    assert.equal(enriched[0]?.reportYear, 2026);
  });
});
