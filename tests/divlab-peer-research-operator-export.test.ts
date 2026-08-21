import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import {
  DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION,
  buildPeerResearchOperatorExport,
  decodePeerResearchOperatorPacket,
} from "../lib/analysis/peer-research-operator-export";
import { buildPeerResearchValidationExport } from "../lib/analysis/peer-research-validation-export";

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
    dataAsOf: "2026-08-15T18:30:00.000Z",
    sources: [
      {
        id: "market:test",
        kind: "market_data",
        publisher: "Test Market",
        url: "https://example.com/market",
        publishedAt: "2026-08-15T18:29:00.000Z",
        verifiedAt: "2026-08-15T18:30:00.000Z",
        primary: false,
      },
      {
        id: "fundamental:test",
        kind: "company_primary",
        publisher: "Peer AB",
        url: "https://example.com/report",
        publishedAt: "2026-08-15T08:00:00.000Z",
        verifiedAt: "2026-08-15T18:30:00.000Z",
        primary: true,
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
        technicalHistoryCoverage: false,
        technicalLevelCoverage: false,
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

describe("peer research operator export", () => {
  it("round-trips the exact ready packet through checksum-bound UTF-8/base64 transport", () => {
    const value = packet();
    const validationExport = buildPeerResearchValidationExport({
      packet: value,
      now: new Date("2026-08-15T18:31:00.000Z"),
    });
    const operatorExport = buildPeerResearchOperatorExport({ validationExport });

    assert.equal(operatorExport.version, DIVLAB_PEER_RESEARCH_OPERATOR_EXPORT_VERSION);
    assert.equal(operatorExport.packetEncoding, "base64-json-utf8");
    assert.match(operatorExport.packetSha256, /^[0-9a-f]{64}$/);
    assert.equal(operatorExport.sourceCount, 2);
    assert.deepEqual(operatorExport.sourceIds, ["market:test", "fundamental:test"]);
    assert.equal("packet" in operatorExport, false);
    assert.deepEqual(decodePeerResearchOperatorPacket(operatorExport), value);
  });

  it("fails closed when the encoded bytes or checksum are changed", () => {
    const validationExport = buildPeerResearchValidationExport({ packet: packet() });
    const operatorExport = buildPeerResearchOperatorExport({ validationExport });

    assert.throws(() =>
      decodePeerResearchOperatorPacket({
        ...operatorExport,
        packetSha256: "0".repeat(64),
      }),
    );

    const replacement = operatorExport.packetBase64.endsWith("A") ? "B" : "A";
    assert.throws(() =>
      decodePeerResearchOperatorPacket({
        ...operatorExport,
        packetBase64: `${operatorExport.packetBase64.slice(0, -1)}${replacement}`,
      }),
    );
  });

  it("fails closed when operator source bindings drift from the packet", () => {
    const validationExport = buildPeerResearchValidationExport({ packet: packet() });
    const operatorExport = buildPeerResearchOperatorExport({ validationExport });

    assert.throws(() =>
      decodePeerResearchOperatorPacket({
        ...operatorExport,
        sourceIds: [...operatorExport.sourceIds].reverse(),
      }),
    );
  });
});
