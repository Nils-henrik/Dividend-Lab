import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const readinessFiles = [
  "../lib/analysis/bank-analysis.ts",
  "../lib/analysis/bank-capital.ts",
  "../lib/analysis/bank-funding.ts",
  "../lib/analysis/financial-specialist-research.ts",
  "../lib/analysis/nordic-primary-sources.ts",
  "../lib/model-portfolios/engine/official-document.ts",
  "../lib/model-portfolios/engine/primary-source-enrichment.ts",
  "../lib/model-portfolios/engine/seb-fact-book.ts",
] as const;

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("specialist Research readiness safety boundary", () => {
  it("keeps the specialist evidence/readiness slice free of persistence and publication dependencies", () => {
    for (const path of readinessFiles) {
      const text = source(path);
      assert.doesNotMatch(text, /founder[-_/]publication/i, `${path} must not depend on publication`);
      assert.doesNotMatch(text, /publication-service/i, `${path} must not depend on publication services`);
      assert.doesNotMatch(text, /createDivLabAnalysisDevAdminClient/i, `${path} must not gain dev-admin writes`);
      assert.doesNotMatch(text, /@\/lib\/supabase/i, `${path} must not gain Supabase writes`);
      assert.doesNotMatch(text, /\.from\([^)]*analys/i, `${path} must not write analysis tables`);
    }
  });

  it("keeps the Preview operator opt-in for writes and requires persistence before publication", () => {
    const route = source("../app/api/internal/analysis/run/route.ts");
    assert.match(route, /const persist = body\.persist === true/);
    assert.match(route, /const publish = body\.publish === true/);
    assert.match(route, /if \(publish && !persist\)/);
    assert.match(route, /publish_requires_persist/);
    assert.match(route, /const serviceSupabase = persist && !publish/);
    assert.match(route, /if \(publish\) \{/);
    assert.match(route, /founder_auth_required/);
    assert.match(route, /founder_role_required/);
  });
});
