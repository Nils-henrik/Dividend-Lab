import type { AnalysisSource } from "./quality-gate";
import type { NormalizedValuationAmount, NormalizedValuationInput } from "./fx";
import type { PrimaryReportReconciliation, ReconciliationMetricName } from "./primary-report-reconciliation";
import type { ValuationAnalysis } from "./valuation";

export const DIVLAB_VALUATION_PROVENANCE_VERSION = "valuation-provenance-v1" as const;

export type ValuationMeasureKey =
  | "pe"
  | "priceToFcf"
  | "fcfYield"
  | "enterpriseValue"
  | "evToEbit"
  | "evToEbitda";

export type ValuationMeasureProvenance = {
  available: boolean;
  traceable: boolean;
  sourceIds: string[];
  primaryConfirmedMetrics: ReconciliationMetricName[];
};

export type DivLabValuationProvenance = {
  version: typeof DIVLAB_VALUATION_PROVENANCE_VERSION;
  measures: Record<ValuationMeasureKey, ValuationMeasureProvenance>;
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim()))];
}

function idsByKind(sources: readonly AnalysisSource[], kind: AnalysisSource["kind"]): string[] {
  return sources.filter((source) => source.kind === kind).map((source) => source.id);
}

function fxIds(...inputs: readonly (NormalizedValuationInput | NormalizedValuationAmount)[]): string[] {
  return unique(inputs.flatMap((input) => input.fxSourceIds));
}

function confirmedMetrics(
  reconciliation: PrimaryReportReconciliation,
  eligible: readonly ReconciliationMetricName[],
): ReconciliationMetricName[] {
  const allowed = new Set(eligible);
  return reconciliation.metrics
    .filter((metric) => metric.status === "confirmed" && allowed.has(metric.metric))
    .map((metric) => metric.metric);
}

function trace(input: {
  available: boolean;
  sources: readonly AnalysisSource[];
  sourceIds: readonly string[];
  primaryConfirmedMetrics?: readonly ReconciliationMetricName[];
}): ValuationMeasureProvenance {
  const sourceIds = unique(input.sourceIds);
  const known = new Set(input.sources.map((source) => source.id));
  const traceable =
    input.available &&
    sourceIds.length >= 2 &&
    sourceIds.every((sourceId) => known.has(sourceId));
  return {
    available: input.available,
    traceable,
    sourceIds,
    primaryConfirmedMetrics: [...(input.primaryConfirmedMetrics ?? [])],
  };
}

/**
 * Build an explicit source map for every deterministic trailing valuation.
 *
 * This does not claim that every component comes from a primary issuer source.
 * It records the provider + market + FX inputs actually required by the math,
 * while `primaryConfirmedMetrics` separately notes components independently
 * confirmed from the bounded official report reconciliation.
 */
export function buildValuationProvenance(input: {
  sources: readonly AnalysisSource[];
  valuation: ValuationAnalysis;
  valuationInputs: {
    epsTtm: NormalizedValuationInput;
    freeCashFlowPerShareTtm: NormalizedValuationInput;
  };
  enterpriseInputs: {
    marketCap: NormalizedValuationAmount;
    cash: NormalizedValuationAmount;
    totalDebt: NormalizedValuationAmount;
    ebitTtm: NormalizedValuationAmount;
    ebitdaTtm: NormalizedValuationAmount;
  };
  reconciliation: PrimaryReportReconciliation;
}): DivLabValuationProvenance {
  const marketIds = idsByKind(input.sources, "market_data");
  const fundamentalIds = idsByKind(input.sources, "fundamental_data");

  const peSources = unique([
    ...marketIds,
    ...fundamentalIds,
    ...fxIds(input.valuationInputs.epsTtm),
  ]);
  const fcfSources = unique([
    ...marketIds,
    ...fundamentalIds,
    ...fxIds(input.valuationInputs.freeCashFlowPerShareTtm),
  ]);
  const evSources = unique([
    ...marketIds,
    ...fundamentalIds,
    ...fxIds(
      input.enterpriseInputs.marketCap,
      input.enterpriseInputs.cash,
      input.enterpriseInputs.totalDebt,
    ),
  ]);
  const evEbitSources = unique([
    ...evSources,
    ...fxIds(input.enterpriseInputs.ebitTtm),
  ]);
  const evEbitdaSources = unique([
    ...evSources,
    ...fxIds(input.enterpriseInputs.ebitdaTtm),
  ]);

  const epsConfirmed = confirmedMetrics(input.reconciliation, ["eps"]);
  const ebitConfirmed = confirmedMetrics(input.reconciliation, ["operatingIncome"]);

  return {
    version: DIVLAB_VALUATION_PROVENANCE_VERSION,
    measures: {
      pe: trace({
        available: input.valuation.trailing.pe !== null,
        sources: input.sources,
        sourceIds: peSources,
        primaryConfirmedMetrics: epsConfirmed,
      }),
      priceToFcf: trace({
        available: input.valuation.trailing.priceToFcf !== null,
        sources: input.sources,
        sourceIds: fcfSources,
      }),
      fcfYield: trace({
        available: input.valuation.trailing.fcfYield !== null,
        sources: input.sources,
        sourceIds: fcfSources,
      }),
      enterpriseValue: trace({
        available: input.valuation.trailing.enterpriseValue !== null,
        sources: input.sources,
        sourceIds: evSources,
      }),
      evToEbit: trace({
        available: input.valuation.trailing.evToEbit !== null,
        sources: input.sources,
        sourceIds: evEbitSources,
        primaryConfirmedMetrics: ebitConfirmed,
      }),
      evToEbitda: trace({
        available: input.valuation.trailing.evToEbitda !== null,
        sources: input.sources,
        sourceIds: evEbitdaSources,
      }),
    },
  };
}
