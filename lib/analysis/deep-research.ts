import { analyzeTechnicalSignals, type TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";
import type { DailyBar } from "@/lib/model-portfolios/engine/eodhd";
import {
  analyzeFundamentals,
  type FundamentalAnalysis,
  type FundamentalSnapshot,
} from "./fundamental-analysis";
import {
  analyzeSupportResistance,
  type SupportResistanceAnalysis,
} from "./support-resistance";
import {
  evaluateAnalysisQuality,
  type AnalysisQualityGate,
  type AnalysisSource,
} from "./quality-gate";
import {
  buildValuationAnalysis,
  type ValuationAnalysis,
  type ValuationScenarioInput,
} from "./valuation";

export const DIVLAB_DEEP_RESEARCH_VERSION = "deep-research-v1" as const;

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
  valuation: ValuationAnalysis;
  technical: {
    snapshot: TechnicalAnalysisSnapshot;
    levels: SupportResistanceAnalysis;
  };
  sources: AnalysisSource[];
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

export function buildDivLabResearchPacket(input: {
  symbol: string;
  exchange: string;
  name: string;
  currency: string;
  currentPrice: number;
  history: readonly DailyBar[];
  fundamentals: FundamentalSnapshot;
  valuationScenarios: ValuationScenarioInput[];
  sources: readonly AnalysisSource[];
  now?: Date;
}): DivLabResearchPacket {
  if (!input.symbol.trim() || !input.exchange.trim() || !input.name.trim()) {
    throw new Error("analysis_instrument_identity_required");
  }
  if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
    throw new Error("analysis_current_price_required");
  }

  const now = input.now ?? new Date();
  const fundamentalSnapshot = cloneFundamentalSnapshot(
    input.fundamentals,
    input.currency,
    input.currentPrice,
  );
  const fundamental = analyzeFundamentals(fundamentalSnapshot);
  const technicalSnapshot = analyzeTechnicalSignals(input.history);
  const levels = analyzeSupportResistance(input.history);
  const valuation = buildValuationAnalysis({
    currentPrice: input.currentPrice,
    currency: input.currency,
    epsTtm: fundamental.metrics.epsTtm,
    freeCashFlowPerShareTtm: fundamental.metrics.freeCashFlowPerShare,
    scenarios: input.valuationScenarios,
  });
  const sources = input.sources.map((source) => ({ ...source }));
  const qualityGate = evaluateAnalysisQuality({
    now,
    fundamental,
    valuation,
    technicalSessions: technicalSnapshot.sessions,
    levels,
    sources,
  });

  return {
    version: DIVLAB_DEEP_RESEARCH_VERSION,
    instrument: {
      symbol: input.symbol.trim().toUpperCase(),
      exchange: input.exchange.trim().toUpperCase(),
      name: input.name.trim(),
      currency: input.currency.trim().toUpperCase(),
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
    valuation,
    technical: {
      snapshot: technicalSnapshot,
      levels,
    },
    sources,
    qualityGate,
  };
}
