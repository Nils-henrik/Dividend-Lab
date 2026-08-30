export const DIVLAB_DAILY_CASE_MARKET_SHORTLIST_VERSION =
  "daily-case-market-shortlist-v1" as const;

export const DAILY_CASE_MARKET_SHORTLIST_BUDGET = {
  maxUniverseSize: 300,
  maxShortlistSize: 20,
  defaultShortlistSize: 20,
  defaultMinScore: 0.2,
  minWhyNowSignal: 0.35,
  maxSameExchange: 15,
  maxSamePrimaryDriver: 10,
  maxFutureClockSkewMinutes: 5,
} as const;

export const DAILY_CASE_MARKET_SIGNAL_WEIGHTS = {
  freshReport: 0.25,
  catalyst: 0.2,
  estimateRevisions: 0.15,
  technicalSetup: 0.15,
  abnormalVolume: 0.125,
  priceMove: 0.125,
} as const;

export type DailyCaseMarketSignalKey = keyof typeof DAILY_CASE_MARKET_SIGNAL_WEIGHTS;

export const DAILY_CASE_MARKET_SIGNAL_MAX_AGE_HOURS: Record<
  DailyCaseMarketSignalKey,
  number
> = {
  freshReport: 24 * 7,
  catalyst: 24 * 7,
  estimateRevisions: 24 * 7,
  technicalSetup: 24 * 4,
  abnormalVolume: 24 * 4,
  priceMove: 24 * 4,
};

export type DailyCaseMarketSignal = {
  value: number;
  sourceIds: readonly string[];
  asOf: string;
};

export type DailyCaseMarketShortlistCandidate = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
  name?: string | null;
  knownSourceIds: readonly string[];
  signals: Partial<Record<DailyCaseMarketSignalKey, DailyCaseMarketSignal | null>>;
};

export type RankedDailyCaseMarketCandidate = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
  name: string | null;
  score: number;
  signalCoverage: number;
  primaryDriver: DailyCaseMarketSignalKey;
  primaryDriverScore: number;
  staleSignals: DailyCaseMarketSignalKey[];
  contributingSignals: Array<{
    signal: DailyCaseMarketSignalKey;
    value: number;
    weightedContribution: number;
    sourceIds: string[];
    asOf: string;
  }>;
};

export type DailyCaseMarketShortlistBlocker =
  | "missing_fresh_why_now_signal"
  | "market_shortlist_score_below_threshold";

export type DailyCaseMarketShortlistNotSelectedReason =
  | "preflight_budget_exhausted"
  | "exchange_diversity_limit"
  | "primary_driver_diversity_limit";

export type DailyCaseMarketShortlistResult = {
  version: typeof DIVLAB_DAILY_CASE_MARKET_SHORTLIST_VERSION;
  selected: RankedDailyCaseMarketCandidate[];
  eligibleNotSelected: Array<
    RankedDailyCaseMarketCandidate & {
      notSelectedReason: DailyCaseMarketShortlistNotSelectedReason;
    }
  >;
  blocked: Array<{
    symbol: string;
    exchange: string;
    yahooSymbol: string;
    name: string | null;
    score: number;
    signalCoverage: number;
    staleSignals: DailyCaseMarketSignalKey[];
    blockers: DailyCaseMarketShortlistBlocker[];
  }>;
  stats: {
    universe: number;
    eligible: number;
    selectedForPreflight: number;
    blocked: number;
  };
};

export type DailyCaseMarketShortlistConfig = {
  maxShortlistSize?: number;
  minScore?: number;
  maxSameExchange?: number;
  maxSamePrimaryDriver?: number;
  now?: Date;
};

type ResolvedConfig = {
  maxShortlistSize: number;
  minScore: number;
  maxSameExchange: number;
  maxSamePrimaryDriver: number;
  now: Date;
};

const SIGNAL_KEYS = Object.keys(
  DAILY_CASE_MARKET_SIGNAL_WEIGHTS,
) as DailyCaseMarketSignalKey[];

function identity(symbol: string, exchange: string): string {
  return `${symbol.trim().toUpperCase()}@${exchange.trim().toUpperCase()}`;
}

function unit(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`daily_case_market_signal_out_of_range:${field}`);
  }
  return value;
}

function boundedPositiveInteger(value: number, max: number, field: string): number {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`daily_case_market_config_invalid:${field}`);
  }
  return value;
}

