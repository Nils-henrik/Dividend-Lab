import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  companyNamesLikelyMatch,
  fetchNordicPrimarySourceEvents,
  nordicDisclosureCompanyAliases,
  nordicDisclosureSearchTerms,
} from "./nordic-primary-sources";

describe("Nordic primary-source event enrichment", () => {
  it("builds useful company aliases without inventing tickers", () => {
    const aliases = nordicDisclosureCompanyAliases("Atlas Copco AB ser. A");
    assert.ok(aliases.includes("Atlas Copco AB ser. A"));
    assert.ok(aliases.some((item) => item.includes("Atlas Copco")));
    assert.equal(companyNamesLikelyMatch("Atlas Copco AB", "Atlas Copco AB ser. A"), true);
    assert.equal(companyNamesLikelyMatch("Attendo AB", "Atlas Copco AB"), false);
  });

  it("replaces ordinary aliases with report-focused terms without exceeding five CNS searches", () => {
    const ordinary = nordicDisclosureSearchTerms({
      companyName: "Modern Times Group MTG B",
      symbol: "MTG-B",
    });
    const deepResearch = nordicDisclosureSearchTerms({
      companyName: "Modern Times Group MTG B",
      symbol: "MTG-B",
      preferFinancialReports: true,
    });

    assert.deepEqual(ordinary, nordicDisclosureCompanyAliases("Modern Times Group MTG B"));
    assert.ok(deepResearch.includes("MTG report"));
    assert.ok(deepResearch.some((term) => /modern times.*report/i.test(term)));
    assert.ok(deepResearch.length <= 5);
  });

  it("queries Nasdaq CNS through bounded freetext discovery and attributes the destination publisher", async () => {
    let requestedFreeText = "";
    let requestedCompany: string | null = null;
    let requestedLimit: string | null = null;
    const hits = await fetchNordicPrimarySourceEvents({
      companyName: "Investor AB ser. B",
      symbol: "INVE-B",
      exchange: "ST",
      now: new Date("2026-08-11T07:20:00.000Z"),
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        requestedFreeText = url.searchParams.get("freeText") ?? "";
        requestedCompany = url.searchParams.get("company");
        requestedLimit = url.searchParams.get("limit");
        if (requestedFreeText === "Investor AB" || requestedFreeText.startsWith("Investor")) {
          return Response.json({
            count: 1,
            results: {
              item: [
                {
                  headline: "Interim report January-June 2026",
                  company: "Investor AB",
                  messageUrl:
                    "https://view.news.eu.nasdaq.com/view?id=bc5cf3c904de001f8438f22fda2fa1b66&lang=en&src=listed",
                  releaseTime: "2026-07-16 06:15:37 +0000",
                  market: "Main Market, Stockholm",
                  cnsCategory: "Half Year financial report",
                  attachment: [
                    {
                      mimetype: "application/pdf",
                      fileName: "07169373.pdf",
                      attachmentUrl:
                        "https://attachment.news.eu.nasdaq.com/a9787a85fa3ab61bd444ea10dd512a474",
                    },
                  ],
                },
              ],
            },
          });
        }
        return Response.json({ count: 0, results: { item: [] } });
      },
    });

    assert.ok(requestedFreeText.length > 0);
    assert.equal(requestedCompany, "");
    assert.equal(requestedLimit, "5");
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.sourceKind, "company_primary");
    assert.equal(hits[0]?.publisher, "view.news.eu.nasdaq.com");
    assert.equal(hits[0]?.category, "Half Year financial report");
    assert.equal(hits[0]?.attachments.length, 1);
    assert.equal(
      hits[0]?.attachments[0]?.url,
      "https://attachment.news.eu.nasdaq.com/a9787a85fa3ab61bd444ea10dd512a474",
    );
    assert.match(hits[0]?.snippet ?? "", /Primärkälla/i);
    assert.doesNotMatch(hits[0]?.snippet ?? "", /\d+(\.\d+)?%/);

    const empty = await fetchNordicPrimarySourceEvents({
      companyName: "Unknown Nordic Co AB",
      symbol: "ZZZZ",
      exchange: "ST",
      fetchImpl: async () => Response.json({ count: 0, results: { item: [] } }),
    });
    assert.deepEqual(empty, []);
  });

  it("ignores mismatched CNS issuers instead of accepting free-text noise", async () => {
    const hits = await fetchNordicPrimarySourceEvents({
      companyName: "Atlas Copco AB ser. A",
      symbol: "ATCO-A",
      exchange: "ST",
      fetchImpl: async () =>
        Response.json({
          count: 1,
          results: {
            item: [
              {
                headline: "Unrelated issuer news",
                company: "Attendo AB",
                messageUrl: "https://view.news.eu.nasdaq.com/view?id=noise&lang=en&src=listed",
                releaseTime: "2026-08-11 06:00:00 +0000",
                market: "Main Market, Stockholm",
                cnsCategory: "Investor News",
              },
            ],
          },
        }),
    });
    assert.deepEqual(hits, []);
  });

  it("requests CNS attachments and ignores non-Nasdaq attachment hosts", async () => {
    let showAttachments: string | null = null;
    const hits = await fetchNordicPrimarySourceEvents({
      companyName: "Investor AB",
      symbol: "INVE-B",
      exchange: "ST",
      now: new Date("2026-08-11T07:20:00.000Z"),
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        showAttachments = url.searchParams.get("showAttachments");
        return Response.json({
          count: 1,
          results: {
            item: [
              {
                headline: "Press release",
                company: "Investor AB",
                messageUrl: "https://view.news.eu.nasdaq.com/view?id=safe&lang=en&src=listed",
                releaseTime: "2026-08-11 06:00:00 +0000",
                market: "Main Market, Stockholm",
                cnsCategory: "Investor News",
                attachment: [
                  {
                    mimetype: "application/pdf",
                    fileName: "evil.pdf",
                    attachmentUrl: "https://evil.example/report.pdf",
                  },
                  {
                    mimetype: "application/pdf",
                    fileName: "ok.pdf",
                    attachmentUrl: "https://attachment.news.eu.nasdaq.com/ok-doc",
                  },
                ],
              },
            ],
          },
        });
      },
    });
    assert.equal(showAttachments, "true");
    assert.equal(hits[0]?.attachments.length, 1);
    assert.equal(hits[0]?.attachments[0]?.url, "https://attachment.news.eu.nasdaq.com/ok-doc");
  });
});
