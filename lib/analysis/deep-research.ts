import { analyzeTechnicalSignals, type TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";
import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import type { AnalysisEvidence } from "./evidence";
import type { CurrencyAwareFundamentalSnapshot } from "./financial-statement-normalizer";
import {
  normalizeValuationInput,
  type AnalysisFxConversion,
  type NormalizedValuationInput,
} from "./fx";
import {
  analyzeFundamentals,
  type FundamentalAnalysis,
  type FundamentalSnapshot,
} from "./fundamental-analysis";
import {
  evaluateAnalysisQuality,
  type AnalysisQualityGate,
  type AnalysisSource,
} from "./quality-gate";
import {
  analyzeSupportResistance,
  type SupportResistanceAnalysis,
} from "./support-resistance";
import {
  buildValuationAnalysis,
  type ValuationAnalysis,
  type ValuationScenarioInput,
} from "./valuation";

export const DIVLAB_DEEP_RESEARCH_VERSION = "deep-research-v1" as const;

export type DivLabValuationInputs = {
  epsTtm: NormalizedValuationInput;
  freeCashFlowPerShareTtm: NormalizedValuationInput;
};

export type DivLabResearchPacket = {
  version: typeof DIVLAB_DEEP_RESEARCH_VERSION;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
    currency: string;
    currentPrice: number;
  };
  createdAt: string;
  dataAsOf: string;
  /** Normalized verified facts retained for auditability and future revisions. */
  fundamentalSnapshot: FundamentalSnapshot;
  /** Deterministic interpretation/scorecard derived from fundamentalSnapshot. */
  fundamental: FundamentalAnalysis;
  /** Optional reporting->market conversion. Raw accounting facts remain untouched. */
  fxConversion: AnalysisFxConversion | null;
  /** Per-share values actually eligible for valuation in the market currency. */
  valuationInputs: DivLabValuationInputs;
  valuation: ValuationAnalysis;
  technical: {
    snapshot: TechnicalAnalysisSnapshot;
    levels: SupportResistanceAnalysis;
  };
  sources: AnalysisSource[];
  /** Bounded source-linked external material actually read during research. */
  evidence: AnalysisEvidence[];
  qualityGate: AnalysisQualityGate;
};

function latestDate(values: readonly string[], fallback: string): string {
  const valid = values
    .map((value) => new Date(value))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  return valid[0]?.toISOString() ?? fallback;
}

function cloneFundamentalSnapshot(
  snapshot: FundamentalSnapshot,
  currency: string,
  currentPrice: number,
): FundamentalSnapshot {
  return {
    ...snapshot,
    currency: currency.trim().toUpperCase(),
    price: currentPrice,
    historicalPeriods: snapshot.historicalPeriods?.map((period) => ({ ...period })),
  };
}

function cloneFxConversion(
  conversion: AnalysisFxConversion | null | undefined,
): AnalysisFxConversion | null {
  if (!conversion) return null;
  return {
    ...conversion,
    sourceIds: [...conversion.sourceIds],
  };
}

function currencyMetadata(snapshot: FundamentalSnapshot): {
  reportingCurrency: string | null;
  epsTtmCurrency: string | null;
} {
  const currencyAware = snapshot as CurrencyAwareFundamentalSnapshot;
  const hasReportingCurrency = Object.prototype.hasOwnProperty.call(
    currencyAware,
    "reportingCurrency",
  );
  const hasEpsCurrency = Object.prototype.hasOwnProperty.call(
    currencyAware,
    "epsTtmCurrency",
  );
  return {
    // Hand-built/test snapshots historically declare all values in `currency`.
    // Provider snapshots explicitly include the metadata fields; an explicit
    // null stays unknown and may not be silently assumed compatible.
    reportingCurrency: hasReportingCurrency
      ? currencyAware.reportingCurrency ?? null
      : snapshot.currency,
    epsTtmCurrency: hasEpsCurrency
      ? currencyAware.epsTtmCurrency ?? null
      : snapshot.currency,
  };
}

