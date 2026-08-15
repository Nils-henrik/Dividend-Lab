import {
  DIVLAB_DEEP_RESEARCH_VERSION,
  type DivLabResearchPacket,
} from "./deep-research";
import type { VersionedResearchPacket } from "./peer-comparison-audit";
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

/**
 * Convert one immutable analysis-version row into a research packet safe for
 * analyst-grade peer comparison.
 *
 * Database JSON is treated as untrusted at this boundary. Only current,
 * publishable Deep Research v2 packets with the exact persisted data-as-of and
 * current valuation provenance contract are accepted.
 */
export function buildVersionedResearchPacketFromRow(input: {
  row: unknown;
  expectedSymbol?: string;
  expectedExchange?: string;
}): VersionedResearchPacket {
  const row = record(input.row);
  if (!row) throw new Error("divlab_research_version_row_invalid");

  const id = text(row.id);
  const engineVersion = text(row.engine_version);
  const rowDataAsOf = timestamp(row.data_as_of);
  const packet = record(row.research_packet);
  if (
    !id ||
    row.publishable !== true ||
    engineVersion !== DIVLAB_DEEP_RESEARCH_VERSION ||
    rowDataAsOf === null ||
    !packet
  ) {
    throw new Error("divlab_research_version_not_analyst_grade");
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
    qualityGate?.publishable !== true ||
    valuationProvenance?.version !== DIVLAB_VALUATION_PROVENANCE_VERSION ||
    !provenanceMeasures ||
    !trailing ||
    !symbol ||
    !exchange ||
    !name
  ) {
    throw new Error("divlab_research_version_packet_contract_invalid");
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

  return {
    analysisVersionId: normalizeAnalysisVersionId(id),
    packet: packet as unknown as DivLabResearchPacket,
  };
}
