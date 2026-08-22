-- DivLab Analysis Execution Attempt Foundation v1.
-- Repository-only and inert: no queue consumer, worker route, entitlement provider,
-- model execution or Production Analysis access is enabled by this migration.
--
-- Purpose:
--   - couple every cost-bearing running request to exactly one durable execution attempt;
--   - make the first model/provider start a one-way boundary;
--   - forbid automatic replay after an ambiguous/crashed model start;
--   - finalize ambiguous spend conservatively at the already-reserved ceiling;
--   - keep the existing Cost Guard as the atomic budget admission primitive.

create table if not exists public.divlab_analysis_execution_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.divlab_analysis_requests (id) on delete restrict,
  user_id uuid null references auth.users (id) on delete set null,
  cost_reservation_id uuid not null
    references public.divlab_analysis_cost_events (id) on delete restrict,
  analysis_depth text not null,
  analysis_engine text not null,
  projection_profile text not null,
  status text not null default 'claimed',
  terminal_status text null,
  reconciliation_reason text null,
  created_at timestamptz not null default now(),
  model_started_at timestamptz null,
  model_finished_at timestamptz null,
  finalized_at timestamptz null,
  reconciliation_at timestamptz null,

  constraint divlab_analysis_execution_attempts_request_unique unique (request_id),
  constraint divlab_analysis_execution_attempts_cost_unique unique (cost_reservation_id),
  constraint divlab_analysis_execution_attempts_depth_deep_only check (
    analysis_depth = 'deep'
  ),
  constraint divlab_analysis_execution_attempts_engine_valid check (
    analysis_engine in ('operating_company', 'bank', 'financial_specialist')
  ),
  constraint divlab_analysis_execution_attempts_projection_profile_valid check (
    char_length(projection_profile) between 1 and 64
    and projection_profile ~ '^analysis-cost-projection-v1\.(operating_company|bank|financial_specialist)$'
  ),
  constraint divlab_analysis_execution_attempts_status_valid check (
    status in (
      'claimed',
      'model_started',
      'model_finished',
      'finalized',
      'reconciliation_required'
    )
  ),
  constraint divlab_analysis_execution_attempts_terminal_status_valid check (
    terminal_status is null
    or terminal_status in ('completed', 'failed', 'cancelled', 'provider_unavailable')
  ),
  constraint divlab_analysis_execution_attempts_reconciliation_reason_format check (
    reconciliation_reason is null
    or (
      char_length(reconciliation_reason) between 1 and 96
      and reconciliation_reason ~ '^[a-z0-9_:-]+$'
    )
  ),
  constraint divlab_analysis_execution_attempts_timestamp_order check (
    (model_started_at is null or model_started_at >= created_at)
    and (
      model_finished_at is null
      or (model_started_at is not null and model_finished_at >= model_started_at)
    )
    and (
      finalized_at is null
      or finalized_at >= coalesce(model_finished_at, model_started_at, created_at)
    )
    and (
      reconciliation_at is null
      or (model_started_at is not null and reconciliation_at >= model_started_at)
    )
  ),
  constraint divlab_analysis_execution_attempts_state_shape check (
    case status
      when 'claimed' then
        terminal_status is null
        and reconciliation_reason is null
        and model_started_at is null
        and model_finished_at is null
        and finalized_at is null
        and reconciliation_at is null
      when 'model_started' then
        terminal_status is null
        and reconciliation_reason is null
        and model_started_at is not null
        and model_finished_at is null
        and finalized_at is null
        and reconciliation_at is null
      when 'model_finished' then
        terminal_status is null
        and reconciliation_reason is null
        and model_started_at is not null
        and model_finished_at is not null
        and finalized_at is null
        and reconciliation_at is null
      when 'finalized' then
        terminal_status is not null
        and reconciliation_reason is null
        and finalized_at is not null
        and reconciliation_at is null
        and (
          (model_started_at is null and model_finished_at is null)
          or (model_started_at is not null and model_finished_at is not null)
        )
      when 'reconciliation_required' then
        terminal_status = 'failed'
        and reconciliation_reason is not null
        and model_started_at is not null
        and finalized_at is null
        and reconciliation_at is not null
      else false
    end
  )
);

create index if not exists divlab_analysis_execution_attempts_status_created_idx
  on public.divlab_analysis_execution_attempts (status, created_at asc);
create index if not exists divlab_analysis_execution_attempts_user_created_idx
  on public.divlab_analysis_execution_attempts (user_id, created_at desc)
  where user_id is not null;

