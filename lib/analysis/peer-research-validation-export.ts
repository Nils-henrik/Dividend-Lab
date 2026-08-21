import type { DivLabResearchPacket } from "./deep-research";
import {
  evaluatePeerResearchReadiness,
  type DivLabPeerResearchReadiness,
} from "./peer-research-readiness";

export const DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION =
  "peer-research-validation-export-v1" as const;

export type DivLabPeerResearchValidationExport = {
  version: typeof DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION;
  exportedAt: string;
  slug: string;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  ordinaryPublishable: false;
  readiness: DivLabPeerResearchReadiness;
  packet: DivLabResearchPacket;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function validationSlug(packet: DivLabResearchPacket): string {
  const company = slugify(packet.instrument.name);
  const symbol = slugify(packet.instrument.symbol);
  const exchange = slugify(packet.instrument.exchange);
  const identity = [company || symbol, symbol, exchange].filter(Boolean).join("-");
  if (!identity) throw new Error("peer_research_validation_export_slug_required");
  return identity.slice(0, 100);
}

/**
 * Read-only operator export used during protected Preview validation.
 *
 * The export is deliberately restricted to facts-only peer packets that already
 * pass peer-research-readiness-v1 and remain ordinary public publishable=false.
 * It contains no credential and performs no persistence. A connected DEV
 * Supabase operator may later pass the exact packet through the existing guarded
 * persistence RPC and then verify the stored immutable version independently.
 */
export function buildPeerResearchValidationExport(input: {
  packet: DivLabResearchPacket;
  now?: Date;
}): DivLabPeerResearchValidationExport {
  const readiness = evaluatePeerResearchReadiness(input.packet);
  if (!readiness.ready) {
    throw new Error(
      `peer_research_validation_export_not_ready:${readiness.blockers.join(",") || "unknown"}`,
    );
  }
  if (input.packet.qualityGate.publishable) {
    throw new Error("peer_research_validation_export_public_packet_forbidden");
  }

  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("peer_research_validation_export_time_invalid");
  }

  return {
    version: DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    slug: validationSlug(input.packet),
    instrument: {
      symbol: input.packet.instrument.symbol,
      exchange: input.packet.instrument.exchange,
      name: input.packet.instrument.name,
    },
    dataAsOf: input.packet.dataAsOf,
    ordinaryPublishable: false,
    readiness,
    packet: input.packet,
  };
}
