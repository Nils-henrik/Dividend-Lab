import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVersionedResearchPacketFromRow,
  normalizeAnalysisVersionId,
} from "../lib/analysis/research-version-read";

const VERSION_ID = "00000000-0000-4000-8000-000000000111";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: VERSION_ID,
    engine_version: "deep-research-v2",
    data_as_of: "2026-08-15T09:00:00.000Z",
    publishable: true,
    research_packet: {
      version: "deep-research-v2",
      instrument: {
        symbol: "EVO",
        exchange: "ST",
        name: "Evolution",
        currency: "SEK",
        currentPrice: 100,
      },
      dataAsOf: "2026-08-15T09:00:00.000Z",
      qualityGate: { publishable: true },
      valuation: {
        trailing: {
          pe: 20,
          priceToFcf: 18,
          fcfYield: 0.055,
          enterpriseValue: 1_000,
          evToEbit: 17,
          evToEbitda: 16,
        },
      },
      valuationProvenance: {
        version: "valuation-provenance-v1",
        measures: {},
      },
    },
    ...overrides,
  };
}

describe("DivLab persisted research version read boundary", () => {
  it("accepts one exact publishable Deep Research v2 row", () => {
    const result = buildVersionedResearchPacketFromRow({
      row: row(),
      expectedSymbol: "evo",
      expectedExchange: "st",
    });

    assert.equal(result.analysisVersionId, VERSION_ID);
    assert.equal(result.packet.version, "deep-research-v2");
    assert.equal(result.packet.instrument.symbol, "EVO");
    assert.equal(result.packet.qualityGate.publishable, true);
  });

  it("rejects non-publishable research", () => {
    assert.throws(
      () => buildVersionedResearchPacketFromRow({ row: row({ publishable: false }) }),
      /divlab_research_version_not_analyst_grade/,
    );
  });

  it("rejects a packet whose data-as-of differs from the immutable row", () => {
    const invalid = row();
    (invalid.research_packet as Record<string, unknown>).dataAsOf =
      "2026-08-15T09:01:00.000Z";

    assert.throws(
      () => buildVersionedResearchPacketFromRow({ row: invalid }),
      /divlab_research_version_packet_contract_invalid/,
    );
  });

  it("rejects the wrong instrument identity", () => {
    assert.throws(
      () =>
        buildVersionedResearchPacketFromRow({
          row: row(),
          expectedSymbol: "ATCO-A",
          expectedExchange: "ST",
        }),
      /divlab_research_version_identity_mismatch/,
    );
  });

  it("rejects stale provenance and invalid analysis-version ids", () => {
    const invalid = row();
    const packet = invalid.research_packet as Record<string, unknown>;
    packet.valuationProvenance = {
      version: "valuation-provenance-v0",
      measures: {},
    };
    assert.throws(
      () => buildVersionedResearchPacketFromRow({ row: invalid }),
      /divlab_research_version_packet_contract_invalid/,
    );
    assert.throws(
      () => normalizeAnalysisVersionId("latest"),
      /divlab_research_version_id_invalid/,
    );
  });
});
