import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Global Evidence Extraction Preview contract", () => {
  it("stays Preview-only and founder-role protected", async () => {
    const route = await source("app/api/internal/analysis/evidence-extraction/route.ts");

    assert.match(route, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(route, /founder_auth_required/);
    assert.match(route, /founder_role_required/);
    assert.match(route, /CREATOR_ROLES/);
    assert.match(route, /Cache-Control/);
  });

  it("requires source discovery readiness before document extraction", async () => {
    const route = await source("app/api/internal/analysis/evidence-extraction/route.ts");

    assert.match(route, /discoverGlobalPrimarySources/);
    assert.match(route, /if \(!discovery\.readyForEvidenceExtraction\)/);
    assert.match(route, /source_discovery_not_ready/);
    assert.match(route, /extractGlobalSecEvidence/);
  });

  it("never upgrades evidence quality directly into global Research readiness", async () => {
    const route = await source("app/api/internal/analysis/evidence-extraction/route.ts");

    assert.match(route, /evidenceQualityReady:\s*extraction\.bundle\.qualityGate\.ready/);
    assert.match(route, /researchCoverageReady:\s*false/);
    assert.match(route, /not sufficient to turn on[\s\S]*global Deep Research/i);
    assert.doesNotMatch(route, /createDivLabAiAnalysis/);
    assert.doesNotMatch(route, /founderPersistAndPublish/);
  });

  it("keeps the runtime fetch bounded and SEC-only", async () => {
    const runtime = await source("lib/analysis/global-evidence-extraction.ts");

    assert.match(runtime, /GLOBAL_EVIDENCE_BOUNDS\.maxDocumentBytes/);
    assert.match(runtime, /GLOBAL_EVIDENCE_BOUNDS\.timeoutMs/);
    assert.match(runtime, /GLOBAL_EVIDENCE_BOUNDS\.maxRedirects/);
    assert.match(runtime, /redirect:\s*"manual"/);
    assert.match(runtime, /validateSecArchiveUrl/);
    assert.match(runtime, /slice\(0, GLOBAL_EVIDENCE_BOUNDS\.maxDocuments\)/);
    assert.match(runtime, /Sequential on purpose/);
  });

  it("lets the Preview UI invoke evidence extraction only after source readiness", async () => {
    const operator = await source("components/analysis/AnalysisSourceDiscoveryOperator.tsx");

    assert.match(operator, /discovery\?\.evidenceExtractionReady/);
    assert.match(operator, /\/api\/internal\/analysis\/evidence-extraction/);
    assert.match(operator, /Evidence extraction/);
    assert.match(operator, /Full Research:/);
    assert.doesNotMatch(operator, /persist:\s*true/);
    assert.doesNotMatch(operator, /publish:\s*true/);
  });
});
