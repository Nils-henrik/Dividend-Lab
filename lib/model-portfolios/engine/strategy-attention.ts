import {
  classifyDividendInstrument,
  isDividendResearchCandidate,
} from "./dividend-universe";
import type { ModelPortfolioStrategyKey } from "./policy";
import {
  RESEARCH_BUDGET,
  assessRecoverySetup,
  classifyResearchMarketCap,
  rankResearchUniverse,
  type RankedResearchCandidate,
  type ResearchCandidate,
} from "./research";

export type AttentionEligibility = "new_entry" | "held_for_monitoring";

export type AttentionReasonTag =
  | "held_for_monitoring"
  | "new_entry_eligible"
  | "quality_stability_fit"
  | "mid_large_cap_preference"
  | "derisked_recovery_exception"
  | "garp_alignment"
  | "small_mid_preferred"
  | "catalyst_revision_fit"
  | "qualified_recovery_fit"
  | "exceptional_large_cap_setup"
  | "income_instrument"
  | "pref_d_priority"
  | "dividend_etf_allowed"
  | "ordinary_dividend"
  | "rejected_falling_knife"
  | "rejected_strong_downtrend"
  | "rejected_recovery_not_derisked"
  | "rejected_speculative_small_cap"
  | "rejected_high_volatility"
  | "rejected_weak_quality"
  | "rejected_weak_balance_sheet"
  | "rejected_missing_quality"
  | "rejected_missing_balance_sheet"
  | "rejected_momentum_only"
  | "rejected_insufficient_alignment"
  | "rejected_volatility_only"
  | "rejected_generic_large_cap"
  | "rejected_non_income"
  | "rejected_yield_trap_risk";

export type AttentionCandidate = RankedResearchCandidate & {
  attentionEligibility: AttentionEligibility;
  attentionReasons: readonly AttentionReasonTag[];
};

export type NewEntryAttentionDecision = {
  eligible: boolean;
  reasons: readonly AttentionReasonTag[];
};

export type HeldInstrumentRef = {
  symbol: string;
  exchange: string;
};

export type ModelPortfolioResearchAttentionPolicy = {
  strategyKey: ModelPortfolioStrategyKey;
  name: string;
  maxNewEntryCandidates: number;
  searchBias: string;
};

export type AttentionSelectionInput = {
  universe: readonly ResearchCandidate[];
  strategyKey: ModelPortfolioStrategyKey;
  heldInstruments: readonly HeldInstrumentRef[];
};

export type AttentionSelectionResult = {
  strategyKey: ModelPortfolioStrategyKey;
  policy: ModelPortfolioResearchAttentionPolicy;
  candidates: AttentionCandidate[];
  rejectedNewEntries: ReadonlyArray<{
    symbol: string;
    exchange: string;
    reasons: readonly AttentionReasonTag[];
  }>;
};

export const ATTENTION_BUDGET = {
  maxNewEntryCandidates: RESEARCH_BUDGET.maxShortlistSize,
  maxAttentionSet: RESEARCH_BUDGET.maxUniverseSize,
} as const;

export const MODEL_PORTFOLIO_ATTENTION_POLICIES: Record<
  ModelPortfolioStrategyKey,
  ModelPortfolioResearchAttentionPolicy
> = {
  conservative: {
    strategyKey: "conservative",
    name: "Försiktig",
    maxNewEntryCandidates: ATTENTION_BUDGET.maxNewEntryCandidates,
    searchBias: "quality_capital_preservation",
  },
  balanced: {
    strategyKey: "balanced",
    name: "Medelrisk",
    maxNewEntryCandidates: ATTENTION_BUDGET.maxNewEntryCandidates,
    searchBias: "garp_revisions_catalyst",
  },
  high_risk: {
    strategyKey: "high_risk",
    name: "Högrisk",
    maxNewEntryCandidates: ATTENTION_BUDGET.maxNewEntryCandidates,
    searchBias: "small_mid_catalyst_recovery",
  },
  dividend: {
    strategyKey: "dividend",
    name: "Utdelning",
    maxNewEntryCandidates: ATTENTION_BUDGET.maxNewEntryCandidates,
    searchBias: "income_cashflow_safety",
  },
};

function instrumentKey(symbol: string, exchange: string): string {
  return `${symbol.trim()}.${exchange.trim()}`.toUpperCase();
}

function knownUnitInterval(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value as number));
}

function knownNonNegative(value: number | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  return value as number;
}

function aligned(value: number | null, threshold = 0.55): boolean {
  return value !== null && value >= threshold;
}

