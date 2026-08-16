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
const peerFinalizer = readFileSync(
  fileURLToPath(new URL("../lib/analysis/peer-analyst-finalization.ts", import.meta.url)),
  "utf8",
);

describe("single-call peer target orchestration contract", () => {
  it("preflights and pins registry plus peer-ready versions before the expensive Analyst call", () => {
    const registry = service.indexOf("loadLatestDivLabPeerSet({");
    const peerResearch = service.indexOf("loadLatestPeerReadyDivLabResearchVersionAsOf({");
    const pinned = service.indexOf("const pinnedPeerResearch =");
    const analyst = service.indexOf("createDivLabAiAnalysis({");

    assert.ok(registry >= 0 && peerResearch > registry && pinned > peerResearch && analyst > pinned);
    assert.equal(
      service.match(/loadLatestPeerReadyDivLabResearchVersionAsOf\(\{/g)?.length ?? 0,
      1,
    );
    assert.equal(service.match(/loadLatestDivLabPeerSet\(\{/g)?.length ?? 0, 1);
  });

  it("builds the audit from the exact pinned preflight objects instead of reloading latest after AI", () => {
    const researchPersist = service.indexOf("persistDivLabResearchPacket({");
    const auditBuild = service.indexOf("buildVersionBoundPeerComparisonAudit({");
    const auditPersist = service.indexOf("persistVersionBoundPeerComparisonAudit({");
    const auditRead = service.indexOf("loadStoredPeerComparisonAuditById({");
    const context = service.indexOf("buildDivLabPeerAnalystContext(storedAudit)");
    const finalize = service.indexOf("finalizeDivLabPeerAnalyst({");
    const contentPersist = service.indexOf("persistDivLabPeerAnalysisContent({");

    assert.ok(
      researchPersist >= 0 &&
        auditBuild > researchPersist &&
        auditPersist > auditBuild &&
        auditRead > auditPersist &&
        context > auditRead &&
        finalize > context &&
        contentPersist > finalize,
    );
    assert.match(
      service,
      /buildVersionBoundPeerComparisonAudit\(\{[\s\S]*registry,[\s\S]*targetResearch,[\s\S]*peerResearch: pinnedPeerResearch,[\s\S]*\}\)/,
    );
    assert.doesNotMatch(service, /createPersistedVersionBoundPeerComparisonAudit/);
    assert.doesNotMatch(service, /createDivLabPeerAiAnalysis\(/);
  });

  it("reuses the exact base Analyst result and keeps standalone fallback model execution intact", () => {
    assert.match(service, /draft:\s*baseAnalysis\.analystDraft/);
    assert.match(service, /model:\s*baseAnalysis\.model/);
    assert.match(service, /usage:\s*baseAnalysis\.usage/);
    assert.match(
      service,
      /finalizeDivLabPeerAnalyst\(\{[\s\S]*targetResearch,[\s\S]*peerContext,[\s\S]*analyst,[\s\S]*\}\)/,
    );
    assert.doesNotMatch(service, /generateDivLabAnalystDraft/);

    assert.match(peerService, /preparedAnalyst\?: PreparedDivLabAnalystResult/);
    assert.match(peerService, /if \(input\.preparedAnalyst\)/);
    assert.match(peerService, /finalizeDivLabPeerAnalyst/);
    assert.match(peerService, /generateDivLabAnalystDraft/);
    assert.match(peerFinalizer, /validateAnalystDraftAgainstPacket/);
  });

  it("fails closed on peer quality before persisting Analyst v3-peer content", () => {
    const qualityCheck = service.indexOf("if (!finalized.qualityGate.publishable)");
    const contentPersist = service.indexOf("persistDivLabPeerAnalysisContent({");
    assert.ok(qualityCheck >= 0 && contentPersist > qualityCheck);
    assert.match(service, /status: "analyst_quality_failed"/);
    assert.match(service, /status: "peer_finalize_failed"/);
  });
});
