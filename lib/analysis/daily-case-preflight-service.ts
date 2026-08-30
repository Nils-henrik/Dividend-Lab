import "server-only";

import {
  runDailyCaseMethodologyPreflight,
  type DailyCasePreflightRequest,
  type DailyCasePreflightResult,
} from "./daily-case-preflight";
import { fetchYahooCompanyProfilePreflight } from "./yahoo-company-profile";

export async function preflightDailyCaseMethodologies(input: {
  requests: readonly DailyCasePreflightRequest[];
  maxConcurrency?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<DailyCasePreflightResult[]> {
  return runDailyCaseMethodologyPreflight({
    requests: input.requests,
    maxConcurrency: input.maxConcurrency,
    loader: (yahooSymbol) =>
      fetchYahooCompanyProfilePreflight({
        yahooSymbol,
        fetchImpl: input.fetchImpl,
        now: input.now,
      }),
  });
}
