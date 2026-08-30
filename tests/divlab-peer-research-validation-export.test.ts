import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import {
  buildPeerResearchValidationExport,
  DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION,
} from "../lib/analysis/peer-research-validation-export";

function packet(): DivLabResearchPacket {
  const readyMeasure = (value: number) => ({
    available: true,
    traceable: true,
    sourceIds: ["market:test", "fundamental:test"],
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
    sources: [],
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

describe("peer research validation export", () => {
  it("exports only a ready facts-only packet without mutating it", () => {
    const value = packet();
    const exported = buildPeerResearchValidationExport({
      packet: value,
      now: new Date("2026-08-15T18:00:00.000Z"),
    });

    assert.equal(exported.version, DIVLAB_PEER_RESEARCH_VALIDATION_EXPORT_VERSION);
    assert.equal(exported.exportedAt, "2026-08-15T18:00:00.000Z");
    assert.equal(exported.slug, "peer-ab-peer-st");
    assert.equal(exported.ordinaryPublishable, false);
    assert.equal(exported.readiness.ready, true);
    assert.equal(exported.packet, value);
  });

  it("fails closed when the packet is not peer-ready", () => {
    const value = packet();
    value.qualityGate.checks.primaryEvidenceCoverage = false;
    assert.throws(
      () => buildPeerResearchValidationExport({ packet: value }),
      /peer_research_validation_export_not_ready/,
    );
  });

  it("refuses an ordinary publishable packet on the peer-validation export path", () => {
    const value = packet();
    value.qualityGate.publishable = true;
    assert.throws(
      () => buildPeerResearchValidationExport({ packet: value }),
      /peer_research_validation_export_public_packet_forbidden/,
    );
  });
});
