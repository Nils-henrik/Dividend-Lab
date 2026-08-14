import type { FundamentalMethodologyStatus } from "./fundamental-methodology";

export const DIVLAB_DAILY_CASE_SELECTION_VERSION = "daily-case-selection-v1" as const;

export const DAILY_CASE_SELECTION_BUDGET = {
  maxUniverseSize: 300,
  maxSelectionsPerDay: 4,
  defaultMaxSelections: 4,
  defaultMinSelectionScore: 0.45,
  minDataReadiness: 0.55,
  whyNowThreshold: 0.35,
  maxSameExchange: 3,
  maxSamePrimaryDriver: 2,
} as const;

export const DAILY_CASE_SIGNAL_WEIGHTS = {
  freshReport: 0.18,
  catalyst: 0.14,
  valuationDislocation: 0.13,
  estimateRevisions: 0.1,
  technicalSetup: 0.1,
  abnormalVolume: 0.07,
  priceMove: 0.06,
  fundamentalOpportunity: 0.08,
  readerInterest: 0.07,
  dataReadiness: 0.07,
} as const;

export type DailyCaseSignalKey = keyof typeof DAILY_CASE_SIGNAL_WEIGHTS;

export const DAILY_CASE_WHY_NOW_SIGNALS: readonly DailyCaseSignalKey[] = [
  "freshReport",
  "catalyst",
  "estimateRevisions",
  "technicalSetup",
  "abnormalVolume",
  "priceMove",
] as const;

export type DailyCaseSelectionSignal = {
  /** Normalized evidence strength in [0, 1]. Missing information must stay missing. */
  value: number;
  /** Every non-null signal must cite known source ids. */
  sourceIds: readonly string[];
  /** Timestamp for the observation represented by this signal. */
  asOf: string;
};

export type DailyCaseSelectionCandidate = {
  symbol: string;
  exchange: string;
  name?: string | null;
  methodologyStatus: FundamentalMethodologyStatus;
  knownSourceIds: readonly string[];
  signals: Partial<Record<DailyCaseSignalKey, DailyCaseSelectionSignal | null>>;
};

export type DailyCaseBlocker =
  | "methodology_not_supported"
  | "missing_why_now_signal"
  | "data_readiness_insufficient"
  | "selection_score_below_threshold";

export type DailyCaseNotSelectedReason =
  | "daily_budget_exhausted"
  | "exchange_diversity_limit"
  | "primary_driver_diversity_limit";

export type RankedDailyCase = {
  symbol: string;
  exchange: string;
  name: string | null;
  score: number;
  signalCoverage: number;
  primaryDriver: DailyCaseSignalKey;
  primaryDriverScore: number;
  contributingSignals: Array<{
    signal: DailyCaseSignalKey;
    value: number;
    weightedContribution: number;
    sourceIds: string[];
    asOf: string;
  }>;
};

export type BlockedDailyCase = {
  symbol: string;
  exchange: string;
  name: string | null;
  score: number;
  signalCoverage: number;
  blockers: DailyCaseBlocker[];
};

export type DailyCaseSelectionResult = {
  version: typeof DIVLAB_DAILY_CASE_SELECTION_VERSION;
  selected: RankedDailyCase[];
  eligibleNotSelected: Array<
    RankedDailyCase & { notSelectedReason: DailyCaseNotSelectedReason }
  >;
  blocked: BlockedDailyCase[];
  stats: {
    candidates: number;
    eligible: number;
    selected: number;
    blocked: number;
  };
};

export type DailyCaseSelectionConfig = {
  maxSelections?: number;
  minSelectionScore?: number;
  maxSameExchange?: number;
  maxSamePrimaryDriver?: number;
};

const SIGNAL_KEYS = Object.keys(DAILY_CASE_SIGNAL_WEIGHTS) as DailyCaseSignalKey[];
const WHY_NOW_SET = new Set<DailyCaseSignalKey>(DAILY_CASE_WHY_NOW_SIGNALS);

function identity(symbol: string, exchange: string): string {
  return `${symbol.trim().toUpperCase()}@${exchange.trim().toUpperCase()}`;
}

function finiteUnitInterval(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`daily_case_signal_out_of_range:${field}`);
  }
  return value;
}

function assertPositiveIntegerWithin(
  value: number,
  maximum: number,
  field: string,
): number {
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`daily_case_config_invalid:${field}`);
  }
  return value;
}

