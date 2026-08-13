import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarketResearchCandidate, deriveResearchMarketSignals } from "./research-market";
import {
  parseEodhdFundamentalsPayload,
  scoreEodhdFundamentals,
  scoreNormalizedFundamentals,
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
  it("keeps market-derived technical signals separate from missing fundamentals", () => {
    const history = makeBars(80);
    const signals = deriveResearchMarketSignals({ history, quote: null, fxToSek: 1 });
    assert.ok(Number.isFinite(signals.priceMomentum20d));
    assert.ok(Number.isFinite(signals.priceMomentum60d));
    assert.ok(Number.isFinite(signals.volatility20d));
    assert.ok(signals.technicalAnalysis);
    assert.equal("marketCapSek" in signals, false);
    assert.equal("qualityScore" in signals, false);
    assert.equal("valuationScore" in signals, false);
    assert.equal("earningsRevisionScore" in signals, false);
    assert.equal("dividendQualityScore" in signals, false);
    assert.equal("catalystScore" in signals, false);
    assert.equal("balanceSheetScore" in signals, false);
  });

  it("does not let technical market data satisfy fundamental fields without a verified overlay", () => {
    const candidate = buildMarketResearchCandidate({
      symbol: "ATCO-A",
      exchange: "ST",
      history: makeBars(80),
      quote: null,
      fxToSek: 1,
    });
    assert.equal(candidate.marketCapSek, undefined);
    assert.equal(candidate.qualityScore, undefined);
    assert.equal(candidate.valuationScore, undefined);
    assert.equal(candidate.earningsRevisionScore, undefined);
    assert.equal(candidate.dividendQualityScore, undefined);
    assert.equal(candidate.catalystScore, undefined);
    assert.equal(candidate.balanceSheetScore, undefined);
  });

  it("lets high-risk and dividend rankings diverge when verified strategy fields differ", () => {
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

  it("does not create dividend quality from company quality when yield is zero or missing", () => {
    const zeroYield = scoreNormalizedFundamentals({
      dividendYield: 0,
      payoutRatio: 0.45,
      returnOnEquityTtm: 0.2,
      profitMargin: 0.2,
    }, 1);
    const missingYield = scoreNormalizedFundamentals({
      payoutRatio: 0.45,
      returnOnEquityTtm: 0.2,
      profitMargin: 0.2,
    }, 1);

    assert.equal(zeroYield.dividendQualityScore, undefined);
    assert.equal(missingYield.dividendQualityScore, undefined);
  });

  it("hard-gates dividend ranking to verified payers plus preference/D shares and approved dividend ETFs", () => {
    const ranked = rankResearchUniverse([
      {
        symbol: "NONPAYER",
        exchange: "ST",
        qualityScore: 0.95,
        balanceSheetScore: 0.95,
        valuationScore: 0.8,
      },
      {
        symbol: "DIVPAYER",
        exchange: "ST",
        dividendQualityScore: 0.72,
        qualityScore: 0.7,
        balanceSheetScore: 0.7,
        valuationScore: 0.65,
      },
      {
        symbol: "SAGA-D",
        exchange: "ST",
        qualityScore: 0.55,
        balanceSheetScore: 0.55,
        valuationScore: 0.55,
      },
      {
        symbol: "XACTHDIV",
        exchange: "ST",
      },
    ], "dividend");

    assert.doesNotMatch(ranked.map((item) => item.symbol).join(" "), /NONPAYER/);
    assert.ok(ranked.some((item) => item.symbol === "DIVPAYER"));
    assert.ok(ranked.some((item) => item.symbol === "SAGA-D"));
    assert.ok(ranked.some((item) => item.symbol === "XACTHDIV"));
    assert.ok((ranked.find((item) => item.symbol === "SAGA-D")?.reasons ?? []).some((item) => /förtur/.test(item)));
  });

  it("scores verified EODHD fundamentals payloads into strategy-relevant fields", () => {
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
});
