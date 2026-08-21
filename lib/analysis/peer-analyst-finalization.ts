import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import { validateAnalystDraftAgainstPacket } from "./analyst-contract";
import type { DivLabAnalystUsage } from "./analyst";
import type { DivLabAnalystDraft } from "./analyst-schema";
import type { DivLabPeerAnalystContext } from "./peer-analyst-context";
import { composePeerAnalystDraft } from "./peer-analyst-composition";
import { validatePeerAnalystDraft } from "./peer-analyst-contract";
import {
  evaluatePeerAnalystContentQuality,
  type DivLabPeerAnalystQualityGate,
} from "./peer-analyst-quality-gate";
import type { DivLabPeerAnalystDraft } from "./peer-analyst-schema";
import type { VersionedResearchPacket } from "./peer-comparison-audit";

export type PreparedDivLabAnalystResult = {
  draft: DivLabAnalystDraft;
  model: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
};

export type FinalizedDivLabPeerAnalyst = {
  draft: DivLabPeerAnalystDraft;
  qualityGate: DivLabPeerAnalystQualityGate;
  analystModel: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
};

/**
 * Pure deterministic finalization for Analyst v3-peer.
 *
 * This function performs no model, database or network work. It revalidates the
 * already prepared target Analyst result against the exact immutable target
 * research packet, composes the neutral peer appendix from one version-bound
 * peer context, validates every structured peer claim, and evaluates the peer
 * content quality gate. Persistence remains the caller's responsibility.
 */
export function finalizeDivLabPeerAnalyst(input: {
  targetResearch: VersionedResearchPacket;
  peerContext: DivLabPeerAnalystContext;
  analyst: PreparedDivLabAnalystResult;
}): FinalizedDivLabPeerAnalyst {
  if (
    input.peerContext.targetAnalysisVersionId.trim().toLowerCase() !==
    input.targetResearch.analysisVersionId.trim().toLowerCase()
  ) {
    throw new Error("divlab_peer_analyst_finalization_target_version_mismatch");
  }

  validateAnalystDraftAgainstPacket({
    packet: input.targetResearch.packet,
    draft: input.analyst.draft,
  });

  const draft = composePeerAnalystDraft({
    baseDraft: input.analyst.draft,
    peerContext: input.peerContext,
  });

  validatePeerAnalystDraft({
    packet: input.targetResearch.packet,
    targetAnalysisVersionId: input.targetResearch.analysisVersionId,
    peerContext: input.peerContext,
    draft,
  });

  const qualityGate = evaluatePeerAnalystContentQuality({
    packet: input.targetResearch.packet,
    targetAnalysisVersionId: input.targetResearch.analysisVersionId,
    peerContext: input.peerContext,
    draft,
  });

  return {
    draft,
    qualityGate,
    analystModel: input.analyst.model,
    usage: input.analyst.usage,
  };
}
