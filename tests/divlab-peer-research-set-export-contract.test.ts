import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("curated peer-set operator export contract", () => {
  it("owns one exact three-peer all-or-nothing research pipeline", () => {
    const value = file("lib/analysis/peer-research-export-runner.ts");

    assert.match(value, /getCuratedPeerSet\(\{/);
    assert.match(value, /peerSet\.registry\.members\.length !== 3/);
    assert.match(value, /getYahooCrumbSession\(fetchImpl, now\)/);
    assert.match(value, /for \(const member of peerSet\.registry\.members\)/);
    assert.match(value, /createDivLabPeerResearchVersion\(\{/);
    assert.match(value, /buildPeerResearchValidationExport\(\{/);
    assert.match(value, /buildPeerResearchOperatorExport\(\{ validationExport \}\)/);
    assert.match(value, /if \(peers\.length !== 3\)/);
    assert.match(value, /peerCount: 3/);
  });

  it("contains no persistence, AI or operator-supplied peer-list path", () => {
    const value = file("lib/analysis/peer-research-export-runner.ts");

    assert.doesNotMatch(value, /SupabaseClient/);
    assert.doesNotMatch(value, /persistDivLab/);
    assert.doesNotMatch(value, /generateDivLabAnalystDraft/);
    assert.doesNotMatch(value, /createDivLabAiAnalysis/);
    assert.doesNotMatch(value, /input\.peers/);
    assert.doesNotMatch(value, /requestId/);
    assert.doesNotMatch(value, /peer-research-export-request/);
  });

  it("keeps every returned peer bound to the exact curated member identity", () => {
    const value = file("lib/analysis/peer-research-export-runner.ts");

    assert.match(value, /operatorExport\.instrument\.symbol !== member\.symbol/);
    assert.match(value, /operatorExport\.instrument\.exchange !== member\.exchange/);
    assert.match(value, /operatorExport\.instrument\.name !== member\.name/);
    assert.match(value, /peer_research_export_member_binding_mismatch/);
    assert.match(value, /result\.persistence !== null/);
  });
});
