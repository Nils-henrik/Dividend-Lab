import type { CompanyProfilePreflight } from "./company-profile-preflight";

export const DAILY_CASE_PREFLIGHT_BUDGET = {
  maxCandidates: 20,
  defaultConcurrency: 3,
  maxConcurrency: 5,
} as const;

export type DailyCasePreflightRequest = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
};

export type DailyCasePreflightResult = {
  symbol: string;
  exchange: string;
  yahooSymbol: string;
  status: "ready" | "missing";
  preflight: CompanyProfilePreflight | null;
};

export type CompanyProfilePreflightLoader = (
  yahooSymbol: string,
) => Promise<CompanyProfilePreflight | null>;

function normalizeRequest(request: DailyCasePreflightRequest): DailyCasePreflightRequest {
  const symbol = request.symbol.trim().toUpperCase();
  const exchange = request.exchange.trim().toUpperCase();
  const yahooSymbol = request.yahooSymbol.trim().toUpperCase();
  if (!symbol || !exchange || !yahooSymbol) {
    throw new Error("daily_case_preflight_identity_required");
  }
  return { symbol, exchange, yahooSymbol };
}

function identity(request: Pick<DailyCasePreflightRequest, "symbol" | "exchange">): string {
  return `${request.symbol}@${request.exchange}`;
}

function resolveConcurrency(value: number | undefined): number {
  const concurrency = value ?? DAILY_CASE_PREFLIGHT_BUDGET.defaultConcurrency;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > DAILY_CASE_PREFLIGHT_BUDGET.maxConcurrency
  ) {
    throw new Error("daily_case_preflight_concurrency_invalid");
  }
  return concurrency;
}

/**
 * Bounded methodology-only preflight runner. It never substitutes an instrument
 * and never performs heavy financial-statement or report research itself.
 */
export async function runDailyCaseMethodologyPreflight(input: {
  requests: readonly DailyCasePreflightRequest[];
  loader: CompanyProfilePreflightLoader;
  maxConcurrency?: number;
}): Promise<DailyCasePreflightResult[]> {
  if (input.requests.length > DAILY_CASE_PREFLIGHT_BUDGET.maxCandidates) {
    throw new Error("daily_case_preflight_budget_exceeded");
  }
  const concurrency = resolveConcurrency(input.maxConcurrency);
  const requests = input.requests.map(normalizeRequest);
  const seen = new Set<string>();
  for (const request of requests) {
    const key = identity(request);
    if (seen.has(key)) throw new Error(`daily_case_preflight_duplicate_identity:${key}`);
    seen.add(key);
  }

  const results = new Array<DailyCasePreflightResult>(requests.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      const request = requests[index];
      if (!request) return;

      const preflight = await input.loader(request.yahooSymbol);
      if (preflight && preflight.yahooSymbol.trim().toUpperCase() !== request.yahooSymbol) {
        throw new Error(
          `daily_case_preflight_substitution:${request.yahooSymbol}:${preflight.yahooSymbol.trim().toUpperCase()}`,
        );
      }
      results[index] = {
        ...request,
        status: preflight ? "ready" : "missing",
        preflight,
      };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requests.length) }, () => worker()),
  );
  return results;
}
