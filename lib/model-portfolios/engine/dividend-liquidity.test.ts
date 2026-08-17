import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankResearchUniverse } from "./research";

const common = {
  exchange: "ST",
  marketCapSek: 10_000_000_000,
  qualityScore: 0.65,
  valuationScore: 0.65,
  earningsRevisionScore: 0.7,
  dividendQualityScore: 0.8,
  catalystScore: 0.5,
  balanceSheetScore: 0.65,
  volatility20d: 0.08,
  priceMomentum20d: 0.01,
  priceMomentum60d: 0.02,
};

describe("Dividend mandate special-instrument liquidity", () => {
  it("keeps a liquid preference share that the generic 5 MSEK gate would remove", () => {
    const ranked = rankResearchUniverse(
      [{ ...common, symbol: "EMIL-PREF", avgDailyTurnoverSek: 2_000_000 }],
      "dividend",
    );

    assert.equal(ranked[0]?.symbol, "EMIL-PREF");
    assert.match(ranked[0]?.reasons.join(" ") ?? "", /preferensaktie med strategisk förtur/);
  });

  it("keeps a liquid D share for Dividend but not for unrelated mandates", () => {
    const candidate = { ...common, symbol: "CORE-D", avgDailyTurnoverSek: 1_500_000 };

    assert.equal(rankResearchUniverse([candidate], "dividend")[0]?.symbol, "CORE-D");
    assert.equal(rankResearchUniverse([candidate], "balanced").length, 0);
  });

  it("does not lower the liquidity floor for ordinary dividend shares", () => {
    const ranked = rankResearchUniverse(
      [{ ...common, symbol: "ORDINARY", avgDailyTurnoverSek: 2_000_000 }],
      "dividend",
    );

    assert.equal(ranked.length, 0);
  });

  it("still rejects genuinely illiquid preference and D shares", () => {
    const ranked = rankResearchUniverse(
      [
        { ...common, symbol: "EMIL-PREF", avgDailyTurnoverSek: 500_000 },
        { ...common, symbol: "CORE-D", avgDailyTurnoverSek: 900_000 },
      ],
      "dividend",
    );

    assert.equal(ranked.length, 0);
  });
});
