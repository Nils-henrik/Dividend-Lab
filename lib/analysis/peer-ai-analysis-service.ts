import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDivLabAnalystDraft,
  type DivLabAnalystUsage,
} from "./analyst";
import {
  persistDivLabPeerAnalysisContent,
  type PersistedDivLabPeerAnalysisContent,
} from "./peer-analysis-content-repository";
import {
  composePeerAnalystDraft,
} from "./peer-analyst-composition";
import {
  validatePeerAnalystDraft,
} from "./peer-analyst-contract";
import {
  buildDivLabPeerAnalystContext,
  type DivLabPeerAnalystContext,
} from "./peer-analyst-context";
import {
  evaluatePeerAnalystContentQuality,
  type DivLabPeerAnalystQualityGate,
} from "./peer-analyst-quality-gate";
import type { DivLabPeerAnalystDraft } from "./peer-analyst-schema";
import {
  createPersistedVersionBoundPeerComparisonAudit,
  type CreatePersistedPeerComparisonAuditResult,
} from "./peer-comparison-audit-service";
import {
  loadStoredPeerComparisonAuditById,
} from "./peer-comparison-audit-read-repository";
import {
  loadPublishableDivLabResearchVersionById,
} from "./research-version-repository";

export type CreateDivLabPeerAiAnalysisResult =
  | { status: "target_research_missing" }
  | {
      status: "content_already_exists";
      contentId: string;
      schemaVersion: string;
    }
  | {
      status: "registry_missing";
      targetAnalysisVersionId: string;
    }
  | {
      status: "peer_research_missing";
      targetAnalysisVersionId: string;
      missingPeers: Array<{ symbol: string; exchange: string; name: string }>;
    }
  | {
      status: "gateway_auth_missing";
      targetAnalysisVersionId: string;
      peerAuditId: string;
    }
  | {
      status: "analyst_quality_failed";
      targetAnalysisVersionId: string;
      peerAuditId: string;
      draft: DivLabPeerAnalystDraft;
      qualityGate: DivLabPeerAnalystQualityGate;
      analystModel: string;
      usage: DivLabAnalystUsage;
    }
  | {
      status: "complete";
      targetAnalysisVersionId: string;
      peerAuditId: string;
      peerContext: DivLabPeerAnalystContext;
      draft: DivLabPeerAnalystDraft;
      qualityGate: DivLabPeerAnalystQualityGate;
      analystModel: string;
      usage: DivLabAnalystUsage;
      persisted: PersistedDivLabPeerAnalysisContent;
    };

function auditFailure(
  result: Exclude<CreatePersistedPeerComparisonAuditResult, { status: "ready" }>,
  targetAnalysisVersionId: string,
): CreateDivLabPeerAiAnalysisResult {
  if (result.status === "target_research_missing") {
    return { status: "target_research_missing" };
  }
  if (result.status === "registry_missing") {
    return { status: "registry_missing", targetAnalysisVersionId };
  }
  return {
    status: "peer_research_missing",
    targetAnalysisVersionId,
    missingPeers: result.missingPeers,
  };
}

/**
 * Conservative first Analyst v3-peer execution path.
 *
 * 1. The target is one already-persisted immutable publishable research version.
 * 2. A point-in-time peer audit is assembled exclusively from already-persisted
 *    research versions and persisted before model work.
 * 3. The established Analyst v2 model call generates the target-company thesis.
 * 4. Peer context is appended deterministically; it does not steer the AI-written
 *    core view/scenarios and does not add another model/provider call.
 * 5. v3-peer contract + quality gate run before the dedicated database RPC.
 *
 * This keeps cost and financial behavior bounded while making peer valuation
 * visible in a fully auditable analysis version. A later model-enabled peer
 * interpretation can be evaluated separately without silently changing v2.
 */
export async function createDivLabPeerAiAnalysis(input: {
  supabase: SupabaseClient;
  targetAnalysisVersionId: string;
  now?: Date;
  useEscalationModel?: boolean;
  maxPeerConcurrency?: number;
}): Promise<CreateDivLabPeerAiAnalysisResult> {
  const targetResearch = await loadPublishableDivLabResearchVersionById({
    supabase: input.supabase,
    analysisVersionId: input.targetAnalysisVersionId,
  });
  if (!targetResearch) return { status: "target_research_missing" };

  const existing = await input.supabase
    .from("divlab_analysis_contents")
    .select("id,schema_version")
    .eq("analysis_version_id", targetResearch.analysisVersionId)
    .maybeSingle();
  if (existing.error) {
    throw new Error(
      `divlab_peer_ai_analysis_existing_content_failed:${existing.error.code ?? "unknown"}`,
    );
  }
  if (existing.data) {
    return {
      status: "content_already_exists",
      contentId: existing.data.id,
      schemaVersion: existing.data.schema_version,
    };
  }

  const auditResult = await createPersistedVersionBoundPeerComparisonAudit({
    supabase: input.supabase,
    targetAnalysisVersionId: targetResearch.analysisVersionId,
    maxConcurrency: input.maxPeerConcurrency,
  });
  if (auditResult.status !== "ready") {
    return auditFailure(auditResult, targetResearch.analysisVersionId);
  }

  const storedAudit = await loadStoredPeerComparisonAuditById({
    supabase: input.supabase,
    auditId: auditResult.persisted.auditId,
  });
  if (!storedAudit) {
    throw new Error("divlab_peer_ai_analysis_persisted_audit_missing");
  }
  const peerContext = buildDivLabPeerAnalystContext(storedAudit);

  let analyst: Awaited<ReturnType<typeof generateDivLabAnalystDraft>>;
  try {
    analyst = await generateDivLabAnalystDraft({
      packet: targetResearch.packet,
      useEscalationModel: input.useEscalationModel,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "gateway_auth_missing") {
      return {
        status: "gateway_auth_missing",
        targetAnalysisVersionId: targetResearch.analysisVersionId,
        peerAuditId: storedAudit.auditId,
      };
    }
    throw error;
  }

  const draft = composePeerAnalystDraft({
    baseDraft: analyst.draft,
    peerContext,
  });
  validatePeerAnalystDraft({
    packet: targetResearch.packet,
    targetAnalysisVersionId: targetResearch.analysisVersionId,
    peerContext,
    draft,
  });

  const qualityGate = evaluatePeerAnalystContentQuality({
    packet: targetResearch.packet,
    targetAnalysisVersionId: targetResearch.analysisVersionId,
    peerContext,
    draft,
  });
  if (!qualityGate.publishable) {
    return {
      status: "analyst_quality_failed",
      targetAnalysisVersionId: targetResearch.analysisVersionId,
      peerAuditId: storedAudit.auditId,
      draft,
      qualityGate,
      analystModel: analyst.model,
      usage: analyst.usage,
    };
  }

  const generatedAt = input.now ?? new Date();
  const persisted = await persistDivLabPeerAnalysisContent({
    supabase: input.supabase,
    analysisVersionId: targetResearch.analysisVersionId,
    peerAuditId: storedAudit.auditId,
    analystModel: analyst.model,
    draft,
    qualityGate,
    usage: analyst.usage,
    generatedAt: generatedAt.toISOString(),
  });

  return {
    status: "complete",
    targetAnalysisVersionId: targetResearch.analysisVersionId,
    peerAuditId: storedAudit.auditId,
    peerContext,
    draft,
    qualityGate,
    analystModel: analyst.model,
    usage: analyst.usage,
    persisted,
  };
}
