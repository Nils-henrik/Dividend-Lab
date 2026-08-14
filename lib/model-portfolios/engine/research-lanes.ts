/**
 * Internal discovery routing for the shared model-portfolio research engine.
 *
 * Lane markers reserve bounded research capacity so all four mandates can see
 * relevant names. They are not financial claims, buy eligibility, or a
 * substitute for verified fundamentals.
 */

import {
  classifyDividendInstrument,
  NORDIC_DIVIDEND_PRIORITY_SEEDS,
} from "./dividend-universe";
import { NORDIC_SMALL_MID_OPPORTUNITY_SEEDS } from "./high-risk-universe";
import {
  NORDIC_RESEARCH_BOUNDS,
  NORDIC_SEED_UNIVERSE,
  type NordicCapSegment,
  type NordicCountry,
} from "./nordic-universe";
import { rankResearchUniverse, type ResearchCandidate } from "./research";

export type ResearchLane =
  | "quality_core"
  | "balanced_general"
  | "high_risk_opportunity"
  | "income";

export const RESEARCH_LANE_FILL_ORDER = [
  "income",
  "high_risk_opportunity",
  "quality_core",
  "balanced_general",
] as const satisfies readonly ResearchLane[];

/**
 * Reserved Nordic deep-history slots inside `deepHistoryTechnicalCount` (14).
 * Unused quota flows to remaining eligible candidates rather than leaving
 * research capacity empty.
 */
export const NORDIC_RESEARCH_LANE_QUOTAS: Record<ResearchLane, number> = {
  income: 3,
  high_risk_opportunity: 4,
  quality_core: 4,
  balanced_general: 3,
};

/**
 * Reserved US shared-seed slots inside `US_MAX_SEEDS` (18), after holdings.
 * Unused quota flows to remaining eligible candidates.
 */
export const US_RESEARCH_LANE_QUOTAS: Record<ResearchLane, number> = {
  income: 2,
  high_risk_opportunity: 4,
  quality_core: 4,
  balanced_general: 8,
};

/** Fundamental slots reserved for income-discovery / pref-D-ETF verification. */
export const FUNDAMENTAL_INCOME_RESERVED_COUNT = 2;

/** Discovery market-cap band for US high-risk opportunity routing. Missing caps are not fabricated. */
export const US_HIGH_RISK_MIN_MARKET_CAP_USD = 300_000_000;
export const US_HIGH_RISK_MAX_MARKET_CAP_USD = 20_000_000_000;

export const US_QUALITY_CORE = [
  { symbol: "MSFT", exchange: "US", name: "Microsoft" },
  { symbol: "AAPL", exchange: "US", name: "Apple" },
  { symbol: "GOOGL", exchange: "US", name: "Alphabet" },
  { symbol: "AMZN", exchange: "US", name: "Amazon" },
  { symbol: "META", exchange: "US", name: "Meta Platforms" },
  { symbol: "JPM", exchange: "US", name: "JPMorgan Chase" },
  { symbol: "NVDA", exchange: "US", name: "NVIDIA" },
] as const;

/**
 * Narrow, liquid, sector-diversified US income *research seeds*.
 * Historical dividend reputation is never a `dividendQualityScore`, yield, or buy signal.
 * Every run must still verify current fundamentals before Dividend-mandate eligibility.
 */
export const US_INCOME_DISCOVERY_SEEDS = [
  { symbol: "JNJ", exchange: "US", name: "Johnson & Johnson" },
  { symbol: "PG", exchange: "US", name: "Procter & Gamble" },
  { symbol: "XOM", exchange: "US", name: "Exxon Mobil" },
  { symbol: "T", exchange: "US", name: "AT&T" },
  { symbol: "O", exchange: "US", name: "Realty Income" },
  { symbol: "MCD", exchange: "US", name: "McDonald's" },
  { symbol: "IBM", exchange: "US", name: "IBM" },
  { symbol: "NEE", exchange: "US", name: "NextEra Energy" },
] as const;

