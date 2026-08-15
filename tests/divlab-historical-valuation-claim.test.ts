import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertHistoricalValuationClaimMatches,
  buildHistoricalValuationClaim,
  DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION,
} from "../lib/analysis/historical-valuation-claim";
import type {
  HistoricalValuationAnalysis,
  HistoricalValuationObservation,
} from "../lib/analysis/historical-valuation";

const IDS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
];

function observations(): HistoricalValuationObservation[] {
  return IDS.map((analysisVersionId, index) => ({
    analysisVersionId,
    observationAt: `2026-08-${String(10 + index).padStart(2, "0")}T16:00:00.000Z`,
    dataAsOf: `2026-08-${String(10 + index).padStart(2, "0")}T15:30:00.000Z`,
    value: [20, 24, 22, 28][index]!,
    sourceIds: [`market:${index + 1}`, `fundamental:${index + 1}`],
  }));
}

function fixture(): HistoricalValuationAnalysis {
  const peObservations = observations();
  return {
    version: "historical-valuation-v1",
    instrument: {
      symbol: "ATCO-A",
      exchange: "ST",
      name: "Atlas Copco A",
    },
    observationPolicy: "immutable_research_versions_only",
    generatedAt: "2026-08-15T12:00:00.000Z",
    maxObservationAt: "2026-08-15T12:00:00.000Z",
    ranges: {
      pe: {
        metric: "pe",
        status: "ready",
        sampleSize: 4,
        observations: peObservations,
        statistics: {
          min: 20,
          q1: 21.5,
          median: 23,
          q3: 25,
          max: 28,
          latest: 28,
          latestPercentile: 0.875,
        },
      },
      priceToFcf: {
        metric: "priceToFcf",
        status: "insufficient",
        sampleSize: 0,
        observations: [],
        statistics: null,
      },
      fcfYield: {
        metric: "fcfYield",
        status: "insufficient",
        sampleSize: 0,
        observations: [],
        statistics: null,
      },
      evToEbit: {
        metric: "evToEbit",
        status: "insufficient",
        sampleSize: 0,
        observations: [],
        statistics: null,
      },
      evToEbitda: {
        metric: "evToEbitda",
        status: "insufficient",
        sampleSize: 0,
        observations: [],
        statistics: null,
      },
    },
  };
}

describe("historical valuation claim provenance", () => {
  it("binds a ready metric to every immutable observation and source", () => {
    const history = fixture();
    const claim = buildHistoricalValuationClaim({ history, metric: "pe" });

    assert.equal(claim.version, DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION);
    assert.equal(claim.historyVersion, "historical-valuation-v1");
    assert.equal(claim.sampleSize, 4);
    assert.equal(claim.latestAnalysisVersionId, IDS[3]);
    assert.deepEqual(claim.observationAnalysisVersionIds, IDS);
    assert.deepEqual(claim.sourceIds, [
      "fundamental:1",
      "fundamental:2",
      "fundamental:3",
      "fundamental:4",
      "market:1",
      "market:2",
      "market:3",
      "market:4",
    ]);
    assert.equal(claim.statistics.latestPercentile, 0.875);
    assert.doesNotThrow(() => assertHistoricalValuationClaimMatches({ claim, history }));
  });

  it("rejects a manipulated percentile", () => {
    const history = fixture();
    const claim = buildHistoricalValuationClaim({ history, metric: "pe" });
    const manipulated = {
      ...claim,
      statistics: { ...claim.statistics, latestPercentile: 0.99 },
    };

    assert.throws(
      () => assertHistoricalValuationClaimMatches({ claim: manipulated, history }),
      /historical_valuation_claim_statistic_mismatch:latestPercentile/,
    );
  });

  it("rejects altered research-version or source bindings", () => {
    const history = fixture();
    const claim = buildHistoricalValuationClaim({ history, metric: "pe" });

    assert.throws(
      () =>
        assertHistoricalValuationClaimMatches({
          claim: {
            ...claim,
            observationAnalysisVersionIds: [
              ...claim.observationAnalysisVersionIds.slice(0, 3),
              "55555555-5555-4555-8555-555555555555",
            ],
          },
          history,
        }),
      /historical_valuation_claim_version_bindings_mismatch/,
    );

    assert.throws(
      () =>
        assertHistoricalValuationClaimMatches({
          claim: { ...claim, sourceIds: claim.sourceIds.slice(1) },
          history,
        }),
      /historical_valuation_claim_source_bindings_mismatch/,
    );
  });

  it("refuses insufficient history", () => {
    const history = fixture();
    assert.throws(
      () => buildHistoricalValuationClaim({ history, metric: "priceToFcf" }),
      /historical_valuation_claim_history_not_ready/,
    );
  });

  it("rejects lookahead and duplicate immutable versions", () => {
    const lookahead = fixture();
    lookahead.ranges.pe.observations[3] = {
      ...lookahead.ranges.pe.observations[3]!,
      observationAt: "2026-08-16T16:00:00.000Z",
    };
    assert.throws(
      () => buildHistoricalValuationClaim({ history: lookahead, metric: "pe" }),
      /historical_valuation_claim_lookahead/,
    );

    const duplicate = fixture();
    duplicate.ranges.pe.observations[3] = {
      ...duplicate.ranges.pe.observations[3]!,
      analysisVersionId: IDS[2]!,
    };
    assert.throws(
      () => buildHistoricalValuationClaim({ history: duplicate, metric: "pe" }),
      /historical_valuation_claim_duplicate_analysis_version/,
    );
  });
});
