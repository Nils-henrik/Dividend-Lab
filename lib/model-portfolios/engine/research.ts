import type { ModelPortfolioStrategyKey } from "./policy";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

export type ResearchCandidate = {
  symbol: string;
  exchange: string;
  marketCapSek?: number;
  avgDailyTurnoverSek?: number;
  priceMomentum20d?: number;
  priceMomentum60d?: number;
  volatility20d?: number;
  earningsRevisionScore?: number;
  qualityScore?: number;
  valuationScore?: number;
  dividendQualityScore?: number;
  catalystScore?: number;
  balanceSheetScore?: number;
  technicalAnalysis?: TechnicalAnalysisSnapshot;
};

export type RankedResearchCandidate = ResearchCandidate & {
  deterministicScore: number;
  reasons: readonly string[];
};

export const RESEARCH_BUDGET = {
  maxUniverseSize: 300,
  maxShortlistSize: 20,
  maxDeepResearchCandidates: 6,
  maxTradeProposalsPerRun: 3,
  maxAiCallsPerPortfolioRun: 2,
} as const;

const MIN_MARKET_CAP_SEK = 750_000_000;
const MIN_DAILY_TURNOVER_SEK = 5_000_000;

function clamp01(value: number | undefined, fallback = 0.5): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value as number));
}

function normalizeMomentum(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0.5;
  return clamp01(((value as number) + 0.2) / 0.4);
}

function inverseVolatility(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0.5;
  return clamp01(1 - (value as number) / 0.8);
}

function weightedScore(parts: readonly [number, number][]): number {
  const weighted = parts.reduce((sum, [score, weight]) => sum + score * weight, 0);
  const weight = parts.reduce((sum, [, partWeight]) => sum + partWeight, 0);
  return weight > 0 ? weighted / weight : 0;
}

function scoreForProfile(candidate: ResearchCandidate, strategy: ModelPortfolioStrategyKey) {
  const quality = clamp01(candidate.qualityScore);
  const valuation = clamp01(candidate.valuationScore);
  const revisions = clamp01(candidate.earningsRevisionScore);
  const dividend = clamp01(candidate.dividendQualityScore);
  const catalyst = clamp01(candidate.catalystScore);
  const balanceSheet = clamp01(candidate.balanceSheetScore);
  const momentum20 = normalizeMomentum(candidate.priceMomentum20d);
  const momentum60 = normalizeMomentum(candidate.priceMomentum60d);
  const lowVolatility = inverseVolatility(candidate.volatility20d);
  const technical = candidate.technicalAnalysis;
  const technicalComposite = clamp01(technical?.scores.composite);
  const technicalTrend = clamp01(technical?.scores.trend);
  const technicalMomentum = clamp01(technical?.scores.momentum);
  const technicalVolume = clamp01(technical?.scores.volume);
  const technicalBreakout = clamp01(technical?.scores.breakout);
  const technicalStability = clamp01(technical?.scores.stability);

  if (strategy === "conservative") {
    return {
      score: weightedScore([
        [quality, 0.24],
        [balanceSheet, 0.22],
        [lowVolatility, 0.15],
        [valuation, 0.14],
        [revisions, 0.09],
        [momentum60, 0.04],
        [technicalTrend, 0.06],
        [technicalStability, 0.06],
      ]),
      reasons: [
        "kvalitet",
        "balansräkning",
        "lägre volatilitet",
        "värdering",
        "teknisk risk- och trendbekräftelse",
      ],
    };
  }

  if (strategy === "high_risk") {
    return {
      score: weightedScore([
        [catalyst, 0.22],
        [revisions, 0.18],
        [momentum20, 0.13],
        [momentum60, 0.09],
        [quality, 0.08],
        [valuation, 0.05],
        [balanceSheet, 0.04],
        [technicalTrend, 0.08],
        [technicalMomentum, 0.07],
        [technicalVolume, 0.06],
        [technicalBreakout, 0.1],
      ]),
      reasons: [
        "katalysator",
        "vinstrevideringar",
        "momentum",
        "volym och breakout",
        "asymmetri",
      ],
    };
  }

  if (strategy === "dividend") {
    return {
      score: weightedScore([
        [dividend, 0.31],
        [balanceSheet, 0.21],
        [quality, 0.17],
        [valuation, 0.13],
        [revisions, 0.07],
        [lowVolatility, 0.03],
        [technicalStability, 0.05],
        [technicalTrend, 0.03],
      ]),
      reasons: [
        "utdelningskvalitet",
        "balansräkning",
        "kassaflödeskvalitet",
        "värdering",
        "teknisk stabilitet",
      ],
    };
  }

  return {
    score: weightedScore([
      [quality, 0.2],
      [valuation, 0.18],
      [revisions, 0.16],
      [balanceSheet, 0.13],
      [catalyst, 0.1],
      [momentum60, 0.07],
      [lowVolatility, 0.05],
      [technicalComposite, 0.11],
    ]),
    reasons: [
      "kvalitet",
      "värdering",
      "revideringar",
      "teknisk bekräftelse",
      "balanserad risk/reward",
    ],
  };
}

export function rankResearchUniverse(
  universe: readonly ResearchCandidate[],
  strategy: ModelPortfolioStrategyKey,
): RankedResearchCandidate[] {
  const eligible = universe.filter((candidate) => {
    const marketCapOk =
      !Number.isFinite(candidate.marketCapSek) ||
      (candidate.marketCapSek as number) >= MIN_MARKET_CAP_SEK;
    const liquidityOk =
      !Number.isFinite(candidate.avgDailyTurnoverSek) ||
      (candidate.avgDailyTurnoverSek as number) >= MIN_DAILY_TURNOVER_SEK;
    return Boolean(candidate.symbol.trim() && candidate.exchange.trim() && marketCapOk && liquidityOk);
  });

  const ranked = eligible
    .map((candidate) => {
      const profile = scoreForProfile(candidate, strategy);
      return {
        ...candidate,
        deterministicScore: Math.round(profile.score * 10_000) / 10_000,
        reasons: profile.reasons,
      };
    })
    .sort((a, b) => b.deterministicScore - a.deterministicScore);

  return ranked.slice(0, RESEARCH_BUDGET.maxUniverseSize).slice(0, RESEARCH_BUDGET.maxShortlistSize);
}

export function selectDeepResearchCandidates(
  ranked: readonly RankedResearchCandidate[],
): RankedResearchCandidate[] {
  return ranked.slice(0, RESEARCH_BUDGET.maxDeepResearchCandidates);
}

export function capTradeProposals<T>(proposals: readonly T[]): T[] {
  return proposals.slice(0, RESEARCH_BUDGET.maxTradeProposalsPerRun);
}
