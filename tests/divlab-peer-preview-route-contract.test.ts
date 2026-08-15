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
});