const NORDIC_INCOME_KEYS = new Set(
  NORDIC_DIVIDEND_PRIORITY_SEEDS.map((item) => laneInstrumentKey(item.symbol, item.exchange)),
);

const NORDIC_HIGH_RISK_KEYS = new Set(
  NORDIC_SMALL_MID_OPPORTUNITY_SEEDS
    .map((item) => laneInstrumentKey(item.symbol, item.exchange))
    .filter((key) => !NORDIC_INCOME_KEYS.has(key)),
);

const NORDIC_CORE_KEYS = new Set(
  NORDIC_SEED_UNIVERSE.map((item) => laneInstrumentKey(item.symbol, item.exchange)),
);

const US_QUALITY_CORE_KEYS = new Set(
  US_QUALITY_CORE.map((item) => laneInstrumentKey(item.symbol, item.exchange)),
);

const US_INCOME_SEED_KEYS = new Set(
  US_INCOME_DISCOVERY_SEEDS.map((item) => laneInstrumentKey(item.symbol, item.exchange)),
);

const US_QUALITY_CORE_RANK = new Map(
  US_QUALITY_CORE.map((item, index) => [
    laneInstrumentKey(item.symbol, item.exchange),
    US_QUALITY_CORE.length - index,
  ]),
);

const US_INCOME_SEED_RANK = new Map(
  US_INCOME_DISCOVERY_SEEDS.map((item, index) => [
    laneInstrumentKey(item.symbol, item.exchange),
    US_INCOME_DISCOVERY_SEEDS.length - index,
  ]),
);

export function laneInstrumentKey(symbol: string, exchange: string): string {
  return `${symbol.trim()}.${exchange.trim()}`.toUpperCase();
}

export function isUsLiquidSmallMidCap(marketCapUsd: number | null | undefined): boolean {
  if (marketCapUsd == null || !Number.isFinite(marketCapUsd) || marketCapUsd <= 0) return false;
  return (
    marketCapUsd >= US_HIGH_RISK_MIN_MARKET_CAP_USD &&
    marketCapUsd <= US_HIGH_RISK_MAX_MARKET_CAP_USD
  );
}

export function classifyNordicDiscoveryLane(input: {
  symbol: string;
  exchange: string;
}): ResearchLane {
  const key = laneInstrumentKey(input.symbol, input.exchange);
  if (NORDIC_INCOME_KEYS.has(key) || classifyDividendInstrument(input)) return "income";
  if (NORDIC_HIGH_RISK_KEYS.has(key)) return "high_risk_opportunity";
  if (NORDIC_CORE_KEYS.has(key)) return "quality_core";
  return "balanced_general";
}

export function classifyUsDiscoveryLane(input: {
  symbol: string;
  exchange?: string;
  marketCapUsd?: number | null;
}): ResearchLane {
  const key = laneInstrumentKey(input.symbol, input.exchange ?? "US");
  if (US_INCOME_SEED_KEYS.has(key)) return "income";
  if (US_QUALITY_CORE_KEYS.has(key)) return "quality_core";
  if (isUsLiquidSmallMidCap(input.marketCapUsd)) return "high_risk_opportunity";
  return "balanced_general";
}

export function nordicDiscoveryLaneRank(input: {
  symbol: string;
  exchange: string;
  score: number;
  segment?: NordicCapSegment;
  lane: ResearchLane;
}): number {
  const score = Number.isFinite(input.score) ? input.score : 0;
  if (input.lane === "income") {
    const priority = classifyDividendInstrument(input)?.priorityScore ?? 0;
    return priority * 1_000 + score;
  }
  if (input.lane === "quality_core") {
    return (input.segment === "large_cap" ? 1_000 : 0) + score;
  }
  return score;
}

