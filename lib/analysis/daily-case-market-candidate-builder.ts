import type { ResearchCandidate } from "@/lib/model-portfolios/engine/research";
import type { DailyCaseSignalSourceRef } from "./daily-case-candidate-builder";
import type {
  DailyCaseMarketShortlistCandidate,
  DailyCaseMarketSignal,
} from "./daily-case-market-shortlist";
import {
  abnormalVolumeCaseInterest,
  clampCaseSignal,
  caseScoreExtremityFromNeutral,
  normalizedCaseScore,
  priceMoveCaseInterest,
  technicalCaseInterest,
} from "./daily-case-signal-derivation";

export type DailyCaseMarketSourceRefs = {
  market: DailyCaseSignalSourceRef;
  revisions?: DailyCaseSignalSourceRef | null;
  catalyst?: DailyCaseSignalSourceRef | null;
  report?: DailyCaseSignalSourceRef | null;
};

function signal(
  value: number | null,
  source: DailyCaseSignalSourceRef | null | undefined,
): DailyCaseMarketSignal | undefined {
  if (value === null || !source) return undefined;
  return {
    value: clampCaseSignal(value),
    sourceIds: [source.id],
    asOf: source.asOf,
  };
}

/**
 * Builds only cheap market/event signals for the 300 -> 20 preflight shortlist.
 * Fundamental quality, valuation attractiveness and portfolio ranking are excluded.
 */
export function buildDailyCaseMarketShortlistCandidate(input: {
  candidate: ResearchCandidate;
  yahooSymbol: string;
  name?: string | null;
  sources: DailyCaseMarketSourceRefs;
  dayChangePct?: number;
}): DailyCaseMarketShortlistCandidate {
  const yahooSymbol = input.yahooSymbol.trim().toUpperCase();
  if (!yahooSymbol) throw new Error("daily_case_market_yahoo_symbol_required");

  const knownSourceIds = new Set<string>();
  for (const source of Object.values(input.sources)) {
    if (source) knownSourceIds.add(source.id);
  }

  const freshReport = input.sources.report ? signal(1, input.sources.report) : undefined;
  const catalyst = signal(
    normalizedCaseScore(input.candidate.catalystScore),
    input.sources.catalyst,
  );
  const estimateRevisions = signal(
    caseScoreExtremityFromNeutral(input.candidate.earningsRevisionScore),
    input.sources.revisions,
  );
  const technicalSetup = signal(
    technicalCaseInterest(input.candidate.technicalAnalysis),
    input.sources.market,
  );
  const abnormalVolume = signal(
    abnormalVolumeCaseInterest(input.candidate.technicalAnalysis),
    input.sources.market,
  );
  const priceMove = signal(priceMoveCaseInterest(input.dayChangePct), input.sources.market);

  return {
    symbol: input.candidate.symbol,
    exchange: input.candidate.exchange,
    yahooSymbol,
    name: input.name ?? null,
    knownSourceIds: [...knownSourceIds].sort(),
    signals: {
      ...(freshReport ? { freshReport } : {}),
      ...(catalyst ? { catalyst } : {}),
      ...(estimateRevisions ? { estimateRevisions } : {}),
      ...(technicalSetup ? { technicalSetup } : {}),
      ...(abnormalVolume ? { abnormalVolume } : {}),
      ...(priceMove ? { priceMove } : {}),
    },
  };
}
