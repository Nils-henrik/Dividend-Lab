import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPortfolioEvidenceFromDeepResearch } from "../lib/analysis/portfolio-deep-research-evidence";

const VERSION_ID = "11111111-2222-4333-8444-555555555555";

function fixture(publishable = true) {
  return {
    analysisVersionId: VERSION_ID,
    packet: {
      version: "deep-research-v2",
      instrument: {
        symbol: "ATCO-A",
        exchange: "ST",
        name: "Atlas Copco A",
        currency: "SEK",
        currentPrice: 182.4,
      },
      createdAt: "2026-08-15T12:00:00.000Z",
      dataAsOf: "2026-08-15T11:55:00.000Z",
      companyClassification: { type: "operating_company" },
      fundamental: {
        methodology: {
          framework: "generic_operating_company",
          status: "supported",
        },
        scorecard: { overall: 0.78, coverage: 0.9 },
        strengths: ["stabil lönsamhet"],
        concerns: ["cyklisk efterfrågan"],
        unknowns: ["nästa rapports orderingång"],
      },
      valuation: {
        currentPrice: 182.4,
        currency: "SEK",
        trailing: {
          pe: 24.3,
          priceToFcf: 22.7,
          fcfYield: 0.044,
          evToEbit: 20.5,
          evToEbitda: 18.8,
        },
        baseCaseValue: 195,
        baseCaseUpsideDownsidePct: 0.069,
      },
      valuationProvenance: { version: "valuation-provenance-v1" },
      technical: {
        snapshot: {
          asOf: "2026-08-14T00:00:00.000Z",
          sessions: 252,
          trend: {
            regime: "uptrend",
            priceVsSma50Pct: 0.031,
            priceVsSma200Pct: 0.087,
          },
          momentum: { rsi14: 58.2 },
          scores: {
            composite: 0.71,
            trend: 0.76,
            breakout: 0.62,
            stability: 0.8,
          },
          signals: ["pris över SMA50", "positiv lång trend"],
        },
        levels: {
          supports: [{ lower: 174, upper: 177, strength: "strong" }],
          resistances: [{ lower: 188, upper: 191, strength: "medium" }],
          resistanceState: "zones",
        },
      },
      sources: [{ primary: true }, { primary: false }],
      qualityGate: { publishable },
    },
  } as any;
}

describe("Deep Research -> portfolio evidence", () => {
  it("emits three bounded evidence sections with exact immutable version provenance", () => {
    const evidence = buildPortfolioEvidenceFromDeepResearch(fixture());
    assert.equal(evidence.length, 3);
    assert.deepEqual(
      evidence.map((item) => item.id),
      [
        `DEEP-RESEARCH:${VERSION_ID}:fundamental`,
        `DEEP-RESEARCH:${VERSION_ID}:valuation`,
        `DEEP-RESEARCH:${VERSION_ID}:technical`,
      ],
    );
    assert.ok(evidence.every((item) => item.kind === "deep_research"));
    assert.ok(evidence.every((item) => item.publisher === "DivLab Deep Research"));
    assert.ok(evidence.every((item) => item.summary.length <= 1_600));
    assert.match(evidence[0]?.summary ?? "", /0\.780/);
    assert.match(evidence[1]?.summary ?? "", /P\/E=24\.30/);
    assert.match(evidence[2]?.summary ?? "", /Trend=uptrend/);
    assert.match(evidence[2]?.summary ?? "", /174\.00–177\.00 \(strong\)/);
  });

  it("stays neutral instead of translating analysis into a trade instruction", () => {
    const evidence = buildPortfolioEvidenceFromDeepResearch(fixture());
    const combined = evidence.map((item) => item.summary).join(" ").toLowerCase();
    assert.match(combined, /inte ett köp- eller säljbeslut/);
    assert.match(combined, /inte ett automatiskt värderings- eller handelssignal/);
    assert.match(combined, /får inte ensam skapa en affär/);
    assert.doesNotMatch(combined, /du bör köpa|rekommenderar köp|köpsignal/);
  });

  it("rejects non-publishable research even when the packet shape otherwise looks complete", () => {
    assert.throws(
      () => buildPortfolioEvidenceFromDeepResearch(fixture(false)),
      /portfolio_deep_research_evidence_not_publishable/,
    );
  });
});
