import type { ResearchCandidate } from "@/lib/model-portfolios/engine/research";
import type { TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";

export function finiteNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clampCaseSignal(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normalizedCaseScore(value: number | undefined): number | null {
  return finiteNumber(value) ? clampCaseSignal(value) : null;
}

export function caseScoreExtremityFromNeutral(value: number | undefined): number | null {
  const normalized = normalizedCaseScore(value);
  return normalized === null ? null : clampCaseSignal(Math.abs(normalized - 0.5) * 2);
}

export function technicalCaseInterest(
  snapshot: TechnicalAnalysisSnapshot | undefined,
): number | null {
  if (!snapshot || snapshot.sessions < 120) return null;
  return Math.max(
    caseScoreExtremityFromNeutral(snapshot.scores.trend) ?? 0,
    caseScoreExtremityFromNeutral(snapshot.scores.momentum) ?? 0,
    caseScoreExtremityFromNeutral(snapshot.scores.breakout) ?? 0,
    caseScoreExtremityFromNeutral(snapshot.scores.meanReversion) ?? 0,
  );
}

export function abnormalVolumeCaseInterest(
  snapshot: TechnicalAnalysisSnapshot | undefined,
): number | null {
  const ratio = snapshot?.volume.volumeRatio20;
  if (!finiteNumber(ratio) || ratio < 0) return null;
  return clampCaseSignal((ratio - 1) / 2);
}

export function priceMoveCaseInterest(dayChangePct: number | undefined): number | null {
  if (!finiteNumber(dayChangePct)) return null;
  return clampCaseSignal((Math.abs(dayChangePct) - 1) / 7);
}

export function fundamentalCaseOpportunity(candidate: ResearchCandidate): number | null {
  const quality = normalizedCaseScore(candidate.qualityScore);
  const balance = normalizedCaseScore(candidate.balanceSheetScore);
  if (quality === null && balance === null) return null;
  // Missing components contribute zero rather than being renormalized away.
  return (quality ?? 0) * 0.6 + (balance ?? 0) * 0.4;
}
