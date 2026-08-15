import {
  DIVLAB_DEEP_RESEARCH_VERSION,
  type DivLabResearchPacket,
} from "./deep-research";
import type { VersionedResearchPacket } from "./peer-comparison-audit";
import { assertPeerResearchReady } from "./peer-research-readiness";
import { DIVLAB_VALUATION_PROVENANCE_VERSION } from "./valuation-provenance";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function timestamp(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeAnalysisVersionId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error("divlab_research_version_id_invalid");
  }
  return normalized;
}

function baseVersionedResearchPacket(input: {
  row: unknown;
  expectedSymbol?: string;
  expectedExchange?: string;
  requirePublishable: boolean;
}): VersionedResearchPacket {
  const row = record(input.row);
  if (!row) throw new Error("divlab_research_version_row_invalid");

  const id = text(row.id);
  const engineVersion = text(row.engine_version);
  const rowDataAsOf = timestamp(row.data_as_of);
  const packet = record(row.research_packet);
  if (
    !id ||
    (input.requirePublishable && row.publishable !== true) ||
    engineVersion !== DIVLAB_DEEP_RESEARCH_VERSION ||
    rowDataAsOf === null ||
    !packet
  ) {
    throw new Error(
      input.requirePublishable
        ? "divlab_research_version_not_analyst_grade"
        : "divlab_peer_research_version_not_candidate",
    );
  }

  const instrument = record(packet.instrument);
  const qualityGate = record(packet.qualityGate);
  const valuation = record(packet.valuation);
  const trailing = valuation ? record(valuation.trailing) : null;
  const valuationProvenance = record(packet.valuationProvenance);
  const provenanceMeasures = valuationProvenance
    ? record(valuationProvenance.measures)
    : null;
  const packetDataAsOf = timestamp(packet.dataAsOf);
  const symbol = instrument ? text(instrument.symbol) : null;
  const exchange = instrument ? text(instrument.exchange) : null;
  const name = instrument ? text(instrument.name) : null;

  if (
    packet.version !== DIVLAB_DEEP_RESEARCH_VERSION ||
    packetDataAsOf === null ||
    packetDataAsOf !== rowDataAsOf ||
    (input.requirePublishable && qualityGate?.publishable !== true) ||
    valuationProvenance?.version !== DIVLAB_VALUATION_PROVENANCE_VERSION ||
    !provenanceMeasures ||
    !trailing ||
    !symbol ||
    !exchange ||
    !name
  ) {
    throw new Error(
      input.requirePublishable
        ? "divlab_research_version_packet_contract_invalid"
        : "divlab_peer_research_version_packet_contract_invalid",
    );
  }

  const canonicalSymbol = symbol.toUpperCase();
  const canonicalExchange = exchange.toUpperCase();
  if (
    (input.expectedSymbol &&
      canonicalSymbol !== input.expectedSymbol.trim().toUpperCase()) ||
    (input.expectedExchange &&
      canonicalExchange !== input.expectedExchange.trim().toUpperCase())
  ) {
    throw new Error("divlab_research_version_identity_mismatch");
  }

  const versioned = {
    analysisVersionId: normalizeAnalysisVersionId(id),
    packet: packet as unknown as DivLabResearchPacket,
  };

  if (!input.requirePublishable) {
    try {
      assertPeerResearchReady(versioned.packet);
    } catch {
      throw new Error("divlab_peer_research_version_not_ready");
    }
  }

  return versioned;
}

/**
 * Convert one immutable analysis-version row into a research packet safe for
 * analyst-grade target consumption. Only current, publishable Deep Research v2
 * packets with the exact persisted data-as-of and valuation provenance contract
 * are accepted.
 */
export function buildVersionedResearchPacketFromRow(input: {
  row: unknown;
  expectedSymbol?: string;
  expectedExchange?: string;
}): VersionedResearchPacket {
  return baseVersionedResearchPacket({ ...input, requirePublishable: true });
}

/**
 * Convert one immutable analysis-version row into facts-only research safe for
 * peer comparison. The row may remain publishable=false as a public analysis,
 * but must pass peer-research-readiness-v1 and all immutable identity/provenance
 * checks before it can be used by an audit.
 */
export function buildPeerReadyResearchPacketFromRow(input: {
  row: unknown;
  expectedSymbol?: string;
  expectedExchange?: string;
}): VersionedResearchPacket {
  return baseVersionedResearchPacket({ ...input, requirePublishable: false });
}
