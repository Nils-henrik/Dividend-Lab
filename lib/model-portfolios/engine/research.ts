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

export type ResearchMarketCapSegment = "small_cap" | "mid_cap" | "large_cap" | "unknown";
export type ResearchRecoveryState = "not_recovery" | "watch" | "qualified" | "falling_knife";

export type ResearchRecoverySetup = {
  state: ResearchRecoveryState;
  score: number;
  drawdownFrom52WeekHigh: number | null;
  fundamentalIntegrityScore: number;
  entryConfirmationScore: number;
  reasons: readonly string[];
};

export type RankedResearchCandidate = ResearchCandidate & {
  deterministicScore: number;
  reasons: readonly string[];
  marketCapSegment: ResearchMarketCapSegment;
  recoverySetup: ResearchRecoverySetup;
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

function isUsExchange(exchange: string): boolean {
  return ["US", "NASDAQ", "NASDAQGS", "NASDAQGM", "NASDAQCM", "NYSE", "NYQ", "NMS", "NGM", "NCM"]
    .includes(exchange.trim().toUpperCase());
}

/**
 * Runtime market-cap classification for ranking only. We deliberately avoid a
 * static Russell constituent list because membership changes; US small/mid-cap
 * preference is based on current market cap and only treats verified index
 * membership as supplemental evidence when such evidence is available.
 */
export function classifyResearchMarketCap(candidate: Pick<ResearchCandidate, "exchange" | "marketCapSek">): ResearchMarketCapSegment {
  const cap = candidate.marketCapSek;
  if (!Number.isFinite(cap) || (cap as number) <= 0) return "unknown";

  if (isUsExchange(candidate.exchange)) {
    if ((cap as number) < 35_000_000_000) return "small_cap";
    if ((cap as number) < 150_000_000_000) return "mid_cap";
    return "large_cap";
  }

  if ((cap as number) < 15_000_000_000) return "small_cap";
  if ((cap as number) < 80_000_000_000) return "mid_cap";
  return "large_cap";
}

function marketCapPreference(segment: ResearchMarketCapSegment): number {
  if (segment === "small_cap") return 1;
  if (segment === "mid_cap") return 0.9;
  if (segment === "large_cap") return 0.3;
  return 0.5;
}

function drawdownOpportunityScore(drawdown: number | null): number {
  if (drawdown === null || !Number.isFinite(drawdown) || drawdown < 0) return 0;
  if (drawdown < 0.12) return 0;
  if (drawdown < 0.18) return 0.35 + ((drawdown - 0.12) / 0.06) * 0.35;
  if (drawdown <= 0.45) return 1;
  if (drawdown <= 0.65) return 1 - ((drawdown - 0.45) / 0.2) * 0.4;
  return 0.3;
}

/**
 * Fallen-quality / recovery setup. A large drawdown is never enough by itself:
 * fundamentals must remain intact and the entry must show some stabilization.
 */
export function assessRecoverySetup(candidate: ResearchCandidate): ResearchRecoverySetup {
  const quality = clamp01(candidate.qualityScore);
  const valuation = clamp01(candidate.valuationScore);
  const revisions = clamp01(candidate.earningsRevisionScore);
  const catalyst = clamp01(candidate.catalystScore);
  const balanceSheet = clamp01(candidate.balanceSheetScore);
  const technical = candidate.technicalAnalysis;
  const trend = clamp01(technical?.scores.trend);
  const technicalMomentum = clamp01(technical?.scores.momentum);
  const volume = clamp01(technical?.scores.volume);
  const breakout = clamp01(technical?.scores.breakout);
  const stability = clamp01(technical?.scores.stability);
  const composite = clamp01(technical?.scores.composite);
  const momentum20 = normalizeMomentum(candidate.priceMomentum20d);
  const distanceFromHigh = technical?.levels.distanceFrom52WeekHighPct;
  const drawdown = Number.isFinite(distanceFromHigh) && (distanceFromHigh as number) < 0
    ? Math.min(1, Math.abs(distanceFromHigh as number))
    : null;

  const fundamentalIntegrityScore = weightedScore([
    [quality, 0.32],
    [balanceSheet, 0.25],
    [valuation, 0.16],
    [revisions, 0.14],
    [catalyst, 0.07],
    [stability, 0.06],
  ]);
  const entryConfirmationScore = weightedScore([
    [trend, 0.24],
    [technicalMomentum, 0.2],
    [volume, 0.15],
    [breakout, 0.13],
    [composite, 0.12],
    [momentum20, 0.16],
  ]);
  const opportunity = drawdownOpportunityScore(drawdown);
  const regime = technical?.trend.regime ?? "insufficient_data";
  const rawMomentum20 = candidate.priceMomentum20d;
  const fallingKnife =
    drawdown !== null &&
    drawdown >= 0.15 &&
    (regime === "strong_downtrend" ||
      (regime === "downtrend" && Number.isFinite(rawMomentum20) && (rawMomentum20 as number) <= -0.08)) &&
    entryConfirmationScore < 0.46;
  const qualified =
    drawdown !== null &&
    drawdown >= 0.15 &&
    drawdown <= 0.65 &&
    fundamentalIntegrityScore >= 0.6 &&
    entryConfirmationScore >= 0.52 &&
    !fallingKnife;
  const watch =
    drawdown !== null &&
    drawdown >= 0.15 &&
    fundamentalIntegrityScore >= 0.6 &&
    !qualified &&
    !fallingKnife;

  const score = clamp01(
    weightedScore([
      [fundamentalIntegrityScore, 0.44],
      [opportunity, 0.24],
      [entryConfirmationScore, 0.32],
    ]) * (fallingKnife ? 0.45 : 1),
  );

  const reasons: string[] = [];
  if (drawdown !== null && drawdown >= 0.15) reasons.push("materiell drawdown från 52-veckorshögsta");
  if (fundamentalIntegrityScore >= 0.6) reasons.push("fundamentala kvaliteter är tillräckligt intakta för recovery-bevakning");
  if (entryConfirmationScore >= 0.52) reasons.push("entry visar stabilisering/bekräftelse");
  if (fallingKnife) reasons.push("fallande-kniv-risk: entry är ännu inte bekräftad");

  return {
    state: fallingKnife ? "falling_knife" : qualified ? "qualified" : watch ? "watch" : "not_recovery",
    score: Math.round(score * 10_000) / 10_000,
    drawdownFrom52WeekHigh: drawdown === null ? null : Math.round(drawdown * 10_000) / 10_000,
    fundamentalIntegrityScore: Math.round(fundamentalIntegrityScore * 10_000) / 10_000,
    entryConfirmationScore: Math.round(entryConfirmationScore * 10_000) / 10_000,
    reasons,
  };
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
  const marketCapSegment = classifyResearchMarketCap(candidate);
  const recoverySetup = assessRecoverySetup(candidate);

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
      marketCapSegment,
      recoverySetup,
    };
  }

  if (strategy === "high_risk") {
    const sizePreference = marketCapPreference(marketCapSegment);
    const recoveryContribution =
      recoverySetup.state === "qualified" ? recoverySetup.score :
      recoverySetup.state === "watch" ? 0.48 :
      recoverySetup.state === "falling_knife" ? 0.18 :
      0.5;
    let score = weightedScore([
      [catalyst, 0.17],
      [revisions, 0.14],
      [momentum20, 0.09],
      [momentum60, 0.05],
      [quality, 0.1],
      [valuation, 0.07],
      [balanceSheet, 0.07],
      [technicalTrend, 0.07],
      [technicalMomentum, 0.06],
      [technicalVolume, 0.05],
      [technicalBreakout, 0.07],
      [sizePreference, 0.08],
      [recoveryContribution, 0.14],
    ]);
    if (recoverySetup.state === "falling_knife") score *= 0.82;

    const reasons = [
      "katalysator",
      "vinstrevideringar",
      "momentum och teknisk bekräftelse",
      "asymmetri",
    ];
    if (marketCapSegment === "small_cap" || marketCapSegment === "mid_cap") {
      reasons.push("small/mid-cap-preferens");
    }
    if (recoverySetup.state === "qualified") reasons.push("fallen-quality/recovery-entry");
    if (recoverySetup.state === "watch") reasons.push("fallen-quality på bevakning – entry ej bekräftad");
    if (recoverySetup.state === "falling_knife") reasons.push("fallande-kniv-risk sänker rankingen");

    return {
      score,
      reasons,
      marketCapSegment,
      recoverySetup,
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
      marketCapSegment,
      recoverySetup,
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
    marketCapSegment,
    recoverySetup,
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
        deterministicScore: Math.round(clamp01(profile.score, 0) * 10_000) / 10_000,
        reasons: profile.reasons,
        marketCapSegment: profile.marketCapSegment,
        recoverySetup: profile.recoverySetup,
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
