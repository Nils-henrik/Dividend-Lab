import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createDivLabAiAnalysis,
  type CreateDivLabAiAnalysisResult,
} from "./ai-analysis-service";
import {
  createDivLabPeerAiAnalysis,
  type CreateDivLabPeerAiAnalysisResult,
} from "./peer-ai-analysis-service";
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
 * Expensive model work starts only after the curated registry and all required
 * peer-ready immutable research versions already exist. The ordinary Analyst v2
 * call then runs once, creates the target's scenario assumptions in-memory, and
 * the final publishable research packet is persisted without analyst content.
 * The exact same draft/model/usage is subsequently reused by v3-peer, so peer
 * integration adds no second model call and no rewritten target thesis.
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

  const peerAnalysis = await createDivLabPeerAiAnalysis({
    supabase: input.supabase,
    targetAnalysisVersionId: targetPersistence.versionId,
    now,
    maxPeerConcurrency: input.maxPeerConcurrency,
    preparedAnalyst: {
      draft: baseAnalysis.analystDraft,
      model: baseAnalysis.model,
      usage: baseAnalysis.usage,
    },
  });

  return {
    status: peerAnalysis.status === "complete" ? "complete" : "peer_finalize_failed",
    targetAnalysisVersionId: targetPersistence.versionId,
    baseAnalysis,
    peerAnalysis,
  };
}
