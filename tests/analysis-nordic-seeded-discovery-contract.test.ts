import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const analysisSource = readFileSync(
  new URL("../lib/analysis/nordic-primary-sources.ts", import.meta.url),
  "utf8",
);
const sharedSource = readFileSync(
  new URL("../lib/model-portfolios/engine/nordic-primary-sources.ts", import.meta.url),
  "utf8",
);

describe("Dedicated Nordic seeded report discovery contract", () => {
  it("keeps the existing hard 3-current + 2-annual dedicated request ceiling", () => {
    assert.match(analysisSource, /currentReport:\s*3/);
    assert.match(analysisSource, /annualReport:\s*2/);
    assert.match(analysisSource, /total:\s*5/);
    assert.match(analysisSource, /boundedFetch\(input\.fetchImpl,\s*1\)/);
  });

  it("uses separate ticker and issuer-name seeds so one noisy disclosure query cannot starve report discovery", () => {
    assert.match(analysisSource, /currentDiscoverySeeds/);
    assert.match(analysisSource, /input\.symbol/);
    assert.match(analysisSource, /input\.companyName/);
    assert.match(analysisSource, /\$\{input\.companyName\} interim/);
    assert.match(analysisSource, /\$\{input\.companyName\} annual/);
    assert.match(analysisSource, /dedupeHits\(batches\.flat\(\)\)/);
  });

  it("does not widen the shared portfolio discovery scope or attachment trust boundary", () => {
    assert.match(sharedSource, /globalName["'],\s*["']NordicMainMarkets["']/);
    assert.match(sharedSource, /attachment\.news\.eu\.nasdaq\.com/);
    assert.match(sharedSource, /HARD_MAX_SEARCH_TERMS\s*=\s*5/);
  });
});
