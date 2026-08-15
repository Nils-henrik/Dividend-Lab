import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("dedicated Nordic Deep Research report discovery", () => {
  it("opts Deep Research into report-aware terms without increasing hard search/result bounds", () => {
    const engine = file("lib/model-portfolios/engine/nordic-primary-sources.ts");
    const analysis = file("lib/analysis/nordic-primary-sources.ts");

    assert.match(engine, /const HARD_MAX_SEARCH_TERMS = 5/);
    assert.match(engine, /const HARD_MAX_QUERY_COUNT = 20/);
    assert.match(engine, /const HARD_MAX_HITS = 12/);
    assert.match(engine, /preferFinancialReports\?: boolean/);
    assert.match(engine, /terms\.add\(`\$\{ticker\} report`\)/);
    assert.match(engine, /return \[\.\.\.terms\]\.slice\(0, HARD_MAX_SEARCH_TERMS\)/);
    assert.match(analysis, /maxHits:\s*12/);
    assert.match(analysis, /queryCount:\s*20/);
    assert.match(analysis, /preferFinancialReports:\s*true/);
  });

  it("includes First North only in dedicated report-aware scope while ordinary portfolio callers stay on Main Market", () => {
    const engine = file("lib/model-portfolios/engine/nordic-primary-sources.ts");

    assert.match(engine, /includeGrowthMarkets\?: boolean/);
    assert.match(
      engine,
      /input\.includeGrowthMarkets\s*\?\s*""\s*:\s*"NordicMainMarkets"/,
    );
    assert.match(
      engine,
      /includeGrowthMarkets:\s*input\.preferFinancialReports\s*===\s*true/,
    );
    assert.match(engine, /if \(!input\.preferFinancialReports\) return aliases/);
    assert.doesNotMatch(engine, /DEFAULT_MAX_HITS\s*=\s*12/);
    assert.doesNotMatch(engine, /DEFAULT_QUERY_COUNT\s*=\s*20/);
  });

  it("retains issuer matching and the official attachment allowlist", () => {
    const engine = file("lib/model-portfolios/engine/nordic-primary-sources.ts");
    assert.match(engine, /companyNamesLikelyMatch\(issuer, companyName\)/);
    assert.match(engine, /host !== "attachment\.news\.eu\.nasdaq\.com"/);
  });
});
