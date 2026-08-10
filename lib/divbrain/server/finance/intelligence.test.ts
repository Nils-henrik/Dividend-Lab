import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildFinanceIntelligencePlan } from "./intelligence";

describe("DivBrain Finance Intelligence v4", () => {
  it("treats technical analysis tools as methods rather than generic platforms", () => {
    const plan = buildFinanceIntelligencePlan(
      "Ge förslag på tekniska analysverktyg som kan underlätta vid köp av aktier",
    );

    assert.ok(plan);
    assert.equal(plan.intent, "technical_analysis");
    assert.equal(plan.toolMeaning, "methods");
    assert.match(plan.context, /Marknadsstruktur/);
    assert.match(plan.context, /RSI14/);
    assert.match(plan.context, /ADX\/DMI/);
    assert.match(plan.context, /ATR/);
    assert.match(plan.context, /Volym/);
    assert.match(plan.context, /TradingView är endast ett sätt/);
    assert.match(plan.context, /VAD det mäter, NÄR det är användbart/);
  });

  it("routes an explicit platform comparison to platform intelligence", () => {
    const plan = buildFinanceIntelligencePlan(
      "Vilken plattform är bäst för screening, TradingView, Börsdata eller Koyfin?",
    );

    assert.ok(plan);
    // Explicit technical-platform names can coexist; the semantic tool meaning
    // must nevertheless say the user asked for platforms.
    assert.equal(plan.toolMeaning, "platforms");
    assert.match(plan.context, /TradingView: charting/);
    assert.match(plan.context, /Börsdata: nordiskt/);
    assert.match(plan.context, /Koyfin: multi-asset/);
    assert.match(plan.context, /marknadstäckning/);
  });

  it("knows valuation is more than one multiple", () => {
    const plan = buildFinanceIntelligencePlan(
      "Hur värderar jag ett bolag med DCF, EV/EBITDA och P/E?",
    );

    assert.ok(plan);
    assert.equal(plan.intent, "valuation");
    assert.match(plan.context, /Reverse DCF/);
    assert.match(plan.context, /känslighetsanalys/);
    assert.match(plan.context, /kapitalstruktur/);
  });

  it("routes options questions to greeks and payoff discipline", () => {
    const plan = buildFinanceIntelligencePlan(
      "Förklara delta gamma theta och vega för optioner",
    );

    assert.ok(plan);
    assert.equal(plan.intent, "derivatives");
    assert.match(plan.context, /delta/);
    assert.match(plan.context, /gamma/);
    assert.match(plan.context, /theta/);
    assert.match(plan.context, /vega/);
    assert.match(plan.context, /Implied volatility/);
  });

  it("flags current platform pricing as freshness-sensitive", () => {
    const plan = buildFinanceIntelligencePlan(
      "Vad kostar TradingView Premium idag?",
    );

    assert.ok(plan);
    assert.equal(plan.currentDataLikelyRequired, true);
    assert.match(plan.context, /Hitta inte på aktuella priser/);
  });

  it("does not inject finance context into unrelated questions", () => {
    assert.equal(buildFinanceIntelligencePlan("Hur kokar man pasta?"), null);
  });

  it("covers portfolio risk with risk-adjusted metrics and sizing", () => {
    const plan = buildFinanceIntelligencePlan(
      "Hur bör jag tänka kring Sharpe, Sortino, beta, korrelation och position sizing i en portfölj?",
    );

    assert.ok(plan);
    assert.equal(plan.intent, "portfolio_risk");
    assert.match(plan.context, /max drawdown/);
    assert.match(plan.context, /riskbudget/);
    assert.match(plan.context, /Expected Shortfall/);
  });

  it("distinguishes primary data sources from aggregators", () => {
    const plan = buildFinanceIntelligencePlan(
      "Var hittar jag marknadsdata och bolagsrapporter?",
    );

    assert.ok(plan);
    assert.equal(plan.intent, "market_data");
    assert.match(plan.context, /Källhierarki/);
    assert.match(plan.context, /SEC EDGAR/);
    assert.match(plan.context, /realtid, delayed, EOD/);
  });
});