function validateConfig(config: DailyCaseSelectionConfig): Required<DailyCaseSelectionConfig> {
  const maxSelections = assertPositiveIntegerWithin(
    config.maxSelections ?? DAILY_CASE_SELECTION_BUDGET.defaultMaxSelections,
    DAILY_CASE_SELECTION_BUDGET.maxSelectionsPerDay,
    "maxSelections",
  );
  const maxSameExchange = assertPositiveIntegerWithin(
    config.maxSameExchange ?? DAILY_CASE_SELECTION_BUDGET.maxSameExchange,
    DAILY_CASE_SELECTION_BUDGET.maxSelectionsPerDay,
    "maxSameExchange",
  );
  const maxSamePrimaryDriver = assertPositiveIntegerWithin(
    config.maxSamePrimaryDriver ?? DAILY_CASE_SELECTION_BUDGET.maxSamePrimaryDriver,
    DAILY_CASE_SELECTION_BUDGET.maxSelectionsPerDay,
    "maxSamePrimaryDriver",
  );
  const minSelectionScore = finiteUnitInterval(
    config.minSelectionScore ?? DAILY_CASE_SELECTION_BUDGET.defaultMinSelectionScore,
    "minSelectionScore",
  );
  return {
    maxSelections,
    maxSameExchange,
    maxSamePrimaryDriver,
    minSelectionScore,
  };
}

function normalizeCandidate(candidate: DailyCaseSelectionCandidate): {
  symbol: string;
  exchange: string;
  name: string | null;
  methodologyStatus: FundamentalMethodologyStatus;
  signals: Partial<Record<DailyCaseSignalKey, DailyCaseSelectionSignal>>;
} {
  const symbol = candidate.symbol.trim().toUpperCase();
  const exchange = candidate.exchange.trim().toUpperCase();
  if (!symbol || !exchange) throw new Error("daily_case_identity_required");

  const knownSourceIds = new Set(
    candidate.knownSourceIds.map((sourceId) => sourceId.trim()).filter(Boolean),
  );
  const signals: Partial<Record<DailyCaseSignalKey, DailyCaseSelectionSignal>> = {};

  for (const key of SIGNAL_KEYS) {
    const raw = candidate.signals[key];
    if (!raw) continue;
    const value = finiteUnitInterval(raw.value, key);
    const sourceIds = [...new Set(raw.sourceIds.map((id) => id.trim()).filter(Boolean))].sort();
    if (sourceIds.length === 0) {
      throw new Error(`daily_case_signal_source_required:${identity(symbol, exchange)}:${key}`);
    }
    for (const sourceId of sourceIds) {
      if (!knownSourceIds.has(sourceId)) {
        throw new Error(
          `daily_case_signal_source_unknown:${identity(symbol, exchange)}:${key}:${sourceId}`,
        );
      }
    }
    const asOfDate = new Date(raw.asOf);
    if (!Number.isFinite(asOfDate.getTime())) {
      throw new Error(`daily_case_signal_as_of_invalid:${identity(symbol, exchange)}:${key}`);
    }
    signals[key] = {
      value,
      sourceIds,
      asOf: asOfDate.toISOString(),
    };
  }

  return {
    symbol,
    exchange,
    name: candidate.name?.trim() || null,
    methodologyStatus: candidate.methodologyStatus,
    signals,
  };
}

function rankCandidate(
  candidate: ReturnType<typeof normalizeCandidate>,
  minSelectionScore: number,
): { ranked: RankedDailyCase; blockers: DailyCaseBlocker[] } {
  let score = 0;
  let signalCoverage = 0;
  const contributions: RankedDailyCase["contributingSignals"] = [];

  for (const key of SIGNAL_KEYS) {
    const signal = candidate.signals[key];
    if (!signal) continue;
    const weight = DAILY_CASE_SIGNAL_WEIGHTS[key];
    const weightedContribution = signal.value * weight;
    score += weightedContribution;
    signalCoverage += weight;
    contributions.push({
      signal: key,
      value: signal.value,
      weightedContribution,
      sourceIds: [...signal.sourceIds],
      asOf: signal.asOf,
    });
  }

  contributions.sort(
    (a, b) =>
      b.weightedContribution - a.weightedContribution || a.signal.localeCompare(b.signal),
  );

  const whyNow = contributions
    .filter((item) => WHY_NOW_SET.has(item.signal))
    .sort(
      (a, b) =>
        b.weightedContribution - a.weightedContribution || a.signal.localeCompare(b.signal),
    );
  const primary = whyNow[0] ?? {
    signal: "freshReport" as DailyCaseSignalKey,
    value: 0,
    weightedContribution: 0,
    sourceIds: [],
    asOf: "",
  };

  const blockers: DailyCaseBlocker[] = [];
  if (candidate.methodologyStatus !== "supported") {
    blockers.push("methodology_not_supported");
  }
  if (!whyNow.some((item) => item.value >= DAILY_CASE_SELECTION_BUDGET.whyNowThreshold)) {
    blockers.push("missing_why_now_signal");
  }
  const dataReadiness = candidate.signals.dataReadiness?.value ?? 0;
  if (dataReadiness < DAILY_CASE_SELECTION_BUDGET.minDataReadiness) {
    blockers.push("data_readiness_insufficient");
  }
  if (score < minSelectionScore) blockers.push("selection_score_below_threshold");

  return {
    ranked: {
      symbol: candidate.symbol,
      exchange: candidate.exchange,
      name: candidate.name,
      score,
      signalCoverage,
      primaryDriver: primary.signal,
      primaryDriverScore: primary.weightedContribution,
      contributingSignals: contributions,
    },
    blockers,
  };
}