function validateFxSources(
  conversion: AnalysisFxConversion | null,
  sources: readonly AnalysisSource[],
): void {
  if (!conversion) return;
  const knownSourceIds = new Set(sources.map((source) => source.id));
  for (const sourceId of conversion.sourceIds) {
    if (!knownSourceIds.has(sourceId)) {
      throw new Error(`analysis_fx_source_missing:${sourceId}`);
    }
  }
}

export function buildDivLabResearchPacket(input: {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  currentPrice: number;
  history: readonly DailyBar[];
  fundamentals: FundamentalSnapshot;
  fxConversion?: AnalysisFxConversion | null;
  valuationScenarios: ValuationScenarioInput[];
  sources: readonly AnalysisSource[];
  evidence?: readonly AnalysisEvidence[];
  now?: Date;
}): DivLabResearchPacket {
  if (!input.symbol.trim() || !input.exchange.trim() || !input.name.trim()) {
    throw new Error("analysis_instrument_identity_required");
  }
  if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
    throw new Error("analysis_current_price_required");
  }

  const now = input.now ?? new Date();
  const marketCurrency = input.currency.trim().toUpperCase();
  const sources = input.sources.map((source) => ({ ...source }));
  const evidence = (input.evidence ?? []).map((item) => ({ ...item }));
  const fxConversion = cloneFxConversion(input.fxConversion);
  validateFxSources(fxConversion, sources);

  const fundamentalSnapshot = cloneFundamentalSnapshot(
    input.fundamentals,
    marketCurrency,
    input.currentPrice,
  );
  const fundamental = analyzeFundamentals(fundamentalSnapshot);
  const technicalSnapshot = analyzeTechnicalSignals(input.history);
  const levels = analyzeSupportResistance(input.history);
  const currencies = currencyMetadata(fundamentalSnapshot);

  const valuationInputs: DivLabValuationInputs = {
    epsTtm: normalizeValuationInput({
      value: fundamental.metrics.epsTtm,
      sourceCurrency: currencies.epsTtmCurrency,
      marketCurrency,
      fxConversion,
    }),
    freeCashFlowPerShareTtm: normalizeValuationInput({
      value: fundamental.metrics.freeCashFlowPerShare,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
  };

  // Preserve the raw source currency in trailing metadata when no verified FX
  // conversion exists, while using converted values only when they are audited.
  const valuation = buildValuationAnalysis({
    currentPrice: input.currentPrice,
    currency: marketCurrency,
    epsTtm: valuationInputs.epsTtm.value ?? fundamental.metrics.epsTtm,
    epsCurrency: valuationInputs.epsTtm.currency ?? currencies.epsTtmCurrency,
    freeCashFlowPerShareTtm:
      valuationInputs.freeCashFlowPerShareTtm.value ??
      fundamental.metrics.freeCashFlowPerShare,
    freeCashFlowPerShareCurrency:
      valuationInputs.freeCashFlowPerShareTtm.currency ?? currencies.reportingCurrency,
    scenarios: input.valuationScenarios,
  });

  const qualityGate = evaluateAnalysisQuality({
    now,
    fundamental,
    valuation,
    technicalSessions: technicalSnapshot.sessions,
    levels,
    sources,
    evidence,
  });

  return {
    version: DIVLAB_DEEP_RESEARCH_VERSION,
    instrument: {
      symbol: input.symbol.trim().toUpperCase(),
      exchange: input.exchange.trim().toUpperCase(),
      name: input.name.trim(),
      currency: marketCurrency,
      currentPrice: input.currentPrice,
    },
    createdAt: now.toISOString(),
    dataAsOf: latestDate(
      [
        fundamentalSnapshot.asOf,
        technicalSnapshot.asOf ?? "",
        ...sources.map((source) => source.verifiedAt),
      ],
      now.toISOString(),
    ),
    fundamentalSnapshot,
    fundamental,
    fxConversion,
    valuationInputs,
    valuation,
    technical: {
      snapshot: technicalSnapshot,
      levels,
    },
    sources,
    evidence,
    qualityGate,
  };
}
