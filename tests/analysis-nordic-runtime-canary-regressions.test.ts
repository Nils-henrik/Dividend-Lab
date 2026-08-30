import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nordicCurrentReportIntentTerms } from "../lib/analysis/nordic-primary-sources";
import { fetchNordicPrimarySourceEvents } from "../lib/model-portfolios/engine/nordic-primary-sources";

describe("Nordic specialist runtime canary regressions", () => {
  it("uses the issuer name without the listed share series for Investor report discovery", () => {
    const terms = nordicCurrentReportIntentTerms({
      companyName: "Investor AB ser. B",
      symbol: "INVE-B",
      now: new Date("2026-08-30T17:40:00.000Z"),
    });

    assert.deepEqual(terms, [
      "INVE Q2",
      "Investor AB half-year",
      "interim report January-June 2026",
    ]);
    assert.equal(terms.some((term) => /ser\.?\s*B/i.test(term)), false);
  });

  it("retains a third trusted Nasdaq PDF attachment without fetching it", async () => {
    let calls = 0;
    const hits = await fetchNordicPrimarySourceEvents({
      companyName: "Skandinaviska Enskilda Banken AB",
      symbol: "SEB-A",
      exchange: "ST",
      now: new Date("2026-08-30T17:40:00.000Z"),
      fetchImpl: async () => {
        calls += 1;
        return Response.json({
          count: 1,
          results: {
            item: [
              {
                headline: "SEB's results for the second quarter 2026",
                company: "Skandinaviska Enskilda Banken AB",
                messageUrl: "https://view.news.eu.nasdaq.com/view?id=seb-q2-2026&lang=en&src=micro",
                releaseTime: "2026-07-15 06:30:00 +0000",
                market: "Main Market, Stockholm",
                cnsCategory: "Half Year financial report",
                attachment: [
                  {
                    mimetype: "application/pdf",
                    fileName: "SEB Q2 2026 Result Presentation.pdf",
                    attachmentUrl: "https://attachment.news.eu.nasdaq.com/presentation",
                  },
                  {
                    mimetype: "application/pdf",
                    fileName: "07158921.pdf",
                    attachmentUrl: "https://attachment.news.eu.nasdaq.com/report",
                  },
                  {
                    mimetype: "application/pdf",
                    fileName: "SEB Q2 2026 Fact Book.pdf",
                    attachmentUrl: "https://attachment.news.eu.nasdaq.com/fact-book",
                  },
                ],
              },
            ],
          },
        });
      },
    });

    assert.equal(calls >= 1, true);
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.attachments.length, 3);
    assert.equal(hits[0]?.attachments[2]?.fileName, "SEB Q2 2026 Fact Book.pdf");
  });
});
