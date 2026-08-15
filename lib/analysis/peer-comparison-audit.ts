import {
  DIVLAB_DEEP_RESEARCH_VERSION,
  type DivLabResearchPacket,
} from "./deep-research";
import {
  buildPeerComparisonFromRegistry,
  type RegistryPeerComparisonResult,
} from "./peer-registry-hydration";
import type { LoadedPeerRegistrySet } from "./peer-registry-read";
import { DIVLAB_VALUATION_PROVENANCE_VERSION } from "./valuation-provenance";

export const DIVLAB_PEER_COMPARISON_AUDIT_VERSION = "peer-comparison-audit-v1" as const;

export type VersionedResearchPacket = {
  analysisVersionId: string;
  packet: DivLabResearchPacket;
};

export type PeerResearchVersionBinding = {
  analysisVersionId: string;
  symbol: string;
  exchange: string;
  name: string;
  engineVersion: string;
  dataAsOf: string;
  valuationProvenanceVersion: string;
};

export type VersionBoundPeerComparisonAudit = {
  version: typeof DIVLAB_PEER_COMPARISON_AUDIT_VERSION;
  registry: RegistryPeerComparisonResult["registry"];
  targetResearch: PeerResearchVersionBinding;
  peerResearch: PeerResearchVersionBinding[];
  comparison: RegistryPeerComparisonResult["comparison"];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function identityKey(input: { symbol: string; exchange: string }): string {
  return `${input.exchange.trim().toUpperCase()}:${input.symbol.trim().toUpperCase()}`;
}

function analysisVersionId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error("peer_comparison_audit_analysis_version_id_invalid");
  }
  return normalized;
}

function versionBinding(input: VersionedResearchPacket): PeerResearchVersionBinding {
  const engineVersion = input.packet.version?.trim();
  const provenanceVersion = input.packet.valuationProvenance?.version?.trim();
  const dataAsOf = new Date(input.packet.dataAsOf);
  if (engineVersion !== DIVLAB_DEEP_RESEARCH_VERSION) {
    throw new Error("peer_comparison_audit_engine_version_invalid");
  }
  if (input.packet.qualityGate?.publishable !== true) {
    throw new Error("peer_comparison_audit_requires_publishable_research");
  }
  if (provenanceVersion !== DIVLAB_VALUATION_PROVENANCE_VERSION) {
    throw new Error("peer_comparison_audit_valuation_provenance_version_invalid");
  }
  if (!Number.isFinite(dataAsOf.getTime())) {
    throw new Error("peer_comparison_audit_data_as_of_invalid");
  }

  return {
    analysisVersionId: analysisVersionId(input.analysisVersionId),
    symbol: input.packet.instrument.symbol.trim().toUpperCase(),
    exchange: input.packet.instrument.exchange.trim().toUpperCase(),
    name: input.packet.instrument.name.trim(),
    engineVersion,
    dataAsOf: dataAsOf.toISOString(),
    valuationProvenanceVersion: provenanceVersion,
  };
}

/**
 * Creates the only peer-comparison shape intended for eventual analyst
 * consumption. The peer registry remains authoritative for membership and every
 * research packet must already have an immutable, publishable analysis-version
 * id with the current provenance contract.
 *
 * The existing unversioned hydration path remains useful for internal research
 * QA, but it must not be treated as a historical analyst input because a packet
 * without an immutable version reference cannot later be reproduced exactly.
 */
export function buildVersionBoundPeerComparisonAudit(input: {
  registry: LoadedPeerRegistrySet;
  targetResearch: VersionedResearchPacket;
  peerResearch: readonly VersionedResearchPacket[];
}): VersionBoundPeerComparisonAudit {
  const targetResearch = versionBinding(input.targetResearch);
  const peerBindings = input.peerResearch.map(versionBinding);

  const versionIds = new Set<string>();
  versionIds.add(targetResearch.analysisVersionId);
  for (const binding of peerBindings) {
    if (versionIds.has(binding.analysisVersionId)) {
      throw new Error(
        `peer_comparison_audit_duplicate_analysis_version:${binding.analysisVersionId}`,
      );
    }
    versionIds.add(binding.analysisVersionId);
  }

  const result = buildPeerComparisonFromRegistry({
    targetPacket: input.targetResearch.packet,
    registry: input.registry,
    peerPackets: input.peerResearch.map((entry) => entry.packet),
  });

  if (result.hydration.status !== "complete" || result.comparison.status !== "ready") {
    throw new Error("peer_comparison_audit_requires_complete_registry_hydration");
  }
  if (peerBindings.length !== input.registry.members.length) {
    throw new Error("peer_comparison_audit_peer_binding_count_mismatch");
  }

  const registeredKeys = new Set(input.registry.members.map(identityKey));
  for (const binding of peerBindings) {
    if (!registeredKeys.has(identityKey(binding))) {
      throw new Error(
        `peer_comparison_audit_unregistered_binding:${identityKey(binding)}`,
      );
    }
  }

  peerBindings.sort((a, b) => identityKey(a).localeCompare(identityKey(b)));

  return {
    version: DIVLAB_PEER_COMPARISON_AUDIT_VERSION,
    registry: result.registry,
    targetResearch,
    peerResearch: peerBindings,
    comparison: result.comparison,
  };
}
