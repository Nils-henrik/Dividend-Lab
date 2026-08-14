import { analyzeTechnicalSignals, type TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";
import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import {
  DIVLAB_COMPANY_CLASSIFICATION_VERSION,
  type DivLabCompanyClassification,
} from "./company-classification";
import type { AnalysisEvidence } from "./evidence";
import type { CurrencyAwareFundamentalSnapshot } from "./financial-statement-normalizer";
import {
  analyzeFundamentalsForCompany,
  type DivLabFundamentalAnalysis,
} from "./fundamental-methodology";
import {
  normalizeValuationAmount,
  normalizeValuationInput,
  type AnalysisFxConversion,
  type NormalizedValuationAmount,
  type NormalizedValuationInput,
} from "./fx";
import type { FundamentalSnapshot } from "./fundamental-analysis";
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
  /** Source-grounded company/instrument classification driving fundamental methodology. */
  companyClassification: DivLabCompanyClassification;
  /** Explicit currency semantics so consumers never infer accounting currency from the quote currency. */
  currencyContext: DivLabCurrencyContext;
  /** Normalized verified facts retained for auditability and future revisions. */
  fundamentalSnapshot: FundamentalSnapshot;
  /** Deterministic company-type-aware interpretation derived from fundamentalSnapshot. */
  fundamental: DivLabFundamentalAnalysis;
  /** Confirmation-only cross-check against clean bounded official-report text. */
  primaryReportReconciliation: PrimaryReportReconciliation;
  /** Optional reporting->market conversion. Raw accounting facts remain untouched. */
  fxConversion: AnalysisFxConversion | null;
  /** Positive per-share values actually eligible for valuation in the market currency. */
  valuationInputs: DivLabValuationInputs;
  /** Auditable absolute amounts used for EV/EBIT and EV/EBITDA when methodology permits them. */
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

function cloneCompanyClassification(
  classification: DivLabCompanyClassification | null | undefined,
): DivLabCompanyClassification {
  if (!classification) {
    return {
      version: DIVLAB_COMPANY_CLASSIFICATION_VERSION,
      type: "unknown",
      confidence: "low",
      sector: null,
      industry: null,
      quoteType: null,
      basis: ["classification_not_supplied"],
      sourceIds: [],
    };
  }
  if (classification.version !== DIVLAB_COMPANY_CLASSIFICATION_VERSION) {
    throw new Error("analysis_company_classification_version_invalid");
  }
  return {
    ...classification,
    basis: [...classification.basis],
    sourceIds: [...new Set(classification.sourceIds)].sort(),
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

function validateSourceIds(
  prefix: string,
  sourceIds: readonly string[],
  sources: readonly AnalysisSource[],
): void {
  const knownSourceIds = new Set(sources.map((source) => source.id));
  for (const sourceId of sourceIds) {
    if (!knownSourceIds.has(sourceId)) {
      throw new Error(`${prefix}:${sourceId}`);
    }
  }
}

function validateFxSources(
  conversion: AnalysisFxConversion | null,
  sources: readonly AnalysisSource[],
): void {
  if (!conversion) return;
  validateSourceIds("analysis_fx_source_missing", conversion.sourceIds, sources);
}

export function buildDivLabResearchPacket(input: {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  currentPrice: number;
  history: readonly DailyBar[];
  fundamentals: FundamentalSnapshot;
  companyClassification?: DivLabCompanyClassification | null;
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
  const companyClassification = cloneCompanyClassification(input.companyClassification);
  validateFxSources(fxConversion, sources);
  validateSourceIds(
    "analysis_company_classification_source_missing",
    companyClassification.sourceIds,
    sources,
  );

  const fundamentalSnapshot = cloneFundamentalSnapshot(
    input.fundamentals,
    marketCurrency,
    input.currentPrice,
  );
  const currencies = currencyMetadata(fundamentalSnapshot);
  const rawFundamental = analyzeFundamentalsForCompany({
    snapshot: fundamentalSnapshot,
    classification: companyClassification,
  });
  const fundamental: DivLabFundamentalAnalysis = {
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
      value: fundamental.methodology.valuationSupport.pe
        ? fundamental.metrics.epsTtm
        : null,
      sourceCurrency: currencies.epsTtmCurrency,
      marketCurrency,
      fxConversion,
    }),
    freeCashFlowPerShareTtm: normalizeValuationInput({
      value: fundamental.methodology.valuationSupport.priceToFcf
        ? fundamental.metrics.freeCashFlowPerShare
        : null,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
  };

  const enterpriseAllowed =
    fundamental.methodology.valuationSupport.enterpriseMultiples;
  const enterpriseValuationInputs: DivLabEnterpriseValuationInputs = {
    marketCap: normalizeValuationAmount({
      value: enterpriseAllowed ? fundamentalSnapshot.marketCap : null,
      sourceCurrency: marketCurrency,
      marketCurrency,
      fxConversion,
    }),
    cash: normalizeValuationAmount({
      value: enterpriseAllowed ? fundamentalSnapshot.cash : null,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    totalDebt: normalizeValuationAmount({
      value: enterpriseAllowed ? fundamentalSnapshot.totalDebt : null,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    ebitTtm: normalizeValuationAmount({
      value: enterpriseAllowed ? fundamentalSnapshot.ebitTtm : null,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
    ebitdaTtm: normalizeValuationAmount({
      value: enterpriseAllowed ? fundamentalSnapshot.ebitdaTtm : null,
      sourceCurrency: currencies.reportingCurrency,
      marketCurrency,
      fxConversion,
    }),
  };

  // Only methodology-approved, normalized valuation inputs may reach the
  // deterministic valuation engine. Raw snapshot fallbacks would reintroduce
  // cross-currency or company-type-incompatible metrics after they were blocked.
  const valuation = buildValuationAnalysis({
    currentPrice: input.currentPrice,
    currency: marketCurrency,
    epsTtm: valuationInputs.epsTtm.value,
    epsCurrency: valuationInputs.epsTtm.currency,
    freeCashFlowPerShareTtm: valuationInputs.freeCashFlowPerShareTtm.value,
    freeCashFlowPerShareCurrency: valuationInputs.freeCashFlowPerShareTtm.currency,
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
    companyClassification,
    fundamental,
    valuation,
    valuationProvenance,
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
    companyClassification,
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
