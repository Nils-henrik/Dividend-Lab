import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Global Source Discovery Preview contract", () => {
  it("keeps source discovery Preview-only and founder-role protected", async () => {
    const route = await source("app/api/internal/analysis/source-discovery/route.ts");

    assert.match(route, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(route, /founder_auth_required/);
    assert.match(route, /founder_role_required/);
    assert.match(route, /CREATOR_ROLES/);
    assert.match(route, /Cache-Control/);
  });

  it("never upgrades a new global market from source discovery directly to Research coverage", async () => {
    const route = await source("app/api/internal/analysis/source-discovery/route.ts");

    assert.match(route, /discoverGlobalPrimarySources/);
    assert.match(route, /researchCoverageReady:\s*false/);
    assert.match(route, /evidenceExtractionReady:\s*discovery\.readyForEvidenceExtraction/);
    assert.match(route, /Source discovery is intentionally not equivalent to publication-grade/);
  });

  it("preserves the already-verified Nordic research path instead of routing it through SEC", async () => {
    const route = await source("app/api/internal/analysis/source-discovery/route.ts");

    assert.match(route, /if \(resolved\.canRunAnalysis\)/);
    assert.match(route, /status:\s*"existing_nordic_coverage"/);
    assert.match(route, /researchCoverageReady:\s*true/);
  });

  it("keeps the source-discovery UI separate from analysis execution", async () => {
    const operator = await source("components/analysis/AnalysisSourceDiscoveryOperator.tsx");
    const page = await source("app/analyses/internal-preview/sources/page.tsx");

    assert.match(operator, /\/api\/internal\/analysis\/source-discovery/);
    assert.doesNotMatch(operator, /\/api\/internal\/analysis\/run/);
    assert.doesNotMatch(operator, /persist:\s*true/);
    assert.doesNotMatch(operator, /publish:\s*true/);
    assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
    assert.match(page, /notFound\(\)/);
  });
});
