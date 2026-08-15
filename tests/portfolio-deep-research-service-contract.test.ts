import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("portfolio Deep Research execution safety contract", () => {
  it("reuses fresh publishable analysis before any new analyst call", () => {
    const value = file("lib/analysis/portfolio-deep-research-service.ts");
    assert.match(value, /PORTFOLIO_DEEP_RESEARCH_FRESHNESS_MS\s*=\s*18\s*\*\s*60\s*\*\s*60\s*\*\s*1_000/);
    assert.match(value, /loadLatestPublishableDivLabResearchVersionAsOf/);
    assert.match(value, /if\s*\(\s*existing[\s\S]*isFresh\([\s\S]*\)[\s\S]*status:\s*"reused_fresh"/);
    assert.match(value, /const result = await executor/);
    assert.ok(
      value.indexOf('status: "reused_fresh"') < value.indexOf("const result = await executor"),
      "fresh reuse must be evaluated before the expensive executor",
    );
  });

  it("keeps execution sequential and bounded to the four-job dispatch budget", () => {
    const value = file("lib/analysis/portfolio-deep-research-service.ts");
    assert.match(value, /PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET\.maxJobs/);
    assert.match(value, /for \(const job of input\.plan\.jobs\)/);
    assert.doesNotMatch(value, /Promise\.all\(\s*input\.plan\.jobs/);
    assert.doesNotMatch(value, /maxConcurrency/);
  });

  it("does not import settlement or mutate model-portfolio history", () => {
    const value = file("lib/analysis/portfolio-deep-research-service.ts");
    assert.doesNotMatch(value, /settleModelPortfolioDecision|model_portfolio_transactions|model_portfolio_holdings|cash_ledger/);
    assert.match(value, /This service does not buy, sell, settle, or mutate historical portfolio state/);
  });

  it("requires identity agreement and leaves domain failures explicit", () => {
    const value = file("lib/analysis/portfolio-deep-research-service.ts");
    assert.match(value, /portfolio_deep_research_execution_identity_mismatch/);
    assert.match(value, /result\.ok/);
    assert.match(value, /failedClosed/);
    assert.doesNotMatch(value, /synthetic|fallback.*analysis/i);
  });
});