function resolveConfig(config: DailyCaseMarketShortlistConfig): ResolvedConfig {
  const now = config.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    throw new Error("daily_case_market_config_invalid:now");
  }
  return {
    maxShortlistSize: boundedPositiveInteger(
      config.maxShortlistSize ?? DAILY_CASE_MARKET_SHORTLIST_BUDGET.defaultShortlistSize,
      DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxShortlistSize,
      "maxShortlistSize",
    ),
    minScore: unit(
      config.minScore ?? DAILY_CASE_MARKET_SHORTLIST_BUDGET.defaultMinScore,
      "minScore",
    ),
    maxSameExchange: boundedPositiveInteger(
      config.maxSameExchange ?? DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxSameExchange,
      DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxShortlistSize,
      "maxSameExchange",
    ),
    maxSamePrimaryDriver: boundedPositiveInteger(
      config.maxSamePrimaryDriver ?? DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxSamePrimaryDriver,
      DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxShortlistSize,
      "maxSamePrimaryDriver",
    ),
    now,
  };
}

function normalizeCandidate(candidate: DailyCaseMarketShortlistCandidate) {
  const symbol = candidate.symbol.trim().toUpperCase();
  const exchange = candidate.exchange.trim().toUpperCase();
  const yahooSymbol = candidate.yahooSymbol.trim().toUpperCase();
  if (!symbol || !exchange || !yahooSymbol) {
    throw new Error("daily_case_market_identity_required");
  }

  const knownSourceIds = new Set(
    candidate.knownSourceIds.map((id) => id.trim()).filter(Boolean),
  );
  const signals: Partial<Record<DailyCaseMarketSignalKey, DailyCaseMarketSignal>> = {};
  for (const key of SIGNAL_KEYS) {
    const raw = candidate.signals[key];
    if (!raw) continue;
    const sourceIds = [...new Set(raw.sourceIds.map((id) => id.trim()).filter(Boolean))].sort();
    if (sourceIds.length === 0) {
      throw new Error(`daily_case_market_signal_source_required:${identity(symbol, exchange)}:${key}`);
    }
    for (const sourceId of sourceIds) {
      if (!knownSourceIds.has(sourceId)) {
        throw new Error(
          `daily_case_market_signal_source_unknown:${identity(symbol, exchange)}:${key}:${sourceId}`,
        );
      }
    }
    const asOf = new Date(raw.asOf);
    if (!Number.isFinite(asOf.getTime())) {
      throw new Error(`daily_case_market_signal_as_of_invalid:${identity(symbol, exchange)}:${key}`);
    }
    signals[key] = {
      value: unit(raw.value, key),
      sourceIds,
      asOf: asOf.toISOString(),
    };
  }

  return {
    symbol,
    exchange,
    yahooSymbol,
    name: candidate.name?.trim() || null,
    signals,
  };
}

