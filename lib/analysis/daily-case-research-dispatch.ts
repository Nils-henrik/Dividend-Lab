import type { DailyCaseRunAudit } from "./daily-case-audit";
import type { DailyCaseSelectionCandidate, RankedDailyCase } from "./daily-case-selection";

export const DIVLAB_DAILY_CASE_RESEARCH_DISPATCH_VERSION =
  "daily-case-research-dispatch-v1" as const;

export const DAILY_CASE_RESEARCH_DISPATCH_BUDGET = {
  maxJobs: 4,
  defaultConcurrency: 1,
  maxConcurrency: 2,
} as const;

export type DailyCaseDeepResearchJob = {
  ordinal: number;
  jobKey: string;
  selectionDate: string;
  runKey: string;
  asOf: string;
  symbol: string;
  exchange: string;
  name: string | null;
  selectionScore: number;
  primaryDriver: RankedDailyCase["primaryDriver"];
  sourceIds: string[];
};

export type DailyCaseDeepResearchDispatchPlan = {
  version: typeof DIVLAB_DAILY_CASE_RESEARCH_DISPATCH_VERSION;
  selectionDate: string;
  runKey: string;
  asOf: string;
  jobs: DailyCaseDeepResearchJob[];
  stats: {
    selected: number;
    jobs: number;
  };
};

function identity(symbol: string, exchange: string): string {
  return `${symbol.trim().toUpperCase()}@${exchange.trim().toUpperCase()}`;
}

function indexFinalCandidates(
  candidates: readonly DailyCaseSelectionCandidate[],
): Map<string, DailyCaseSelectionCandidate> {
  const map = new Map<string, DailyCaseSelectionCandidate>();
  for (const candidate of candidates) {
    const key = identity(candidate.symbol, candidate.exchange);
    if (map.has(key)) throw new Error(`daily_case_dispatch_duplicate_final_candidate:${key}`);
    map.set(key, candidate);
  }
  return map;
}

function selectedSourceIds(selected: RankedDailyCase): string[] {
  return [
    ...new Set(
      selected.contributingSignals.flatMap((signal) => signal.sourceIds),
    ),
  ].sort();
}

/**
 * Creates the immutable boundary between cheap case selection and expensive
 * Deep Research. This function never performs network I/O, AI calls or persistence.
 */
export function buildDailyCaseDeepResearchDispatchPlan(
  audit: DailyCaseRunAudit,
): DailyCaseDeepResearchDispatchPlan {
  const selected = audit.funnel.desk.selection.selected;
  if (selected.length !== audit.stats.selectedForDeepResearch) {
    throw new Error("daily_case_dispatch_selected_count_mismatch");
  }
  if (selected.length > DAILY_CASE_RESEARCH_DISPATCH_BUDGET.maxJobs) {
    throw new Error("daily_case_dispatch_budget_exceeded");
  }

  const finalCandidateIndex = indexFinalCandidates(
    audit.funnel.desk.selectionCandidateAudit,
  );
  const seenSelected = new Set<string>();
  const jobs = selected.map((caseItem, index) => {
    const key = identity(caseItem.symbol, caseItem.exchange);
    if (seenSelected.has(key)) {
      throw new Error(`daily_case_dispatch_duplicate_selected_identity:${key}`);
    }
    seenSelected.add(key);

    const finalCandidate = finalCandidateIndex.get(key);
    if (!finalCandidate) {
      throw new Error(`daily_case_dispatch_final_candidate_missing:${key}`);
    }
    if (finalCandidate.methodologyStatus !== "supported") {
      throw new Error(`daily_case_dispatch_methodology_not_supported:${key}`);
    }

    const sourceIds = selectedSourceIds(caseItem);
    if (sourceIds.length === 0) {
      throw new Error(`daily_case_dispatch_sources_missing:${key}`);
    }
    const candidateSourceIds = new Set(finalCandidate.knownSourceIds);
    for (const sourceId of sourceIds) {
      if (!candidateSourceIds.has(sourceId)) {
        throw new Error(`daily_case_dispatch_source_not_in_final_candidate:${key}:${sourceId}`);
      }
    }

    const ordinal = index + 1;
    return {
      ordinal,
      jobKey: `${audit.runKey}:${ordinal}:${key}`,
      selectionDate: audit.selectionDate,
      runKey: audit.runKey,
      asOf: audit.asOf,
      symbol: caseItem.symbol,
      exchange: caseItem.exchange,
      name: caseItem.name,
      selectionScore: caseItem.score,
      primaryDriver: caseItem.primaryDriver,
      sourceIds,
    } satisfies DailyCaseDeepResearchJob;
  });

  return {
    version: DIVLAB_DAILY_CASE_RESEARCH_DISPATCH_VERSION,
    selectionDate: audit.selectionDate,
    runKey: audit.runKey,
    asOf: audit.asOf,
    jobs,
    stats: {
      selected: selected.length,
      jobs: jobs.length,
    },
  };
}

export function resolveDailyCaseResearchConcurrency(value?: number): number {
  const concurrency = value ?? DAILY_CASE_RESEARCH_DISPATCH_BUDGET.defaultConcurrency;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > DAILY_CASE_RESEARCH_DISPATCH_BUDGET.maxConcurrency
  ) {
    throw new Error("daily_case_dispatch_concurrency_invalid");
  }
  return concurrency;
}
