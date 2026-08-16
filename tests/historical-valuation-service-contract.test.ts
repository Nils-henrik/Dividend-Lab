import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("historical valuation repository boundary", () => {
  it("loads only publishable immutable versions before both data and persistence boundaries", () => {
    const value = file("lib/analysis/historical-valuation-service.ts");
    assert.match(value, /\.eq\("publishable", true\)/);
    assert.match(value, /\.lte\("data_as_of", maxObservationAt\)/);
    assert.match(value, /\.lte\("created_at", maxObservationAt\)/);
    assert.match(value, /\.order\("created_at", \{ ascending: false \}\)/);
    assert.match(value, /buildVersionedResearchPacketFromRow/);
    assert.match(value, /buildHistoricalValuationAnalysis/);
  });

  it("keeps database history reads bounded", () => {
    const value = file("lib/analysis/historical-valuation-service.ts");
    assert.match(value, /HISTORICAL_VALUATION_DEFAULT_VERSION_LIMIT = 120/);
    assert.match(value, /HISTORICAL_VALUATION_HARD_VERSION_LIMIT = 500/);
    assert.match(value, /Math\.min\([\s\S]*HISTORICAL_VALUATION_HARD_VERSION_LIMIT/);
    assert.match(value, /\.limit\(limit\)/);
  });

  it("does not use providers or models to reconstruct history", () => {
    const value = file("lib/analysis/historical-valuation-service.ts");
    assert.doesNotMatch(value, /fetchYahoo|fetchEodhd|generateText|generateObject|createDivLabAiAnalysis/);
    assert.match(value, /immutable persisted research/i);
  });
});
