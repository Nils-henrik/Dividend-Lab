import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const service = readFileSync(
  fileURLToPath(new URL("../lib/analysis/peer-target-analysis-service.ts", import.meta.url)),
  "utf8",
);
const peerService = readFileSync(
  fileURLToPath(new URL("../lib/analysis/peer-ai-analysis-service.ts", import.meta.url)),
  "utf8",
);

describe("single-call peer target orchestration contract", () => {
  it("preflights registry and peer-ready research before the expensive base analyst call", () => {
    const registry = service.indexOf("loadLatestDivLabPeerSet({");
    const peerResearch = service.indexOf("loadLatestPeerReadyDivLabResearchVersionAsOf({");
    const analyst = service.indexOf("createDivLabAiAnalysis({");
    assert.ok(registry >= 0 && peerResearch > registry && analyst > peerResearch);
  });

  it("persists research-only before finalizing v3-peer with the prepared analyst result", () => {
    const researchPersist = service.indexOf("persistDivLabResearchPacket({");
    const peerFinalize = service.indexOf("createDivLabPeerAiAnalysis({");
    const prepared = service.indexOf("preparedAnalyst:");
    assert.ok(researchPersist >= 0 && peerFinalize > researchPersist && prepared > peerFinalize);
  });

  it("allows prepared analyst reuse without removing the standalone fallback model path", () => {
    assert.match(peerService, /preparedAnalyst\?: PreparedDivLabAnalystResult/);
    assert.match(peerService, /if \(input\.preparedAnalyst\)/);
    assert.match(peerService, /validateAnalystDraftAgainstPacket/);
    assert.match(peerService, /generateDivLabAnalystDraft/);
  });
});