export function usDiscoveryLaneRank(input: {
  symbol: string;
  exchange?: string;
  discoveryScore?: number;
  lane: ResearchLane;
}): number {
  const key = laneInstrumentKey(input.symbol, input.exchange ?? "US");
  const score = Number.isFinite(input.discoveryScore) ? (input.discoveryScore as number) : 0;
  if (input.lane === "income") return (US_INCOME_SEED_RANK.get(key) ?? 0) * 1_000 + score;
  if (input.lane === "quality_core") return (US_QUALITY_CORE_RANK.get(key) ?? 0) * 1_000 + score;
  return score;
}

export type LaneUnionCandidate<T> = {
  key: string;
  lane: ResearchLane;
  /** Higher is better within the reserved lane. */
  laneRank: number;
  /** Higher is better when unused quota flows to remaining names. */
  fillRank: number;
  country?: string;
  item: T;
};

export type LaneUnionGeographicLimits = {
  countries: readonly string[];
  perCountryMin: number;
  perCountryMax: number;
};

/**
 * Deterministic bounded union of reserved research lanes.
 * Identical input => identical order. One instrument consumes one slot.
 * Unused lane quota flows to the best remaining candidates.
 */
export function selectBoundedResearchLaneUnion<T>(
  candidates: readonly LaneUnionCandidate<T>[],
  options: {
    limit: number;
    quotas: Record<ResearchLane, number>;
    geographic?: LaneUnionGeographicLimits;
  },
): T[] {
  const limit = Math.max(0, Math.floor(options.limit));
  if (limit <= 0) return [];

  const unique = new Map<string, LaneUnionCandidate<T>>();
  for (const candidate of candidates) {
    const previous = unique.get(candidate.key);
    if (!previous || compareLaneCandidates(candidate, previous) < 0) {
      unique.set(candidate.key, candidate);
    }
  }
  const pool = [...unique.values()];

  const selected: LaneUnionCandidate<T>[] = [];
  const selectedKeys = new Set<string>();
  const countByCountry: Record<string, number> = {};

  const withinCountryMax = (candidate: LaneUnionCandidate<T>): boolean => {
    if (!options.geographic || !candidate.country) return true;
    const count = countByCountry[candidate.country] ?? 0;
    return count < options.geographic.perCountryMax;
  };

  const canAdd = (candidate: LaneUnionCandidate<T>): boolean => {
    if (selectedKeys.has(candidate.key)) return false;
    if (selected.length >= limit) return false;
    return withinCountryMax(candidate);
  };

  const add = (candidate: LaneUnionCandidate<T>): boolean => {
    if (!canAdd(candidate)) return false;
    selectedKeys.add(candidate.key);
    selected.push(candidate);
    if (candidate.country) {
      countByCountry[candidate.country] = (countByCountry[candidate.country] ?? 0) + 1;
    }
    return true;
  };

  const remove = (candidate: LaneUnionCandidate<T>): void => {
    const index = selected.findIndex((item) => item.key === candidate.key);
    if (index < 0) return;
    selected.splice(index, 1);
    selectedKeys.delete(candidate.key);
    if (candidate.country) {
      countByCountry[candidate.country] = Math.max(
        0,
        (countByCountry[candidate.country] ?? 1) - 1,
      );
    }
  };

  for (const lane of RESEARCH_LANE_FILL_ORDER) {
    const quota = Math.max(0, Math.floor(options.quotas[lane] ?? 0));
    if (quota <= 0) continue;
    const ranked = pool
      .filter((item) => item.lane === lane)
      .sort(compareLaneCandidates);
    let taken = 0;
    for (const candidate of ranked) {
      if (taken >= quota || selected.length >= limit) break;
      if (add(candidate)) taken += 1;
    }
  }

  if (options.geographic) {
    const remainingByFill = [...pool].sort(compareFillCandidates);
    for (const country of options.geographic.countries) {
      while ((countByCountry[country] ?? 0) < options.geographic.perCountryMin) {
        const next = remainingByFill.find(
          (item) => item.country === country && !selectedKeys.has(item.key) && withinCountryMax(item),
        );
        if (!next) break;
        if (add(next)) continue;

        const victims = selected
          .filter((item) => {
            if (item.key === next.key) return false;
            if (!item.country || item.country === country) return false;
            const count = countByCountry[item.country] ?? 0;
            return count - 1 >= options.geographic!.perCountryMin;
          })
          .sort((left, right) => {
            if (left.fillRank !== right.fillRank) return left.fillRank - right.fillRank;
            if (left.laneRank !== right.laneRank) return left.laneRank - right.laneRank;
            return right.key.localeCompare(left.key);
          });
        const victim = victims[0];
        if (!victim) break;
        remove(victim);
        if (!add(next)) break;
      }
    }
  }

  const fill = [...pool].sort(compareFillCandidates);
  for (const candidate of fill) {
    if (selected.length >= limit) break;
    add(candidate);
  }

  return selected.map((item) => item.item);
}

