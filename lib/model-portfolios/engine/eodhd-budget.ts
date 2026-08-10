export const EODHD_FREE_ACCOUNT_DAILY_LIMIT = 20;
// Four scheduled research passes per weekday must remain at/under the provider's
// free-account daily ceiling. Each pass uses one batched quote call, up to three
// history calls, and one reserved fundamentals enrichment call for the strongest
// shortlisted name. Remaining candidates still participate with quote data and
// honestly report missing TA/history/fundamentals.
export const MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT = 5;
export const MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS = 1;
export const MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS =
  MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT - 1 - MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS;

export type EodhdCallBudgetSnapshot = {
  limit: number;
  used: number;
  remaining: number;
};

export class EodhdCallBudget {
  private used = 0;

  constructor(readonly limit = MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT) {
    if (!Number.isInteger(limit) || limit < 1 || limit > EODHD_FREE_ACCOUNT_DAILY_LIMIT) {
      throw new Error("invalid_eodhd_call_budget");
    }
  }

  consume(calls = 1): void {
    if (!Number.isInteger(calls) || calls < 1) throw new Error("invalid_eodhd_call_count");
    if (this.used + calls > this.limit) throw new Error("eodhd_call_budget_exhausted");
    this.used += calls;
  }

  snapshot(): EodhdCallBudgetSnapshot {
    return {
      limit: this.limit,
      used: this.used,
      remaining: this.limit - this.used,
    };
  }
}

/**
 * History fetches must leave the reserved fundamentals slot intact.
 * After the batched quote call, only fetch another history while more than one
 * call remains (limit 5 → quote 1 + histories ≤ 3 + fundamentals 1).
 */
export function canFetchHistoryWithFundamentalsReserve(
  budget: EodhdCallBudgetSnapshot,
  reservedFundamentalsCalls = MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS,
): boolean {
  if (!Number.isInteger(reservedFundamentalsCalls) || reservedFundamentalsCalls < 1) {
    throw new Error("invalid_eodhd_fundamentals_reserve");
  }
  return budget.remaining > reservedFundamentalsCalls;
}

export function createDryRunEodhdBudget(): EodhdCallBudget {
  return new EodhdCallBudget(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT);
}
