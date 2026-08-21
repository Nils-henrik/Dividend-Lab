import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateDivLabAnalystDraft,
  type DivLabAnalystUsage,
} from "./analyst";
import {
  finalizeDivLabPeerAnalyst,
  type PreparedDivLabAnalystResult,
} from "./peer-analyst-finalization";
import {
  buildDivLabPeerAnalystContext,
  type DivLabPeerAnalystContext,
} from "./peer-analyst-context";
import type { DivLabPeerAnalystQualityGate } from "./peer-analyst-quality-gate";
import type { DivLabPeerAnalystDraft } from "./peer-analyst-schema";
import {
  persistDivLabPeerAnalysisContent,
  type PersistedDivLabPeerAnalysisContent,
} from "./peer-analysis-content-repository";
import {
  createPersistedVersionBoundPeerComparisonAudit,
  type CreatePersistedPeerComparisonAuditResult,
} from "./peer-comparison-audit-service";
import { loadStoredPeerComparisonAuditById } from "./peer-comparison-audit-read-repository";
import { loadPublishableDivLabResearchVersionById } from "./research-version-repository";

export type { PreparedDivLabAnalystResult } from "./peer-analyst-finalization";

export type CreateDivLabPeerAiAnalysisResult =
  | { status: "target_research_missing" }
  | { status: "content_already_exists"; contentId: string; schemaVersion: string }
  | { status: "registry_missing"; targetAnalysisVersionId: string }
  | {
      status: "peer_research_missing";
      targetAnalysisVersionId: string;
      missingPeers: Array<{ symbol: string; exchange: string; name: string }>;
    }
  | { status: "gateway_auth_missing"; targetAnalysisVersionId: string; peerAuditId: string }
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
  if (result.status === "target_research_missing") return { status: "target_research_missing" };
  if (result.status === "registry_missing") return { status: "registry_missing", targetAnalysisVersionId };
  return { status: "peer_research_missing", targetAnalysisVersionId, missingPeers: result.missingPeers };
}

/**
 * Conservative Analyst v3-peer execution for one already-persisted target
 * research version. Callers may supply the exact Analyst v2 result that created
 * the target's valuation scenarios; when supplied it is revalidated against the
 * immutable target packet and reused, avoiding a second model call.
 *
 * Database/audit orchestration stays here. The deterministic Analyst v3-peer
 * composition and quality checks live in finalizeDivLabPeerAnalyst so the same
 * fail-closed finalization can later be reused across an explicit phase boundary.
 */
export async function createDivLabPeerAiAnalysis(input: {
  supabase: SupabaseClient;
  targetAnalysisVersionId: string;
  now?: Date;
  useEscalationModel?: boolean;
  maxPeerConcurrency?: number;
  preparedAnalyst?: PreparedDivLabAnalystResult;
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
    throw new Error(`divlab_peer_ai_analysis_existing_content_failed:${existing.error.code ?? "unknown"}`);
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
  if (!storedAudit) throw new Error("divlab_peer_ai_analysis_persisted_audit_missing");
  const peerContext = buildDivLabPeerAnalystContext(storedAudit);

  let analyst: PreparedDivLabAnalystResult;
  if (input.preparedAnalyst) {
    analyst = input.preparedAnalyst;
  } else {
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
  }

  const finalized = finalizeDivLabPeerAnalyst({
    targetResearch,
    peerContext,
    analyst,
  });

  if (!finalized.qualityGate.publishable) {
    return {
      status: "analyst_quality_failed",
      targetAnalysisVersionId: targetResearch.analysisVersionId,
      peerAuditId: storedAudit.auditId,
      draft: finalized.draft,
      qualityGate: finalized.qualityGate,
      analystModel: finalized.analystModel,
      usage: finalized.usage,
    };
  }

  const generatedAt = input.now ?? new Date();
  const persisted = await persistDivLabPeerAnalysisContent({
    supabase: input.supabase,
    analysisVersionId: targetResearch.analysisVersionId,
    peerAuditId: storedAudit.auditId,
    analystModel: finalized.analystModel,
    draft: finalized.draft,
    qualityGate: finalized.qualityGate,
    usage: finalized.usage,
    generatedAt: generatedAt.toISOString(),
  });

  return {
    status: "complete",
    targetAnalysisVersionId: targetResearch.analysisVersionId,
    peerAuditId: storedAudit.auditId,
    peerContext,
    draft: finalized.draft,
    qualityGate: finalized.qualityGate,
    analystModel: finalized.analystModel,
    usage: finalized.usage,
    persisted,
  };
}
