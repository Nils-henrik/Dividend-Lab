import { DIVLAB_PEER_COMPARISON_VERSION, type PeerBasisSource } from "./peer-comparison";

export type LoadedPeerRegistryMember = {
  symbol: string;
  exchange: string;
  name: string;
  relationshipSourceIds: string[];
};

export type LoadedPeerRegistrySet = {
  targetId: string;
  peerSetId: string;
  versionNumber: number;
  target: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  methodologyVersion: typeof DIVLAB_PEER_COMPARISON_VERSION;
  sources: PeerBasisSource[];
  members: LoadedPeerRegistryMember[];
};

export type PeerRegistryReadRows = {
  target: unknown;
  peerSet: unknown;
  sources: readonly unknown[];
  members: readonly unknown[];
  links: readonly unknown[];
};

function record(value: unknown, error: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(error);
  }
  return value as Record<string, unknown>;
}

function requiredString(row: Record<string, unknown>, key: string, error: string): string {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(error);
  return value.trim();
}

function canonicalIdentity(value: string): string {
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

/**
 * Pure fail-closed assembler for the peer-registry read side.
 *
 * Database rows are treated as untrusted input even though they come from the
 * internal service-role path. A partial set is never returned as if it were a
 * verified peer set.
 */
export function buildLoadedPeerRegistrySet(
  rows: PeerRegistryReadRows,
): LoadedPeerRegistrySet {
  const targetRow = record(rows.target, "peer_registry_read_target_invalid");
  const peerSetRow = record(rows.peerSet, "peer_registry_read_set_invalid");

  const targetId = requiredString(targetRow, "id", "peer_registry_read_target_id_invalid");
  const targetSymbol = requiredString(
    targetRow,
    "instrument_symbol",
    "peer_registry_read_target_symbol_invalid",
  );
  const targetExchange = requiredString(
    targetRow,
    "exchange",
    "peer_registry_read_target_exchange_invalid",
  );
  if (
    targetSymbol !== canonicalIdentity(targetSymbol) ||
    targetExchange !== canonicalIdentity(targetExchange)
  ) {
    throw new Error("peer_registry_read_target_not_canonical");
  }

  const peerSetId = requiredString(peerSetRow, "id", "peer_registry_read_set_id_invalid");
  const peerSetTargetId = requiredString(
    peerSetRow,
    "target_id",
    "peer_registry_read_set_target_invalid",
  );
  if (peerSetTargetId !== targetId) throw new Error("peer_registry_read_target_mismatch");

  const versionNumber = Number(peerSetRow.version_number);
  if (!Number.isInteger(versionNumber) || versionNumber <= 0) {
    throw new Error("peer_registry_read_version_invalid");
  }
  const targetName = requiredString(
    peerSetRow,
    "target_name",
    "peer_registry_read_target_name_invalid",
  );
  const dataAsOfRaw = requiredString(
    peerSetRow,
    "data_as_of",
    "peer_registry_read_data_as_of_invalid",
  );
  if (!validDate(dataAsOfRaw)) throw new Error("peer_registry_read_data_as_of_invalid");
  const methodologyVersion = requiredString(
    peerSetRow,
    "methodology_version",
    "peer_registry_read_methodology_invalid",
  );
  if (methodologyVersion !== DIVLAB_PEER_COMPARISON_VERSION) {
    throw new Error("peer_registry_read_methodology_invalid");
  }

  if (rows.sources.length < 1 || rows.sources.length > 25) {
    throw new Error("peer_registry_read_source_count_invalid");
  }
  const sourceByInternalId = new Map<string, PeerBasisSource>();
  const sourceKeys = new Set<string>();
  for (const rawSource of rows.sources) {
    const sourceRow = record(rawSource, "peer_registry_read_source_invalid");
    const internalId = requiredString(
      sourceRow,
      "id",
      "peer_registry_read_source_internal_id_invalid",
    );
    if (sourceByInternalId.has(internalId)) {
      throw new Error("peer_registry_read_source_internal_duplicate");
    }
    const sourcePeerSetId = requiredString(
      sourceRow,
      "peer_set_id",
      "peer_registry_read_source_set_invalid",
    );
    if (sourcePeerSetId !== peerSetId) throw new Error("peer_registry_read_source_set_mismatch");
    const id = requiredString(sourceRow, "source_key", "peer_registry_read_source_key_invalid");
    if (sourceKeys.has(id)) throw new Error(`peer_registry_read_source_duplicate:${id}`);
    sourceKeys.add(id);
    const publisher = requiredString(
      sourceRow,
      "publisher",
      "peer_registry_read_source_publisher_invalid",
    );
    const url = requiredString(sourceRow, "source_url", "peer_registry_read_source_url_invalid");
    if (!validHttpsUrl(url)) throw new Error(`peer_registry_read_source_url_invalid:${id}`);
    const verifiedAtRaw = requiredString(
      sourceRow,
      "verified_at",
      "peer_registry_read_source_verified_at_invalid",
    );
    if (!validDate(verifiedAtRaw)) {
      throw new Error(`peer_registry_read_source_verified_at_invalid:${id}`);
    }
    sourceByInternalId.set(internalId, {
      id,
      publisher,
      url,
      verifiedAt: new Date(verifiedAtRaw).toISOString(),
    });
  }

  if (rows.members.length < 3 || rows.members.length > 25) {
    throw new Error("peer_registry_read_member_count_invalid");
  }
  const memberByInternalId = new Map<
    string,
    { symbol: string; exchange: string; name: string; relationshipSourceIds: Set<string> }
  >();
  const memberIdentityKeys = new Set<string>();
  const targetIdentityKey = `${targetExchange}:${targetSymbol}`;
  for (const rawMember of rows.members) {
    const memberRow = record(rawMember, "peer_registry_read_member_invalid");
    const internalId = requiredString(
      memberRow,
      "id",
      "peer_registry_read_member_internal_id_invalid",
    );
    if (memberByInternalId.has(internalId)) {
      throw new Error("peer_registry_read_member_internal_duplicate");
    }
    const memberPeerSetId = requiredString(
      memberRow,
      "peer_set_id",
      "peer_registry_read_member_set_invalid",
    );
    if (memberPeerSetId !== peerSetId) throw new Error("peer_registry_read_member_set_mismatch");
    const symbol = requiredString(
      memberRow,
      "instrument_symbol",
      "peer_registry_read_member_symbol_invalid",
    );
    const exchange = requiredString(
      memberRow,
      "exchange",
      "peer_registry_read_member_exchange_invalid",
    );
    if (symbol !== canonicalIdentity(symbol) || exchange !== canonicalIdentity(exchange)) {
      throw new Error("peer_registry_read_member_not_canonical");
    }
    const name = requiredString(
      memberRow,
      "instrument_name",
      "peer_registry_read_member_name_invalid",
    );
    const identityKey = `${exchange}:${symbol}`;
    if (identityKey === targetIdentityKey) {
      throw new Error(`peer_registry_read_contains_target:${identityKey}`);
    }
    if (memberIdentityKeys.has(identityKey)) {
      throw new Error(`peer_registry_read_member_duplicate:${identityKey}`);
    }
    memberIdentityKeys.add(identityKey);
    memberByInternalId.set(internalId, {
      symbol,
      exchange,
      name,
      relationshipSourceIds: new Set<string>(),
    });
  }

  for (const rawLink of rows.links) {
    const linkRow = record(rawLink, "peer_registry_read_link_invalid");
    const linkPeerSetId = requiredString(
      linkRow,
      "peer_set_id",
      "peer_registry_read_link_set_invalid",
    );
    if (linkPeerSetId !== peerSetId) throw new Error("peer_registry_read_link_set_mismatch");
    const memberInternalId = requiredString(
      linkRow,
      "peer_member_id",
      "peer_registry_read_link_member_invalid",
    );
    const sourceInternalId = requiredString(
      linkRow,
      "peer_set_source_id",
      "peer_registry_read_link_source_invalid",
    );
    const member = memberByInternalId.get(memberInternalId);
    if (!member) throw new Error("peer_registry_read_link_unknown_member");
    const source = sourceByInternalId.get(sourceInternalId);
    if (!source) throw new Error("peer_registry_read_link_unknown_source");
    member.relationshipSourceIds.add(source.id);
  }

  const members = [...memberByInternalId.values()]
    .map((member) => {
      const relationshipSourceIds = [...member.relationshipSourceIds].sort();
      if (!relationshipSourceIds.length) {
        throw new Error(`peer_registry_read_member_source_missing:${member.exchange}:${member.symbol}`);
      }
      return {
        symbol: member.symbol,
        exchange: member.exchange,
        name: member.name,
        relationshipSourceIds,
      };
    })
    .sort((a, b) => `${a.exchange}:${a.symbol}`.localeCompare(`${b.exchange}:${b.symbol}`));

  const sources = [...sourceByInternalId.values()].sort((a, b) => a.id.localeCompare(b.id));

  return {
    targetId,
    peerSetId,
    versionNumber,
    target: {
      symbol: targetSymbol,
      exchange: targetExchange,
      name: targetName,
    },
    dataAsOf: new Date(dataAsOfRaw).toISOString(),
    methodologyVersion: DIVLAB_PEER_COMPARISON_VERSION,
    sources,
    members,
  };
}
