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

describe("Dedicated Nordic period-only CNS row window", () => {
  it("widens rows only for the already-budgeted period-only query", () => {
    assert.match(analysisSource, /ordinaryTerm:\s*20/);
    assert.match(analysisSource, /periodOnlyTerm:\s*100/);
    assert.match(analysisSource, /function isPeriodOnlyReportTerm/);
    assert.match(
      analysisSource,
      /queryCount:\s*isPeriodOnlyReportTerm\(term\)[\s\S]{0,180}DEEP_RESEARCH_CNS_ROW_BUDGET\.periodOnlyTerm[\s\S]{0,180}DEEP_RESEARCH_CNS_ROW_BUDGET\.ordinaryTerm/,
    );
  });

  it("does not add requests or weaken the shared portfolio defaults and issuer filter", () => {
    assert.match(analysisSource, /currentReport:\s*3/);
    assert.match(analysisSource, /annualReport:\s*2/);
    assert.match(analysisSource, /total:\s*5/);
    assert.match(sharedSource, /const DEFAULT_QUERY_COUNT = 5/);
    assert.match(sharedSource, /const HARD_MAX_QUERY_COUNT = 100/);
    assert.match(sharedSource, /companyNamesLikelyMatch\(issuer, companyName\)/);
  });
});
