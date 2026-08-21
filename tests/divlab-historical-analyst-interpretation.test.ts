import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHistoricalAnalystContext } from "../lib/analysis/historical-analyst-context";
import { composeHistoricalAnalystInterpretation } from "../lib/analysis/historical-analyst-composition";
import { validateHistoricalAnalystInterpretation } from "../lib/analysis/historical-analyst-contract";
import { evaluateHistoricalAnalystInterpretationQuality } from "../lib/analysis/historical-analyst-quality-gate";
import { divLabHistoricalAnalystInterpretationSchema } from "../lib/analysis/historical-analyst-schema";
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

function observations(
  values: readonly number[],
  sourcePrefix: string,
): HistoricalValuationObservation[] {
  return IDS.map((analysisVersionId, index) => ({
    analysisVersionId,
    observationAt: `2026-08-${String(10 + index).padStart(2, "0")}T16:00:00.000Z`,
    dataAsOf: `2026-08-${String(10 + index).padStart(2, "0")}T15:30:00.000Z`,
    value: values[index]!,
    sourceIds: [`${sourcePrefix}:${index + 1}`],
  }));
}

function fixture(): HistoricalValuationAnalysis {
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
        observations: observations([20, 24, 22, 28], "pe"),
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
        status: "ready",
        sampleSize: 4,
        observations: observations([0.04, 0.05, 0.045, 0.035], "fcf"),
        statistics: {
          min: 0.035,
          q1: 0.03875,
          median: 0.0425,
          q3: 0.04625,
          max: 0.05,
          latest: 0.035,
          latestPercentile: 0.125,
        },
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

function validSetup() {
  const history = fixture();
  const context = buildHistoricalAnalystContext({ history });
  assert.ok(context);
  const interpretation = composeHistoricalAnalystInterpretation({
    history,
    context,
  });
  return { history, context, interpretation };
}

describe("historical analyst interpretation", () => {
  it("covers every ready metric with deterministic neutral grounding", () => {
    const { history, context, interpretation } = validSetup();

    assert.deepEqual(
      interpretation.interpretations.map((claim) => claim.metric),
      ["pe", "fcfYield"],
    );
    assert.equal(interpretation.interpretations[0]?.positionBand, "top_quartile");
    assert.equal(interpretation.interpretations[1]?.positionBand, "bottom_quartile");
    assert.equal(interpretation.interpretations[0]?.evidenceBreadth, "limited");
    assert.doesNotThrow(() =>
      validateHistoricalAnalystInterpretation({
        history,
        context,
        interpretation,
      }),
    );

    const quality = evaluateHistoricalAnalystInterpretationQuality({
      history,
      context,
      interpretation,
    });
    assert.equal(quality.publishable, true);
    assert.equal(quality.score, 100);
  });

  it("rejects cherry-picking of ready historical metrics", () => {
    const { history, context, interpretation } = validSetup();
    const cherryPicked = {
      ...interpretation,
      interpretations: interpretation.interpretations.slice(0, 1),
    };

    assert.throws(
      () =>
        validateHistoricalAnalystInterpretation({
          history,
          context,
          interpretation: cherryPicked,
        }),
      /historical_analyst_metric_coverage_mismatch/,
    );
    const quality = evaluateHistoricalAnalystInterpretationQuality({
      history,
      context,
      interpretation: cherryPicked,
    });
    assert.equal(quality.checks.completeMetricCoverage, false);
    assert.equal(quality.publishable, false);
  });

  it("rejects manipulated statistics and point-in-time bindings", () => {
    const { history, context, interpretation } = validSetup();
    const manipulated = structuredClone(interpretation);
    manipulated.interpretations[0]!.statistics.median = 23.5;

    assert.throws(
      () =>
        validateHistoricalAnalystInterpretation({
          history,
          context,
          interpretation: manipulated,
        }),
      /historical_analyst_numeric_mismatch:pe:median/,
    );
    assert.equal(
      evaluateHistoricalAnalystInterpretationQuality({
        history,
        context,
        interpretation: manipulated,
      }).checks.numericGrounding,
      false,
    );

    const wrongBoundary = {
      ...interpretation,
      maxObservationAt: "2026-08-16T12:00:00.000Z",
    };
    assert.throws(
      () =>
        validateHistoricalAnalystInterpretation({
          history,
          context,
          interpretation: wrongBoundary,
        }),
      /historical_analyst_boundary_mismatch/,
    );
  });

  it("rejects false percentile position and overstated evidence breadth", () => {
    const { history, context, interpretation } = validSetup();
    const wrongPosition = structuredClone(interpretation);
    wrongPosition.interpretations[0]!.positionBand = "bottom_quartile";
    assert.throws(
      () =>
        validateHistoricalAnalystInterpretation({
          history,
          context,
          interpretation: wrongPosition,
        }),
      /historical_analyst_position_band_mismatch:pe/,
    );

    const overconfident = structuredClone(interpretation);
    overconfident.interpretations[0]!.evidenceBreadth = "broad";
    assert.throws(
      () =>
        validateHistoricalAnalystInterpretation({
          history,
          context,
          interpretation: overconfident,
        }),
      /historical_analyst_evidence_breadth_mismatch:pe/,
    );
    const quality = evaluateHistoricalAnalystInterpretationQuality({
      history,
      context,
      interpretation: overconfident,
    });
    assert.equal(quality.checks.evidenceBreadthCalibration, false);
    assert.equal(quality.publishable, false);
  });

  it("blocks investment verdict language derived only from history", () => {
    const { history, context, interpretation } = validSetup();
    const verdict = structuredClone(interpretation);
    verdict.interpretations[0]!.text =
      "P/E ligger högt historiskt och aktien är därför dyr och ett sälj.";

    assert.doesNotThrow(() =>
      validateHistoricalAnalystInterpretation({
        history,
        context,
        interpretation: verdict,
      }),
    );
    const quality = evaluateHistoricalAnalystInterpretationQuality({
      history,
      context,
      interpretation: verdict,
    });
    assert.equal(quality.checks.neutralLanguage, false);
    assert.equal(quality.publishable, false);
  });

  it("schema rejects duplicate metric interpretations", () => {
    const { interpretation } = validSetup();
    const duplicate = {
      ...interpretation,
      interpretations: [
        interpretation.interpretations[0]!,
        { ...interpretation.interpretations[0]! },
      ],
    };
    assert.equal(
      divLabHistoricalAnalystInterpretationSchema.safeParse(duplicate).success,
      false,
    );
  });
});
