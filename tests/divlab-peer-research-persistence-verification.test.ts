import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildPeerResearchValidationExport } from "../lib/analysis/peer-research-validation-export";
import {
  DIVLAB_PEER_RESEARCH_PERSISTENCE_VERIFICATION_VERSION,
  verifyPeerResearchPersistence,
} from "../lib/analysis/peer-research-persistence-verification";

const VERSION_ID = "11111111-1111-4111-8111-111111111111";

function packet(): DivLabResearchPacket {
  const sourceIds = ["nordic-primary:PEER:q2", "market:PEER"];
  const readyMeasure = (value: number) => ({
    available: true,
    traceable: true,
    sourceIds,
    primaryConfirmedMetrics: [],
    value,
  });
  const unavailable = {
    available: false,
    traceable: false,
    sourceIds: [],
    primaryConfirmedMetrics: [],
    value: null,
  };

  return {
    version: "deep-research-v2",
    instrument: {
      symbol: "PEER",
      exchange: "ST",
      name: "Peer AB",
      currency: "SEK",
      currentPrice: 100,
    },
    dataAsOf: "2026-08-15T11:00:00.000Z",
    sources: [
      {
        id: sourceIds[0],
        kind: "quarterly_report",
        publisher: "view.news.eu.nasdaq.com",
        url: "https://attachment.news.eu.nasdaq.com/peer-q2",
        publishedAt: "2026-07-20T06:00:00.000Z",
        verifiedAt: "2026-08-15T11:00:00.000Z",
        primary: true,
      },
      {
        id: sourceIds[1],
        kind: "market_data",
        publisher: "Yahoo Finance",
        url: "https://finance.yahoo.com/quote/PEER.ST",
        publishedAt: "2026-08-15T10:55:00.000Z",
        verifiedAt: "2026-08-15T11:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [],
    qualityGate: {
      publishable: false,
      score: 82,
      blockers: ["valuation scenarios intentionally absent"],
      warnings: [],
      checks: {
        companyClassificationCoverage: true,
        fundamentalMethodologyCoverage: true,
        fundamentalCoverage: true,
        multiYearFundamentalCoverage: true,
        freshPrimarySource: true,
        sourceTraceability: true,
        primaryEvidenceCoverage: true,
        valuationTraceability: true,
        valuationScenarioCoverage: false,
        technicalHistoryCoverage: true,
        technicalLevelCoverage: true,
      },
    },
    valuation: {
      trailing: {
        pe: 20,
        priceToFcf: 18,
        fcfYield: null,
        enterpriseValue: null,
        evToEbit: null,
        evToEbitda: null,
      },
      scenarios: [],
    },
    valuationProvenance: {
      version: "valuation-provenance-v1",
      measures: {
        pe: readyMeasure(20),
        priceToFcf: readyMeasure(18),
        fcfYield: unavailable,
        enterpriseValue: unavailable,
        evToEbit: unavailable,
        evToEbitda: unavailable,
      },
    },
  } as unknown as DivLabResearchPacket;
}

function setup() {
  const exported = buildPeerResearchValidationExport({
    packet: packet(),
    now: new Date("2026-08-15T18:00:00.000Z"),
  });
  const row = {
    id: VERSION_ID,
    engine_version: "deep-research-v2",
    data_as_of: exported.dataAsOf,
    research_packet: structuredClone(exported.packet),
    publishable: false,
  };
  return { exported, row };
}

describe("peer research DEV persistence verification", () => {
  it("verifies exact immutable packet and source bindings", () => {
    const { exported, row } = setup();
    const result = verifyPeerResearchPersistence({
      validationExport: exported,
      row,
      persistedSourceIds: ["market:PEER", "nordic-primary:PEER:q2"],
    });

    assert.equal(
      result.version,
      DIVLAB_PEER_RESEARCH_PERSISTENCE_VERIFICATION_VERSION,
    );
    assert.equal(result.verified, true);
    assert.equal(result.analysisVersionId, VERSION_ID);
    assert.equal(result.dataAsOf, exported.dataAsOf);
    assert.equal(result.sourceCount, 2);
  });

  it("rejects a packet that changed after export even if it remains peer-ready", () => {
    const { exported, row } = setup();
    const researchPacket = row.research_packet as DivLabResearchPacket;
    researchPacket.valuation.trailing.pe = 21;

    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row,
          persistedSourceIds: exported.packet.sources.map((source) => source.id),
        }),
      /peer_research_persistence_packet_mismatch/,
    );
  });

  it("requires the persisted peer version to remain ordinary publishable=false", () => {
    const { exported, row } = setup();
    row.publishable = true;

    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row,
          persistedSourceIds: exported.packet.sources.map((source) => source.id),
        }),
      /peer_research_persistence_row_publishable_invalid/,
    );
  });

  it("rejects missing, extra and duplicate persisted source bindings", () => {
    const { exported, row } = setup();

    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row,
          persistedSourceIds: ["nordic-primary:PEER:q2"],
        }),
      /peer_research_persistence_source_binding_mismatch/,
    );
    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row,
          persistedSourceIds: [
            "nordic-primary:PEER:q2",
            "market:PEER",
            "extra:source",
          ],
        }),
      /peer_research_persistence_source_binding_mismatch/,
    );
    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row,
          persistedSourceIds: ["market:PEER", "market:PEER"],
        }),
      /peer_research_persistence_row_source_ids_duplicate/,
    );
  });

  it("rejects identity/data-as-of drift through the immutable row reader", () => {
    const { exported, row } = setup();
    const wrongIdentity = structuredClone(row);
    (wrongIdentity.research_packet as DivLabResearchPacket).instrument.symbol = "OTHER";
    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row: wrongIdentity,
          persistedSourceIds: exported.packet.sources.map((source) => source.id),
        }),
      /divlab_research_version_identity_mismatch/,
    );

    const wrongBoundary = structuredClone(row);
    wrongBoundary.data_as_of = "2026-08-15T11:01:00.000Z";
    assert.throws(
      () =>
        verifyPeerResearchPersistence({
          validationExport: exported,
          row: wrongBoundary,
          persistedSourceIds: exported.packet.sources.map((source) => source.id),
        }),
      /divlab_peer_research_version_packet_contract_invalid/,
    );
  });
});
