import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EodhdCallBudget,
  MODEL_PORTFOLIO_EODHD_PASS_LIMITS,
  type EodhdCallBudgetSnapshot,
  type ModelPortfolioResearchPass,
} from "./eodhd-budget";

const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
const TABLE = "model_portfolio_eodhd_budget_claims";

function stockholmDate(now: Date): string {
  if (!Number.isFinite(now.getTime())) throw new Error("invalid_eodhd_ledger_date");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Claims one scheduled pass allocation for the Stockholm trading day.
 *
 * The unique (usage_date, pass) key makes retries fail closed: once a pass has
 * claimed its allowance, a second invocation gets a zero-call budget. This is
 * intentionally conservative so retries can never push the free EODHD account
 * above DivLab's 0/7/6/7 daily envelope.
 */
export async function claimScheduledEodhdBudget(input: {
  supabase: SupabaseClient;
  pass: ModelPortfolioResearchPass;
  now: Date;
}): Promise<EodhdCallBudget> {
  const limit = MODEL_PORTFOLIO_EODHD_PASS_LIMITS[input.pass];
  if (limit === 0) return new EodhdCallBudget(0);

  const usageDate = stockholmDate(input.now);
  const { error } = await input.supabase.from(TABLE).insert({
    usage_date: usageDate,
    pass: input.pass,
    allocated_calls: limit,
    used_calls: 0,
    claimed_at: input.now.toISOString(),
    updated_at: input.now.toISOString(),
  });

  if (!error) return new EodhdCallBudget(limit);
  if (error.code === "23505") return new EodhdCallBudget(0);
  throw new Error(`eodhd_budget_claim_failed:${error.code ?? "unknown"}`);
}

/** Persist actual calls for auditability after the external EODHD phase. */
export async function recordScheduledEodhdUsage(input: {
  supabase: SupabaseClient;
  pass: ModelPortfolioResearchPass;
  now: Date;
  budget: EodhdCallBudgetSnapshot;
}): Promise<void> {
  // A zero-limit budget means either the Nordic pass or a duplicate/retry.
  // Never let a duplicate overwrite the original pass usage row.
  if (input.budget.limit === 0) return;
  const usageDate = stockholmDate(input.now);
  const { error } = await input.supabase
    .from(TABLE)
    .update({
      used_calls: input.budget.used,
      updated_at: new Date().toISOString(),
    })
    .eq("usage_date", usageDate)
    .eq("pass", input.pass);
  if (error) throw new Error(`eodhd_budget_record_failed:${error.code ?? "unknown"}`);
}
