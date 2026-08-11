import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MODEL_PORTFOLIO_PUBLIC_CATALOG,
  getModelPortfolioPublicEntry,
} from "./public";

describe("public model portfolio horizons", () => {
  it("exposes each approved horizon and readable working style", () => {
    assert.equal(getModelPortfolioPublicEntry("forsiktig")?.horizonLabel, "12–60+ månader");
    assert.equal(getModelPortfolioPublicEntry("medelrisk")?.horizonLabel, "2–24 månader");
    assert.equal(getModelPortfolioPublicEntry("hog-risk")?.horizonLabel, "1 vecka–12 månader");
    assert.equal(getModelPortfolioPublicEntry("utdelning")?.horizonLabel, "5–10+ år");
    for (const entry of MODEL_PORTFOLIO_PUBLIC_CATALOG) {
      assert.ok(entry.workStyle.length > 80);
      assert.match(entry.summary, /tidshorisont/i);
    }
  });
});
