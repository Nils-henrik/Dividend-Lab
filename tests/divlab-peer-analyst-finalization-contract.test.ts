import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("pure peer Analyst finalization boundary", () => {
  it("keeps deterministic v3-peer finalization free of DB, network and model execution", () => {
    const value = file("lib/analysis/peer-analyst-finalization.ts");

    assert.match(value, /validateAnalystDraftAgainstPacket/);
    assert.match(value, /composePeerAnalystDraft/);
    assert.match(value, /validatePeerAnalystDraft/);
    assert.match(value, /evaluatePeerAnalystContentQuality/);
    assert.match(value, /divlab_peer_analyst_finalization_target_version_mismatch/);

    assert.doesNotMatch(value, /SupabaseClient/);
    assert.doesNotMatch(value, /\.from\(/);
    assert.doesNotMatch(value, /\.rpc\(/);
    assert.doesNotMatch(value, /fetch\(/);
    assert.doesNotMatch(value, /generateDivLabAnalystDraft/);
    assert.doesNotMatch(value, /persistDivLab[A-Za-z]+/);
    assert.doesNotMatch(value, /from\s+["'][^"']*repository[^"']*["']/i);
  });

  it("routes both prepared and fallback Analyst results through the same pure finalizer", () => {
    const value = file("lib/analysis/peer-ai-analysis-service.ts");

    assert.match(value, /finalizeDivLabPeerAnalyst/);
    assert.match(value, /if \(input\.preparedAnalyst\)/);
    assert.match(value, /analyst = input\.preparedAnalyst/);
    assert.match(value, /generateDivLabAnalystDraft/);
    assert.match(
      value,
      /const finalized = finalizeDivLabPeerAnalyst\(\{[\s\S]*targetResearch,[\s\S]*peerContext,[\s\S]*analyst,[\s\S]*\}\)/,
    );
    assert.match(value, /if \(!finalized\.qualityGate\.publishable\)/);
    assert.match(value, /draft: finalized\.draft/);
    assert.match(value, /qualityGate: finalized\.qualityGate/);
    assert.match(value, /usage: finalized\.usage/);
  });

  it("preserves exact one-call target Analyst reuse through the pinned finalization path", () => {
    const value = file("lib/analysis/peer-target-analysis-service.ts");

    assert.match(value, /createDivLabAiAnalysis/);
    assert.match(value, /const analyst: PreparedDivLabAnalystResult = \{/);
    assert.match(value, /draft:\s*baseAnalysis\.analystDraft/);
    assert.match(value, /model:\s*baseAnalysis\.model/);
    assert.match(value, /usage:\s*baseAnalysis\.usage/);
    assert.match(value, /finalizeDivLabPeerAnalyst/);
    assert.doesNotMatch(value, /generateDivLabAnalystDraft/);
    assert.doesNotMatch(value, /createDivLabPeerAiAnalysis\(/);
  });
});