alter table public.divlab_analysis_execution_attempts enable row level security;

-- Execution-attempt details are internal operational data. Browser users observe
-- the owner-safe request status instead of mutating or reading worker internals.
revoke all on table public.divlab_analysis_execution_attempts
  from public, anon, authenticated, service_role;
grant select on table public.divlab_analysis_execution_attempts to service_role;

-- ---------------------------------------------------------------------------
-- Immutable attempt identity + one-way lifecycle.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_analysis_execution_attempts_enforce_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'claimed' then
      raise exception 'divlab_analysis_execution_attempt_initial_status_invalid'
        using errcode = 'DAA00';
    end if;
    return new;
  end if;

  if new.request_id is distinct from old.request_id
     or new.cost_reservation_id is distinct from old.cost_reservation_id
     or new.analysis_depth is distinct from old.analysis_depth
     or new.analysis_engine is distinct from old.analysis_engine
     or new.projection_profile is distinct from old.projection_profile
     or new.created_at is distinct from old.created_at
  then
    raise exception 'divlab_analysis_execution_attempt_identity_immutable'
      using errcode = 'DAA01';
  end if;

  -- Account deletion may anonymize the attempt through ON DELETE SET NULL only.
  if new.user_id is distinct from old.user_id then
    if old.user_id is not null
       and new.user_id is null
       and new.status = old.status
       and new.terminal_status is not distinct from old.terminal_status
       and new.reconciliation_reason is not distinct from old.reconciliation_reason
       and new.model_started_at is not distinct from old.model_started_at
       and new.model_finished_at is not distinct from old.model_finished_at
       and new.finalized_at is not distinct from old.finalized_at
       and new.reconciliation_at is not distinct from old.reconciliation_at
    then
      return new;
    end if;

    raise exception 'divlab_analysis_execution_attempt_owner_immutable'
      using errcode = 'DAA02';
  end if;

  if old.model_started_at is not null
     and new.model_started_at is distinct from old.model_started_at
  then
    raise exception 'divlab_analysis_execution_attempt_model_started_immutable'
      using errcode = 'DAA03';
  end if;
  if old.model_finished_at is not null
     and new.model_finished_at is distinct from old.model_finished_at
  then
    raise exception 'divlab_analysis_execution_attempt_model_finished_immutable'
      using errcode = 'DAA04';
  end if;
  if old.finalized_at is not null
     and new.finalized_at is distinct from old.finalized_at
  then
    raise exception 'divlab_analysis_execution_attempt_finalized_immutable'
      using errcode = 'DAA05';
  end if;
  if old.reconciliation_at is not null
     and new.reconciliation_at is distinct from old.reconciliation_at
  then
    raise exception 'divlab_analysis_execution_attempt_reconciliation_immutable'
      using errcode = 'DAA06';
  end if;

  if new.status = old.status then
    raise exception 'divlab_analysis_execution_attempt_status_update_required'
      using errcode = 'DAA07';
  end if;

  if not (
    (old.status = 'claimed' and new.status in ('model_started', 'finalized'))
    or (old.status = 'model_started' and new.status in ('model_finished', 'reconciliation_required'))
    or (old.status = 'model_finished' and new.status in ('finalized', 'reconciliation_required'))
  ) then
    raise exception 'divlab_analysis_execution_attempt_transition_invalid'
      using errcode = 'DAA08';
  end if;

  return new;
end;
$$;

drop trigger if exists divlab_analysis_execution_attempts_enforce_lifecycle
  on public.divlab_analysis_execution_attempts;
create trigger divlab_analysis_execution_attempts_enforce_lifecycle
  before insert or update on public.divlab_analysis_execution_attempts
  for each row
  execute function public.divlab_analysis_execution_attempts_enforce_lifecycle();

revoke all on function public.divlab_analysis_execution_attempts_enforce_lifecycle()
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_execution_attempts_enforce_lifecycle()
  to service_role;

-- ---------------------------------------------------------------------------
-- Deferred binding: every cost-bearing request must have the exact matching
-- execution attempt by transaction commit. This lets the wrapper call Cost
-- Guard first and insert the attempt later in the same transaction, while a
-- direct queued -> running transition cannot commit without the binding.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_analysis_request_requires_execution_attempt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'running'
     or new.status = 'completed'
     or (new.status = 'failed' and new.started_at is not null)
  then
    if not exists (
      select 1
      from public.divlab_analysis_execution_attempts a
      where a.request_id = new.id
        and a.cost_reservation_id = new.cost_reservation_id
        and a.analysis_depth = new.analysis_depth
        and a.user_id is not distinct from new.user_id
    ) then
      raise exception 'divlab_analysis_request_execution_attempt_missing'
        using errcode = 'DAA09';
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists divlab_analysis_request_requires_execution_attempt
  on public.divlab_analysis_requests;
