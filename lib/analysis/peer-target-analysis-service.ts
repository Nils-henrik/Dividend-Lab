import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDivLabAiAnalysis,
  type CreateDivLabAiAnalysisResult,
} from "./ai-analysis-service";
import type { CreateDivLabPeerAiAnalysisResult } from "./peer-ai-analysis-service";
import {
  finalizeDivLabPeerAnalyst,
  type PreparedDivLabAnalystResult,
} from "./peer-analyst-finalization";
import { buildDivLabPeerAnalystContext } from "./peer-analyst-context";
import { persistDivLabPeerAnalysisContent } from "./peer-analysis-content-repository";
import { buildVersionBoundPeerComparisonAudit } from "./peer-comparison-audit";
import { loadStoredPeerComparisonAuditById } from "./peer-comparison-audit-read-repository";
import { persistVersionBoundPeerComparisonAudit } from "./peer-comparison-audit-repository";
import { loadLatestDivLabPeerSet } from "./peer-registry-repository";
import { persistDivLabResearchPacket } from "./repository";
import { loadLatestPeerReadyDivLabResearchVersionAsOf } from "./research-version-repository";

export type CreateDivLabPeerTargetAnalysisResult =
  | {
      status: "registry_missing_before_analyst";
    }
  | {
      status: "peer_research_missing_before_analyst";
      missingPeers: Array<{ symbol: string; exchange: string; name: string }>;
    }
  | {
      status: "base_analysis_failed";
      result: Exclude<CreateDivLabAiAnalysisResult, { ok: true }>;
    }
  | {
      status: "final_research_not_publishable";
      blockers: string[];
    }
  | {
      status: "complete" | "peer_finalize_failed";
      targetAnalysisVersionId: string;
      baseAnalysis: Extract<CreateDivLabAiAnalysisResult, { ok: true }>;
      peerAnalysis: CreateDivLabPeerAiAnalysisResult;
    };

/**
 * One-call target orchestration for Analyst v3-peer.
 *
 * The registry set and every peer-ready immutable research version are loaded
 * once before any expensive model work and then pinned in memory. The exact
 * same objects are used to build the version-bound audit after target research
 * persistence; the orchestration never asks for "latest" peers again after the
 * Analyst call. This closes the preflight->audit version-drift window while
 * preserving the single-call target thesis/scenario generation invariant.
 */
export async function createDivLabPeerTargetAnalysis(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  slug?: string;
  useEscalationModel?: boolean;
  maxPeerConcurrency?: number;
}): Promise<CreateDivLabPeerTargetAnalysisResult> {
  const now = input.now ?? new Date();
  const boundary = now.toISOString();

  const registry = await loadLatestDivLabPeerSet({
    supabase: input.supabase,
    symbol: input.symbol,
    exchange: input.exchange,
    maxDataAsOf: boundary,
  });
  if (!registry) return { status: "registry_missing_before_analyst" };

  const peerResearch = await Promise.all(
    registry.members.map(async (member) => ({
      member,
      research: await loadLatestPeerReadyDivLabResearchVersionAsOf({
        supabase: input.supabase,
        symbol: member.symbol,
        exchange: member.exchange,
        maxDataAsOf: boundary,
      }),
    })),
  );
  const missingPeers = peerResearch
    .filter((entry) => !entry.research)
    .map(({ member }) => ({
      symbol: member.symbol,
      exchange: member.exchange,
      name: member.name,
    }))
    .sort((a, b) => `${a.exchange}:${a.symbol}`.localeCompare(`${b.exchange}:${b.symbol}`));
  if (missingPeers.length) {
    return { status: "peer_research_missing_before_analyst", missingPeers };
  }

  const pinnedPeerResearch = peerResearch.map((entry) => {
    if (!entry.research) {
      throw new Error("divlab_peer_target_preflight_peer_missing_after_check");
    }
    return entry.research;
  });

  const baseAnalysis = await createDivLabAiAnalysis({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now,
    useEscalationModel: input.useEscalationModel,
  });
  if (!baseAnalysis.ok) return { status: "base_analysis_failed", result: baseAnalysis };

  if (!baseAnalysis.finalPacket.qualityGate.publishable) {
    return {
      status: "final_research_not_publishable",
      blockers: [...baseAnalysis.finalPacket.qualityGate.blockers],
    };
  }

  const targetPersistence = await persistDivLabResearchPacket({
    supabase: input.supabase,
    packet: baseAnalysis.finalPacket,
    slug: input.slug,
  });
  if (!targetPersistence.publishable) {
    throw new Error("divlab_peer_target_research_persisted_nonpublishable");
  }

  const targetResearch = {
    analysisVersionId: targetPersistence.versionId,
    packet: baseAnalysis.finalPacket,
  };
  const audit = buildVersionBoundPeerComparisonAudit({
    registry,
    targetResearch,
    peerResearch: pinnedPeerResearch,
  });
  const persistedAudit = await persistVersionBoundPeerComparisonAudit({
    supabase: input.supabase,
    audit,
  });
  if (
    persistedAudit.targetAnalysisVersionId.toLowerCase() !==
    targetPersistence.versionId.toLowerCase()
  ) {
    throw new Error("divlab_peer_target_audit_target_version_mismatch");
  }

  const storedAudit = await loadStoredPeerComparisonAuditById({
    supabase: input.supabase,
    auditId: persistedAudit.auditId,
  });
  if (!storedAudit) {
    throw new Error("divlab_peer_target_persisted_audit_missing");
  }
  const peerContext = buildDivLabPeerAnalystContext(storedAudit);

  const analyst: PreparedDivLabAnalystResult = {
    draft: baseAnalysis.analystDraft,
    model: baseAnalysis.model,
    usage: baseAnalysis.usage,
  };
  const finalized = finalizeDivLabPeerAnalyst({
    targetResearch,
    peerContext,
    analyst,
  });

  if (!finalized.qualityGate.publishable) {
    const peerAnalysis: CreateDivLabPeerAiAnalysisResult = {
      status: "analyst_quality_failed",
      targetAnalysisVersionId: targetPersistence.versionId,
      peerAuditId: storedAudit.auditId,
      draft: finalized.draft,
      qualityGate: finalized.qualityGate,
      analystModel: finalized.analystModel,
      usage: finalized.usage,
    };
    return {
      status: "peer_finalize_failed",
      targetAnalysisVersionId: targetPersistence.versionId,
      baseAnalysis,
      peerAnalysis,
    };
  }

  const persisted = await persistDivLabPeerAnalysisContent({
    supabase: input.supabase,
    analysisVersionId: targetPersistence.versionId,
    peerAuditId: storedAudit.auditId,
    analystModel: finalized.analystModel,
    draft: finalized.draft,
    qualityGate: finalized.qualityGate,
    usage: finalized.usage,
    generatedAt: now.toISOString(),
  });

  const peerAnalysis: CreateDivLabPeerAiAnalysisResult = {
    status: "complete",
    targetAnalysisVersionId: targetPersistence.versionId,
    peerAuditId: storedAudit.auditId,
    peerContext,
    draft: finalized.draft,
    qualityGate: finalized.qualityGate,
    analystModel: finalized.analystModel,
    usage: finalized.usage,
    persisted,
  };

  return {
    status: "complete",
    targetAnalysisVersionId: targetPersistence.versionId,
    baseAnalysis,
    peerAnalysis,
  };
}
