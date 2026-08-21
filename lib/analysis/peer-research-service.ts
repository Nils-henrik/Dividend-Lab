import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildDivLabResearchPacket,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  evaluatePeerResearchReadiness,
  type DivLabPeerResearchReadiness,
} from "./peer-research-readiness";
import {
  persistDivLabResearchPacket,
  type PersistedDivLabAnalysisVersion,
} from "./repository";
import {
  loadDivLabResearchInputs,
  type DivLabResearchLoadResult,
} from "./research-loader";

export type CreateDivLabPeerResearchVersionResult =
  | {
      ok: true;
      packet: DivLabResearchPacket;
      readiness: DivLabPeerResearchReadiness;
      persistence: PersistedDivLabAnalysisVersion | null;
    }
  | {
      ok: false;
      stage: "research";
      reason: Extract<DivLabResearchLoadResult, { ok: false }>["reason"];
    }
  | {
      ok: false;
      stage: "peer_readiness";
      reason: "peer_research_readiness_failed";
      packet: DivLabResearchPacket;
      readiness: DivLabPeerResearchReadiness;
    };

/**
 * Build and optionally persist one deterministic facts-only research version for
 * peer comparison. This path makes no analyst/model call and intentionally does
 * not manufacture Bear/Base/Bull assumptions merely to make a peer publishable.
 */
export async function createDivLabPeerResearchVersion(input: {
  symbol: string;
  exchange: string;
  name: string;
  fetchImpl?: typeof fetch;
  now?: Date;
  supabase?: SupabaseClient;
  slug?: string;
}): Promise<CreateDivLabPeerResearchVersionResult> {
  const now = input.now ?? new Date();
  const loaded = await loadDivLabResearchInputs({
    symbol: input.symbol,
    exchange: input.exchange,
    name: input.name,
    fetchImpl: input.fetchImpl,
    now,
  });
  if (!loaded.ok) {
    return {
      ok: false,
      stage: "research",
      reason: loaded.reason,
    };
  }

  const research = loaded.value;
  const packet = buildDivLabResearchPacket({
    symbol: research.instrument.symbol,
    exchange: research.instrument.exchange,
    name: research.instrument.name,
    currency: research.instrument.currency,
    currentPrice: research.instrument.currentPrice,
    history: research.history,
    fundamentals: research.fundamentals,
    companyClassification: research.companyClassification,
    fxConversion: research.fxConversion,
    valuationScenarios: [],
    sources: research.sources,
    evidence: research.evidence,
    now,
  });

  // A facts-only peer version is an internal evidence object, never a public
  // analysis. If the ordinary publication contract ever changes such that this
  // becomes publishable without analyst scenarios, fail closed and re-review it.
  if (packet.qualityGate.publishable) {
    throw new Error("peer_research_facts_packet_unexpectedly_publishable");
  }

  const readiness = evaluatePeerResearchReadiness(packet);
  if (!readiness.ready) {
    return {
      ok: false,
      stage: "peer_readiness",
      reason: "peer_research_readiness_failed",
      packet,
      readiness,
    };
  }

  const persistence = input.supabase
    ? await persistDivLabResearchPacket({
        supabase: input.supabase,
        packet,
        slug: input.slug,
      })
    : null;

  if (persistence?.publishable) {
    throw new Error("peer_research_persisted_as_publishable");
  }

  return {
    ok: true,
    packet,
    readiness,
    persistence,
  };
}
