import { analyzeTechnicalSignals, type TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";
import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import type { AnalysisEvidence } from "./evidence";
import type { CurrencyAwareFundamentalSnapshot } from "./financial-statement-normalizer";
import {
  normalizeValuationAmount,
  normalizeValuationInput,
  type AnalysisFxConversion,
  type NormalizedValuationAmount,
  type NormalizedValuationInput,
} from "./fx";
import {
  analyzeFundamentals,
  type FundamentalAnalysis,
  type FundamentalSnapshot,
} from "./fundamental-analysis";
import {
  reconcilePrimaryReport,
  type PrimaryReportReconciliation,
} from "./primary-report-reconciliation";
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
import {
  buildValuationProvenance,
  type DivLabValuationProvenance,
} from "./valuation-provenance";

export const DIVLAB_DEEP_RESEARCH_VERSION = "deep-research-v1" as const;

export type DivLabValuationInputs = {
  epsTtm: NormalizedValuationInput;
  freeCashFlowPerShareTtm: NormalizedValuationInput;
};

export type DivLabEnterpriseValuationInputs = {
  /** Quote-derived market cap is already denominated in the listed share currency. */
  marketCap: NormalizedValuationAmount;
  /** Statement-derived amounts are normalized from reporting currency when required. */
  cash: NormalizedValuationAmount;
  totalDebt: NormalizedValuationAmount;
  ebitTtm: NormalizedValuationAmount;
  ebitdaTtm: NormalizedValuationAmount;
};

export type DivLabCurrencyContext = {
  /** Currency of the listed share price and final per-share valuation. */
  marketCurrency: string;
  /** Currency used by accounting statement values, when verified. */
  reportingCurrency: string | null;
  /** Currency of the trailing EPS input, tracked separately from statement values. */
  epsTtmCurrency: string | null;
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
  /** Explicit currency semantics so consumers never infer accounting currency from the quote currency. */
  currencyContext: DivLabCurrencyContext;
  /** Normalized verified facts retained for auditability and future revisions. */
  fundamentalSnapshot: FundamentalSnapshot;
  /** Deterministic interpretation/scorecard derived from fundamentalSnapshot. */
  fundamental: FundamentalAnalysis;
  /** Confirmation-only cross-check against clean bounded official-report text. */
  primaryReportReconciliation: PrimaryReportReconciliation;
  /** Optional reporting->market conversion. Raw accounting facts remain untouched. */
  fxConversion: AnalysisFxConversion | null;
  /** Positive per-share values actually eligible for valuation in the market currency. */
  valuationInputs: DivLabValuationInputs;
  /** Auditable absolute amounts used for EV/EBIT and EV/EBITDA. */
  enterpriseValuationInputs: DivLabEnterpriseValuationInputs;
  valuation: ValuationAnalysis;
  /** Source map for every available deterministic trailing valuation measure. */
  valuationProvenance: DivLabValuationProvenance;
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
  const currencyAware = snapshot as CurrencyAwareFundamentalSnapshot;
  return {
    ...snapshot,
    // `currency` is retained as the legacy quote-currency field for backward
    // compatibility. Consumers must use currencyContext/reportingCurrency for
    // accounting-value labels.
    currency: currency.trim().toUpperCase(),
    price: currentPrice,
    historicalPeriods: snapshot.historicalPeriods?.map((period) => ({ ...period })),
    ...(currencyAware.quarterlyPeriods
      ? { quarterlyPeriods: currencyAware.quarterlyPeriods.map((period) => ({ ...period })) }
      : {}),
  } as CurrencyAwareFundamentalSnapshot;
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
  const currencies = currencyMetadata(fundamentalSnapshot);
  const rawFundamental = analyzeFundamentals(fundamentalSnapshot);
  const fundamental: FundamentalAnalysis = {
    ...rawFundamental,
    // Fundamental monetary values describe the accounting statements, not the
    // listed share quote. Keep that semantic explicit for UI/DivBrain consumers.
    currency: currencies.reportingCurrency ?? rawFundamental.currency,
  };
  const primaryReportReconciliation = reconcilePrimaryReport({
    fundamentals: fundamentalSnapshot,
    evidence,
  });
  const technicalSnapshot = analyzeTechnicalSignals(input.history);
  const levels = analyzeSupportResistance(input.history);
  const currencyContext: DivLabCurrencyContext = {
    marketCurrency,
    reportingCurrency: currencies.reportingCurrency,
    epsTtmCurrency: currencies.epsTtmCurrency,
  };

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

  const enterpriseValuationInputs: DivLabEnterpriseValuationInputs = {
    marketCap: normalizeValuationAmount({
      value: fundamentalSnapshot.marketCap,
      sourceCurrency: marketCurrency,
      marketCurrency,
      fxConversion,
    }),
    cash: normalizeValuationAmount({
      value: fundamentalSnapshot.cash,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    totalDebt: normalizeValuationAmount({
      value: fundamentalSnapshot.totalDebt,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    ebitTtm: normalizeValuationAmount({
      value: fundamentalSnapshot.ebitTtm,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    ebitdaTtm: normalizeValuationAmount({
      value: fundamentalSnapshot.ebitdaTtm,
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
    marketCap: enterpriseValuationInputs.marketCap.value,
    cash: enterpriseValuationInputs.cash.value,
    totalDebt: enterpriseValuationInputs.totalDebt.value,
    ebitTtm: enterpriseValuationInputs.ebitTtm.value,
    ebitdaTtm: enterpriseValuationInputs.ebitdaTtm.value,
    scenarios: input.valuationScenarios,
  });

  const valuationProvenance = buildValuationProvenance({
    sources,
    valuation,
    valuationInputs,
    enterpriseInputs: enterpriseValuationInputs,
    reconciliation: primaryReportReconciliation,
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
    currencyContext,
    fundamentalSnapshot,
    fundamental,
    primaryReportReconciliation,
    fxConversion,
    valuationInputs,
    enterpriseValuationInputs,
    valuation,
    valuationProvenance,
    technical: {
      snapshot: technicalSnapshot,
      levels,
    },
    sources,
    evidence,
    qualityGate,
  };
}
