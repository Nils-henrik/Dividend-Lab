import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DIVLAB_CURATED_PEER_CATALOG_VERSION,
  DIVLAB_CURATED_PEER_SETS,
  getCuratedPeerSet,
} from "../lib/analysis/curated-peer-catalog";

describe("DivLab curated peer catalog v1", () => {
  it("contains the three initial real-company validation targets", () => {
    assert.equal(DIVLAB_CURATED_PEER_SETS.length, 3);
    assert.deepEqual(
      DIVLAB_CURATED_PEER_SETS.map((set) => [
        set.registry.target.exchange,
        set.registry.target.symbol,
      ]),
      [
        ["ST", "ATCO-A"],
        ["ST", "EVO"],
        ["ST", "EMBRAC-B"],
      ],
    );
    assert.ok(
      DIVLAB_CURATED_PEER_SETS.every(
        (set) => set.version === DIVLAB_CURATED_PEER_CATALOG_VERSION,
      ),
    );
  });

  it("uses exactly three source-backed Nordic members per initial set", () => {
    for (const set of DIVLAB_CURATED_PEER_SETS) {
      assert.equal(set.registry.members.length, 3);
      assert.ok(set.registry.sources.length >= 4);
      const sourceIds = new Set(set.registry.sources.map((source) => source.id));
      for (const member of set.registry.members) {
        assert.ok(member.relationshipSourceIds.length >= 2);
        assert.ok(
          member.relationshipSourceIds.every((sourceId) => sourceIds.has(sourceId)),
        );
      }
    }
  });

  it("does not mislabel Atlas broad comparables as direct competitors", () => {
    const set = getCuratedPeerSet({ symbol: "atco-a", exchange: "st" });
    assert.ok(set);
    assert.equal(set.relationshipKind, "broad_industrial_comparable");
    assert.deepEqual(
      set.registry.members.map((member) => member.symbol),
      ["MTRS", "SAND", "EPI-A"],
    );
    assert.match(set.rationale, /inte som en lista över Atlas Copcos namngivna huvudkonkurrenter/i);
  });

  it("keeps Evolution in the B2B operator ecosystem and records GiG short-history risk", () => {
    const set = getCuratedPeerSet({ symbol: "EVO", exchange: "ST" });
    assert.ok(set);
    assert.equal(set.relationshipKind, "b2b_igaming_ecosystem");
    assert.deepEqual(
      set.registry.members.map((member) => member.symbol),
      ["HACK", "KAMBI", "GIG-SDB"],
    );
    assert.ok(set.limitations.some((value) => /kort fristående historik/i.test(value)));
  });

  it("keeps Embracer comparison explicitly broad after restructuring", () => {
    const set = getCuratedPeerSet({ symbol: "EMBRAC-B", exchange: "ST" });
    assert.ok(set);
    assert.equal(set.relationshipKind, "listed_gaming_group");
    assert.deepEqual(
      set.registry.members.map((member) => member.symbol),
      ["PDX", "SF", "MTG-B"],
    );
    assert.ok(set.limitations.some((value) => /koncernstruktur/i.test(value)));
  });
});
