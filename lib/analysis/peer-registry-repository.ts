import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PeerBasisSource, VerifiedPeerInput } from "./peer-comparison";
import { buildPeerRegistryBundle } from "./peer-registry-contract";
import {
  buildLoadedPeerRegistrySet,
  type LoadedPeerRegistrySet,
} from "./peer-registry-read";

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

function canonicalIdentity(value: string): string {
  return value.trim().toUpperCase();
}

function queryError(stage: string, error: { code?: string } | null): Error {
  return new Error(`divlab_peer_registry_${stage}_failed:${error?.code ?? "unknown"}`);
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

/**
 * Load the latest immutable peer-set version for one canonical instrument.
 *
 * The read side never invents or completes a partial relationship. Rows are
 * assembled through `buildLoadedPeerRegistrySet`, which fails closed if the
 * latest version is incomplete, cross-linked to another set or lacks an
 * explicit source relationship for any member.
 */
export async function loadLatestDivLabPeerSet(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
}): Promise<LoadedPeerRegistrySet | null> {
  const symbol = canonicalIdentity(input.symbol);
  const exchange = canonicalIdentity(input.exchange);
  if (!symbol || !exchange) throw new Error("divlab_peer_registry_identity_required");

  const targetResult = await input.supabase
    .from("divlab_peer_targets")
    .select("id,instrument_symbol,exchange")
    .eq("instrument_symbol", symbol)
    .eq("exchange", exchange)
    .maybeSingle();

  if (targetResult.error) throw queryError("load_target", targetResult.error);
  if (!targetResult.data) return null;

  const peerSetResult = await input.supabase
    .from("divlab_peer_sets")
    .select("id,target_id,version_number,target_name,data_as_of,methodology_version")
    .eq("target_id", targetResult.data.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (peerSetResult.error) throw queryError("load_set", peerSetResult.error);
  if (!peerSetResult.data) throw new Error("divlab_peer_registry_target_without_set");

  const peerSetId = peerSetResult.data.id;
  const [sourceResult, memberResult, linkResult] = await Promise.all([
    input.supabase
      .from("divlab_peer_set_sources")
      .select("id,peer_set_id,source_key,publisher,source_url,verified_at")
      .eq("peer_set_id", peerSetId),
    input.supabase
      .from("divlab_peer_set_members")
      .select("id,peer_set_id,instrument_symbol,exchange,instrument_name")
      .eq("peer_set_id", peerSetId),
    input.supabase
      .from("divlab_peer_member_sources")
      .select("peer_set_id,peer_member_id,peer_set_source_id")
      .eq("peer_set_id", peerSetId),
  ]);

  if (sourceResult.error) throw queryError("load_sources", sourceResult.error);
  if (memberResult.error) throw queryError("load_members", memberResult.error);
  if (linkResult.error) throw queryError("load_links", linkResult.error);

  return buildLoadedPeerRegistrySet({
    target: targetResult.data,
    peerSet: peerSetResult.data,
    sources: sourceResult.data ?? [],
    members: memberResult.data ?? [],
    links: linkResult.data ?? [],
  });
}
