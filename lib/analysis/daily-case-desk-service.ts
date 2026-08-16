import "server-only";

import {
  runDailyCaseDeskSelection,
  type DailyCaseDeskConfig,
  type DailyCaseDeskInputCandidate,
  type DailyCaseDeskResult,
} from "./daily-case-desk";
import { fetchYahooCompanyProfilePreflight } from "./yahoo-company-profile";

/**
 * Server entrypoint for the cheap Daily Case Desk funnel.
 * It stops before Deep Research, analyst AI, persistence and publication.
 */
export async function selectDailyCasesForDeepResearch(input: {
  candidates: readonly DailyCaseDeskInputCandidate[];
  config?: DailyCaseDeskConfig;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<DailyCaseDeskResult> {
  return runDailyCaseDeskSelection({
    candidates: input.candidates,
    config: input.config,
    preflightLoader: (yahooSymbol) =>
      fetchYahooCompanyProfilePreflight({
        yahooSymbol,
        fetchImpl: input.fetchImpl,
        now: input.now,
      }),
  });
}