function isDeriskedQualityRecovery(candidate: ResearchCandidate): boolean {
  const recovery = assessRecoverySetup(candidate);
  const quality = knownUnitInterval(candidate.qualityScore);
  const balanceSheet = knownUnitInterval(candidate.balanceSheetScore);
  return (
    recovery.state === "qualified" &&
    quality !== null &&
    quality >= 0.85 &&
    balanceSheet !== null &&
    balanceSheet >= 0.8 &&
    recovery.entryConfirmationScore >= 0.6
  );
}

function isExceptionalLargeCapSetup(candidate: ResearchCandidate): boolean {
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const revisions = knownUnitInterval(candidate.earningsRevisionScore);
  const breakout = knownUnitInterval(candidate.technicalAnalysis?.scores.breakout);
  const recovery = assessRecoverySetup(candidate);
  const catalystStrong = catalyst !== null && catalyst >= 0.78;
  const revisionStrong = revisions !== null && revisions >= 0.75;
  const breakoutStrong = breakout !== null && breakout >= 0.72;
  return catalystStrong && (revisionStrong || recovery.state === "qualified" || breakoutStrong);
}

function conservativeNewEntry(candidate: ResearchCandidate): NewEntryAttentionDecision {
  const reasons: AttentionReasonTag[] = [];
  const quality = knownUnitInterval(candidate.qualityScore);
  const balanceSheet = knownUnitInterval(candidate.balanceSheetScore);
  const volatility = knownNonNegative(candidate.volatility20d);
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const segment = classifyResearchMarketCap(candidate);
  const recovery = assessRecoverySetup(candidate);
  const regime = candidate.technicalAnalysis?.trend.regime;
  const rsi = candidate.technicalAnalysis?.momentum.rsi14;
  const highRsi = Number.isFinite(rsi) && (rsi as number) >= 70;

  if (recovery.state === "falling_knife") {
    return { eligible: false, reasons: ["rejected_falling_knife"] };
  }
  if (quality === null) {
    return { eligible: false, reasons: ["rejected_missing_quality"] };
  }
  if (balanceSheet === null) {
    return { eligible: false, reasons: ["rejected_missing_balance_sheet"] };
  }
  if (quality < 0.72) {
    return { eligible: false, reasons: ["rejected_weak_quality"] };
  }
  if (balanceSheet < 0.62) {
    return { eligible: false, reasons: ["rejected_weak_balance_sheet"] };
  }
  if (volatility !== null && volatility >= 0.4) {
    return { eligible: false, reasons: ["rejected_high_volatility"] };
  }
  if (segment === "small_cap" && (quality < 0.88 || balanceSheet < 0.85 || volatility === null || volatility > 0.22)) {
    return { eligible: false, reasons: ["rejected_speculative_small_cap"] };
  }
  if (
    (recovery.state === "watch" || recovery.state === "qualified") &&
    !isDeriskedQualityRecovery(candidate)
  ) {
    return { eligible: false, reasons: ["rejected_recovery_not_derisked"] };
  }
  if (regime === "strong_downtrend" && !isDeriskedQualityRecovery(candidate)) {
    return { eligible: false, reasons: ["rejected_strong_downtrend"] };
  }
  if ((aligned(catalyst, 0.75) || highRsi) && (quality < 0.8 || balanceSheet < 0.7)) {
    return { eligible: false, reasons: ["rejected_momentum_only"] };
  }

  reasons.push("new_entry_eligible", "quality_stability_fit");
  if (segment === "mid_cap" || segment === "large_cap") {
    reasons.push("mid_large_cap_preference");
  }
  if (isDeriskedQualityRecovery(candidate)) {
    reasons.push("derisked_recovery_exception");
  }
  return { eligible: true, reasons };
}

function balancedNewEntry(candidate: ResearchCandidate): NewEntryAttentionDecision {
  const quality = knownUnitInterval(candidate.qualityScore);
  const valuation = knownUnitInterval(candidate.valuationScore);
  const revisions = knownUnitInterval(candidate.earningsRevisionScore);
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const trend = knownUnitInterval(candidate.technicalAnalysis?.scores.trend);
  const volatility = knownNonNegative(candidate.volatility20d);
  const recovery = assessRecoverySetup(candidate);

  if (recovery.state === "falling_knife") {
    return { eligible: false, reasons: ["rejected_falling_knife"] };
  }

  const alignedCount = [quality, valuation, revisions, catalyst, trend].filter((value) =>
    aligned(value),
  ).length;
  if (alignedCount < 2) {
    return { eligible: false, reasons: ["rejected_insufficient_alignment"] };
  }
  if (
    volatility !== null &&
    volatility >= 0.5 &&
    (quality === null || quality < 0.45) &&
    !aligned(revisions) &&
    !aligned(catalyst)
  ) {
    return { eligible: false, reasons: ["rejected_volatility_only"] };
  }

  return { eligible: true, reasons: ["new_entry_eligible", "garp_alignment"] };
}

