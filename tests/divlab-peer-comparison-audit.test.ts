import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import {
  buildVersionBoundPeerComparisonAudit,
  DIVLAB_PEER_COMPARISON_AUDIT_VERSION,
} from "../lib/analysis/peer-comparison-audit";
import type { LoadedPeerRegistrySet } from "../lib/analysis/peer-registry-read";

function packet(
  symbol: string,
  name = symbol,
  base = 10,
  publishable = true,
): DivLabResearchPacket {
  const measure = (value: number, suffix: string) => ({
    value,
    traceable: true,
    sourceIds: [`research:${symbol}:${suffix}`],
    primaryConfirmedMetrics: [],
  });

  return {
    version: "deep-research-v2",
    instrument: {
      symbol,
      exchange: "ST",
      name,
      currency: "SEK",
      currentPrice: 100,
    },
    dataAsOf: "2026-08-15T09:00:00.000Z",
    qualityGate: {
      publishable,
    },
    valuation: {
      trailing: {
        pe: base,
        priceToFcf: base + 1,
        fcfYield: 1 / (base + 1),
        enterpriseValue: 1_000,
        evToEbit: base - 1,
        evToEbitda: base - 2,
      },
      scenarios: [],
    },
    valuationProvenance: {
      version: "valuation-provenance-v1",
      measures: {
        pe: measure(base, "pe"),
        priceToFcf: measure(base + 1, "pfcf"),
        fcfYield: measure(1 / (base + 1), "fcf-yield"),
        enterpriseValue: measure(1_000, "ev"),
        evToEbit: measure(base - 1, "ev-ebit"),
        evToEbitda: measure(base - 2, "ev-ebitda"),
      },
    },
  } as unknown as DivLabResearchPacket;
}

function registry(symbols: string[] = ["AAA", "BBB", "CCC"]): LoadedPeerRegistrySet {
  return {
    targetId: "target-evo",
    peerSetId: "set-evo-3",
    versionNumber: 3,
    target: {
      symbol: "EVO",
      exchange: "ST",
      name: "Evolution",
    },
    dataAsOf: "2026-08-15T08:30:00.000Z",
    methodologyVersion: "peer-comparison-v1",
    sources: [
      {
        id: "basis:verified",
        publisher: "Verified peer source",
        url: "https://example.com/verified-peers",
        verifiedAt: "2026-08-15T08:30:00.000Z",
      },
    ],
    members: symbols.map((symbol) => ({
      symbol,
      exchange: "ST",
      name: `Peer ${symbol}`,
      relationshipSourceIds: ["basis:verified"],
    })),
  };
}

const IDS = {
  target: "00000000-0000-4000-8000-000000000001",
  aaa: "00000000-0000-4000-8000-000000000002",
  bbb: "00000000-0000-4000-8000-000000000003",
  ccc: "00000000-0000-4000-8000-000000000004",
  ddd: "00000000-0000-4000-8000-000000000005",
} as const;

describe("DivLab version-bound peer comparison audit", () => {
  it("binds the immutable registry and every publishable research packet to exact analysis versions", () => {
    const audit = buildVersionBoundPeerComparisonAudit({
      registry: registry(),
      targetResearch: {
        analysisVersionId: IDS.target,
        packet: packet("EVO", "Evolution", 12),
      },
      peerResearch: [
        { analysisVersionId: IDS.ccc, packet: packet("CCC", "Peer CCC", 11) },
        { analysisVersionId: IDS.aaa, packet: packet("AAA", "Peer AAA", 9) },
        { analysisVersionId: IDS.bbb, packet: packet("BBB", "Peer BBB", 10) },
      ],
    });

    assert.equal(audit.version, DIVLAB_PEER_COMPARISON_AUDIT_VERSION);
    assert.deepEqual(audit.registry, {
      peerSetId: "set-evo-3",
      versionNumber: 3,
      dataAsOf: "2026-08-15T08:30:00.000Z",
      registeredPeerCount: 3,
    });
    assert.equal(audit.targetResearch.analysisVersionId, IDS.target);
    assert.equal(audit.targetResearch.engineVersion, "deep-research-v2");
    assert.equal(
      audit.targetResearch.valuationProvenanceVersion,
      "valuation-provenance-v1",
    );
    assert.deepEqual(
      audit.peerResearch.map((binding) => [binding.symbol, binding.analysisVersionId]),
      [
        ["AAA", IDS.aaa],
        ["BBB", IDS.bbb],
        ["CCC", IDS.ccc],
      ],
    );
    assert.equal(audit.comparison.status, "ready");
    assert.equal(audit.comparison.metrics.pe.peerMedian, 10);
  });

  it("refuses an analyst-grade audit when any registered peer lacks a versioned packet", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(["AAA", "BBB", "CCC", "DDD"]),
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: packet("BBB") },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_requires_complete_registry_hydration/,
    );
  });

  it("rejects non-publishable research even when registry membership is complete", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(),
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: packet("BBB", "BBB", 10, false) },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_requires_publishable_research/,
    );
  });

  it("rejects registry evidence verified after the target research boundary", () => {
    const futureRegistry = registry();
    futureRegistry.sources[0] = {
      ...futureRegistry.sources[0],
      verifiedAt: "2026-08-15T09:01:00.000Z",
    };

    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: futureRegistry,
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: packet("BBB") },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_registry_source_lookahead:basis:verified/,
    );
  });

  it("rejects peer research newer than the target research boundary", () => {
    const futurePeer = packet("BBB");
    futurePeer.dataAsOf = "2026-08-15T09:01:00.000Z";

    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(),
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: futurePeer },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_peer_research_lookahead:ST:BBB/,
    );
  });

  it("rejects reuse of one immutable analysis version for two identities", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(),
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.aaa, packet: packet("BBB") },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_duplicate_analysis_version/,
    );
  });

  it("rejects a non-UUID analysis version reference", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(),
          targetResearch: {
            analysisVersionId: "latest",
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: packet("BBB") },
            { analysisVersionId: IDS.ccc, packet: packet("CCC") },
          ],
        }),
      /peer_comparison_audit_analysis_version_id_invalid/,
    );
  });

  it("inherits the registry boundary and rejects substitute research", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry: registry(),
          targetResearch: {
            analysisVersionId: IDS.target,
            packet: packet("EVO", "Evolution", 12),
          },
          peerResearch: [
            { analysisVersionId: IDS.aaa, packet: packet("AAA") },
            { analysisVersionId: IDS.bbb, packet: packet("BBB") },
            { analysisVersionId: IDS.ddd, packet: packet("DDD") },
          ],
        }),
      /peer_registry_hydration_unexpected_packet:ST:DDD/,
    );
  });
});
