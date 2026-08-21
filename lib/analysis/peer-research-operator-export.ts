import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import type { DivLabResearchPacket } from "./deep-research";
import {
  DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION,
  type DivLabPeerResearchValidationExport,
} from "./peer-research-validation-export";
import { evaluatePeerResearchReadiness } from "./peer-research-readiness";

export const DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION =
  "peer-research-operator-export-v1" as const;
export const DIVLAB_PEER_RESEARCH_OPERATOR_PACKET_ENCODING =
  "base64-json-utf8" as const;

export type DivLabPeerResearchOperatorExport = {
  version: typeof DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION;
  validationExportVersion: typeof DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION;
  exportedAt: string;
  slug: string;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  ordinaryPublishable: false;
  readinessVersion: "peer-research-readiness-v1";
  packetEncoding: typeof DIVLAB_PEER_RESEARCH_OPERATOR_PACKET_ENCODING;
  packetSha256: string;
  packetBase64: string;
  sourceCount: number;
  sourceIds: string[];
};

function canonicalIdentity(value: string): string {
  return value.trim().toUpperCase();
}

function sha256Utf8(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function exactSourceIds(packet: DivLabResearchPacket): string[] {
  const sourceIds = packet.sources.map((source) => source.id.trim());
  if (!sourceIds.length || sourceIds.some((value) => !value)) {
    throw new Error("peer_research_operator_export_source_id_invalid");
  }
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new Error("peer_research_operator_export_source_ids_duplicate");
  }
  return sourceIds;
}

function assertValidationBinding(value: DivLabPeerResearchValidationExport): void {
  if (value.version !== DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION) {
    throw new Error("peer_research_operator_export_validation_version_invalid");
  }
  if (value.ordinaryPublishable !== false || value.packet.qualityGate.publishable) {
    throw new Error("peer_research_operator_export_publishability_invalid");
  }

  const readiness = evaluatePeerResearchReadiness(value.packet);
  if (!value.readiness.ready || !readiness.ready) {
    throw new Error("peer_research_operator_export_not_ready");
  }
  if (
    canonicalIdentity(value.instrument.symbol) !==
      canonicalIdentity(value.packet.instrument.symbol) ||
    canonicalIdentity(value.instrument.exchange) !==
      canonicalIdentity(value.packet.instrument.exchange) ||
    value.instrument.name.trim() !== value.packet.instrument.name.trim() ||
    value.dataAsOf !== value.packet.dataAsOf
  ) {
    throw new Error("peer_research_operator_export_binding_invalid");
  }
}

/**
 * Compact, read-only transport envelope for one already validated peer packet.
 *
 * The packet bytes are JSON.stringify(packet) encoded as UTF-8/base64 and bound
 * to SHA-256. No credential or persistence capability is included. DEV operators
 * must still decode the packet, verify the checksum, call the existing guarded
 * persistence RPC, and perform immutable read-back verification afterwards.
 */
export function buildPeerResearchOperatorExport(input: {
  validationExport: DivLabPeerResearchValidationExport;
}): DivLabPeerResearchOperatorExport {
  assertValidationBinding(input.validationExport);
  const packetJson = JSON.stringify(input.validationExport.packet);
  const sourceIds = exactSourceIds(input.validationExport.packet);

  return {
    version: DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION,
    validationExportVersion: input.validationExport.version,
    exportedAt: input.validationExport.exportedAt,
    slug: input.validationExport.slug,
    instrument: { ...input.validationExport.instrument },
    dataAsOf: input.validationExport.dataAsOf,
    ordinaryPublishable: false,
    readinessVersion: input.validationExport.readiness.version,
    packetEncoding: DIVLAB_PEER_RESEARCH_OPERATOR_PACKET_ENCODING,
    packetSha256: sha256Utf8(packetJson),
    packetBase64: Buffer.from(packetJson, "utf8").toString("base64"),
    sourceCount: sourceIds.length,
    sourceIds,
  };
}

/**
 * Deterministic decoder used by tests/operator tooling. It is intentionally
 * stricter than Buffer.from(base64): the encoded bytes must round-trip to the
 * exact canonical base64 string and the packet must still satisfy peer readiness.
 */
export function decodePeerResearchOperatorPacket(
  value: DivLabPeerResearchOperatorExport,
): DivLabResearchPacket {
  if (
    value.version !== DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION ||
    value.validationExportVersion !== DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION ||
    value.packetEncoding !== DIVLAB_PEER_RESEARCH_OPERATOR_PACKET_ENCODING ||
    value.ordinaryPublishable !== false ||
    !/^[0-9a-f]{64}$/.test(value.packetSha256)
  ) {
    throw new Error("peer_research_operator_export_contract_invalid");
  }

  const bytes = Buffer.from(value.packetBase64, "base64");
  if (!bytes.length || bytes.toString("base64") !== value.packetBase64) {
    throw new Error("peer_research_operator_export_base64_invalid");
  }
  const packetJson = bytes.toString("utf8");
  if (sha256Utf8(packetJson) !== value.packetSha256) {
    throw new Error("peer_research_operator_export_checksum_mismatch");
  }

  let packet: DivLabResearchPacket;
  try {
    packet = JSON.parse(packetJson) as DivLabResearchPacket;
  } catch {
    throw new Error("peer_research_operator_export_json_invalid");
  }

  const readiness = evaluatePeerResearchReadiness(packet);
  if (!readiness.ready || packet.qualityGate.publishable) {
    throw new Error("peer_research_operator_export_packet_not_ready");
  }
  if (
    canonicalIdentity(packet.instrument.symbol) !== canonicalIdentity(value.instrument.symbol) ||
    canonicalIdentity(packet.instrument.exchange) !== canonicalIdentity(value.instrument.exchange) ||
    packet.instrument.name.trim() !== value.instrument.name.trim() ||
    packet.dataAsOf !== value.dataAsOf ||
    readiness.version !== value.readinessVersion
  ) {
    throw new Error("peer_research_operator_export_packet_binding_invalid");
  }

  const sourceIds = exactSourceIds(packet);
  if (
    sourceIds.length !== value.sourceCount ||
    sourceIds.length !== value.sourceIds.length ||
    sourceIds.some((sourceId, index) => sourceId !== value.sourceIds[index])
  ) {
    throw new Error("peer_research_operator_export_source_binding_invalid");
  }

  return packet;
}
