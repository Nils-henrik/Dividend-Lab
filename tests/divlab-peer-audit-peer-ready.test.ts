import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import { buildVersionBoundPeerComparisonAudit } from "../lib/analysis/peer-comparison-audit";
import type { LoadedPeerRegistrySet } from "../lib/analysis/peer-registry-read";

const IDS = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
  "00000000-0000-4000-8000-000000000103",
  "00000000-0000-4000-8000-000000000104",
] as const;

function packet(symbol: string, value: number, publishable: boolean): DivLabResearchPacket {
  const measure = (metricValue: number) => ({
    available: true,
    traceable: true,
    sourceIds: [`market:${symbol}`, `fundamental:${symbol}`],
    primaryConfirmedMetrics: [],
    value: metricValue,
  });
  return {
    version: "deep-research-v2",
    instrument: { symbol, exchange: "ST", name: symbol, currency: "SEK", currentPrice: 100 },
    dataAsOf: "2026-08-15T11:00:00.000Z",
    qualityGate: {
      publishable,
      score: publishable ? 100 : 82,
      blockers: publishable ? [] : ["valuation scenarios intentionally absent"],
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
        valuationScenarioCoverage: publishable,
        technicalHistoryCoverage: true,
        technicalLevelCoverage: true,
      },
    },
    valuation: {
      trailing: {
        pe: value,
        priceToFcf: value + 1,
        fcfYield: 1 / (value + 1),
        enterpriseValue: 1_000,
        evToEbit: value - 1,
        evToEbitda: value - 2,
      },
      scenarios: [],
    },
    valuationProvenance: {
      version: "valuation-provenance-v1",
      measures: {
        pe: measure(value),
        priceToFcf: measure(value + 1),
        fcfYield: measure(1 / (value + 1)),
        enterpriseValue: measure(1_000),
        evToEbit: measure(value - 1),
        evToEbitda: measure(value - 2),
      },
    },
  } as unknown as DivLabResearchPacket;
}

const registry: LoadedPeerRegistrySet = {
  targetId: "target-evo",
  peerSetId: "set-evo",
  versionNumber: 1,
  target: { symbol: "EVO", exchange: "ST", name: "Evolution" },
  dataAsOf: "2026-08-15T10:00:00.000Z",
  methodologyVersion: "peer-comparison-v1",
  sources: [
    {
      id: "basis:official",
      publisher: "Official source",
      url: "https://example.com/official",
      verifiedAt: "2026-08-15T10:00:00.000Z",
    },
  ],
  members: ["AAA", "BBB", "CCC"].map((symbol) => ({
    symbol,
    exchange: "ST",
    name: symbol,
    relationshipSourceIds: ["basis:official"],
  })),
};

describe("peer audit with facts-only peer research", () => {
  it("keeps the target publishable while accepting peer-research-ready non-publishable peers", () => {
    const audit = buildVersionBoundPeerComparisonAudit({
      registry,
      targetResearch: { analysisVersionId: IDS[0], packet: packet("EVO", 12, true) },
      peerResearch: [
        { analysisVersionId: IDS[1], packet: packet("AAA", 9, false) },
        { analysisVersionId: IDS[2], packet: packet("BBB", 10, false) },
        { analysisVersionId: IDS[3], packet: packet("CCC", 11, false) },
      ],
    });

    assert.equal(audit.comparison.status, "ready");
    assert.equal(audit.comparison.metrics.pe.peerMedian, 10);
    assert.equal(audit.peerResearch.length, 3);
  });

  it("still rejects a non-publishable target", () => {
    assert.throws(
      () =>
        buildVersionBoundPeerComparisonAudit({
          registry,
          targetResearch: { analysisVersionId: IDS[0], packet: packet("EVO", 12, false) },
          peerResearch: [
            { analysisVersionId: IDS[1], packet: packet("AAA", 9, false) },
            { analysisVersionId: IDS[2], packet: packet("BBB", 10, false) },
            { analysisVersionId: IDS[3], packet: packet("CCC", 11, false) },
          ],
        }),
      /peer_comparison_audit_requires_publishable_research/,
    );
  });
});
