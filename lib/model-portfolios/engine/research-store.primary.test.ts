import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  persistGoogleResearchHit,
  persistPrimarySourceResearchHit,
} from "./research-store";

type InsertedRow = Record<string, unknown>;

function mockInsertClient(rows: InsertedRow[]) {
  return {
    from() {
      return {
        insert: async (payload: InsertedRow) => {
          rows.push(payload);
          return { data: null, error: null };
        },
      };
    },
  };
}

describe("primary vs google research persistence", () => {
  it("persists official primary evidence with real publisher and verified metadata", async () => {
    const rows: InsertedRow[] = [];
    await persistPrimarySourceResearchHit({
      supabase: mockInsertClient(rows) as never,
      symbol: "INVE-B",
      exchange: "ST",
      name: "Investor AB ser. B",
      kind: "company_report",
      publisher: "view.news.eu.nasdaq.com",
      sourceUrl: "https://view.news.eu.nasdaq.com/view?id=abc&lang=en&src=listed",
      publishedAt: "2026-07-16T06:15:37.000Z",
      verifiedAt: "2026-08-11T07:20:00.000Z",
      title: "Interim report January-June 2026",
      summary: "Officiell bolagsrapport (H1 2026) från Investor AB. Utdrag: Adjusted NAV...",
      metadata: {
        source_type: "official_company_report",
        document_retrieved: true,
        official_source: "nasdaq_nordic_cns",
        report_period: "H1",
        report_year: 2026,
        document_type: "half_year_report",
        document_url: "https://attachment.news.eu.nasdaq.com/report-doc",
        cns_category: "Half Year financial report",
        source_urls: [
          "https://view.news.eu.nasdaq.com/view?id=abc&lang=en&src=listed",
          "https://attachment.news.eu.nasdaq.com/report-doc",
        ],
      },
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.kind, "company_report");
    assert.equal(rows[0]?.publisher, "view.news.eu.nasdaq.com");
    assert.notEqual(rows[0]?.publisher, "Google Custom Search");
    const metadata = rows[0]?.metadata as Record<string, unknown>;
    assert.equal(metadata.research_kind, "primary_source_disclosure");
    assert.equal(metadata.primary_source, "company");
    assert.equal(metadata.verification_state, "verified");
    assert.equal(metadata.report_period, "H1");
    assert.equal(metadata.report_year, 2026);
    assert.equal(metadata.document_retrieved, true);
    assert.equal(metadata.source_type, "official_company_report");
  });

  it("keeps Google discovery unverified news attributed to Google Custom Search", async () => {
    const rows: InsertedRow[] = [];
    await persistGoogleResearchHit({
      supabase: mockInsertClient(rows) as never,
      symbol: "INVE-B",
      exchange: "ST",
      name: "Investor AB ser. B",
      title: "Someone mentioned Investor Q2 report",
      snippet: "Blog snippet about a report",
      url: "https://example.com/blog",
      fetchedAt: "2026-08-11T07:20:00.000Z",
    });
    assert.equal(rows[0]?.kind, "news");
    assert.equal(rows[0]?.publisher, "Google Custom Search");
    const metadata = rows[0]?.metadata as Record<string, unknown>;
    assert.equal(metadata.research_kind, "google_discovery");
    assert.equal(metadata.primary_source, "google");
    assert.equal(metadata.verification_state, "unverified");
  });
});
