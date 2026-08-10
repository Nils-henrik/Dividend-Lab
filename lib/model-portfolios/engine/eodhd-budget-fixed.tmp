export const EODHD_FREE_ACCOUNT_DAILY_LIMIT = 20;

/**
 * DivLab's weekday US research budget. The morning Nordic pass deliberately
 * receives no EODHD allocation; the three later passes split the complete
 * free-account allowance without exceeding 20 calls/day.
 */
export const MODEL_PORTFOLIO_EODHD_PASS_LIMITS = {
  nordic_morning: 0,
  us_1550: 7,
  us_1830: 6,
  us_2130: 7,
} as const;

export type ModelPortfolioResearchPass = keyof typeof MODEL_PORTFOLIO_EODHD_PASS_LIMITS;

// Legacy dry-run callers still use a small isolated budget. Scheduled production
// research must use createScheduledEodhdBudget instead.
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
    if (!Number.isInteger(limit) || limit < 0 || limit > EODHD_FREE_ACCOUNT_DAILY_LIMIT) {
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

/** History fetches must leave the reserved fundamentals slot intact. */
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

export function createScheduledEodhdBudget(pass: ModelPortfolioResearchPass): EodhdCallBudget {
  return new EodhdCallBudget(MODEL_PORTFOLIO_EODHD_PASS_LIMITS[pass]);
}

export function scheduledEodhdDailyLimit(): number {
  return Object.values(MODEL_PORTFOLIO_EODHD_PASS_LIMITS).reduce<number>(
    (sum, calls) => sum + calls,
    0,
  );
}

if (scheduledEodhdDailyLimit() > EODHD_FREE_ACCOUNT_DAILY_LIMIT) {
  throw new Error("scheduled_eodhd_budget_exceeds_daily_limit");
}
