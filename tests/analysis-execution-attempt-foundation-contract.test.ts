import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260822181000_create_divlab_analysis_execution_attempts.sql",
    import.meta.url,
  ),
  "utf8",
);

function has(value: string) {
  assert.ok(migration.includes(value), `missing execution-attempt contract: ${value}`);
}

describe("DivLab Analysis Execution Attempt Foundation v1", () => {
  it("binds one durable attempt to one request and cost reservation", () => {
    has("create table if not exists public.divlab_analysis_execution_attempts");
    has("unique (request_id)");
    has("unique (cost_reservation_id)");
    has("analysis_depth = 'deep'");
    has("analysis_engine in ('operating_company', 'bank', 'financial_specialist')");
    has("analysis-cost-projection-v1");
  });

  it("requires every cost-bearing request to have the matching attempt at commit", () => {
    has("create constraint trigger divlab_analysis_request_requires_execution_attempt");
    has("deferrable initially deferred");
    has("new.status = 'running'");
    has("new.status = 'completed'");
    has("new.status = 'failed' and new.started_at is not null");
    has("a.request_id = new.id");
    has("a.cost_reservation_id = new.cost_reservation_id");
    has("divlab_analysis_request_execution_attempt_missing");
  });

  it("internalizes raw Cost Guard reserve/finalize behind attempt-aware wrappers", () => {
    has("revoke execute on function public.divlab_reserve_analysis_cost(");
    has("from public, anon, authenticated, service_role");
    has("create or replace function public.divlab_reserve_analysis_cost_and_claim_execution(");
    has("v_cost := public.divlab_reserve_analysis_cost(");
    has("insert into public.divlab_analysis_execution_attempts");
    has("divlab_analysis_execution_attempt_missing_for_reserved_request");
    has("revoke execute on function public.divlab_finalize_analysis_cost(");
    has("from service_role");
    has("create or replace function public.divlab_finalize_analysis_execution_attempt(");
    has("v_cost_result := public.divlab_finalize_analysis_cost(");
  });

  it("keeps Light and mismatched projection profiles fail-closed", () => {
    has("light_engine_not_implemented");
    has("projection_profile_mismatch");
    has("'analysis-cost-projection-v1.' || p_analysis_engine");
  });

  it("makes model start a one-shot non-replayable boundary", () => {
    has("create or replace function public.divlab_mark_analysis_model_started(");
    has("for update");
    has("model_execution_already_started");
    has("set status = 'model_started', model_started_at = p_now");
    has("old.status = 'model_started' and new.status in ('model_finished', 'reconciliation_required')");
    assert.equal(
      migration.includes("old.status = 'model_started' and new.status = 'claimed'"),
      false,
    );
  });

  it("handles an ambiguous started execution by ceiling reconciliation instead of replay", () => {
    has("create or replace function public.divlab_mark_analysis_reconciliation_required(");
    has("v_status not in ('model_started', 'model_finished')");
    has("'fail_closed_ceiling'");
    has("v_reserved_cost");
    has("status = 'reconciliation_required'");
    has("failure_code = 'execution_reconciliation_required'");
    has("status = 'failed'");
  });

  it("allows controlled pre-model failure only with conservative ceiling accounting", () => {
    has("v_status not in ('claimed', 'model_finished')");
    has("v_status = 'claimed' and p_cost_source <> 'fail_closed_ceiling'");
    has("pre_model_failure_requires_fail_closed_ceiling");
    has("model_outcome_ambiguous_reconciliation_required");
  });

  it("keeps attempt internals server-only and non-deletable", () => {
    has("alter table public.divlab_analysis_execution_attempts enable row level security");
    has("revoke all on table public.divlab_analysis_execution_attempts");
    has("from public, anon, authenticated, service_role");
    has("grant select on table public.divlab_analysis_execution_attempts to service_role");
    assert.equal(
      migration.includes("grant insert on table public.divlab_analysis_execution_attempts to authenticated"),
      false,
    );
    assert.equal(
      migration.includes("grant delete on table public.divlab_analysis_execution_attempts"),
      false,
    );
  });
});
