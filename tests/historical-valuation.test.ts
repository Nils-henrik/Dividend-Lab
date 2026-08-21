import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHistoricalValuationAnalysis,
  HISTORICAL_VALUATION_MIN_OBSERVATIONS,
} from "../lib/analysis/historical-valuation";
import type { VersionedResearchPacket } from "../lib/analysis/peer-comparison-audit";

const SOURCE_IDS = ["market:fixture", "fundamental:fixture"] as const;

function version(input: {
  id: string;
  createdAt: string;
  pe: number;
  symbol?: string;
  publishable?: boolean;
  sourceVerifiedAt?: string;
}): VersionedResearchPacket {
  const publishedAt = new Date(new Date(input.createdAt).getTime() - 60 * 60 * 1_000).toISOString();
  const sourceVerifiedAt = input.sourceVerifiedAt ?? publishedAt;
  const measures = {
    pe: {
      available: true,
      traceable: true,
      sourceIds: [...SOURCE_IDS],
      primaryConfirmedMetrics: [],
    },
    priceToFcf: {
      available: false,
      traceable: false,
      sourceIds: [],
      primaryConfirmedMetrics: [],
    },
    fcfYield: {
      available: false,
      traceable: false,
      sourceIds: [],
      primaryConfirmedMetrics: [],
    },
    enterpriseValue: {
      available: false,
      traceable: false,
      sourceIds: [],
      primaryConfirmedMetrics: [],
    },
    evToEbit: {
      available: false,
      traceable: false,
      sourceIds: [],
      primaryConfirmedMetrics: [],
    },
    evToEbitda: {
      available: false,
      traceable: false,
      sourceIds: [],
      primaryConfirmedMetrics: [],
    },
  };

  return {
    analysisVersionId: input.id,
    packet: {
      version: "deep-research-v2",
      instrument: {
        symbol: input.symbol ?? "ATCO-A",
        exchange: "ST",
        name: "Atlas Copco A",
        currency: "SEK",
        currentPrice: 180,
      },
      createdAt: input.createdAt,
      dataAsOf: publishedAt,
      valuation: {
        currentPrice: 180,
        currency: "SEK",
        trailing: {
          pe: input.pe,
          priceToFcf: null,
          fcfYield: null,
          enterpriseValue: null,
          evToEbit: null,
          evToEbitda: null,
          epsCurrency: "SEK",
          freeCashFlowPerShareCurrency: "SEK",
          epsCurrencyCompatible: true,
          freeCashFlowCurrencyCompatible: true,
        },
        scenarios: [],
        baseCaseValue: null,
        baseCaseUpsideDownsidePct: null,
      },
      valuationProvenance: {
        version: "valuation-provenance-v1",
        measures,
      },
      sources: [
        {
          id: SOURCE_IDS[0],
          kind: "market_data",
          publisher: "Fixture market",
          url: "https://example.com/market",
          publishedAt,
          verifiedAt: sourceVerifiedAt,
          primary: false,
        },
        {
          id: SOURCE_IDS[1],
          kind: "fundamental_data",
          publisher: "Fixture fundamentals",
          url: "https://example.com/fundamentals",
          publishedAt,
          verifiedAt: sourceVerifiedAt,
          primary: false,
        },
      ],
      qualityGate: { publishable: input.publishable ?? true },
    },
  } as unknown as VersionedResearchPacket;
}

