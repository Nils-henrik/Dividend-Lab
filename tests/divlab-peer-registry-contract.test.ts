import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PeerResearchSnapshot, VerifiedPeerInput } from "../lib/analysis/peer-comparison";
import { buildPeerRegistryBundle } from "../lib/analysis/peer-registry-contract";

const SOURCE_ID = "peer-basis:verified-sector";

function snapshot(symbol: string): PeerResearchSnapshot {
  const missing = { value: null, traceable: false, sourceIds: [] as string[] };
  return {
    instrument: { symbol, exchange: "st", name: `${symbol} AB` },
    dataAsOf: "2026-08-14T16:00:00.000Z",
    measures: {
      pe: { ...missing },
      priceToFcf: { ...missing },
      evToEbit: { ...missing },
      evToEbitda: { ...missing },
    },
  };
}

function peer(symbol: string, sourceIds = [SOURCE_ID]): VerifiedPeerInput {
  return { snapshot: snapshot(symbol), relationshipSourceIds: sourceIds };
}

const sources = [
  {
    id: SOURCE_ID,
    publisher: "Verified classification provider",
    url: "https://example.com/classification",
    verifiedAt: "2026-08-14T15:30:00+02:00",
  },
];

describe("DivLab peer registry contract", () => {
  it("normalizes one immutable source-backed peer bundle", () => {
    const bundle = buildPeerRegistryBundle({
      target: { symbol: " target ", exchange: " st ", name: " Target AB " },
      dataAsOf: "2026-08-14T16:00:00+02:00",
      sources,
      peers: [peer("peer1"), peer("peer2"), peer("peer3")],
    });

    assert.deepEqual(bundle.target, {
      symbol: "TARGET",
      exchange: "ST",
      name: "Target AB",
    });
    assert.equal(bundle.methodologyVersion, "peer-comparison-v1");
    assert.equal(bundle.members.length, 3);
    assert.equal(bundle.members[0]?.symbol, "PEER1");
    assert.deepEqual(bundle.members[0]?.relationshipSourceIds, [SOURCE_ID]);
    assert.equal(bundle.sources[0]?.url, "https://example.com/classification");
    assert.ok(bundle.dataAsOf.endsWith("Z"));
  });

  it("rejects fewer than three peer members", () => {
    assert.throws(
      () =>
        buildPeerRegistryBundle({
          target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
          dataAsOf: "2026-08-14T16:00:00.000Z",
          sources,
          peers: [peer("PEER1"), peer("PEER2")],
        }),
      /peer_registry_requires_three_members/,
    );
  });

  it("rejects target self-membership and duplicate peer identities", () => {
    assert.throws(
      () =>
        buildPeerRegistryBundle({
          target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
          dataAsOf: "2026-08-14T16:00:00.000Z",
          sources,
          peers: [peer("TARGET"), peer("PEER2"), peer("PEER3")],
        }),
      /peer_registry_contains_target/,
    );

    assert.throws(
      () =>
        buildPeerRegistryBundle({
          target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
          dataAsOf: "2026-08-14T16:00:00.000Z",
          sources,
          peers: [peer("PEER1"), peer("PEER1"), peer("PEER3")],
        }),
      /peer_registry_duplicate_member/,
    );
  });

  it("rejects unknown relationship sources and malformed source URLs", () => {
    assert.throws(
      () =>
        buildPeerRegistryBundle({
          target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
          dataAsOf: "2026-08-14T16:00:00.000Z",
          sources,
          peers: [peer("PEER1", ["peer-basis:invented"]), peer("PEER2"), peer("PEER3")],
        }),
      /peer_registry_relationship_source_unknown/,
    );

    assert.throws(
      () =>
        buildPeerRegistryBundle({
          target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
          dataAsOf: "2026-08-14T16:00:00.000Z",
          sources: [{ ...sources[0]!, url: "http://example.com/insecure" }],
          peers: [peer("PEER1"), peer("PEER2"), peer("PEER3")],
        }),
      /peer_registry_source_invalid/,
    );
  });

  it("deduplicates repeated relationship source references for one member", () => {
    const bundle = buildPeerRegistryBundle({
      target: { symbol: "TARGET", exchange: "ST", name: "Target AB" },
      dataAsOf: "2026-08-14T16:00:00.000Z",
      sources,
      peers: [
        peer("PEER1", [SOURCE_ID, SOURCE_ID]),
        peer("PEER2"),
        peer("PEER3"),
      ],
    });
    assert.deepEqual(bundle.members[0]?.relationshipSourceIds, [SOURCE_ID]);
  });
});
