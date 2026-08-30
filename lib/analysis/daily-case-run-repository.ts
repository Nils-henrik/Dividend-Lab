import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyCaseRunAudit } from "./daily-case-audit";
import { buildDailyCaseRunInsertRow } from "./daily-case-run-persistence";

export type PersistedDailyCaseRun = {
  id: string;
  selectionDate: string;
  runKey: string;
  createdAt: string;
};

function readPersistedRun(value: unknown): PersistedDailyCaseRun {
  if (!value || typeof value !== "object") {
    throw new Error("daily_case_run_persist_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : null;
  const selectionDate = typeof row.selection_date === "string" ? row.selection_date : null;
  const runKey = typeof row.run_key === "string" ? row.run_key : null;
  const createdAt = typeof row.created_at === "string" ? row.created_at : null;
  if (!id || !selectionDate || !runKey || !createdAt) {
    throw new Error("daily_case_run_persist_invalid_result");
  }
  return { id, selectionDate, runKey, createdAt };
}

/**
 * Append-only persistence. There is intentionally no update/delete repository path.
 */
export async function persistDailyCaseRun(input: {
  supabase: SupabaseClient;
  audit: DailyCaseRunAudit;
}): Promise<PersistedDailyCaseRun> {
  const row = buildDailyCaseRunInsertRow(input.audit);
  const { data, error } = await input.supabase
    .from("divlab_daily_case_runs")
    .insert(row)
    .select("id,selection_date,run_key,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("daily_case_run_duplicate");
    }
    throw new Error(`daily_case_run_persist_failed:${error.code ?? "unknown"}`);
  }
  return readPersistedRun(data);
}