export function selectNordicLaneShortlist<T extends {
  symbol: string;
  exchange: string;
  country: NordicCountry;
  score: number;
  segment?: NordicCapSegment;
}>(
  candidates: readonly T[],
  limits: {
    shortlistLimit?: number;
    perCountryMin?: number;
    perCountryMax?: number;
  } = {},
): T[] {
  const shortlistLimit = Math.max(
    1,
    Math.min(limits.shortlistLimit ?? NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount, 30),
  );
  const perCountryMin = Math.max(
    0,
    Math.min(limits.perCountryMin ?? NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist, shortlistLimit),
  );
  const perCountryMax = Math.max(
    perCountryMin,
    Math.min(limits.perCountryMax ?? NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist, shortlistLimit),
  );

  return selectBoundedResearchLaneUnion(
    candidates.map((item) => {
      const lane = classifyNordicDiscoveryLane(item);
      return {
        key: laneInstrumentKey(item.symbol, item.exchange),
        lane,
        laneRank: nordicDiscoveryLaneRank({ ...item, lane }),
        fillRank: Number.isFinite(item.score) ? item.score : 0,
        country: item.country,
        item,
      };
    }),
    {
      limit: shortlistLimit,
      quotas: NORDIC_RESEARCH_LANE_QUOTAS,
      geographic: {
        countries: ["SE", "NO", "FI", "DK"],
        perCountryMin,
        perCountryMax,
      },
    },
  );
}

export type UsLaneSeed = {
  symbol: string;
  exchange: string;
  name: string;
  yahooSymbol: string;
  discoveryMarketCapUsd?: number | null;
  discoveryPrice?: number | null;
  discoveryChangePct?: number | null;
  discoveryScore?: number;
  held: boolean;
  researchLane: ResearchLane;
};

