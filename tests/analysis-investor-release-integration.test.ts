import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildFinancialSpecialistResearch } from "../lib/analysis/financial-specialist-research";
import { fetchNordicDivLabAnalysisResearch } from "../lib/analysis/nordic-primary-sources";

const RELEASE_URL =
  "https://view.news.eu.nasdaq.com/view?id=bc5cf3c904de001f8438f22fda2fa1b66&lang=en&src=listed";

function cnsInvestorItem() {
  return {
    headline: "Interim report January-June 2026",
    company: "Investor AB",
    messageUrl: RELEASE_URL,
    releaseTime: "2026-07-16 06:15:37 +0000",
    market: "Main Market, Stockholm",
    cnsCategory: "Half Year financial report",
    attachment: [],
  };
}

describe("Investor bounded official-release Research integration", () => {
  it("discovers Investor through the period-only window, reads only the allowlisted release and derives NAV discount", async () => {
    const cnsTerms: string[] = [];
    let releaseFetches = 0;

    const research = await fetchNordicDivLabAnalysisResearch({
      companyName: "Investor AB ser. B",
      symbol: "INVE-B",
      exchange: "ST",
      now: new Date("2026-08-22T20:00:00.000Z"),
      fetchImpl: async (input) => {
        const url = new URL(
          input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url,
        );

        if (url.hostname === "api.news.eu.nasdaq.com") {
          const term = url.searchParams.get("freeText") ?? "";
          cnsTerms.push(term);
          const items = term === "interim report January-June 2026"
            ? [cnsInvestorItem()]
            : [];
          return Response.json({ count: items.length, results: { item: items } });
        }

        if (url.hostname === "view.news.eu.nasdaq.com" && url.pathname === "/view") {
          releaseFetches += 1;
          return new Response(
            [
              "<!doctype html><html><body>",
              "<p>Investor AB interim report January-June 2026.</p>",
              "<p>Adjusted net asset value (NAV) was SEK 1,214.7bn (SEK 397 per share) on June 30, 2026.</p>",
              "</body></html>",
            ].join(""),
            { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
          );
        }

        throw new Error(`unexpected_fetch:${url.hostname}${url.pathname}`);
      },
    });

    assert.equal(cnsTerms.length, 5);
    assert.equal(
      cnsTerms.filter((term) => term === "interim report January-June 2026").length,
      1,
    );
    assert.equal(releaseFetches, 1);

    const releaseEvidence = research.evidence.find((item) =>
      item.sourceId.startsWith("nordic-release:INVE-B:"),
    );
    assert.ok(releaseEvidence);
    assert.equal(releaseEvidence.primary, true);
    assert.equal(releaseEvidence.documentRetrieved, true);
    assert.match(releaseEvidence.documentExcerpt ?? "", /SEK 397 per share/i);

    const packet = {
      companyClassification: { type: "investment_company" },
      evidence: research.evidence,
      instrument: { currency: "SEK", currentPrice: 330 },
      valuation: { trailing: { pe: null } },
      valuationProvenance: { measures: { pe: { sourceIds: [] } } },
    } as unknown as DivLabResearchPacket;
    const specialist = buildFinancialSpecialistResearch({ basePacket: packet });

    assert.equal(specialist.status, "research_ready");
    assert.equal(specialist.metrics.navPerShare.value, 397);
    assert.deepEqual(specialist.metrics.navPerShare.sourceIds, [releaseEvidence.sourceId]);
    assert.ok(Math.abs((specialist.metrics.discountToNavPct.value ?? 0) - 16.8765743) < 0.0001);
    assert.deepEqual(
      specialist.metrics.discountToNavPct.sourceIds,
      specialist.metrics.navPerShare.sourceIds,
    );
  });

  it("keeps Investor fail-closed when the official release lacks an explicit NAV-per-share token", async () => {
    const research = await fetchNordicDivLabAnalysisResearch({
      companyName: "Investor AB ser. B",
      symbol: "INVE-B",
      exchange: "ST",
      now: new Date("2026-08-22T20:00:00.000Z"),
      fetchImpl: async (input) => {
        const url = new URL(
          input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url,
        );
        if (url.hostname === "api.news.eu.nasdaq.com") {
          const term = url.searchParams.get("freeText") ?? "";
          const items = term === "interim report January-June 2026"
            ? [cnsInvestorItem()]
            : [];
          return Response.json({ count: items.length, results: { item: items } });
        }
        if (url.hostname === "view.news.eu.nasdaq.com" && url.pathname === "/view") {
          return new Response(
            "<!doctype html><html><body><p>Total equity was SEK 397bn and market capitalization SEK 1,010bn.</p></body></html>",
            { status: 200, headers: { "content-type": "text/html" } },
          );
        }
        throw new Error(`unexpected_fetch:${url.hostname}${url.pathname}`);
      },
    });

    const packet = {
      companyClassification: { type: "investment_company" },
      evidence: research.evidence,
      instrument: { currency: "SEK", currentPrice: 330 },
      valuation: { trailing: { pe: null } },
      valuationProvenance: { measures: { pe: { sourceIds: [] } } },
    } as unknown as DivLabResearchPacket;
    const specialist = buildFinancialSpecialistResearch({ basePacket: packet });

    assert.equal(specialist.status, "insufficient");
    assert.equal(specialist.metrics.navPerShare.status, "missing");
    assert.equal(specialist.metrics.discountToNavPct.status, "missing");
  });
});