function id(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

describe("historical valuation v1", () => {
  it("builds ranges only after four real immutable observation days and deduplicates repeated same-day analysis", () => {
    const result = buildHistoricalValuationAnalysis({
      versions: [
        version({ id: id(1), createdAt: "2026-08-01T10:00:00.000Z", pe: 10 }),
        version({ id: id(2), createdAt: "2026-08-02T10:00:00.000Z", pe: 12 }),
        version({ id: id(3), createdAt: "2026-08-03T10:00:00.000Z", pe: 14 }),
        version({ id: id(4), createdAt: "2026-08-04T10:00:00.000Z", pe: 16 }),
        version({ id: id(5), createdAt: "2026-08-04T12:00:00.000Z", pe: 18 }),
      ],
      generatedAt: "2026-08-05T00:00:00.000Z",
    });

    assert.ok(result);
    assert.equal(HISTORICAL_VALUATION_MIN_OBSERVATIONS, 4);
    assert.equal(result.observationPolicy, "immutable_research_versions_only");
    assert.equal(result.ranges.pe.status, "ready");
    assert.equal(result.ranges.pe.sampleSize, 4);
    assert.deepEqual(
      result.ranges.pe.observations.map((item) => item.value),
      [10, 12, 14, 18],
    );
    assert.deepEqual(result.ranges.pe.statistics, {
      min: 10,
      q1: 11.5,
      median: 13,
      q3: 15,
      max: 18,
      latest: 18,
      latestPercentile: 0.875,
    });
    assert.equal(result.ranges.priceToFcf.status, "insufficient");
    assert.equal(result.ranges.priceToFcf.statistics, null);
  });

  it("refuses to call a sparse history ready", () => {
    const result = buildHistoricalValuationAnalysis({
      versions: [
        version({ id: id(11), createdAt: "2026-08-01T10:00:00.000Z", pe: 10 }),
        version({ id: id(12), createdAt: "2026-08-02T10:00:00.000Z", pe: 12 }),
        version({ id: id(13), createdAt: "2026-08-03T10:00:00.000Z", pe: 14 }),
      ],
      generatedAt: "2026-08-04T00:00:00.000Z",
    });
    assert.ok(result);
    assert.equal(result.ranges.pe.status, "insufficient");
    assert.equal(result.ranges.pe.sampleSize, 3);
    assert.equal(result.ranges.pe.statistics, null);
  });

  it("rejects source lookahead rather than backfilling future knowledge", () => {
    assert.throws(
      () =>
        buildHistoricalValuationAnalysis({
          versions: [
            version({
              id: id(21),
              createdAt: "2026-08-01T10:00:00.000Z",
              pe: 10,
              sourceVerifiedAt: "2026-08-02T10:00:00.000Z",
            }),
          ],
          generatedAt: "2026-08-03T00:00:00.000Z",
        }),
      /historical_valuation_source_lookahead/,
    );
  });

  it("rejects mixed instruments and non-publishable versions", () => {
    assert.throws(
      () =>
        buildHistoricalValuationAnalysis({
          versions: [
            version({ id: id(31), createdAt: "2026-08-01T10:00:00.000Z", pe: 10 }),
            version({
              id: id(32),
              createdAt: "2026-08-02T10:00:00.000Z",
              pe: 11,
              symbol: "SAND",
            }),
          ],
          generatedAt: "2026-08-03T00:00:00.000Z",
        }),
      /historical_valuation_mixed_instruments/,
    );

    assert.throws(
      () =>
        buildHistoricalValuationAnalysis({
          versions: [
            version({
              id: id(33),
              createdAt: "2026-08-01T10:00:00.000Z",
              pe: 10,
              publishable: false,
            }),
          ],
          generatedAt: "2026-08-03T00:00:00.000Z",
        }),
      /historical_valuation_requires_publishable_research/,
    );
  });

  it("rejects observation or generation lookahead", () => {
    assert.throws(
      () =>
        buildHistoricalValuationAnalysis({
          versions: [
            version({ id: id(41), createdAt: "2026-08-05T10:00:00.000Z", pe: 10 }),
          ],
          generatedAt: "2026-08-06T00:00:00.000Z",
          maxObservationAt: "2026-08-04T00:00:00.000Z",
        }),
      /historical_valuation_observation_lookahead/,
    );

    assert.throws(
      () =>
        buildHistoricalValuationAnalysis({
          versions: [
            version({ id: id(42), createdAt: "2026-08-01T10:00:00.000Z", pe: 10 }),
          ],
          generatedAt: "2026-08-03T00:00:00.000Z",
          maxObservationAt: "2026-08-04T00:00:00.000Z",
        }),
      /historical_valuation_generation_lookahead/,
    );
  });
});
