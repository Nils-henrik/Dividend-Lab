import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  companyNamesLikelyMatch,
  fetchNordicPrimarySourceEvents,
  nordicDisclosureCompanyAliases,
} from "./nordic-primary-sources";

describe("Nordic primary-source event enrichment", () => {
  it("builds useful company aliases without inventing tickers", () => {
    const aliases = nordicDisclosureCompanyAliases("Atlas Copco AB ser. A");
    assert.ok(aliases.includes("Atlas Copco AB ser. A"));
    assert.ok(aliases.some((item) => item.includes("Atlas Copco")));
    assert.equal(companyNamesLikelyMatch("Atlas Copco AB", "Atlas Copco AB ser. A"), true);
    assert.equal(companyNamesLikelyMatch("Attendo AB", "Atlas Copco AB"), false);
  });

  it("attributes Nasdaq CNS disclosures to the destination publisher and degrades on miss", async () => {
    let requestedCompany = "";
    const hits = await fetchNordicPrimarySourceEvents({
      companyName: "Investor AB ser. B",
      symbol: "INVE-B",
      exchange: "ST",
      now: new Date("2026-08-11T07:20:00.000Z"),
      fetchImpl: async (input) => {
        const url = new URL(String(input));
        requestedCompany = url.searchParams.get("company") ?? "";
        if (requestedCompany === "Investor AB" || requestedCompany.startsWith("Investor")) {
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
                },
              ],
            },
          });
        }
        return Response.json({ count: 0, results: { item: [] } });
      },
    });

    assert.ok(requestedCompany.length > 0);
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.sourceKind, "company_primary");
    assert.equal(hits[0]?.publisher, "view.news.eu.nasdaq.com");
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
});
