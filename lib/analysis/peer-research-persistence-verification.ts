import type { DivLabResearchPacket } from "./deep-research";
import {
  DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION,
  type DivLabPeerResearchValidationExport,
} from "./peer-research-validation-export";
import { evaluatePeerResearchReadiness } from "./peer-research-readiness";
import { buildPeerReadyResearchPacketFromRow } from "./research-version-read";

export const DIVLAB_PEER_RESEARCH_PERSISTENCE_VERIFICATION_VERSION =
  "peer-research-persistence-verification-v1" as const;

export type DivLabPeerResearchPersistenceVerification = {
  version: typeof DIVLAB_PEER_RESEARCH_PERSISTENCE_VERIFICATION_VERSION;
  verified: true;
  analysisVersionId: string;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  sourceCount: number;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function canonicalIdentity(value: string): string {
  return value.trim().toUpperCase();
}

function canonicalJson(value: unknown): string {
  const jsonSafe = JSON.parse(JSON.stringify(value)) as unknown;

  function sort(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(sort);
    if (!input || typeof input !== "object") return input;

    const source = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      output[key] = sort(source[key]);
    }
    return output;
  }

  return JSON.stringify(sort(jsonSafe));
}

function exactUniqueSourceIds(input: readonly string[], label: string): string[] {
  const normalized = input.map((value) => value.trim());
  if (normalized.some((value) => !value)) {
    throw new Error(`peer_research_persistence_${label}_source_id_invalid`);
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`peer_research_persistence_${label}_source_ids_duplicate`);
  }
  return [...normalized].sort();
}

function assertExportContract(value: DivLabPeerResearchValidationExport): void {
  if (value.version !== DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION) {
    throw new Error("peer_research_persistence_export_version_invalid");
  }
  if (value.ordinaryPublishable !== false || value.packet.qualityGate.publishable) {
    throw new Error("peer_research_persistence_export_publishability_invalid");
  }
  const readiness = evaluatePeerResearchReadiness(value.packet);
  if (!value.readiness.ready || !readiness.ready) {
    throw new Error("peer_research_persistence_export_not_ready");
  }
  if (
    canonicalIdentity(value.instrument.symbol) !==
      canonicalIdentity(value.packet.instrument.symbol) ||
    canonicalIdentity(value.instrument.exchange) !==
      canonicalIdentity(value.packet.instrument.exchange) ||
    value.instrument.name.trim() !== value.packet.instrument.name.trim() ||
    value.dataAsOf !== value.packet.dataAsOf
  ) {
    throw new Error("peer_research_persistence_export_binding_invalid");
  }
}

/**
 * Verifies that one operator-persisted DEV row is the exact immutable packet
 * previously exported from protected Preview validation.
 *
 * This function performs no network/database work. The caller supplies the
 * persisted analysis-version row and its persisted source IDs after read-back.
 * It fails closed on identity/dataAsOf/publishability/readiness, packet or source
 * mismatches so an operator write cannot advance a peer audit merely because a
 * database row happens to exist.
 */
export function verifyPeerResearchPersistence(input: {
  validationExport: DivLabPeerResearchValidationExport;
  row: unknown;
  persistedSourceIds: readonly string[];
}): DivLabPeerResearchPersistenceVerification {
  assertExportContract(input.validationExport);

  const row = record(input.row);
  if (!row) throw new Error("peer_research_persistence_row_invalid");
  if (row.publishable !== false) {
    throw new Error("peer_research_persistence_row_publishable_invalid");
  }

  const persisted = buildPeerReadyResearchPacketFromRow({
    row,
    expectedSymbol: input.validationExport.instrument.symbol,
    expectedExchange: input.validationExport.instrument.exchange,
  });

  if (persisted.packet.dataAsOf !== input.validationExport.dataAsOf) {
    throw new Error("peer_research_persistence_data_as_of_mismatch");
  }
  if (
    persisted.packet.instrument.name.trim() !==
    input.validationExport.instrument.name.trim()
  ) {
    throw new Error("peer_research_persistence_name_mismatch");
  }
  if (canonicalJson(persisted.packet) !== canonicalJson(input.validationExport.packet)) {
    throw new Error("peer_research_persistence_packet_mismatch");
  }

  const expectedSourceIds = exactUniqueSourceIds(
    input.validationExport.packet.sources.map((source) => source.id),
    "export",
  );
  const persistedSourceIds = exactUniqueSourceIds(
    input.persistedSourceIds,
    "row",
  );
  if (
    expectedSourceIds.length !== persistedSourceIds.length ||
    expectedSourceIds.some((value, index) => value !== persistedSourceIds[index])
  ) {
    throw new Error("peer_research_persistence_source_binding_mismatch");
  }

  return {
    version: DIVLAB_PEER_RESEARCH_PERSISTENCE_VERIFICATION_VERSION,
    verified: true,
    analysisVersionId: persisted.analysisVersionId,
    instrument: {
      symbol: persisted.packet.instrument.symbol,
      exchange: persisted.packet.instrument.exchange,
      name: persisted.packet.instrument.name,
    },
    dataAsOf: persisted.packet.dataAsOf,
    sourceCount: persistedSourceIds.length,
  };
}
