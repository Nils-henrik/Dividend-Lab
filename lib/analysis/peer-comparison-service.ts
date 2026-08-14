import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabResearchPacket } from "./deep-research";
import {
  hydratePeerComparisonFromRegistry,
  type RegistryPeerComparisonResult,
  type RegistryPeerResearchLoader,
} from "./peer-registry-hydration";
import { loadLatestDivLabPeerSet } from "./peer-registry-repository";

export type LatestRegistryPeerComparisonResult =
  | {
      status: "registry_missing";
      result: null;
    }
  | {
      status: "ready" | "insufficient";
      result: RegistryPeerComparisonResult;
    };

/**
 * Server-side bridge from the immutable registry to deterministic peer
 * comparison. It deliberately accepts an injected research loader so this layer
 * does not decide cache policy, external-call budget or whether a peer needs a
 * fresh Deep Research run. Hydration concurrency is bounded by the underlying
 * contract (default 3, hard maximum 5).
 */
export async function createLatestRegistryPeerComparison(input: {
  supabase: SupabaseClient;
  targetPacket: DivLabResearchPacket;
  loadPeerResearch: RegistryPeerResearchLoader;
  maxConcurrency?: number;
}): Promise<LatestRegistryPeerComparisonResult> {
  const registry = await loadLatestDivLabPeerSet({
    supabase: input.supabase,
    symbol: input.targetPacket.instrument.symbol,
    exchange: input.targetPacket.instrument.exchange,
  });

  if (!registry) {
    return {
      status: "registry_missing",
      result: null,
    };
  }

  const result = await hydratePeerComparisonFromRegistry({
    targetPacket: input.targetPacket,
    registry,
    loadPeerResearch: input.loadPeerResearch,
    maxConcurrency: input.maxConcurrency,
  });

  return {
    status: result.comparison.status,
    result,
  };
}
