import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_PORTFOLIO_MANDATES,
  buildModelPortfolioSystemMandate,
} from "./mandates";

describe("model portfolio investment horizons", () => {
  it("encodes the approved horizon for every strategy", () => {
    assert.equal(MODEL_PORTFOLIO_MANDATES.conservative.horizonLabel, "12–60+ månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.balanced.horizonLabel, "2–24 månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.high_risk.horizonLabel, "1 vecka–12 månader");
    assert.equal(MODEL_PORTFOLIO_MANDATES.dividend.horizonLabel, "5–10+ år");
  });

  it("passes horizon guidance into the AI system mandate", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const mandate = MODEL_PORTFOLIO_MANDATES[strategyKey];
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, new RegExp(mandate.horizonLabel.replace(/[+]/g, "\\+")));
      assert.match(system, /strategiskt analysfilter/);
      assert.match(system, /inte samma sak som förväntad innehavstid/);
    }
  });

  it("does not turn the horizon into an automatic sell timer", () => {
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const mandate = MODEL_PORTFOLIO_MANDATES[strategyKey];
      assert.ok(mandate.explicitDoNot.some((item) => /utgångsdatum/.test(item)));
    }
  });
});
