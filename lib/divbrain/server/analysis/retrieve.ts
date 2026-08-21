import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { loadLatestApprovedDivLabAnalysisForDivBrain } from "./repository";
import { buildDivBrainSourcesFromApprovedAnalysis } from "./to-source";
import {
  DIVBRAIN_DIVLAB_ANALYSIS_CONTEXT_VERSION,
  type DivBrainDivLabAnalysisRetrievalResult,
} from "./types";

/**
 * Exact-instrument retrieval bridge. Instrument/entity resolution belongs to the
 * surrounding DivBrain routing layer; this function never guesses a ticker.
 */
export async function retrieveLatestDivLabAnalysisSources(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  now?: Date;
}): Promise<DivBrainResult<DivBrainDivLabAnalysisRetrievalResult>> {
  try {
    const record = await loadLatestApprovedDivLabAnalysisForDivBrain({
      supabase: input.supabase,
      symbol: input.symbol,
      exchange: input.exchange,
    });
    if (!record) {
      return divBrainSuccess({
        version: DIVBRAIN_DIVLAB_ANALYSIS_CONTEXT_VERSION,
        record: null,
        sources: [],
      });
    }

    const sourceResult = buildDivBrainSourcesFromApprovedAnalysis({
      record,
      now: input.now,
    });
    if (!sourceResult.ok) return sourceResult;

    return divBrainSuccess({
      version: DIVBRAIN_DIVLAB_ANALYSIS_CONTEXT_VERSION,
      record,
      sources: sourceResult.data,
    });
  } catch {
    return divBrainFailureFromCode("internal_error");
  }
}
