import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildPeerComparisonFromRegistry } from "../lib/analysis/peer-registry-hydration";
import type { LoadedPeerRegistrySet } from "../lib/analysis/peer-registry-read";

function packet(symbol: string, name = symbol, base = 10): DivLabResearchPacket {
  const measure = (value: number, suffix: string) => ({
    value,
    traceable: true,
    sourceIds: [`research:${symbol}:${suffix}`],
    primaryConfirmedMetrics: [],
  });

  return {
    instrument: {
      symbol,
      exchange: "ST",
      name,
      currency: "SEK",
      currentPrice: 100,
    },
    dataAsOf: "2026-08-14T20:00:00.000Z",
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
      traceable: true,
      blockers: [],
    },
  } as unknown as DivLabResearchPacket;
}

function registry(symbols: string[] = ["AAA", "BBB", "CCC"]): LoadedPeerRegistrySet {
  return {
    targetId: "target-evo",
    peerSetId: "set-evo-2",
    versionNumber: 2,
    target: {
      symbol: "EVO",
      exchange: "ST",
      name: "Evolution",
    },
    dataAsOf: "2026-08-14T19:00:00.000Z",
    methodologyVersion: "peer-comparison-v1",
    sources: [
      {
        id: "basis:verified",
        publisher: "Verified peer source",
        url: "https://example.com/verified-peers",
        verifiedAt: "2026-08-14T19:00:00.000Z",
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

describe("DivLab registry peer hydration", () => {
  it("hydrates exactly the registered members into a ready comparison", () => {
    const result = buildPeerComparisonFromRegistry({
      targetPacket: packet("EVO", "Evolution", 12),
      registry: registry(),
      peerPackets: [packet("CCC", "Peer CCC", 11), packet("AAA", "Peer AAA", 9), packet("BBB", "Peer BBB", 10)],
    });

    assert.equal(result.hydration.status, "complete");
    assert.equal(result.hydration.hydratedPeerCount, 3);
    assert.deepEqual(result.hydration.missingPeers, []);
    assert.equal(result.comparison.status, "ready");
    assert.equal(result.comparison.metrics.pe.peerSampleSize, 3);
    assert.deepEqual(
      result.comparison.metrics.pe.peers.map((peer) => peer.symbol),
      ["AAA", "BBB", "CCC"],
    );
    assert.deepEqual(result.comparison.metrics.pe.peers[0]?.relationshipSourceIds, ["basis:verified"]);
  });

  it("marks the whole comparison insufficient when one registered peer is missing", () => {
    const result = buildPeerComparisonFromRegistry({
      targetPacket: packet("EVO", "Evolution", 12),
      registry: registry(["AAA", "BBB", "CCC", "DDD"]),
      peerPackets: [packet("AAA", "Peer AAA", 9), packet("BBB", "Peer BBB", 10), packet("CCC", "Peer CCC", 11)],
    });

    assert.equal(result.hydration.status, "incomplete");
    assert.equal(result.hydration.hydratedPeerCount, 3);
    assert.deepEqual(result.hydration.missingPeers.map((peer) => peer.symbol), ["DDD"]);
    assert.equal(result.comparison.metrics.pe.status, "ready");
    assert.equal(result.comparison.status, "insufficient");
    assert.match(result.comparison.notes[0] ?? "", /använder inte en delmängd/);
  });

  it("rejects research for a company that is not in the immutable registry set", () => {
    assert.throws(
      () =>
        buildPeerComparisonFromRegistry({
          targetPacket: packet("EVO", "Evolution", 12),
          registry: registry(),
          peerPackets: [packet("AAA"), packet("BBB"), packet("CCC"), packet("DDD")],
        }),
      /peer_registry_hydration_unexpected_packet:ST:DDD/,
    );
  });

  it("rejects duplicate research packets for one registered identity", () => {
    assert.throws(
      () =>
        buildPeerComparisonFromRegistry({
          targetPacket: packet("EVO", "Evolution", 12),
          registry: registry(),
          peerPackets: [packet("AAA"), packet("AAA"), packet("BBB"), packet("CCC")],
        }),
      /peer_registry_hydration_duplicate_packet:ST:AAA/,
    );
  });

  it("rejects a target packet that does not match the registry target", () => {
    assert.throws(
      () =>
        buildPeerComparisonFromRegistry({
          targetPacket: packet("ATCO-A", "Atlas Copco A", 12),
          registry: registry(),
          peerPackets: [packet("AAA"), packet("BBB"), packet("CCC")],
        }),
      /peer_registry_hydration_target_mismatch:ST:EVO:ST:ATCO-A/,
    );
  });
});
