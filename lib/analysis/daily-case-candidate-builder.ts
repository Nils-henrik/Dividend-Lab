import type { ResearchCandidate } from "@/lib/model-portfolios/engine/research";
import type { CompanyProfilePreflight } from "./company-profile-preflight";
import type {
  DailyCaseSelectionCandidate,
  DailyCaseSelectionSignal,
} from "./daily-case-selection";
import {
  abnormalVolumeCaseInterest,
  clampCaseSignal,
  caseScoreExtremityFromNeutral,
  finiteNumber,
  fundamentalCaseOpportunity,
  normalizedCaseScore,
  priceMoveCaseInterest,
  technicalCaseInterest,
} from "./daily-case-signal-derivation";

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

function signal(
  value: number | null,
  source: DailyCaseSignalSourceRef | null | undefined,
): DailyCaseSelectionSignal | undefined {
  if (value === null || !source) return undefined;
  return {
    value: clampCaseSignal(value),
    sourceIds: [source.id],
    asOf: source.asOf,
  };
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

  if (finiteNumber(input.candidate.marketCapSek) && input.candidate.marketCapSek > 0) known += 1;
  if (
    finiteNumber(input.candidate.avgDailyTurnoverSek) &&
    input.candidate.avgDailyTurnoverSek > 0
  ) {
    known += 1;
  }
  if (input.sources.fundamentals && normalizedCaseScore(input.candidate.qualityScore) !== null) {
    known += 1;
    usedSources.push(input.sources.fundamentals);
  }
  if (input.sources.fundamentals && normalizedCaseScore(input.candidate.valuationScore) !== null) {
    known += 1;
    usedSources.push(input.sources.fundamentals);
  }
  if (
    input.sources.revisions &&
    normalizedCaseScore(input.candidate.earningsRevisionScore) !== null
  ) {
    known += 1;
    usedSources.push(input.sources.revisions);
  }
  if (input.sources.catalyst && normalizedCaseScore(input.candidate.catalystScore) !== null) {
    known += 1;
    usedSources.push(input.sources.catalyst);
  }
  if (
    input.sources.fundamentals &&
    normalizedCaseScore(input.candidate.balanceSheetScore) !== null
  ) {
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
  const knownSourceIds = new Set<string>([input.preflight.source.id]);
  for (const source of Object.values(input.sources)) {
    if (source) knownSourceIds.add(source.id);
  }

  const valuationDislocation = signal(
    caseScoreExtremityFromNeutral(input.candidate.valuationScore),
    fundamentals,
  );
  const estimateRevisions = signal(
    caseScoreExtremityFromNeutral(input.candidate.earningsRevisionScore),
    input.sources.revisions,
  );
  const catalyst = signal(
    normalizedCaseScore(input.candidate.catalystScore),
    input.sources.catalyst,
  );
  const technicalSetup = signal(technicalCaseInterest(input.candidate.technicalAnalysis), market);
  const abnormalVolume = signal(
    abnormalVolumeCaseInterest(input.candidate.technicalAnalysis),
    market,
  );
  const priceMove = signal(priceMoveCaseInterest(input.dayChangePct), market);
  const fundamental = signal(fundamentalCaseOpportunity(input.candidate), fundamentals);
  const readerInterest = signal(
    normalizedCaseScore(input.readerInterestScore),
    input.sources.analytics,
  );
  const freshReport = input.sources.report ? signal(1, input.sources.report) : undefined;

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
