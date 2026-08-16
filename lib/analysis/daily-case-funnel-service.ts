import "server-only";

import {
  runDailyCaseSelectionFunnel,
  type DailyCaseFunnelConfig,
  type DailyCaseFunnelResult,
} from "./daily-case-funnel";
import type { DailyCaseDeskInputCandidate } from "./daily-case-desk";
import { fetchYahooCompanyProfilePreflight } from "./yahoo-company-profile";

/**
 * Server entrypoint for the complete zero-AI Daily Case selection funnel.
 * It ends with explicit Deep Research candidates but never starts Deep Research itself.
 */
export async function selectDailyDeepResearchCandidates(input: {
  candidates: readonly DailyCaseDeskInputCandidate[];
  config?: DailyCaseFunnelConfig;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<DailyCaseFunnelResult> {
  return runDailyCaseSelectionFunnel({
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
