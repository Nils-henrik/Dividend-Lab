import { DIVLAB_PEER_COMPARISON_VERSION, type PeerBasisSource, type VerifiedPeerInput } from "./peer-comparison";

export type PeerRegistryBundle = {
  target: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  methodologyVersion: typeof DIVLAB_PEER_COMPARISON_VERSION;
  sources: Array<{
    id: string;
    publisher: string;
    url: string;
    verifiedAt: string;
  }>;
  members: Array<{
    symbol: string;
    exchange: string;
    name: string;
    relationshipSourceIds: string[];
  }>;
};

function normalizedIdentity(value: string): string {
  return value.trim().toUpperCase();
}

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Pure boundary validator used before calling the database RPC.
 * PostgreSQL repeats the same invariants and remains authoritative.
 */
export function buildPeerRegistryBundle(input: {
  target: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  sources: readonly PeerBasisSource[];
  peers: readonly VerifiedPeerInput[];
}): PeerRegistryBundle {
  const target = {
    symbol: normalizedIdentity(input.target.symbol),
    exchange: normalizedIdentity(input.target.exchange),
    name: input.target.name.trim(),
  };
  if (!target.symbol || !target.exchange || !target.name) {
    throw new Error("peer_registry_target_identity_required");
  }
  if (!validDate(input.dataAsOf)) {
    throw new Error("peer_registry_data_as_of_invalid");
  }
  if (input.peers.length < 3) {
    throw new Error("peer_registry_requires_three_members");
  }
  if (!input.sources.length) {
    throw new Error("peer_registry_requires_source");
  }

  const sourceIds = new Set<string>();
  const sources = input.sources.map((source) => {
    const id = source.id.trim();
    const publisher = source.publisher.trim();
    const url = source.url.trim();
    if (!id || !publisher || !validHttpsUrl(url) || !validDate(source.verifiedAt)) {
      throw new Error(`peer_registry_source_invalid:${id || "missing"}`);
    }
    if (sourceIds.has(id)) {
      throw new Error(`peer_registry_source_duplicate:${id}`);
    }
    sourceIds.add(id);
    return {
      id,
      publisher,
      url,
      verifiedAt: new Date(source.verifiedAt).toISOString(),
    };
  });

  const targetKey = `${target.exchange}:${target.symbol}`;
  const memberKeys = new Set<string>();
  const members = input.peers.map((peer) => {
    const member = {
      symbol: normalizedIdentity(peer.snapshot.instrument.symbol),
      exchange: normalizedIdentity(peer.snapshot.instrument.exchange),
      name: peer.snapshot.instrument.name.trim(),
      relationshipSourceIds: unique(peer.relationshipSourceIds),
    };
    if (!member.symbol || !member.exchange || !member.name) {
      throw new Error("peer_registry_member_identity_required");
    }
    const key = `${member.exchange}:${member.symbol}`;
    if (key === targetKey) {
      throw new Error(`peer_registry_contains_target:${key}`);
    }
    if (memberKeys.has(key)) {
      throw new Error(`peer_registry_duplicate_member:${key}`);
    }
    memberKeys.add(key);
    if (!member.relationshipSourceIds.length) {
      throw new Error(`peer_registry_relationship_source_required:${key}`);
    }
    for (const sourceId of member.relationshipSourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`peer_registry_relationship_source_unknown:${key}:${sourceId}`);
      }
    }
    return member;
  });

  return {
    target,
    dataAsOf: new Date(input.dataAsOf).toISOString(),
    methodologyVersion: DIVLAB_PEER_COMPARISON_VERSION,
    sources,
    members,
  };
}