export function selectUsSharedSeedUnion(input: {
  holdings: readonly Omit<UsLaneSeed, "researchLane">[];
  movers: readonly Omit<UsLaneSeed, "researchLane" | "held">[];
  maxSeeds: number;
}): UsLaneSeed[] {
  const maxSeeds = Math.max(0, Math.floor(input.maxSeeds));
  const holdingMap = new Map<string, UsLaneSeed>();
  for (const holding of input.holdings) {
    const key = laneInstrumentKey(holding.symbol, holding.exchange);
    const researchLane = classifyUsDiscoveryLane({
      symbol: holding.symbol,
      exchange: holding.exchange,
      marketCapUsd: holding.discoveryMarketCapUsd,
    });
    holdingMap.set(key, { ...holding, held: true, researchLane });
  }

  // Holdings always consume the envelope first. Discovered new-entry capacity
  // may fall to zero when holding count >= maxSeeds. Never slice holdings.
  const remainingLimit = Math.max(0, maxSeeds - holdingMap.size);
  const pool = new Map<string, Omit<UsLaneSeed, "researchLane"> & { originScore: number }>();

  const consider = (
    seed: Omit<UsLaneSeed, "researchLane" | "held"> & { held?: boolean },
    originScore: number,
  ) => {
    const key = laneInstrumentKey(seed.symbol, seed.exchange);
    if (holdingMap.has(key)) return;
    const previous = pool.get(key);
    if (!previous || originScore > previous.originScore) {
      pool.set(key, { ...seed, held: false, originScore });
    }
  };

  for (const mover of input.movers) {
    consider(mover, 3 + (Number.isFinite(mover.discoveryScore) ? (mover.discoveryScore as number) : 0));
  }
  for (const item of US_QUALITY_CORE) {
    consider(
      {
        symbol: item.symbol,
        exchange: item.exchange,
        name: item.name,
        yahooSymbol: item.symbol,
        discoveryScore: 0,
      },
      2,
    );
  }
  for (const item of US_INCOME_DISCOVERY_SEEDS) {
    consider(
      {
        symbol: item.symbol,
        exchange: item.exchange,
        name: item.name,
        yahooSymbol: item.symbol,
        discoveryScore: 0,
      },
      2,
    );
  }

  const discovered = selectBoundedResearchLaneUnion(
    [...pool.values()].map((seed) => {
      const lane = classifyUsDiscoveryLane({
        symbol: seed.symbol,
        exchange: seed.exchange,
        marketCapUsd: seed.discoveryMarketCapUsd,
      });
      return {
        key: laneInstrumentKey(seed.symbol, seed.exchange),
        lane,
        laneRank: usDiscoveryLaneRank({
          symbol: seed.symbol,
          exchange: seed.exchange,
          discoveryScore: seed.discoveryScore,
          lane,
        }),
        fillRank: Number.isFinite(seed.discoveryScore) ? (seed.discoveryScore as number) : 0,
        item: { ...seed, held: false, researchLane: lane },
      };
    }),
    {
      limit: remainingLimit,
      quotas: US_RESEARCH_LANE_QUOTAS,
    },
  );

  return [...holdingMap.values(), ...discovered];
}

export function isIncomeFundamentalReservationSeed(input: {
  symbol: string;
  exchange: string;
  researchLane?: ResearchLane;
}): boolean {
  if (input.researchLane === "income") return true;
  return classifyDividendInstrument(input) !== null;
}

/**
 * Reserve a few of the existing fundamental slots so income-discovery names can
 * actually have current payout/dividend data fetched. Does not manufacture a
 * dividendQualityScore or Dividend-mandate eligibility.
 */
export function selectLaneAwareFundamentalTargets(input: {
  candidates: readonly ResearchCandidate[];
  seeds: readonly {
    symbol: string;
    exchange: string;
    held?: boolean;
    researchLane?: ResearchLane;
  }[];
  maxTargets: number;
  incomeReservedCount?: number;
}): Set<string> {
  const maxTargets = Math.max(0, Math.floor(input.maxTargets));
  const incomeReservedCount = Math.max(
    0,
    Math.floor(input.incomeReservedCount ?? FUNDAMENTAL_INCOME_RESERVED_COUNT),
  );
  const available = new Set(
    input.candidates.map((candidate) => laneInstrumentKey(candidate.symbol, candidate.exchange)),
  );
  const selected = new Set<string>();

  const tryAdd = (key: string): boolean => {
    if (!available.has(key) || selected.has(key) || selected.size >= maxTargets) return false;
    selected.add(key);
    return true;
  };

  for (const seed of input.seeds) {
    if (!seed.held) continue;
    tryAdd(laneInstrumentKey(seed.symbol, seed.exchange));
    if (selected.size >= maxTargets) return selected;
  }

  let incomeCount = 0;
  for (const seed of input.seeds) {
    if (incomeCount >= incomeReservedCount || selected.size >= maxTargets) break;
    if (!isIncomeFundamentalReservationSeed(seed)) continue;
    if (tryAdd(laneInstrumentKey(seed.symbol, seed.exchange))) incomeCount += 1;
  }

  for (const strategy of ["conservative", "balanced", "high_risk"] as const) {
    if (selected.size >= maxTargets) return selected;
    for (const candidate of rankResearchUniverse(input.candidates, strategy)) {
      if (tryAdd(laneInstrumentKey(candidate.symbol, candidate.exchange))) break;
    }
  }

  for (const strategy of ["conservative", "balanced", "high_risk", "dividend"] as const) {
    if (selected.size >= maxTargets) return selected;
    for (const candidate of rankResearchUniverse(input.candidates, strategy).slice(0, 3)) {
      tryAdd(laneInstrumentKey(candidate.symbol, candidate.exchange));
      if (selected.size >= maxTargets) return selected;
    }
  }

  return selected;
}

