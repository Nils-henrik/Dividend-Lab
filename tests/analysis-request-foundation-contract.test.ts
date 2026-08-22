import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822161000_create_divlab_analysis_requests.sql", import.meta.url),
  "utf8",
);

function has(value: string) {
  assert.ok(migration.includes(value), `missing migration contract: ${value}`);
}

describe("DivLab paid analysis request foundation", () => {
  it("starts every request before entitlement and requires reservations before execution", () => {
    has("create table if not exists public.divlab_analysis_requests");
    has("default 'pending_entitlement'");
    has("if tg_op = 'INSERT' then");
    has("new.status <> 'pending_entitlement'");
    has("divlab_analysis_request_initial_status_invalid");
    has("when 'queued' then");
    has("entitlement_reservation_id is not null");
    has("when 'running' then");
    has("cost_reservation_id is not null");
    has("when 'completed' then");
    has("analysis_version_id is not null");
  });

  it("is idempotent and permits only one active request per account", () => {
    has("unique (user_id, idempotency_key)");
    has("divlab_analysis_requests_one_active_per_user_idx");
    has("status in ('pending_entitlement', 'queued', 'running')");
  });

  it("allows only forward lifecycle transitions", () => {
    has("old.status = 'pending_entitlement' and new.status in ('queued', 'failed')");
    has("old.status = 'queued' and new.status in ('running', 'failed')");
    has("old.status = 'running' and new.status in ('completed', 'failed')");
    has("divlab_analysis_request_identity_immutable");
    has("divlab_analysis_request_owner_immutable");
    assert.equal(migration.includes("old.status = 'completed'"), false);
    assert.equal(migration.includes("old.status = 'failed'"), false);
  });

  it("keeps reservation ids and lifecycle timestamps immutable once set", () => {
    has("divlab_analysis_request_entitlement_reservation_immutable");
    has("divlab_analysis_request_cost_reservation_immutable");
    has("divlab_analysis_request_queued_at_immutable");
    has("divlab_analysis_request_started_at_immutable");
    has("divlab_analysis_request_finished_at_immutable");
    has("divlab_analysis_request_failed_stage_invalid");
    has("old.status = 'queued'");
    has("new.cost_reservation_id is not null or new.started_at is not null");
  });

  it("allows account deletion to anonymize only user_id", () => {
    has("old.user_id is not null");
    has("new.user_id is null");
    has("new.status = old.status");
    has("new.entitlement_reservation_id is not distinct from old.entitlement_reservation_id");
    has("new.analysis_version_id is not distinct from old.analysis_version_id");
  });

  it("uses owner-only reads and server-owned writes", () => {
    has("alter table public.divlab_analysis_requests enable row level security");
    has("using (user_id = (select auth.uid()))");
    has("revoke all on table public.divlab_analysis_requests from public, anon, authenticated, service_role");
    has("grant select on table public.divlab_analysis_requests to authenticated");
    has("grant select, insert, update on table public.divlab_analysis_requests to service_role");
    assert.equal(migration.includes("grant insert on table public.divlab_analysis_requests to authenticated"), false);
    assert.equal(migration.includes("grant update on table public.divlab_analysis_requests to authenticated"), false);
    assert.equal(migration.includes("grant delete on table public.divlab_analysis_requests to service_role"), false);
  });

  it("preserves audit history and completed-result provenance", () => {
    has("user_id uuid null references auth.users (id) on delete set null");
    has("analysis_version_id uuid null references public.divlab_analysis_versions (id) on delete restrict");
    has("analysis_version_id is null");
    has("failure_code is not null");
  });
});
