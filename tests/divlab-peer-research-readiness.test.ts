import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import {
  DIVLAB_PEER_RESEARCH_READINESS_VERSION,
  evaluatePeerResearchReadiness,
} from "../lib/analysis/peer-research-readiness";

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

describe("DivLab peer research readiness v1", () => {
  it("accepts non-publishable facts research when source/fundamental/valuation evidence is ready", () => {
    const readiness = evaluatePeerResearchReadiness(packet());
    assert.equal(readiness.version, DIVLAB_PEER_RESEARCH_READINESS_VERSION);
    assert.equal(readiness.ready, true);
    assert.deepEqual(readiness.eligibleMetrics, ["pe", "priceToFcf"]);
    assert.deepEqual(readiness.blockers, []);
  });

  it("does not require analyst scenarios or technical publication checks", () => {
    const value = packet();
    value.qualityGate.checks.valuationScenarioCoverage = false;
    value.qualityGate.checks.technicalHistoryCoverage = false;
    value.qualityGate.checks.technicalLevelCoverage = false;
    assert.equal(evaluatePeerResearchReadiness(value).ready, true);
  });

  it("fails closed without verified primary evidence", () => {
    const value = packet();
    value.qualityGate.checks.primaryEvidenceCoverage = false;
    const readiness = evaluatePeerResearchReadiness(value);
    assert.equal(readiness.ready, false);
    assert.ok(
      readiness.blockers.includes(
        "peer_research_readiness_failed:primaryEvidenceCoverage",
      ),
    );
  });

  it("requires at least two traceable positive peer metrics", () => {
    const value = packet();
    value.valuation.trailing.priceToFcf = null;
    value.valuationProvenance.measures.priceToFcf = {
      ...value.valuationProvenance.measures.priceToFcf,
      available: false,
      traceable: false,
      sourceIds: [],
    };
    const readiness = evaluatePeerResearchReadiness(value);
    assert.equal(readiness.ready, false);
    assert.deepEqual(readiness.eligibleMetrics, ["pe"]);
    assert.ok(
      readiness.blockers.includes("peer_research_readiness_failed:peerMetricCoverage"),
    );
  });
});
