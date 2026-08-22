import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822170500_create_divlab_analysis_cost_guard.sql", import.meta.url),
  "utf8",
);

function has(value: string) {
  assert.ok(migration.includes(value), `missing Analysis Cost Guard contract: ${value}`);
}

describe("DivLab Analysis Cost Guard v1", () => {
  it("makes Light/Deep an immutable request identity before cost admission", () => {
    has("add column if not exists analysis_depth text");
    has("analysis_depth in ('light', 'deep')");
    has("divlab_analysis_depth_backfill_required");
    has("divlab_analysis_request_depth_immutable");
    has("before update of analysis_depth");
  });

  it("uses a separate whole-job Analysis ledger instead of DivBrain usage rows", () => {
    has("create table if not exists public.divlab_analysis_cost_events");
    has("request_id uuid not null");
    has("constraint divlab_analysis_cost_events_request_unique unique (request_id)");
    has("reserved_cost_micro_usd bigint not null");
    has("accounted_cost_micro_usd bigint null");
    has("projection_profile text not null");
    assert.equal(migration.includes("insert into public.divbrain_usage_events"), false);
  });

  it("binds each request to the exact cost reservation with delete protection", () => {
    has("divlab_analysis_requests_cost_reservation_fk");
    has("foreign key (cost_reservation_id)");
    has("references public.divlab_analysis_cost_events (id)");
    has("on delete restrict");
  });

  it("atomically reserves budget before queued becomes running", () => {
    has("create or replace function public.divlab_reserve_analysis_cost");
    has("pg_advisory_xact_lock(hashtext('divlab_analysis_cost_budget_v1'))");
    has("from public.divlab_analysis_requests");
    has("for update");
    has("v_request_status <> 'queued'");
    has("entitlement_reservation_missing");
    has("daily_hard_limit");
    has("monthly_hard_limit");
    has("insert into public.divlab_analysis_cost_events");
    has("status = 'running'");
    has("cost_reservation_id = v_reservation_id");
    has("started_at = p_now");
  });

  it("supports safe reservation retry without creating a second cost event", () => {
    has("v_request_status = 'running' and v_existing_cost_reservation_id is not null");
    has("reservation_parameters_mismatch");
    has("'already_reserved', true");
    has("constraint divlab_analysis_cost_events_request_unique unique (request_id)");
  });

  it("keeps hard-limit accounting conservative during finalization", () => {
    has("create or replace function public.divlab_finalize_analysis_cost");
    has("reserved_cost_micro_usd = greatest(");
    has("reserved_cost_micro_usd,\n      p_accounted_cost_micro_usd");
    has("'fail_closed_ceiling'");
    has("'already_finalized', true");
    has("status = 'finalized'");
  });

  it("keeps browser roles out of the internal cost ledger and mutation RPCs", () => {
    has("alter table public.divlab_analysis_cost_events enable row level security");
    has("revoke all on table public.divlab_analysis_cost_events");
    has("from public, anon, authenticated, service_role");
    has("grant select on table public.divlab_analysis_cost_events to service_role");
    has("security definer");
    has("set search_path = ''");
    has("from public, anon, authenticated");
    assert.equal(migration.includes("grant insert on table public.divlab_analysis_cost_events"), false);
    assert.equal(migration.includes("grant update on table public.divlab_analysis_cost_events"), false);
    assert.equal(migration.includes("grant delete on table public.divlab_analysis_cost_events"), false);
  });

  it("does not add entitlement, billing, request API or worker execution", () => {
    assert.equal(migration.includes("stripe"), false);
    assert.equal(migration.includes("create policy"), false);
    assert.equal(migration.includes("provider.generate"), false);
    assert.equal(migration.includes("createDivLabAiAnalysis"), false);
  });
});
