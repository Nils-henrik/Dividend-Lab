import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildVersionBoundPeerComparisonAudit,
  type VersionBoundPeerComparisonAudit,
  type VersionedResearchPacket,
} from "./peer-comparison-audit";
import {
  persistVersionBoundPeerComparisonAudit,
  type PersistedPeerComparisonAudit,
} from "./peer-comparison-audit-repository";
import {
  DEFAULT_PEER_RESEARCH_CONCURRENCY,
  MAX_PEER_RESEARCH_CONCURRENCY,
} from "./peer-registry-hydration";
import type { LoadedPeerRegistryMember, LoadedPeerRegistrySet } from "./peer-registry-read";
import { loadLatestDivLabPeerSet } from "./peer-registry-repository";
import {
  loadLatestPublishableDivLabResearchVersionAsOf,
  loadPublishableDivLabResearchVersionById,
} from "./research-version-repository";

export type CreatePersistedPeerComparisonAuditResult =
  | {
      status: "target_research_missing";
      targetResearch: null;
    }
  | {
      status: "registry_missing";
      targetResearch: VersionedResearchPacket;
    }
  | {
      status: "peer_research_missing";
      targetResearch: VersionedResearchPacket;
      registry: LoadedPeerRegistrySet;
      missingPeers: Array<{ symbol: string; exchange: string; name: string }>;
    }
  | {
      status: "ready";
      targetResearch: VersionedResearchPacket;
      registry: LoadedPeerRegistrySet;
      audit: VersionBoundPeerComparisonAudit;
      persisted: PersistedPeerComparisonAudit;
    };

function identityKey(input: { symbol: string; exchange: string }): string {
  return `${input.exchange.trim().toUpperCase()}:${input.symbol.trim().toUpperCase()}`;
}

function concurrency(value: number | undefined): number {
  const resolved = value ?? DEFAULT_PEER_RESEARCH_CONCURRENCY;
  if (
    !Number.isInteger(resolved) ||
    resolved < 1 ||
    resolved > MAX_PEER_RESEARCH_CONCURRENCY
  ) {
    throw new Error("peer_comparison_audit_service_concurrency_invalid");
  }
  return resolved;
}

async function loadPeerVersions(input: {
  supabase: SupabaseClient;
  members: readonly LoadedPeerRegistryMember[];
  maxDataAsOf: string;
  maxConcurrency?: number;
}): Promise<Array<VersionedResearchPacket | null>> {
  const limit = concurrency(input.maxConcurrency);
  const output: Array<VersionedResearchPacket | null> = new Array(input.members.length).fill(
    null,
  );
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= input.members.length) return;
      const member = input.members[index];
      output[index] = await loadLatestPublishableDivLabResearchVersionAsOf({
        supabase: input.supabase,
        symbol: member.symbol,
        exchange: member.exchange,
        maxDataAsOf: input.maxDataAsOf,
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, input.members.length) }, () => worker()),
  );
  return output;
}

/**
 * Build and persist one analyst-grade peer comparison strictly from immutable
 * research already stored in DivLab.
 *
 * This service never triggers live research and never substitutes an unregistered
 * peer. It selects the latest publishable peer version available no later than
 * the exact target research boundary, then persists the resulting audit before
 * any future analyst-consumption step can use it.
 */
export async function createPersistedVersionBoundPeerComparisonAudit(input: {
  supabase: SupabaseClient;
  targetAnalysisVersionId: string;
  maxConcurrency?: number;
}): Promise<CreatePersistedPeerComparisonAuditResult> {
  const targetResearch = await loadPublishableDivLabResearchVersionById({
    supabase: input.supabase,
    analysisVersionId: input.targetAnalysisVersionId,
  });
  if (!targetResearch) {
    return {
      status: "target_research_missing",
      targetResearch: null,
    };
  }

  const registry = await loadLatestDivLabPeerSet({
    supabase: input.supabase,
    symbol: targetResearch.packet.instrument.symbol,
    exchange: targetResearch.packet.instrument.exchange,
    maxDataAsOf: targetResearch.packet.dataAsOf,
  });
  if (!registry) {
    return {
      status: "registry_missing",
      targetResearch,
    };
  }

  const loadedPeers = await loadPeerVersions({
    supabase: input.supabase,
    members: registry.members,
    maxDataAsOf: targetResearch.packet.dataAsOf,
    maxConcurrency: input.maxConcurrency,
  });

  const peerResearch: VersionedResearchPacket[] = [];
  const missingPeers: Array<{ symbol: string; exchange: string; name: string }> = [];
  loadedPeers.forEach((research, index) => {
    const member = registry.members[index];
    if (!research) {
      missingPeers.push({
        symbol: member.symbol,
        exchange: member.exchange,
        name: member.name,
      });
      return;
    }
    peerResearch.push(research);
  });

  if (missingPeers.length) {
    missingPeers.sort((a, b) => identityKey(a).localeCompare(identityKey(b)));
    return {
      status: "peer_research_missing",
      targetResearch,
      registry,
      missingPeers,
    };
  }

  const audit = buildVersionBoundPeerComparisonAudit({
    registry,
    targetResearch,
    peerResearch,
  });
  const persisted = await persistVersionBoundPeerComparisonAudit({
    supabase: input.supabase,
    audit,
  });

  return {
    status: "ready",
    targetResearch,
    registry,
    audit,
    persisted,
  };
}
