import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("US Preview Deep Research Execution contract", () => {
  it("stays Preview-only, founder protected, POST-only and MSFT-only", async () => {
    const route = await source("app/api/internal/analysis/us-deep-research-execution/route.ts");

    assert.match(route, /export async function POST/);
    assert.doesNotMatch(route, /export async function GET/);
    assert.match(route, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(route, /founder_auth_required/);
    assert.match(route, /founder_role_required/);
    assert.match(route, /CREATOR_ROLES/);
    assert.match(route, /US_DEEP_RESEARCH_V1_TARGETS = new Set\(\["MSFT"\]\)/);
    assert.match(route, /preview_target_not_allowlisted/);
    assert.match(route, /Cache-Control/);
  });

  it("re-verifies the deterministic US chain before any Analyst execution", async () => {
    const route = await source("app/api/internal/analysis/us-deep-research-execution/route.ts");

    const discovery = route.indexOf("discoverGlobalPrimarySources({");
    const extraction = route.indexOf("extractGlobalSecEvidence({");
    const loader = route.indexOf("loadDivLabResearchInputs({");
    const coveragePacket = route.indexOf("buildUsResearchCoverageFactsPacket({");
    const coverage = route.indexOf("evaluateUsResearchCoverage({");
    const execute = route.indexOf("createDivLabAiAnalysisFromResearchInputs({");

    assert.ok(discovery >= 0);
    assert.ok(extraction > discovery);
    assert.ok(loader > extraction);
    assert.ok(coveragePacket > loader);
    assert.ok(coverage > coveragePacket);
    assert.ok(execute > coverage);
    assert.match(route, /extraction\.bundle\.qualityGate\.score !== 100/);
    assert.match(route, /!coverage\.ready \|\| coverage\.score !== 100/);
  });

  it("passes verified SEC sources and evidence into the shared Analyst sequence", async () => {
    const route = await source("app/api/internal/analysis/us-deep-research-execution/route.ts");

    assert.match(route, /additionalSources:\s*extraction\.bundle\.analysisSources/);
    assert.match(route, /additionalEvidence:\s*extraction\.bundle\.evidence/);
    assert.match(route, /secSourceProvenancePreserved/);
    assert.match(route, /secEvidenceProvenancePreserved/);
    assert.match(route, /provenance_failed/);
  });

  it("cannot persist or publish and requires both final quality gates at 100", async () => {
    const route = await source("app/api/internal/analysis/us-deep-research-execution/route.ts");

    assert.doesNotMatch(route, /founderPersistAndPublish/);
    assert.doesNotMatch(route, /persistDivLabAnalysisBundle/);
    assert.doesNotMatch(route, /createDivLabAnalysisDevAdminClient/);
    assert.doesNotMatch(route, /publication-service/);
    assert.match(route, /result\.persistence !== null/);
    assert.match(route, /!result\.finalPacket\.qualityGate\.publishable/);
    assert.match(route, /result\.finalPacket\.qualityGate\.score !== 100/);
    assert.match(route, /!result\.analystQualityGate\.publishable/);
    assert.match(route, /result\.analystQualityGate\.score !== 100/);
    assert.match(route, /persistence:\s*null/);
    assert.match(route, /publication:\s*null/);
  });
});
