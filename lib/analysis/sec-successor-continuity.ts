export const SEC_SUCCESSOR_CONTINUITY_VERSION = "sec-successor-continuity-v1" as const;

export type SecDomesticSuccessorContinuity = {
  version: typeof SEC_SUCCESSOR_CONTINUITY_VERSION;
  ticker: string;
  successorCik: number;
  predecessorCik: number;
  effectiveDate: string;
  evidenceUrl: string;
};

const REGISTRY: readonly SecDomesticSuccessorContinuity[] = [
  {
    version: SEC_SUCCESSOR_CONTINUITY_VERSION,
    ticker: "XOM",
    successorCik: 2_115_436,
    predecessorCik: 34_088,
    effectiveDate: "2026-07-01",
    // SEC 8-K12B / successor registration filing for ExxonMobil Holdings Corp.
    // The successor's 2026 Q2 10-Q also states that EMHC became successor
    // registrant of Exxon Mobil Corporation after the July 1 redomiciliation.
    evidenceUrl:
      "https://www.sec.gov/Archives/edgar/data/2115436/000119312526291990/d71068d8k12b.htm",
  },
] as const;

/**
 * Exact, curated continuity only. No fuzzy issuer matching, accession-prefix
 * inference or generic predecessor crawl is permitted here.
 */
export function resolveSecDomesticSuccessorContinuity(input: {
  ticker: string;
  currentCik: number;
}): SecDomesticSuccessorContinuity | null {
  const ticker = input.ticker.trim().toUpperCase();
  if (!ticker || !Number.isInteger(input.currentCik) || input.currentCik <= 0) return null;
  return REGISTRY.find(
    (entry) => entry.ticker === ticker && entry.successorCik === input.currentCik,
  ) ?? null;
}
