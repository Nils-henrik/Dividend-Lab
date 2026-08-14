import type { ResearchCandidate } from "@/lib/model-portfolios/engine/research";
import type { TechnicalAnalysisSnapshot } from "@/lib/model-portfolios/engine/technical-analysis";
import type { CompanyProfilePreflight } from "./company-profile-preflight";
import type {
  DailyCaseSelectionCandidate,
  DailyCaseSelectionSignal,
} from "./daily-case-selection";

export type DailyCaseSignalSourceRef = {
  id: string;
  asOf: string;
};

export type DailyCaseCandidateSourceRefs = {
  market: DailyCaseSignalSourceRef;
  fundamentals?: DailyCaseSignalSourceRef | null;
  revisions?: DailyCaseSignalSourceRef | null;
  catalyst?: DailyCaseSignalSourceRef | null;
  report?: DailyCaseSignalSourceRef | null;
  analytics?: DailyCaseSignalSourceRef | null;
};

function finite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizedScore(value: number | undefined): number | null {
  return finite(value) ? clamp01(value) : null;
}

function extremityFromNeutral(value: number | undefined): number | null {
  const normalized = normalizedScore(value);
  return normalized === null ? null : clamp01(Math.abs(normalized - 0.5) * 2);
}

function signal(
  value: number | null,
  source: DailyCaseSignalSourceRef | null | undefined,
): DailyCaseSelectionSignal | undefined {
  if (value === null || !source) return undefined;
  return {
    value: clamp01(value),
    sourceIds: [source.id],
    asOf: source.asOf,
  };
}

function technicalInterest(snapshot: TechnicalAnalysisSnapshot | undefined): number | null {
  if (!snapshot || snapshot.sessions < 120) return null;
  return Math.max(
    extremityFromNeutral(snapshot.scores.trend) ?? 0,
    extremityFromNeutral(snapshot.scores.momentum) ?? 0,
    extremityFromNeutral(snapshot.scores.breakout) ?? 0,
    extremityFromNeutral(snapshot.scores.meanReversion) ?? 0,
  );
}

function abnormalVolumeInterest(snapshot: TechnicalAnalysisSnapshot | undefined): number | null {
  const ratio = snapshot?.volume.volumeRatio20;
  if (!finite(ratio) || ratio < 0) return null;
  return clamp01((ratio - 1) / 2);
}

function priceMoveInterest(dayChangePct: number | undefined): number | null {
  if (!finite(dayChangePct)) return null;
  return clamp01((Math.abs(dayChangePct) - 1) / 7);
}

function fundamentalOpportunity(candidate: ResearchCandidate): number | null {
  const quality = normalizedScore(candidate.qualityScore);
  const balance = normalizedScore(candidate.balanceSheetScore);
  if (quality === null && balance === null) return null;
  // Missing components contribute zero rather than being renormalized away.
  return (quality ?? 0) * 0.6 + (balance ?? 0) * 0.4;
}

function oldestAsOf(sources: readonly DailyCaseSignalSourceRef[]): string {
  const sorted = sources
    .map((source) => new Date(source.asOf))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (!sorted[0]) throw new Error("daily_case_candidate_source_time_invalid");
  return sorted[0].toISOString();
}

