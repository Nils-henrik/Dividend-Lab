import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVerifiedPeerComparison,
  type PeerResearchSnapshot,
  type VerifiedPeerInput,
} from "../lib/analysis/peer-comparison";

const BASIS_ID = "peer-basis:industry-classification";

function snapshot(input: {
  symbol: string;
  pe?: number | null;
  priceToFcf?: number | null;
  evToEbit?: number | null;
  evToEbitda?: number | null;
  untraceable?: Array<"pe" | "priceToFcf" | "evToEbit" | "evToEbitda">;
  asOf?: string;
}): PeerResearchSnapshot {
  const untraceable = new Set(input.untraceable ?? []);
  const measure = (
    key: "pe" | "priceToFcf" | "evToEbit" | "evToEbitda",
    value: number | null | undefined,
  ) => ({
    value: value ?? null,
    traceable: value != null && !untraceable.has(key),
    sourceIds: value == null ? [] : [`market:${input.symbol}`, `fundamental:${input.symbol}`],
  });
  return {
    instrument: {
      symbol: input.symbol,
      exchange: "ST",
      name: `${input.symbol} AB`,
    },
    dataAsOf: input.asOf ?? "2026-08-14T16:00:00.000Z",
    measures: {
      pe: measure("pe", input.pe),
      priceToFcf: measure("priceToFcf", input.priceToFcf),
      evToEbit: measure("evToEbit", input.evToEbit),
      evToEbitda: measure("evToEbitda", input.evToEbitda),
    },
  };
}

function peer(value: PeerResearchSnapshot): VerifiedPeerInput {
  return {
    snapshot: value,
    relationshipSourceIds: [BASIS_ID],
  };
}

const basisSources = [
  {
    id: BASIS_ID,
    publisher: "Verified industry classification",
    url: "https://example.com/peer-basis",
    verifiedAt: "2026-08-14T16:00:00.000Z",
  },
];

describe("DivLab verified peer comparison", () => {
  it("compares only explicit source-backed peers without producing an investment score", () => {
    const result = buildVerifiedPeerComparison({
      target: snapshot({ symbol: "TARGET", pe: 15, priceToFcf: 12, evToEbit: 14, evToEbitda: 10 }),
      peers: [
        peer(snapshot({ symbol: "PEER1", pe: 10, priceToFcf: 9, evToEbit: 11, evToEbitda: 8 })),
        peer(snapshot({ symbol: "PEER2", pe: 20, priceToFcf: 13, evToEbit: 16, evToEbitda: 12 })),
        peer(snapshot({ symbol: "PEER3", pe: 30, priceToFcf: 17, evToEbit: 19, evToEbitda: 14 })),
      ],
      basisSources,
    });

    assert.equal(result.version, "peer-comparison-v1");
    assert.equal(result.status, "ready");
    assert.equal(result.peerCount, 3);
    assert.deepEqual(result.relationshipSourceIds, [BASIS_ID]);
    assert.equal(result.metrics.pe.status, "ready");
    assert.equal(result.metrics.pe.peerMedian, 20);
    assert.equal(result.metrics.pe.peerMin, 10);
    assert.equal(result.metrics.pe.peerMax, 30);
    assert.equal(result.metrics.pe.targetVsMedianPct, -0.25);
    assert.equal("score" in result, false);
  });

  it("excludes an untraceable peer value even when the number is present", () => {
    const result = buildVerifiedPeerComparison({
      target: snapshot({ symbol: "TARGET", pe: 15 }),
      peers: [
        peer(snapshot({ symbol: "PEER1", pe: 10 })),
        peer(snapshot({ symbol: "PEER2", pe: 20 })),
        peer(snapshot({ symbol: "PEER3", pe: 30, untraceable: ["pe"] })),
      ],
      basisSources,
    });

    assert.equal(result.status, "ready");
    assert.equal(result.metrics.pe.peerSampleSize, 2);
    assert.equal(result.metrics.pe.status, "insufficient");
    assert.equal(result.metrics.pe.peerMedian, 15);
  });

  it("requires at least three explicit peer members for a ready peer set", () => {
    const result = buildVerifiedPeerComparison({
      target: snapshot({ symbol: "TARGET", pe: 15 }),
      peers: [
        peer(snapshot({ symbol: "PEER1", pe: 10 })),
        peer(snapshot({ symbol: "PEER2", pe: 20 })),
      ],
      basisSources,
    });
    assert.equal(result.status, "insufficient");
    assert.match(result.notes[0] ?? "", /Minst tre/i);
  });

  it("rejects the target as its own peer", () => {
    assert.throws(
      () =>
        buildVerifiedPeerComparison({
          target: snapshot({ symbol: "TARGET", pe: 15 }),
          peers: [peer(snapshot({ symbol: "TARGET", pe: 15 }))],
          basisSources,
        }),
      /peer_set_contains_target/,
    );
  });

  it("rejects duplicate peer identities", () => {
    assert.throws(
      () =>
        buildVerifiedPeerComparison({
          target: snapshot({ symbol: "TARGET", pe: 15 }),
          peers: [
            peer(snapshot({ symbol: "PEER1", pe: 10 })),
            peer(snapshot({ symbol: "PEER1", pe: 11 })),
          ],
          basisSources,
        }),
      /peer_set_duplicate_member/,
    );
  });

  it("rejects a peer relationship that is not backed by a known verified source", () => {
    assert.throws(
      () =>
        buildVerifiedPeerComparison({
          target: snapshot({ symbol: "TARGET", pe: 15 }),
          peers: [
            {
              snapshot: snapshot({ symbol: "PEER1", pe: 10 }),
              relationshipSourceIds: ["peer-basis:invented"],
            },
          ],
          basisSources,
        }),
      /peer_relationship_source_unknown/,
    );
  });
});
