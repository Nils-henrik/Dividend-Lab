import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RESEARCH_BUDGET,
  capTradeProposals,
  rankResearchUniverse,
  selectDeepResearchCandidates,
} from "./research";

const base = {
  exchange: "ST",
  marketCapSek: 10_000_000_000,
  avgDailyTurnoverSek: 50_000_000,
  qualityScore: 0.7,
  valuationScore: 0.6,
  earningsRevisionScore: 0.6,
  dividendQualityScore: 0.5,
  catalystScore: 0.5,
  balanceSheetScore: 0.7,
  volatility20d: 0.25,
  priceMomentum20d: 0.03,
  priceMomentum60d: 0.08,
};

describe("model portfolio research funnel", () => {
  it("ranks the same universe differently by portfolio mandate", () => {
    const universe = [
      {
        ...base,
        symbol: "STABLE",
        qualityScore: 0.95,
        balanceSheetScore: 0.98,
        volatility20d: 0.12,
        catalystScore: 0.35,
      },
      {
        ...base,
        symbol: "FAST",
        qualityScore: 0.58,
        balanceSheetScore: 0.55,
        catalystScore: 0.98,
        earningsRevisionScore: 0.94,
        priceMomentum20d: 0.16,
      },
    ];

    assert.equal(rankResearchUniverse(universe, "conservative")[0]?.symbol, "STABLE");
    assert.equal(rankResearchUniverse(universe, "high_risk")[0]?.symbol, "FAST");
  });

  it("filters obvious illiquid microcaps before any AI work", () => {
    const ranked = rankResearchUniverse(
      [
        { ...base, symbol: "GOOD" },
        { ...base, symbol: "TINY", marketCapSek: 50_000_000 },
        { ...base, symbol: "DRY", avgDailyTurnoverSek: 200_000 },
      ],
      "balanced",
    );
    assert.deepEqual(ranked.map((item) => item.symbol), ["GOOD"]);
  });

  it("hard caps shortlist, deep research and final proposals", () => {
    const universe = Array.from({ length: 400 }, (_, index) => ({
      ...base,
      symbol: `S${index}`,
      qualityScore: (index % 100) / 100,
    }));
    const ranked = rankResearchUniverse(universe, "balanced");
    assert.equal(ranked.length, RESEARCH_BUDGET.maxShortlistSize);
    assert.equal(selectDeepResearchCandidates(ranked).length, RESEARCH_BUDGET.maxDeepResearchCandidates);
    assert.equal(capTradeProposals(Array.from({ length: 10 }, (_, i) => i)).length, RESEARCH_BUDGET.maxTradeProposalsPerRun);
  });
});
