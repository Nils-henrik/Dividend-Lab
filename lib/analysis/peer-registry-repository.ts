import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PeerBasisSource, VerifiedPeerInput } from "./peer-comparison";
import { buildPeerRegistryBundle } from "./peer-registry-contract";

export type PersistedPeerSet = {
  targetId: string;
  peerSetId: string;
  versionNumber: number;
  peerCount: number;
  sourceCount: number;
  methodologyVersion: string;
};

function readPersistResult(value: unknown): PersistedPeerSet {
  if (!value || typeof value !== "object") {
    throw new Error("divlab_peer_registry_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const targetId = typeof row.target_id === "string" ? row.target_id : null;
  const peerSetId = typeof row.peer_set_id === "string" ? row.peer_set_id : null;
  const methodologyVersion =
    typeof row.methodology_version === "string" ? row.methodology_version : null;
  const versionNumber = Number(row.version_number);
  const peerCount = Number(row.peer_count);
  const sourceCount = Number(row.source_count);
  if (
    !targetId ||
    !peerSetId ||
    !methodologyVersion ||
    !Number.isInteger(versionNumber) ||
    versionNumber <= 0 ||
    !Number.isInteger(peerCount) ||
    peerCount < 3 ||
    !Number.isInteger(sourceCount) ||
    sourceCount < 1
  ) {
    throw new Error("divlab_peer_registry_invalid_result");
  }
  return {
    targetId,
    peerSetId,
    versionNumber,
    peerCount,
    sourceCount,
    methodologyVersion,
  };
}

/**
 * Persist one immutable, explicitly sourced peer-set version.
 *
 * This does not discover peers and does not persist comparison output. The
 * registry stores only the audited relationship decision so fresh Deep Research
 * packets can later be compared deterministically against that same peer set.
 */
export async function persistDivLabPeerSet(input: {
  supabase: SupabaseClient;
  target: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  sources: readonly PeerBasisSource[];
  peers: readonly VerifiedPeerInput[];
}): Promise<PersistedPeerSet> {
  const bundle = buildPeerRegistryBundle({
    target: input.target,
    dataAsOf: input.dataAsOf,
    sources: input.sources,
    peers: input.peers,
  });

  const { data, error } = await input.supabase.rpc("persist_divlab_peer_set", {
    p_target_symbol: bundle.target.symbol,
    p_target_exchange: bundle.target.exchange,
    p_target_name: bundle.target.name,
    p_data_as_of: bundle.dataAsOf,
    p_methodology_version: bundle.methodologyVersion,
    p_sources: bundle.sources,
    p_members: bundle.members,
  });

  if (error) {
    throw new Error(`divlab_peer_registry_persist_failed:${error.code ?? "unknown"}`);
  }
  return readPersistResult(data);
}
