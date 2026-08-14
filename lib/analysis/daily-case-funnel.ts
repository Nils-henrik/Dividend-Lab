import type { CompanyProfilePreflightLoader } from "./daily-case-preflight";
import {
  runDailyCaseDeskSelection,
  type DailyCaseDeskConfig,
  type DailyCaseDeskInputCandidate,
  type DailyCaseDeskResult,
} from "./daily-case-desk";
import { buildDailyCaseMarketShortlistCandidate } from "./daily-case-market-candidate-builder";
import {
  shortlistDailyCasePreflights,
  type DailyCaseMarketShortlistConfig,
  type DailyCaseMarketShortlistResult,
} from "./daily-case-market-shortlist";

export const DIVLAB_DAILY_CASE_FUNNEL_VERSION = "daily-case-funnel-v1" as const;

export type DailyCaseFunnelResult = {
  version: typeof DIVLAB_DAILY_CASE_FUNNEL_VERSION;
  marketShortlist: DailyCaseMarketShortlistResult;
  desk: DailyCaseDeskResult;
  stats: {
    universe: number;
    selectedForMethodologyPreflight: number;
    methodologyPreflightReady: number;
    selectedForDeepResearch: number;
  };
};

export type DailyCaseFunnelConfig = {
  marketShortlist?: DailyCaseMarketShortlistConfig;
  desk?: DailyCaseDeskConfig;
};

function identity(candidate: DailyCaseDeskInputCandidate): string {
  return `${candidate.candidate.symbol.trim().toUpperCase()}@${candidate.candidate.exchange.trim().toUpperCase()}`;
}

/**
 * Complete zero-AI Daily Case selection funnel:
 * 300 cheap observations -> max 20 methodology preflights -> max 4 Deep Research candidates.
 * It never starts Deep Research, analyst AI, persistence or publication.
 */
export async function runDailyCaseSelectionFunnel(input: {
  candidates: readonly DailyCaseDeskInputCandidate[];
  preflightLoader: CompanyProfilePreflightLoader;
  config?: DailyCaseFunnelConfig;
}): Promise<DailyCaseFunnelResult> {
  const inputByIdentity = new Map<string, DailyCaseDeskInputCandidate>();
  const marketCandidates = input.candidates.map((candidate) => {
    const key = identity(candidate);
    if (inputByIdentity.has(key)) {
      throw new Error(`daily_case_funnel_duplicate_identity:${key}`);
    }
    inputByIdentity.set(key, candidate);
    return buildDailyCaseMarketShortlistCandidate({
      candidate: candidate.candidate,
      yahooSymbol: candidate.yahooSymbol,
      name: candidate.name,
      sources: {
        market: candidate.sources.market,
        revisions: candidate.sources.revisions,
        catalyst: candidate.sources.catalyst,
        report: candidate.sources.report,
      },
      dayChangePct: candidate.dayChangePct,
    });
  });

  const marketShortlist = shortlistDailyCasePreflights(
    marketCandidates,
    input.config?.marketShortlist,
  );
  const deskInputs = marketShortlist.selected.map((selected) => {
    const key = `${selected.symbol}@${selected.exchange}`;
    const original = inputByIdentity.get(key);
    if (!original) throw new Error(`daily_case_funnel_internal_identity_missing:${key}`);
    return original;
  });

  const desk = await runDailyCaseDeskSelection({
    candidates: deskInputs,
    preflightLoader: input.preflightLoader,
    config: input.config?.desk,
  });

  return {
    version: DIVLAB_DAILY_CASE_FUNNEL_VERSION,
    marketShortlist,
    desk,
    stats: {
      universe: input.candidates.length,
      selectedForMethodologyPreflight: marketShortlist.selected.length,
      methodologyPreflightReady: desk.stats.preflightReady,
      selectedForDeepResearch: desk.stats.selectedForDeepResearch,
    },
  };
}