function highRiskNewEntry(candidate: ResearchCandidate): NewEntryAttentionDecision {
  const catalyst = knownUnitInterval(candidate.catalystScore);
  const revisions = knownUnitInterval(candidate.earningsRevisionScore);
  const breakout = knownUnitInterval(candidate.technicalAnalysis?.scores.breakout);
  const volume = knownUnitInterval(candidate.technicalAnalysis?.scores.volume);
  const volatility = knownNonNegative(candidate.volatility20d);
  const segment = classifyResearchMarketCap(candidate);
  const recovery = assessRecoverySetup(candidate);

  if (recovery.state === "falling_knife") {
    return { eligible: false, reasons: ["rejected_falling_knife"] };
  }

  const hasAsymmetricEvidence =
    aligned(catalyst, 0.58) ||
    aligned(revisions, 0.58) ||
    aligned(breakout, 0.6) ||
    (aligned(volume, 0.6) && aligned(breakout, 0.52)) ||
    recovery.state === "qualified";

  if (volatility !== null && volatility >= 0.4 && !hasAsymmetricEvidence) {
    return { eligible: false, reasons: ["rejected_volatility_only"] };
  }

  if (segment === "large_cap") {
    if (!isExceptionalLargeCapSetup(candidate)) {
      return { eligible: false, reasons: ["rejected_generic_large_cap"] };
    }
    return {
      eligible: true,
      reasons: ["new_entry_eligible", "exceptional_large_cap_setup", "catalyst_revision_fit"],
    };
  }

  if (!hasAsymmetricEvidence) {
    return { eligible: false, reasons: ["rejected_insufficient_alignment"] };
  }

  const reasons: AttentionReasonTag[] = ["new_entry_eligible", "catalyst_revision_fit"];
  if (segment === "small_cap" || segment === "mid_cap") {
    reasons.push("small_mid_preferred");
  }
  if (recovery.state === "qualified") {
    reasons.push("qualified_recovery_fit");
  }
  return { eligible: true, reasons };
}

function dividendNewEntry(candidate: ResearchCandidate): NewEntryAttentionDecision {
  if (!isDividendResearchCandidate(candidate)) {
    return { eligible: false, reasons: ["rejected_non_income"] };
  }

  const recovery = assessRecoverySetup(candidate);
  const quality = knownUnitInterval(candidate.qualityScore);
  const balanceSheet = knownUnitInterval(candidate.balanceSheetScore);
  const profile = classifyDividendInstrument(candidate);

  if (recovery.state === "falling_knife") {
    return { eligible: false, reasons: ["rejected_falling_knife"] };
  }
  if (
    recovery.drawdownFrom52WeekHigh !== null &&
    recovery.drawdownFrom52WeekHigh >= 0.25 &&
    ((balanceSheet !== null && balanceSheet < 0.45) || (quality !== null && quality < 0.4))
  ) {
    return { eligible: false, reasons: ["rejected_yield_trap_risk"] };
  }

  const reasons: AttentionReasonTag[] = ["new_entry_eligible", "income_instrument"];
  if (profile?.kind === "preferred_share" || profile?.kind === "d_share") {
    reasons.push("pref_d_priority");
  } else if (profile?.kind === "dividend_etf") {
    reasons.push("dividend_etf_allowed");
  } else {
    reasons.push("ordinary_dividend");
  }
  return { eligible: true, reasons };
}

export function evaluateNewEntryAttention(
  candidate: ResearchCandidate,
  strategyKey: ModelPortfolioStrategyKey,
): NewEntryAttentionDecision {
  if (strategyKey === "conservative") return conservativeNewEntry(candidate);
  if (strategyKey === "high_risk") return highRiskNewEntry(candidate);
  if (strategyKey === "dividend") return dividendNewEntry(candidate);
  return balancedNewEntry(candidate);
}

function toHeldStub(held: HeldInstrumentRef): ResearchCandidate {
  return {
    symbol: held.symbol.trim(),
    exchange: held.exchange.trim(),
  };
}

function compareInstrumentKey(a: ResearchCandidate, b: ResearchCandidate): number {
  return instrumentKey(a.symbol, a.exchange).localeCompare(instrumentKey(b.symbol, b.exchange));
}

function decorateAttentionCandidate(
  candidate: RankedResearchCandidate,
  eligibility: AttentionEligibility,
  reasons: readonly AttentionReasonTag[],
): AttentionCandidate {
  return {
    ...candidate,
    attentionEligibility: eligibility,
    attentionReasons: reasons,
  };
}

