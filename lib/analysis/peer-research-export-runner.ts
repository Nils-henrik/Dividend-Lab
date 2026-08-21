import "server-only";

import {
  DIVLAB_CURATED_PEER_CATALOG_VERSION,
  getCuratedPeerSet,
} from "./curated-peer-catalog";
import {
  DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION,
  buildPeerResearchOperatorExport,
  type DivLabPeerResearchOperatorExport,
} from "./peer-research-operator-export";
import { createDivLabPeerResearchVersion } from "./peer-research-service";
import { buildPeerResearchValidationExport } from "./peer-research-validation-export";
import { getYahooCrumbSession } from "../model-portfolios/engine/yahoo-research";

export const DIVLAB_PEER_RESEARCH_EXPORT_ARTIFACT_VERSION =
  "peer-research-export-artifact-v1" as const;

export type DivLabPeerResearchExportArtifact = {
  version: typeof DIVLAB_PEER_RESEARCH_EXPORT_ARTIFACT_VERSION;
  catalogVersion: typeof DIVLAB_CURATED_PEER_CATALOG_VERSION;
  operatorExportVersion: typeof DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION;
  generatedAt: string;
  target: { symbol: string; exchange: string; name: string };
  peerCount: 3;
  peers: Array<{
    symbol: string;
    exchange: string;
    name: string;
    operatorExport: DivLabPeerResearchOperatorExport;
  }>;
};

function identity(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Execute exactly one curated three-peer set without persistence or AI.
 *
 * The function is intentionally transport-agnostic. It owns the complete
 * provider/readiness/operator-export sequence so a protected runtime endpoint
 * can return one all-or-nothing artifact without duplicating research logic.
 */
export async function createDivLabCuratedPeerResearchExportArtifact(input: {
  target: { symbol: string; exchange: string };
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<DivLabPeerResearchExportArtifact> {
  const peerSet = getCuratedPeerSet({
    symbol: identity(input.target.symbol),
    exchange: identity(input.target.exchange),
  });
  if (!peerSet) throw new Error("peer_research_export_curated_target_missing");
  if (peerSet.version !== DIVLAB_CURATED_PEER_CATALOG_VERSION) {
    throw new Error("peer_research_export_catalog_binding_mismatch");
  }
  if (peerSet.registry.members.length !== 3) {
    throw new Error("peer_research_export_member_count_mismatch");
  }

  const now = input.now ?? new Date();
  const fetchImpl = input.fetchImpl ?? fetch;
  const yahooSession = await getYahooCrumbSession(fetchImpl, now);
  if (!yahooSession) {
    throw new Error("peer_research_export_yahoo_session_unavailable");
  }

  const peers: DivLabPeerResearchExportArtifact["peers"] = [];
  for (const member of peerSet.registry.members) {
    const result = await createDivLabPeerResearchVersion({
      symbol: member.symbol,
      exchange: member.exchange,
      name: member.name,
      fetchImpl,
      now,
    });
    if (!result.ok) {
      const detail =
        result.stage === "peer_readiness"
          ? `${result.reason}:${result.readiness.blockers.join("|")}`
          : result.reason;
      throw new Error(
        `peer_research_export_peer_failed:${member.exchange}:${member.symbol}:${detail}`,
      );
    }
    if (result.persistence !== null) {
      throw new Error("peer_research_export_unexpected_persistence");
    }

    const validationExport = buildPeerResearchValidationExport({
      packet: result.packet,
      now,
    });
    const operatorExport = buildPeerResearchOperatorExport({ validationExport });
    if (
      operatorExport.instrument.symbol !== member.symbol ||
      operatorExport.instrument.exchange !== member.exchange ||
      operatorExport.instrument.name !== member.name
    ) {
      throw new Error("peer_research_export_member_binding_mismatch");
    }

    peers.push({
      symbol: member.symbol,
      exchange: member.exchange,
      name: member.name,
      operatorExport,
    });
  }

  if (peers.length !== 3) {
    throw new Error("peer_research_export_incomplete_set");
  }

  return {
    version: DIVLAB_PEER_RESEARCH_EXPORT_ARTIFACT_VERSION,
    catalogVersion: DIVLAB_CURATED_PEER_CATALOG_VERSION,
    operatorExportVersion: DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION,
    generatedAt: now.toISOString(),
    target: { ...peerSet.registry.target },
    peerCount: 3,
    peers,
  };
}