/**
 * Ranks editorial/research priority, never expected return or a trade recommendation.
 * Missing inputs reduce the score because intended signal weights are not renormalized.
 */
export function selectDailyAnalysisCases(
  candidates: readonly DailyCaseSelectionCandidate[],
  config: DailyCaseSelectionConfig = {},
): DailyCaseSelectionResult {
  if (candidates.length > DAILY_CASE_SELECTION_BUDGET.maxUniverseSize) {
    throw new Error("daily_case_universe_too_large");
  }
  const resolvedConfig = validateConfig(config);
  const seen = new Set<string>();
  const eligible: RankedDailyCase[] = [];
  const blocked: BlockedDailyCase[] = [];

  for (const rawCandidate of candidates) {
    const candidate = normalizeCandidate(rawCandidate);
    const key = identity(candidate.symbol, candidate.exchange);
    if (seen.has(key)) throw new Error(`daily_case_duplicate_identity:${key}`);
    seen.add(key);

    const { ranked, blockers } = rankCandidate(candidate, resolvedConfig.minSelectionScore);
    if (blockers.length > 0) {
      blocked.push({
        symbol: ranked.symbol,
        exchange: ranked.exchange,
        name: ranked.name,
        score: ranked.score,
        signalCoverage: ranked.signalCoverage,
        blockers,
      });
    } else {
      eligible.push(ranked);
    }
  }

  eligible.sort(
    (a, b) =>
      b.score - a.score ||
      a.symbol.localeCompare(b.symbol) ||
      a.exchange.localeCompare(b.exchange),
  );
  blocked.sort(
    (a, b) =>
      b.score - a.score ||
      a.symbol.localeCompare(b.symbol) ||
      a.exchange.localeCompare(b.exchange),
  );

  const selected: RankedDailyCase[] = [];
  const eligibleNotSelected: DailyCaseSelectionResult["eligibleNotSelected"] = [];
  const exchangeCounts = new Map<string, number>();
  const driverCounts = new Map<DailyCaseSignalKey, number>();

  for (const candidate of eligible) {
    if (selected.length >= resolvedConfig.maxSelections) {
      eligibleNotSelected.push({ ...candidate, notSelectedReason: "daily_budget_exhausted" });
      continue;
    }
    if ((exchangeCounts.get(candidate.exchange) ?? 0) >= resolvedConfig.maxSameExchange) {
      eligibleNotSelected.push({ ...candidate, notSelectedReason: "exchange_diversity_limit" });
      continue;
    }
    if (
      (driverCounts.get(candidate.primaryDriver) ?? 0) >=
      resolvedConfig.maxSamePrimaryDriver
    ) {
      eligibleNotSelected.push({
        ...candidate,
        notSelectedReason: "primary_driver_diversity_limit",
      });
      continue;
    }

    selected.push(candidate);
    exchangeCounts.set(candidate.exchange, (exchangeCounts.get(candidate.exchange) ?? 0) + 1);
    driverCounts.set(
      candidate.primaryDriver,
      (driverCounts.get(candidate.primaryDriver) ?? 0) + 1,
    );
  }

  return {
    version: DIVLAB_DAILY_CASE_SELECTION_VERSION,
    selected,
    eligibleNotSelected,
    blocked,
    stats: {
      candidates: candidates.length,
      eligible: eligible.length,
      selected: selected.length,
      blocked: blocked.length,
    },
  };
}
