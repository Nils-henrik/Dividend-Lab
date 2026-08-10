import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveResearchMarketSignals } from "./research-market";
import {
  deriveMarketFundamentalScores,
  parseEodhdFundamentalsPayload,
  scoreEodhdFundamentals,
} from "./research-fundamentals";
import { rankResearchUniverse } from "./research";

function makeBars(count: number, start = 100, drift = 0.4, volume = 1_000_000) {
  return Array.from({ length: count }, (_, index) => ({
    date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    open: start + index * drift,
    high: start + index * drift + 1,
    low: start + index * drift - 1,
    close: start + index * drift,
    adjustedClose: start + index * drift,
    volume,
  }));
}

describe("research fundamental enrichment", () => {
  it("derives non-null fundamental scores from verified market history", () => {
    const history = makeBars(80);
    const signals = deriveResearchMarketSignals({ history, quote: null, fxToSek: 1 });
    assert.ok(Number.isFinite(signals.qualityScore));
    assert.ok(Number.isFinite(signals.valuationScore));
    assert.ok(Number.isFinite(signals.earningsRevisionScore));
    assert.ok(Number.isFinite(signals.dividendQualityScore));
    assert.ok(Number.isFinite(signals.catalystScore));
    assert.ok(Number.isFinite(signals.balanceSheetScore));
    assert.ok((signals.marketCapSek ?? 0) > 0);
  });

  it("lets high-risk and dividend rankings diverge once catalyst/dividend scores differ", () => {
    const calm = {
      symbol: "TEL2-B",
      exchange: "ST",
      qualityScore: 0.82,
      valuationScore: 0.7,
      earningsRevisionScore: 0.45,
      dividendQualityScore: 0.9,
      catalystScore: 0.3,
      balanceSheetScore: 0.85,
      priceMomentum20d: 0.02,
      priceMomentum60d: 0.04,
      volatility20d: 0.18,
      avgDailyTurnoverSek: 80_000_000,
    };
    const hot = {
      symbol: "EVO",
      exchange: "ST",
      qualityScore: 0.55,
      valuationScore: 0.4,
      earningsRevisionScore: 0.92,
      dividendQualityScore: 0.2,
      catalystScore: 0.95,
      balanceSheetScore: 0.4,
      priceMomentum20d: 0.18,
      priceMomentum60d: 0.3,
      volatility20d: 0.45,
      avgDailyTurnoverSek: 120_000_000,
    };

    const dividend = rankResearchUniverse([calm, hot], "dividend");
    const highRisk = rankResearchUniverse([calm, hot], "high_risk");
    assert.equal(dividend[0]?.symbol, "TEL2-B");
    assert.equal(highRisk[0]?.symbol, "EVO");
  });

  it("scores EODHD fundamentals payloads into strategy-relevant fields", () => {
    const parsed = parseEodhdFundamentalsPayload({
      Highlights: {
        MarketCapitalization: 100_000_000,
        PERatio: 18,
        ProfitMargin: 0.2,
        OperatingMarginTTM: 0.22,
        ReturnOnEquityTTM: 0.18,
        ReturnOnAssetsTTM: 0.08,
        QuarterlyEarningsGrowthYOY: 0.12,
        QuarterlyRevenueGrowthYOY: 0.08,
        DividendYield: 0.035,
      },
      Valuation: {
        TrailingPE: 17,
        PriceBookMRQ: 2.5,
        PriceSalesTTM: 3,
      },
      SplitsDividends: {
        PayoutRatio: 0.55,
        ForwardAnnualDividendYield: 0.036,
      },
    });
    assert.ok(parsed);
    const scored = scoreEodhdFundamentals(parsed!, 1);
    assert.equal(scored.marketCapSek, 100_000_000);
    assert.ok((scored.dividendQualityScore ?? 0) > 0.4);
    assert.ok((scored.qualityScore ?? 0) > 0.4);
    assert.ok((scored.catalystScore ?? 0) > 0.4);
  });

  it("returns null market-derived scores when history is too thin", () => {
    assert.equal(
      deriveMarketFundamentalScores({
        history: makeBars(5),
        quote: null,
        fxToSek: 1,
      }),
      null,
    );
  });
});