function rankHeldForMonitoring(
  holdings: readonly ResearchCandidate[],
  strategyKey: ModelPortfolioStrategyKey,
): RankedResearchCandidate[] {
  const ranked = rankResearchUniverse(holdings, strategyKey);
  const rankedKeys = new Set(ranked.map((item) => instrumentKey(item.symbol, item.exchange)));
  const dropped = holdings
    .filter((item) => !rankedKeys.has(instrumentKey(item.symbol, item.exchange)))
    .sort(compareInstrumentKey)
    .map((candidate) => {
      const recoverySetup = assessRecoverySetup(candidate);
      return {
        ...candidate,
        deterministicScore: 0,
        reasons: ["innehav under bevakning"] as const,
        marketCapSegment: classifyResearchMarketCap(candidate),
        recoverySetup,
      };
    });
  return [...ranked, ...dropped];
}

/**
 * Deterministic manager-attention layer. The shared fetched pool can stay
 * shared; each strategy receives a different bounded candidate set.
 *
 * Current holdings are always kept for HOLD/SELL/TRIM monitoring, even when
 * they no longer qualify as new entries.
 */
export function selectPortfolioAttentionCandidates(
  input: AttentionSelectionInput,
): AttentionSelectionResult {
  const policy = MODEL_PORTFOLIO_ATTENTION_POLICIES[input.strategyKey];
  const heldKeys = new Set(
    input.heldInstruments
      .filter((item) => item.symbol.trim() && item.exchange.trim())
      .map((item) => instrumentKey(item.symbol, item.exchange)),
  );
  const universeByKey = new Map<string, ResearchCandidate>();
  for (const candidate of input.universe) {
    const key = instrumentKey(candidate.symbol, candidate.exchange);
    if (!key.startsWith(".") && !universeByKey.has(key)) {
      universeByKey.set(key, candidate);
    }
  }

  const heldCandidates: ResearchCandidate[] = [];
  for (const held of [...input.heldInstruments].sort((a, b) =>
    instrumentKey(a.symbol, a.exchange).localeCompare(instrumentKey(b.symbol, b.exchange)),
  )) {
    if (!held.symbol.trim() || !held.exchange.trim()) continue;
    const key = instrumentKey(held.symbol, held.exchange);
    heldCandidates.push(universeByKey.get(key) ?? toHeldStub(held));
  }

  const rejectedNewEntries: Array<{
    symbol: string;
    exchange: string;
    reasons: readonly AttentionReasonTag[];
  }> = [];
  const eligibleNewEntries: ResearchCandidate[] = [];
  const newEntryReasons = new Map<string, readonly AttentionReasonTag[]>();

  for (const candidate of input.universe) {
    const key = instrumentKey(candidate.symbol, candidate.exchange);
    if (!candidate.symbol.trim() || !candidate.exchange.trim() || heldKeys.has(key)) continue;
    const decision = evaluateNewEntryAttention(candidate, input.strategyKey);
    if (!decision.eligible) {
      rejectedNewEntries.push({
        symbol: candidate.symbol,
        exchange: candidate.exchange,
        reasons: decision.reasons,
      });
      continue;
    }
    eligibleNewEntries.push(candidate);
    newEntryReasons.set(key, decision.reasons);
  }

  rejectedNewEntries.sort((left, right) =>
    instrumentKey(left.symbol, left.exchange).localeCompare(instrumentKey(right.symbol, right.exchange)),
  );

  const rankedNewEntries = rankResearchUniverse(eligibleNewEntries, input.strategyKey)
    .slice(0, policy.maxNewEntryCandidates);
  const heldRanked = rankHeldForMonitoring(heldCandidates, input.strategyKey);
  const includedKeys = new Set<string>();
  const candidates: AttentionCandidate[] = [];

  for (const candidate of heldRanked) {
    const key = instrumentKey(candidate.symbol, candidate.exchange);
    if (includedKeys.has(key)) continue;
    includedKeys.add(key);
    candidates.push(decorateAttentionCandidate(candidate, "held_for_monitoring", ["held_for_monitoring"]));
  }
  for (const candidate of rankedNewEntries) {
    const key = instrumentKey(candidate.symbol, candidate.exchange);
    if (includedKeys.has(key)) continue;
    includedKeys.add(key);
    candidates.push(
      decorateAttentionCandidate(
        candidate,
        "new_entry",
        newEntryReasons.get(key) ?? ["new_entry_eligible"],
      ),
    );
  }

  return {
    strategyKey: input.strategyKey,
    policy,
    candidates: candidates.slice(0, ATTENTION_BUDGET.maxAttentionSet),
    rejectedNewEntries,
  };
}

export function attentionCandidatesAsResearch(
  attention: AttentionSelectionResult,
): ResearchCandidate[] {
  return attention.candidates;
}
