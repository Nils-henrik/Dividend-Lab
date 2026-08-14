import {
  classifyDividendInstrument,
  dividendInstrumentPriorityScore,
  isDividendResearchCandidate,
} from "./dividend-universe";
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

function clamp01(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function knownUnitInterval(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value as number));
}

function normalizeMomentum(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  return knownUnitInterval(((value as number) + 0.2) / 0.4);
}

function inverseVolatility(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  return knownUnitInterval(1 - (value as number) / 0.8);
}

/**
 * Coverage-aware weighted score in [0, 1].
 *
 * Known components keep their actual values, including a genuine 0.5.
 * Missing/non-finite components are absent — never filled with a synthetic 0.5.
 * The known weighted average is then multiplied by knownWeight / totalIntendedWeight
 * so deleting a datum cannot raise or preserve a falsely high score through
 * renormalization. Equivalent form: sum(knownScore * weight) / totalIntendedWeight.
 */
function weightedScore(parts: readonly (readonly [number | null, number])[]): number {
  const totalIntendedWeight = parts.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
  if (totalIntendedWeight <= 0) return 0;

  let knownWeighted = 0;
  let knownWeight = 0;
  for (const [score, weight] of parts) {
    if (score === null || !Number.isFinite(score) || weight <= 0) continue;
    knownWeighted += score * weight;
    knownWeight += weight;
  }
  if (knownWeight <= 0) return 0;

  const knownAverage = knownWeighted / knownWeight;
  const coverage = knownWeight / totalIntendedWeight;
  return clamp01(knownAverage * coverage);
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
  const quality = knownUnitInterval(candidate.qualityScore);
  const valuation = knownUnitInterval(candidate.valuationScore);
  const revisions = knownUnitInterval(candidate.earningsRevisionScore);
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const balanceSheet = knownUnitInterval(candidate.balanceSheetScore);
  const technical = candidate.technicalAnalysis;
  const trend = knownUnitInterval(technical?.scores.trend);
  const technicalMomentum = knownUnitInterval(technical?.scores.momentum);
  const volume = knownUnitInterval(technical?.scores.volume);
  const breakout = knownUnitInterval(technical?.scores.breakout);
  const stability = knownUnitInterval(technical?.scores.stability);
  const composite = knownUnitInterval(technical?.scores.composite);
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
  const quality = knownUnitInterval(candidate.qualityScore);
  const valuation = knownUnitInterval(candidate.valuationScore);
  const revisions = knownUnitInterval(candidate.earningsRevisionScore);
  const dividend = knownUnitInterval(candidate.dividendQualityScore);
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const balanceSheet = knownUnitInterval(candidate.balanceSheetScore);
  const momentum20 = normalizeMomentum(candidate.priceMomentum20d);
  const momentum60 = normalizeMomentum(candidate.priceMomentum60d);
  const lowVolatility = inverseVolatility(candidate.volatility20d);
  const technical = candidate.technicalAnalysis;
  const technicalComposite = knownUnitInterval(technical?.scores.composite);
  const technicalTrend = knownUnitInterval(technical?.scores.trend);
  const technicalMomentum = knownUnitInterval(technical?.scores.momentum);
  const technicalVolume = knownUnitInterval(technical?.scores.volume);
  const technicalBreakout = knownUnitInterval(technical?.scores.breakout);
  const technicalStability = knownUnitInterval(technical?.scores.stability);
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
    const incomeProfile = classifyDividendInstrument(candidate);
    const incomePriority = dividendInstrumentPriorityScore(candidate);
    const reasons = [
      "utdelningskvalitet",
      "balansräkning",
      "kassaflödeskvalitet",
      "värdering",
      "teknisk stabilitet",
    ];
    if (incomeProfile?.kind === "preferred_share" || incomeProfile?.kind === "d_share") {
      reasons.unshift(`${incomeProfile.label} med strategisk förtur`);
    } else if (incomeProfile?.kind === "dividend_etf") {
      reasons.unshift("utdelande ETF tillåten som diversifierande kassaflödesbyggsten");
    }

    return {
      score: weightedScore([
        [incomePriority, 0.18],
        [dividend, 0.25],
        [balanceSheet, 0.18],
        [quality, 0.14],
        [valuation, 0.11],
        [revisions, 0.05],
        [lowVolatility, 0.03],
        [technicalStability, 0.04],
        [technicalTrend, 0.02],
      ]),
      reasons,
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
    const mandateOk = strategy !== "dividend" || isDividendResearchCandidate(candidate);
    return Boolean(
      candidate.symbol.trim() &&
      candidate.exchange.trim() &&
      marketCapOk &&
      liquidityOk &&
      mandateOk
    );
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