/** Exact Google/event primary-source call budget. Do not raise. */
export const EVENT_PRIMARY_SOURCE_TARGET_COUNT = 2;

export type EventTargetSeed = {
  symbol: string;
  exchange: string;
  held?: boolean;
  researchLane?: ResearchLane;
  /** Explicit current event/review need. Never inferred from lane membership. */
  eventReviewNeeded?: boolean;
};

/**
 * Pick expensive event/Google targets from the already chosen fundamental set.
 * Numeric cap stays at 2. Holdings with an explicit event need remain eligible,
 * but a crowded income lane cannot monopolize both slots when other useful
 * lanes exist in the same fundamental set.
 */
export function selectCrossLaneEventTargets(input: {
  orderedFundamentalKeys: readonly string[];
  seeds: readonly EventTargetSeed[];
  limit?: number;
}): string[] {
  const limit = Math.max(0, Math.floor(input.limit ?? EVENT_PRIMARY_SOURCE_TARGET_COUNT));
  if (limit <= 0) return [];

  const seedByKey = new Map<string, EventTargetSeed>();
  for (const seed of input.seeds) {
    const key = laneInstrumentKey(seed.symbol, seed.exchange);
    if (!seedByKey.has(key)) seedByKey.set(key, seed);
  }

  const queue: Array<{
    key: string;
    held: boolean;
    eventReviewNeeded: boolean;
    lane: ResearchLane;
  }> = [];
  const seen = new Set<string>();
  for (const key of input.orderedFundamentalKeys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const seed = seedByKey.get(key);
    const lane = seed?.researchLane
      ?? (seed ? classifyUsDiscoveryLane(seed) : "balanced_general");
    queue.push({
      key,
      held: Boolean(seed?.held),
      eventReviewNeeded: Boolean(seed?.eventReviewNeeded),
      lane,
    });
  }

  const selected: string[] = [];
  const selectedLanes = new Set<ResearchLane>();
  const take = (item: (typeof queue)[number]) => {
    if (selected.includes(item.key) || selected.length >= limit) return;
    selected.push(item.key);
    selectedLanes.add(item.lane);
  };

  for (const item of queue) {
    if (item.held && item.eventReviewNeeded) take(item);
  }

  const remaining = queue.filter((item) => !selected.includes(item.key));
  while (selected.length < limit && remaining.length) {
    const diverseIndex = remaining.findIndex((item) => !selectedLanes.has(item.lane));
    const index = diverseIndex >= 0 ? diverseIndex : 0;
    const pick = remaining.splice(index, 1)[0];
    if (pick) take(pick);
  }

  return selected;
}

function compareLaneCandidates<T>(a: LaneUnionCandidate<T>, b: LaneUnionCandidate<T>): number {
  if (b.laneRank !== a.laneRank) return b.laneRank - a.laneRank;
  if (b.fillRank !== a.fillRank) return b.fillRank - a.fillRank;
  return a.key.localeCompare(b.key);
}

function compareFillCandidates<T>(a: LaneUnionCandidate<T>, b: LaneUnionCandidate<T>): number {
  if (b.fillRank !== a.fillRank) return b.fillRank - a.fillRank;
  if (b.laneRank !== a.laneRank) return b.laneRank - a.laneRank;
  return a.key.localeCompare(b.key);
}
