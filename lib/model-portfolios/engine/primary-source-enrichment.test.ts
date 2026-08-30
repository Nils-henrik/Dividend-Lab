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

function sebHit(): NordicPrimarySourceHit {
  return baseHit({
    title: "SEB's results for the second quarter 2026",
    company: "Skandinaviska Enskilda Banken AB",
    publishedAt: "2026-07-15T06:30:00.000Z",
    attachments: [
      {
        url: "https://attachment.news.eu.nasdaq.com/seb-result-presentation",
        mimeType: "application/pdf",
        fileName: "SEB Q2 2026 Result Presentation.pdf",
      },
      {
        url: "https://attachment.news.eu.nasdaq.com/seb-fact-book",
        mimeType: "application/pdf",
        fileName: "SEB Q2 2026 Fact Book.pdf",
      },
    ],
  });
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

  it("prefers SEB's already-trusted Fact Book only for the dedicated multi-document Deep Research path", async () => {
    const ordinaryUrls: string[] = [];
    await enrichNordicPrimarySourceHits({
      hits: [sebHit()],
      maxDocuments: 1,
      fetchImpl: async (input) => {
        ordinaryUrls.push(input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url);
        return new Response("missing", { status: 404 });
      },
    });
    assert.deepEqual(ordinaryUrls, [
      "https://attachment.news.eu.nasdaq.com/seb-result-presentation",
    ]);

    const deepResearchUrls: string[] = [];
    await enrichNordicPrimarySourceHits({
      hits: [sebHit()],
      maxDocuments: 2,
      fetchImpl: async (input) => {
        deepResearchUrls.push(input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url);
        return new Response("missing", { status: 404 });
      },
    });
    assert.deepEqual(deepResearchUrls, [
      "https://attachment.news.eu.nasdaq.com/seb-fact-book",
    ]);
  });

  it("consumes the document attempt budget before fetch, even when the first fetch fails", async () => {
    let fetchCalls = 0;
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [
        baseHit({ url: "https://view.news.eu.nasdaq.com/view?id=first" }),
        baseHit({
          url: "https://view.news.eu.nasdaq.com/view?id=second",
          attachments: [
            {
              url: "https://attachment.news.eu.nasdaq.com/second-doc",
              mimeType: "application/pdf",
              fileName: "q2-second.pdf",
            },
          ],
        }),
      ],
      maxDocuments: 1,
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response("missing", { status: 404 });
      },
    });

    assert.equal(fetchCalls, 1);
    assert.equal(enriched[0]?.kind, "company_release");
    assert.equal(enriched[0]?.documentRetrieved, false);
    assert.match(enriched[0]?.summary ?? "", /kunde inte hämtas\/parsas säkert/i);
    assert.match(enriched[0]?.summary ?? "", /http_error/i);

    assert.equal(enriched[1]?.kind, "company_release");
    assert.equal(enriched[1]?.documentRetrieved, false);
    assert.match(enriched[1]?.summary ?? "", /hoppades över/i);
    assert.match(enriched[1]?.summary ?? "", /dokumentförsöksbudgetet redan var förbrukat/i);
    assert.doesNotMatch(enriched[1]?.summary ?? "", /kunde inte hämtas\/parsas/i);
    assert.doesNotMatch(enriched[1]?.summary ?? "", /http_error/i);
  });

  it("still allows only one document attempt when the first fetch succeeds", async () => {
    const pdf = buildFixturePdf("Investor AB Interim report January-June 2026 Adjusted NAV SEK 100");
    let fetchCalls = 0;
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [
        baseHit({ url: "https://view.news.eu.nasdaq.com/view?id=first" }),
        baseHit({
          url: "https://view.news.eu.nasdaq.com/view?id=second",
          attachments: [
            {
              url: "https://attachment.news.eu.nasdaq.com/second-doc",
              mimeType: "application/pdf",
              fileName: "q2-second.pdf",
            },
          ],
        }),
      ],
      maxDocuments: 1,
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response(Buffer.from(pdf), {
          status: 200,
          headers: { "content-type": "application/pdf" },
        });
      },
    });

    assert.equal(fetchCalls, 1);
    assert.equal(enriched[0]?.kind, "company_report");
    assert.equal(enriched[0]?.documentRetrieved, true);
    assert.match(enriched[0]?.summary ?? "", /Adjusted NAV SEK 100/i);

    assert.equal(enriched[1]?.kind, "company_release");
    assert.equal(enriched[1]?.documentRetrieved, false);
    assert.match(enriched[1]?.summary ?? "", /hoppades över/i);
    assert.match(enriched[1]?.summary ?? "", /dokumentförsöksbudgetet redan var förbrukat/i);
    assert.doesNotMatch(enriched[1]?.summary ?? "", /kunde inte hämtas\/parsas/i);
  });

  it("makes zero fetch calls when maxDocuments is 0 and describes the attachment as skipped", async () => {
    let fetchCalls = 0;
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [baseHit()],
      maxDocuments: 0,
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response("should-not-run", { status: 500 });
      },
    });

    assert.equal(fetchCalls, 0);
    assert.equal(enriched[0]?.kind, "company_release");
    assert.equal(enriched[0]?.documentRetrieved, false);
    assert.match(enriched[0]?.summary ?? "", /hoppades över/i);
    assert.match(enriched[0]?.summary ?? "", /dokumentförsöksbudgetet redan var förbrukat/i);
    assert.doesNotMatch(enriched[0]?.summary ?? "", /kunde inte hämtas\/parsas/i);
    assert.doesNotMatch(enriched[0]?.summary ?? "", /http_error|fetch_failed/i);
  });

  it("describes a hit with no report attachment as unread, not skipped or failed", async () => {
    let fetchCalls = 0;
    const enriched = await enrichNordicPrimarySourceHits({
      hits: [baseHit({ attachments: [] })],
      maxDocuments: 1,
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response("should-not-run", { status: 500 });
      },
    });

    assert.equal(fetchCalls, 0);
    assert.equal(enriched[0]?.kind, "company_release");
    assert.equal(enriched[0]?.documentRetrieved, false);
    assert.match(enriched[0]?.summary ?? "", /Ingen rapportbilaga lästes/i);
    assert.doesNotMatch(enriched[0]?.summary ?? "", /hoppades över/i);
    assert.doesNotMatch(enriched[0]?.summary ?? "", /kunde inte hämtas\/parsas/i);
  });
});
