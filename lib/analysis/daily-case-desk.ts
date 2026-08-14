import type { ResearchCandidate } from "@/lib/model-portfolios/engine/research";
import type { CompanyProfilePreflight } from "./company-profile-preflight";
import {
  buildDailyCaseSelectionCandidate,
  type DailyCaseCandidateSourceRefs,
} from "./daily-case-candidate-builder";
import {
  runDailyCaseMethodologyPreflight,
  type CompanyProfilePreflightLoader,
} from "./daily-case-preflight";
import {
  selectDailyAnalysisCases,
  type DailyCaseSelectionCandidate,
  type DailyCaseSelectionConfig,
  type DailyCaseSelectionResult,
} from "./daily-case-selection";

export const DIVLAB_DAILY_CASE_DESK_VERSION = "daily-case-desk-v1" as const;

export type DailyCaseDeskInputCandidate = {
  candidate: ResearchCandidate;
  yahooSymbol: string;
  name?: string | null;
  sources: DailyCaseCandidateSourceRefs;
  dayChangePct?: number;
  readerInterestScore?: number;
};

export type DailyCaseDeskMissingPreflight = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
  reason: "company_profile_preflight_missing";
};

export type DailyCaseDeskPreflightAudit = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
  status: "ready" | "missing";
  preflight: CompanyProfilePreflight | null;
};

export type DailyCaseDeskResult = {
  version: typeof DIVLAB_DAILY_CASE_DESK_VERSION;
  selection: DailyCaseSelectionResult;
  missingPreflights: DailyCaseDeskMissingPreflight[];
  /** Exact methodology-preflight outputs used by this run. */
  preflightAudit: DailyCaseDeskPreflightAudit[];
  /** Exact source-backed candidates passed into the deterministic 20 -> 4 selector. */
  selectionCandidateAudit: DailyCaseSelectionCandidate[];
  stats: {
    shortlisted: number;
    preflightReady: number;
    preflightMissing: number;
    selectedForDeepResearch: number;
  };
};

export type DailyCaseDeskConfig = {
  preflightConcurrency?: number;
  selection?: DailyCaseSelectionConfig;
};

function canonicalIdentity(candidate: Pick<ResearchCandidate, "symbol" | "exchange">): string {
  return `${candidate.symbol.trim().toUpperCase()}@${candidate.exchange.trim().toUpperCase()}`;
}

function normalizeYahooSymbol(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new Error("daily_case_desk_yahoo_symbol_required");
  return normalized;
}

function buildInputIndex(inputs: readonly DailyCaseDeskInputCandidate[]) {
  const index = new Map<string, DailyCaseDeskInputCandidate & { yahooSymbol: string }>();
  for (const input of inputs) {
    const key = canonicalIdentity(input.candidate);
    if (index.has(key)) throw new Error(`daily_case_desk_duplicate_identity:${key}`);
    index.set(key, { ...input, yahooSymbol: normalizeYahooSymbol(input.yahooSymbol) });
  }
  return index;
}

function assertPreflightIdentity(
  expectedYahooSymbol: string,
  preflight: CompanyProfilePreflight,
): void {
  if (preflight.yahooSymbol.trim().toUpperCase() !== expectedYahooSymbol) {
    throw new Error(
      `daily_case_desk_preflight_identity_mismatch:${expectedYahooSymbol}:${preflight.yahooSymbol.trim().toUpperCase()}`,
    );
  }
}

/**
 * Executes only the cheap selection funnel. It intentionally stops before
 * Deep Research, analyst AI, persistence or publication.
 */
export async function runDailyCaseDeskSelection(input: {
  candidates: readonly DailyCaseDeskInputCandidate[];
  preflightLoader: CompanyProfilePreflightLoader;
  config?: DailyCaseDeskConfig;
}): Promise<DailyCaseDeskResult> {
  const inputIndex = buildInputIndex(input.candidates);
  const preflightResults = await runDailyCaseMethodologyPreflight({
    requests: [...inputIndex.values()].map((item) => ({
      symbol: item.candidate.symbol,
      exchange: item.candidate.exchange,
      yahooSymbol: item.yahooSymbol,
    })),
    loader: input.preflightLoader,
    maxConcurrency: input.config?.preflightConcurrency,
  });

  const selectionCandidates: DailyCaseSelectionCandidate[] = [];
  const missingPreflights: DailyCaseDeskMissingPreflight[] = [];
  const preflightAudit: DailyCaseDeskPreflightAudit[] = [];

  for (const result of preflightResults) {
    const key = `${result.symbol}@${result.exchange}`;
    const sourceInput = inputIndex.get(key);
    if (!sourceInput) throw new Error(`daily_case_desk_internal_identity_missing:${key}`);

    preflightAudit.push({
      symbol: result.symbol,
      exchange: result.exchange,
      yahooSymbol: result.yahooSymbol,
      status: result.status,
      preflight: result.preflight,
    });

    if (!result.preflight) {
      missingPreflights.push({
        symbol: result.symbol,
        exchange: result.exchange,
        yahooSymbol: result.yahooSymbol,
        reason: "company_profile_preflight_missing",
      });
      continue;
    }
    assertPreflightIdentity(sourceInput.yahooSymbol, result.preflight);
    selectionCandidates.push(
      buildDailyCaseSelectionCandidate({
        candidate: sourceInput.candidate,
        name: sourceInput.name,
        preflight: result.preflight,
        sources: sourceInput.sources,
        dayChangePct: sourceInput.dayChangePct,
        readerInterestScore: sourceInput.readerInterestScore,
      }),
    );
  }

  const selection = selectDailyAnalysisCases(selectionCandidates, input.config?.selection);
  missingPreflights.sort(
    (a, b) => a.symbol.localeCompare(b.symbol) || a.exchange.localeCompare(b.exchange),
  );

  return {
    version: DIVLAB_DAILY_CASE_DESK_VERSION,
    selection,
    missingPreflights,
    preflightAudit,
    selectionCandidateAudit: selectionCandidates,
    stats: {
      shortlisted: input.candidates.length,
      preflightReady: selectionCandidates.length,
      preflightMissing: missingPreflights.length,
      selectedForDeepResearch: selection.selected.length,
    },
  };
}
