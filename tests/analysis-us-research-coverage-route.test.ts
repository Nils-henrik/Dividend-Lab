import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("US Research Coverage Preview contract", () => {
  it("stays Preview-only, founder protected and MSFT-only in v1", async () => {
    const route = await source("app/api/internal/analysis/us-research-coverage/route.ts");

    assert.match(route, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(route, /founder_auth_required/);
    assert.match(route, /founder_role_required/);
    assert.match(route, /CREATOR_ROLES/);
    assert.match(route, /US_RESEARCH_V1_TARGETS = new Set\(\["MSFT"\]\)/);
    assert.match(route, /preview_target_not_allowlisted/);
    assert.match(route, /Cache-Control/);
  });

  it("re-verifies discovery and evidence before loading ordinary Research inputs", async () => {
    const route = await source("app/api/internal/analysis/us-research-coverage/route.ts");

    assert.match(route, /discoverGlobalPrimarySources/);
    assert.match(route, /if \(!discovery\.readyForEvidenceExtraction\)/);
    assert.match(route, /extractGlobalSecEvidence/);
    assert.match(route, /if \(!extraction\.bundle\.qualityGate\.ready\)/);
    assert.match(route, /loadDivLabResearchInputs/);
    assert.match(route, /buildUsResearchCoverageFactsPacket/);
    assert.match(route, /evaluateUsResearchCoverage/);
  });

  it("cannot execute AI, persist or publish from the coverage endpoint", async () => {
    const route = await source("app/api/internal/analysis/us-research-coverage/route.ts");

    assert.match(route, /analysisExecutionEnabled:\s*false/);
    assert.doesNotMatch(route, /createDivLabAiAnalysis/);
    assert.doesNotMatch(route, /generateDivLabAnalystDraft/);
    assert.doesNotMatch(route, /founderPersistAndPublish/);
    assert.doesNotMatch(route, /persistDivLabAnalysis/);
    assert.doesNotMatch(route, /publish:\s*true/);
    assert.doesNotMatch(route, /persist:\s*true/);
  });

  it("builds facts with no invented Bear/Base/Bull scenarios and reuses the existing Research gate", async () => {
    const coverage = await source("lib/analysis/us-research-coverage.ts");

    assert.match(coverage, /buildDivLabResearchPacket/);
    assert.match(coverage, /valuationScenarios:\s*\[\]/);
    assert.match(coverage, /packet\.qualityGate\.checks/);
    assert.match(coverage, /valuationScenarioCoverageDeferred/);
    assert.doesNotMatch(coverage, /publishable:\s*true/);
  });
});