function readiness(input: {
  candidate: ResearchCandidate;
  preflight: CompanyProfilePreflight;
  sources: DailyCaseCandidateSourceRefs;
}): DailyCaseSelectionSignal {
  const usedSources: DailyCaseSignalSourceRef[] = [
    input.sources.market,
    { id: input.preflight.source.id, asOf: input.preflight.source.verifiedAt },
  ];
  let known = 0;
  const total = 8;

  if (finite(input.candidate.marketCapSek) && input.candidate.marketCapSek > 0) known += 1;
  if (finite(input.candidate.avgDailyTurnoverSek) && input.candidate.avgDailyTurnoverSek > 0) known += 1;
  if (input.sources.fundamentals && normalizedScore(input.candidate.qualityScore) !== null) {
    known += 1;
    usedSources.push(input.sources.fundamentals);
  }
  if (input.sources.fundamentals && normalizedScore(input.candidate.valuationScore) !== null) {
    known += 1;
    usedSources.push(input.sources.fundamentals);
  }
  if (input.sources.revisions && normalizedScore(input.candidate.earningsRevisionScore) !== null) {
    known += 1;
    usedSources.push(input.sources.revisions);
  }
  if (input.sources.catalyst && normalizedScore(input.candidate.catalystScore) !== null) {
    known += 1;
    usedSources.push(input.sources.catalyst);
  }
  if (input.sources.fundamentals && normalizedScore(input.candidate.balanceSheetScore) !== null) {
    known += 1;
    usedSources.push(input.sources.fundamentals);
  }
  if (input.candidate.technicalAnalysis && input.candidate.technicalAnalysis.sessions >= 120) {
    known += 1;
  }

  const uniqueSources = new Map<string, DailyCaseSignalSourceRef>();
  for (const source of usedSources) uniqueSources.set(source.id, source);
  const sourceRefs = [...uniqueSources.values()];
  return {
    value: known / total,
    sourceIds: sourceRefs.map((source) => source.id).sort(),
    // Readiness is only as fresh as its oldest supporting observation.
    asOf: oldestAsOf(sourceRefs),
  };
}

/**
 * Converts existing market/research observations into editorial case-selection
 * signals. It intentionally does not reuse a portfolio manager's ranking or trade
 * decision and it does not invent provenance for missing upstream sources.
 */
export function buildDailyCaseSelectionCandidate(input: {
  candidate: ResearchCandidate;
  name?: string | null;
  preflight: CompanyProfilePreflight;
  sources: DailyCaseCandidateSourceRefs;
  dayChangePct?: number;
  readerInterestScore?: number;
}): DailyCaseSelectionCandidate {
  const market = input.sources.market;
  const fundamentals = input.sources.fundamentals;
  const technical = input.candidate.technicalAnalysis;
  const knownSourceIds = new Set<string>([input.preflight.source.id]);
  for (const source of Object.values(input.sources)) {
    if (source) knownSourceIds.add(source.id);
  }

  const valuationDislocation = signal(
    extremityFromNeutral(input.candidate.valuationScore),
    fundamentals,
  );
  const estimateRevisions = signal(
    extremityFromNeutral(input.candidate.earningsRevisionScore),
    input.sources.revisions,
  );
  const catalyst = signal(normalizedScore(input.candidate.catalystScore), input.sources.catalyst);
  const technicalSetup = signal(technicalInterest(technical), market);
  const abnormalVolume = signal(abnormalVolumeInterest(technical), market);
  const priceMove = signal(priceMoveInterest(input.dayChangePct), market);
  const fundamental = signal(fundamentalOpportunity(input.candidate), fundamentals);
  const readerInterest = signal(normalizedScore(input.readerInterestScore), input.sources.analytics);
  const freshReport = input.sources.report
    ? signal(1, input.sources.report)
    : undefined;

  return {
    symbol: input.candidate.symbol,
    exchange: input.candidate.exchange,
    name: input.name ?? null,
    methodologyStatus: input.preflight.methodology.status,
    knownSourceIds: [...knownSourceIds].sort(),
    signals: {
      ...(freshReport ? { freshReport } : {}),
      ...(catalyst ? { catalyst } : {}),
      ...(valuationDislocation ? { valuationDislocation } : {}),
      ...(estimateRevisions ? { estimateRevisions } : {}),
      ...(technicalSetup ? { technicalSetup } : {}),
      ...(abnormalVolume ? { abnormalVolume } : {}),
      ...(priceMove ? { priceMove } : {}),
      ...(fundamental ? { fundamentalOpportunity: fundamental } : {}),
      ...(readerInterest ? { readerInterest } : {}),
      dataReadiness: readiness({
        candidate: input.candidate,
        preflight: input.preflight,
        sources: input.sources,
      }),
    },
  };
}
