import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("preview peer research safety boundary", () => {
  it("hard-locks the admin client to Preview and dividend-lab-dev", () => {
    const value = file("lib/analysis/dev-admin.ts");
    assert.match(value, /VERCEL_ENV[^\n]*preview/i);
    assert.match(value, /faaxloafogpsywfkpbrm/);
    assert.match(value, /hostname !== `\$\{DIVLAB_ANALYSIS_DEV_PROJECT_REF\}\.supabase\.co`/);
    assert.doesNotMatch(value, /nudnybicacgvhckfndim/);
  });

  it("makes the temporary route preview-only and curated-peer-only", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /VERCEL_ENV[^\n]*preview/i);
    assert.match(value, /status: 404/);
    assert.match(value, /DIVLAB_CURATED_PEER_SETS/);
    assert.match(value, /createDivLabAnalysisDevAdminClient/);
    assert.match(value, /createDivLabPeerResearchVersion/);
    assert.match(value, /Cache-Control/);
  });

  it("keeps catalog-wide batch validation dry-run-only and bounded", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /const BATCH_CONCURRENCY = 3/);
    assert.match(value, /batch_persistence_forbidden/);
    assert.match(value, /if \(batch\)[\s\S]*if \(persist\)[\s\S]*status: 400/i);
    assert.match(value, /runBatchDryResearch/);
    assert.match(value, /persist: false/);
  });

  it("exposes only bounded primary-source metadata, never report text", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /primaryDiagnostics/);
    assert.match(value, /documentRetrieved/);
    assert.match(value, /reportPeriod/);
    assert.match(value, /documentType/);
    assert.doesNotMatch(value, /documentExcerpt/);
    assert.doesNotMatch(value, /item\.content/);
  });
});
