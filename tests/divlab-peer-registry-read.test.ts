import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLoadedPeerRegistrySet,
  type PeerRegistryReadRows,
} from "../lib/analysis/peer-registry-read";

function rows(): PeerRegistryReadRows {
  return {
    target: {
      id: "target-1",
      instrument_symbol: "EVO",
      exchange: "ST",
    },
    peerSet: {
      id: "set-1",
      target_id: "target-1",
      version_number: 2,
      target_name: "Evolution",
      data_as_of: "2026-08-14T20:00:00.000Z",
      methodology_version: "peer-comparison-v1",
    },
    sources: [
      {
        id: "source-internal-2",
        peer_set_id: "set-1",
        source_key: "basis:industry",
        publisher: "Industry source",
        source_url: "https://example.com/industry",
        verified_at: "2026-08-14T19:00:00.000Z",
      },
      {
        id: "source-internal-1",
        peer_set_id: "set-1",
        source_key: "basis:issuer",
        publisher: "Issuer source",
        source_url: "https://example.com/issuer",
        verified_at: "2026-08-14T18:00:00.000Z",
      },
    ],
    members: [
      {
        id: "member-2",
        peer_set_id: "set-1",
        instrument_symbol: "BBB",
        exchange: "ST",
        instrument_name: "Peer B",
      },
      {
        id: "member-1",
        peer_set_id: "set-1",
        instrument_symbol: "AAA",
        exchange: "ST",
        instrument_name: "Peer A",
      },
      {
        id: "member-3",
        peer_set_id: "set-1",
        instrument_symbol: "CCC",
        exchange: "ST",
        instrument_name: "Peer C",
      },
    ],
    links: [
      {
        peer_set_id: "set-1",
        peer_member_id: "member-1",
        peer_set_source_id: "source-internal-1",
      },
      {
        peer_set_id: "set-1",
        peer_member_id: "member-2",
        peer_set_source_id: "source-internal-2",
      },
      {
        peer_set_id: "set-1",
        peer_member_id: "member-2",
        peer_set_source_id: "source-internal-1",
      },
      {
        peer_set_id: "set-1",
        peer_member_id: "member-3",
        peer_set_source_id: "source-internal-1",
      },
    ],
  };
}

describe("DivLab peer registry read contract", () => {
  it("assembles a complete latest registry version deterministically", () => {
    const result = buildLoadedPeerRegistrySet(rows());

    assert.equal(result.target.symbol, "EVO");
    assert.equal(result.target.exchange, "ST");
    assert.equal(result.target.name, "Evolution");
    assert.equal(result.versionNumber, 2);
    assert.equal(result.methodologyVersion, "peer-comparison-v1");
    assert.deepEqual(
      result.sources.map((source) => source.id),
      ["basis:industry", "basis:issuer"],
    );
    assert.deepEqual(
      result.members.map((member) => member.symbol),
      ["AAA", "BBB", "CCC"],
    );
    assert.deepEqual(result.members[1]?.relationshipSourceIds, ["basis:industry", "basis:issuer"]);
  });

  it("fails closed when a member has no relationship source", () => {
    const input = rows();
    input.links = input.links.filter(
      (link) =>
        (link as { peer_member_id?: string }).peer_member_id !== "member-3",
    );

    assert.throws(
      () => buildLoadedPeerRegistrySet(input),
      /peer_registry_read_member_source_missing:ST:CCC/,
    );
  });

  it("rejects a cross-set source row", () => {
    const input = rows();
    input.sources = [
      { ...(input.sources[0] as Record<string, unknown>), peer_set_id: "set-other" },
      input.sources[1],
    ];

    assert.throws(
      () => buildLoadedPeerRegistrySet(input),
      /peer_registry_read_source_set_mismatch/,
    );
  });

  it("rejects the target as its own peer", () => {
    const input = rows();
    input.members = [
      {
        ...(input.members[0] as Record<string, unknown>),
        instrument_symbol: "EVO",
        exchange: "ST",
      },
      input.members[1],
      input.members[2],
    ];

    assert.throws(
      () => buildLoadedPeerRegistrySet(input),
      /peer_registry_read_contains_target:ST:EVO/,
    );
  });

  it("rejects an incomplete set with fewer than three members", () => {
    const input = rows();
    input.members = input.members.slice(0, 2);

    assert.throws(
      () => buildLoadedPeerRegistrySet(input),
      /peer_registry_read_member_count_invalid/,
    );
  });
});