create constraint trigger divlab_analysis_request_requires_execution_attempt
  after insert or update of status, cost_reservation_id, user_id, analysis_depth
  on public.divlab_analysis_requests
  deferrable initially deferred
  for each row
  execute function public.divlab_analysis_request_requires_execution_attempt();

revoke all on function public.divlab_analysis_request_requires_execution_attempt()
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_request_requires_execution_attempt()
  to service_role;

-- The raw Cost Guard reserve RPC is now an internal primitive used only by the
-- execution-attempt wrapper. App service_role must not create a running request
-- without the durable attempt binding.
revoke execute on function public.divlab_reserve_analysis_cost(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Atomic cost reservation + execution-attempt claim.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_reserve_analysis_cost_and_claim_execution(
  p_request_id uuid,
  p_user_id uuid,
  p_analysis_depth text,
  p_analysis_engine text,
  p_projection_profile text,
  p_projected_cost_micro_usd bigint,
  p_max_request_micro_usd bigint,
  p_daily_hard_limit_micro_usd bigint,
  p_monthly_target_micro_usd bigint,
  p_monthly_warning_micro_usd bigint,
  p_monthly_hard_limit_micro_usd bigint,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost jsonb;
  v_reservation_id uuid;
  v_existing_attempt_id uuid;
  v_existing_user_id uuid;
  v_existing_cost_reservation_id uuid;
  v_existing_depth text;
  v_existing_engine text;
  v_existing_profile text;
  v_attempt_id uuid;
begin
  if p_analysis_depth is distinct from 'deep' then
    return jsonb_build_object('ok', false, 'reason', 'light_engine_not_implemented');
  end if;

  if p_analysis_engine is null
     or p_analysis_engine not in ('operating_company', 'bank', 'financial_specialist')
  then
    return jsonb_build_object('ok', false, 'reason', 'analysis_engine_invalid');
  end if;

  if p_projection_profile is distinct from
     ('analysis-cost-projection-v1.' || p_analysis_engine)
  then
    return jsonb_build_object('ok', false, 'reason', 'projection_profile_mismatch');
  end if;

  v_cost := public.divlab_reserve_analysis_cost(
    p_request_id,
    p_user_id,
    p_analysis_depth,
    p_projection_profile,
    p_projected_cost_micro_usd,
    p_max_request_micro_usd,
    p_daily_hard_limit_micro_usd,
    p_monthly_target_micro_usd,
    p_monthly_warning_micro_usd,
    p_monthly_hard_limit_micro_usd,
    p_now
  );

  if coalesce((v_cost ->> 'ok')::boolean, false) is not true then
    return v_cost;
  end if;

  begin
    v_reservation_id := (v_cost ->> 'reservation_id')::uuid;
  exception when others then
    raise exception 'divlab_analysis_execution_cost_reservation_invalid'
      using errcode = 'DAA10';
  end;

  select
    id,
    user_id,
    cost_reservation_id,
    analysis_depth,
    analysis_engine,
    projection_profile
  into
    v_existing_attempt_id,
    v_existing_user_id,
    v_existing_cost_reservation_id,
    v_existing_depth,
    v_existing_engine,
    v_existing_profile
  from public.divlab_analysis_execution_attempts
  where request_id = p_request_id;

  if found then
    if v_existing_user_id is distinct from p_user_id
       or v_existing_cost_reservation_id is distinct from v_reservation_id
       or v_existing_depth is distinct from p_analysis_depth
       or v_existing_engine is distinct from p_analysis_engine
       or v_existing_profile is distinct from p_projection_profile
    then
      raise exception 'divlab_analysis_execution_attempt_binding_mismatch'
        using errcode = 'DAA11';
    end if;

    return v_cost || jsonb_build_object(
      'attempt_id', v_existing_attempt_id,
      'already_claimed', true
    );
  end if;

  -- If Cost Guard reports a reservation from a previous committed transaction
  -- but no execution attempt exists, do not manufacture a replayable attempt.
  -- The request requires manual reconciliation instead.
  if coalesce((v_cost ->> 'already_reserved')::boolean, false) is true then
    raise exception 'divlab_analysis_execution_attempt_missing_for_reserved_request'
      using errcode = 'DAA12';
  end if;

  insert into public.divlab_analysis_execution_attempts (
    request_id,
    user_id,
    cost_reservation_id,
    analysis_depth,
    analysis_engine,
    projection_profile,
    status,
    created_at
  )
  values (
    p_request_id,
    p_user_id,
    v_reservation_id,
    p_analysis_depth,
    p_analysis_engine,
    p_projection_profile,
    'claimed',
    p_now
  )
  returning id into v_attempt_id;

  return v_cost || jsonb_build_object(
    'attempt_id', v_attempt_id,
    'already_claimed', false
  );
end;
$$;

revoke all on function public.divlab_reserve_analysis_cost_and_claim_execution(
  uuid, uuid, text, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from public, anon, authenticated;
grant execute on function public.divlab_reserve_analysis_cost_and_claim_execution(
  uuid, uuid, text, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to service_role;

-- ---------------------------------------------------------------------------
-- One-shot model start. A retry after this point must never start the model
-- again automatically because provider billing/outcome may be ambiguous.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_mark_analysis_model_started(
  p_attempt_id uuid,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_request_id uuid;
  v_cost_reservation_id uuid;
  v_request_status text;
  v_request_cost_reservation_id uuid;
begin
  select status, request_id, cost_reservation_id
  into v_status, v_request_id, v_cost_reservation_id
  from public.divlab_analysis_execution_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_found');
  end if;

  if v_status <> 'claimed' then
    if v_status in ('model_started', 'model_finished', 'finalized', 'reconciliation_required') then
      return jsonb_build_object('ok', false, 'reason', 'model_execution_already_started');
    end if;
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_claimed');
  end if;

  select status, cost_reservation_id
  into v_request_status, v_request_cost_reservation_id
  from public.divlab_analysis_requests
  where id = v_request_id
  for update;

  if not found
     or v_request_status <> 'running'
     or v_request_cost_reservation_id is distinct from v_cost_reservation_id
  then
    return jsonb_build_object('ok', false, 'reason', 'running_request_binding_invalid');
  end if;

  update public.divlab_analysis_execution_attempts
  set status = 'model_started', model_started_at = p_now
  where id = p_attempt_id and status = 'claimed';

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'model_start_race_lost');
  end if;

  return jsonb_build_object('ok', true, 'attempt_id', p_attempt_id);
end;
$$;

revoke all on function public.divlab_mark_analysis_model_started(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.divlab_mark_analysis_model_started(uuid, timestamptz)
  to service_role;

create or replace function public.divlab_mark_analysis_model_finished(
  p_attempt_id uuid,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status
  from public.divlab_analysis_execution_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_found');
  end if;

  if v_status = 'model_finished' then
    return jsonb_build_object('ok', true, 'attempt_id', p_attempt_id, 'already_finished', true);
  end if;

  if v_status <> 'model_started' then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_model_started');
  end if;

  update public.divlab_analysis_execution_attempts
  set status = 'model_finished', model_finished_at = p_now
  where id = p_attempt_id and status = 'model_started';

  return jsonb_build_object('ok', true, 'attempt_id', p_attempt_id, 'already_finished', false);
end;
$$;

revoke all on function public.divlab_mark_analysis_model_finished(uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.divlab_mark_analysis_model_finished(uuid, timestamptz)
  to service_role;

-- ---------------------------------------------------------------------------
-- Atomic cost + attempt finalization for a controlled outcome. `claimed` may
-- finalize before a provider call only with conservative cost accounting;
-- `model_finished` may finalize after a returned execution. A live
-- `model_started` attempt is intentionally ineligible because replay/outcome is
-- ambiguous and must go through reconciliation_required instead.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_finalize_analysis_execution_attempt(
  p_attempt_id uuid,
  p_accounted_cost_micro_usd bigint,
  p_cost_source text,
  p_terminal_status text,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_total_tokens integer default null,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_cost_reservation_id uuid;
  v_cost_result jsonb;
begin
  select status, cost_reservation_id
  into v_status, v_cost_reservation_id
  from public.divlab_analysis_execution_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_found');
  end if;

  if v_status = 'finalized' then
    return jsonb_build_object('ok', true, 'attempt_id', p_attempt_id, 'already_finalized', true);
  end if;

  if v_status = 'model_started' then
    return jsonb_build_object('ok', false, 'reason', 'model_outcome_ambiguous_reconciliation_required');
  end if;

  if v_status not in ('claimed', 'model_finished') then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_finalizable');
  end if;

  if v_status = 'claimed' and p_cost_source <> 'fail_closed_ceiling' then
    return jsonb_build_object('ok', false, 'reason', 'pre_model_failure_requires_fail_closed_ceiling');
  end if;

  v_cost_result := public.divlab_finalize_analysis_cost(
    v_cost_reservation_id,
    p_accounted_cost_micro_usd,
    p_cost_source,
    p_terminal_status,
    p_input_tokens,
    p_output_tokens,
    p_total_tokens,
    p_now
  );

  if coalesce((v_cost_result ->> 'ok')::boolean, false) is not true then
    return v_cost_result;
  end if;

  update public.divlab_analysis_execution_attempts
  set
    status = 'finalized',
    terminal_status = p_terminal_status,
    finalized_at = p_now
  where id = p_attempt_id
    and status = v_status;

  if not found then
    raise exception 'divlab_analysis_execution_attempt_finalize_race'
      using errcode = 'DAA13';
  end if;

  return v_cost_result || jsonb_build_object(
    'attempt_id', p_attempt_id,
    'already_finalized', false
  );
end;
$$;

revoke all on function public.divlab_finalize_analysis_execution_attempt(
  uuid, bigint, text, text, integer, integer, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.divlab_finalize_analysis_execution_attempt(
  uuid, bigint, text, text, integer, integer, integer, timestamptz
) to service_role;

-- ---------------------------------------------------------------------------
-- Ambiguous provider boundary. Once `model_started` was committed, a crash or
-- unknown response must not auto-replay. Reconciliation finalizes the cost at
-- the reserved fail-closed ceiling and terminates the request as failed.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_mark_analysis_reconciliation_required(
  p_attempt_id uuid,
  p_reason text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_request_id uuid;
  v_cost_reservation_id uuid;
  v_reserved_cost bigint;
  v_cost_result jsonb;
begin
  if p_reason is null
     or char_length(p_reason) not between 1 and 96
     or p_reason !~ '^[a-z0-9_:-]+$'
  then
    return jsonb_build_object('ok', false, 'reason', 'reconciliation_reason_invalid');
  end if;

  select status, request_id, cost_reservation_id
  into v_status, v_request_id, v_cost_reservation_id
  from public.divlab_analysis_execution_attempts
  where id = p_attempt_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_found');
  end if;

  if v_status = 'reconciliation_required' then
    return jsonb_build_object('ok', true, 'attempt_id', p_attempt_id, 'already_reconciled', true);
  end if;

  if v_status not in ('model_started', 'model_finished') then
    return jsonb_build_object('ok', false, 'reason', 'attempt_not_reconcilable');
  end if;

  select reserved_cost_micro_usd
  into v_reserved_cost
  from public.divlab_analysis_cost_events
  where id = v_cost_reservation_id
  for update;

  if not found or v_reserved_cost is null or v_reserved_cost <= 0 then
    raise exception 'divlab_analysis_execution_reserved_cost_missing'
      using errcode = 'DAA14';
  end if;

  v_cost_result := public.divlab_finalize_analysis_cost(
    v_cost_reservation_id,
    v_reserved_cost,
    'fail_closed_ceiling',
    'failed',
    null,
    null,
    null,
    p_now
  );

  if coalesce((v_cost_result ->> 'ok')::boolean, false) is not true then
    return v_cost_result;
  end if;

  update public.divlab_analysis_execution_attempts
  set
    status = 'reconciliation_required',
    terminal_status = 'failed',
    reconciliation_reason = p_reason,
    reconciliation_at = p_now
  where id = p_attempt_id
    and status = v_status;

  if not found then
    raise exception 'divlab_analysis_execution_reconciliation_race'
      using errcode = 'DAA15';
  end if;

  update public.divlab_analysis_requests
  set
    status = 'failed',
    failure_code = 'execution_reconciliation_required',
    finished_at = p_now
  where id = v_request_id
    and status = 'running';

  if not found then
    raise exception 'divlab_analysis_execution_request_reconciliation_failed'
      using errcode = 'DAA16';
  end if;

  return v_cost_result || jsonb_build_object(
    'attempt_id', p_attempt_id,
    'already_reconciled', false
  );
end;
$$;

revoke all on function public.divlab_mark_analysis_reconciliation_required(
  uuid, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.divlab_mark_analysis_reconciliation_required(
  uuid, text, timestamptz
) to service_role;

-- Direct cost finalization is also internalized behind the execution-attempt
-- lifecycle so app service_role cannot finalize spend without attempt state.
revoke execute on function public.divlab_finalize_analysis_cost(
  uuid, bigint, text, text, integer, integer, integer, timestamptz
) from service_role;
