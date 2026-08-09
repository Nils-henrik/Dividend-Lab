export const EODHD_FREE_ACCOUNT_DAILY_LIMIT = 20;
export const MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT = 8;

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

export function createDryRunEodhdBudget(): EodhdCallBudget {
  return new EodhdCallBudget(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT);
}