function rankCandidate(
  candidate: ReturnType<typeof normalizeCandidate>,
  config: ResolvedConfig,
): {
  ranked: RankedDailyCaseMarketCandidate;
  blockers: DailyCaseMarketShortlistBlocker[];
} {
  const contributions: RankedDailyCaseMarketCandidate["contributingSignals"] = [];
  const staleSignals: DailyCaseMarketSignalKey[] = [];
  let score = 0;
  let signalCoverage = 0;
  const nowMs = config.now.getTime();
  const futureLimit =
    nowMs + DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxFutureClockSkewMinutes * 60_000;

  for (const key of SIGNAL_KEYS) {
    const signal = candidate.signals[key];
    if (!signal) continue;
    const asOfMs = new Date(signal.asOf).getTime();
    if (asOfMs > futureLimit) {
      throw new Error(
        `daily_case_market_signal_from_future:${identity(candidate.symbol, candidate.exchange)}:${key}`,
      );
    }
    const ageHours = Math.max(0, (nowMs - asOfMs) / 3_600_000);
    if (ageHours > DAILY_CASE_MARKET_SIGNAL_MAX_AGE_HOURS[key]) {
      staleSignals.push(key);
      continue;
    }
    const weight = DAILY_CASE_MARKET_SIGNAL_WEIGHTS[key];
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
  staleSignals.sort();
  const primary = contributions[0] ?? {
    signal: "freshReport" as DailyCaseMarketSignalKey,
    value: 0,
    weightedContribution: 0,
    sourceIds: [],
    asOf: "",
  };

  const blockers: DailyCaseMarketShortlistBlocker[] = [];
  if (
    !contributions.some(
      (item) => item.value >= DAILY_CASE_MARKET_SHORTLIST_BUDGET.minWhyNowSignal,
    )
  ) {
    blockers.push("missing_fresh_why_now_signal");
  }
  if (score < config.minScore) {
    blockers.push("market_shortlist_score_below_threshold");
  }

  return {
    ranked: {
      symbol: candidate.symbol,
      exchange: candidate.exchange,
      yahooSymbol: candidate.yahooSymbol,
      name: candidate.name,
      score,
      signalCoverage,
      primaryDriver: primary.signal,
      primaryDriverScore: primary.weightedContribution,
      staleSignals,
      contributingSignals: contributions,
    },
    blockers,
  };
}

/**
 * Cheap 300 -> 20 funnel. This ranks research urgency, never expected return,
 * fundamental quality or a trade recommendation.
 */
export function shortlistDailyCasePreflights(
  candidates: readonly DailyCaseMarketShortlistCandidate[],
  config: DailyCaseMarketShortlistConfig = {},
): DailyCaseMarketShortlistResult {
  if (candidates.length > DAILY_CASE_MARKET_SHORTLIST_BUDGET.maxUniverseSize) {
    throw new Error("daily_case_market_universe_too_large");
  }
  const resolved = resolveConfig(config);
  const seen = new Set<string>();
  const eligible: RankedDailyCaseMarketCandidate[] = [];
  const blocked: DailyCaseMarketShortlistResult["blocked"] = [];

  for (const raw of candidates) {
    const candidate = normalizeCandidate(raw);
    const key = identity(candidate.symbol, candidate.exchange);
    if (seen.has(key)) throw new Error(`daily_case_market_duplicate_identity:${key}`);
    seen.add(key);
    const { ranked, blockers } = rankCandidate(candidate, resolved);
    if (blockers.length > 0) {
      blocked.push({
        symbol: ranked.symbol,
        exchange: ranked.exchange,
        yahooSymbol: ranked.yahooSymbol,
        name: ranked.name,
        score: ranked.score,
        signalCoverage: ranked.signalCoverage,
        staleSignals: ranked.staleSignals,
        blockers,
      });
    } else {
      eligible.push(ranked);
    }
  }

  const sortRanked = (a: RankedDailyCaseMarketCandidate, b: RankedDailyCaseMarketCandidate) =>
    b.score - a.score || a.symbol.localeCompare(b.symbol) || a.exchange.localeCompare(b.exchange);
  eligible.sort(sortRanked);
  blocked.sort(
    (a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol) || a.exchange.localeCompare(b.exchange),
  );

  const selected: RankedDailyCaseMarketCandidate[] = [];
  const eligibleNotSelected: DailyCaseMarketShortlistResult["eligibleNotSelected"] = [];
  const exchangeCounts = new Map<string, number>();
  const driverCounts = new Map<DailyCaseMarketSignalKey, number>();

  for (const candidate of eligible) {
    if (selected.length >= resolved.maxShortlistSize) {
      eligibleNotSelected.push({ ...candidate, notSelectedReason: "preflight_budget_exhausted" });
      continue;
    }
    if ((exchangeCounts.get(candidate.exchange) ?? 0) >= resolved.maxSameExchange) {
      eligibleNotSelected.push({ ...candidate, notSelectedReason: "exchange_diversity_limit" });
      continue;
    }
    if ((driverCounts.get(candidate.primaryDriver) ?? 0) >= resolved.maxSamePrimaryDriver) {
      eligibleNotSelected.push({ ...candidate, notSelectedReason: "primary_driver_diversity_limit" });
      continue;
    }
    selected.push(candidate);
    exchangeCounts.set(candidate.exchange, (exchangeCounts.get(candidate.exchange) ?? 0) + 1);
    driverCounts.set(candidate.primaryDriver, (driverCounts.get(candidate.primaryDriver) ?? 0) + 1);
  }

  return {
    version: DIVLAB_DAILY_CASE_MARKET_SHORTLIST_VERSION,
    selected,
    eligibleNotSelected,
    blocked,
    stats: {
      universe: candidates.length,
      eligible: eligible.length,
      selectedForPreflight: selected.length,
      blocked: blocked.length,
    },
  };
}
