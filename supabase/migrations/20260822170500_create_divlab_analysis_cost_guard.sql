-- DivLab Analysis Cost Guard v1.
-- Repository-only and inert: no request API, entitlement provider, worker,
-- production execution route or billing system is enabled by this migration.
--
-- Reuses the proven DivBrain reserve/finalize safety pattern in a separate
-- Analysis-domain ledger. One reservation represents the whole analysis job,
-- including any bounded analyst repair/escalation attempts performed later.
--
-- Security model:
--   - analysis depth is immutable request identity: light | deep;
--   - cost admission is atomic and must precede queued -> running;
--   - hard-limit accounting always uses reserved_cost_micro_usd;
--   - finalization can only increase the hard-limit amount;
--   - browser roles have no access to the cost ledger or mutation RPCs;
--   - service_role can SELECT the ledger and execute reserve/finalize RPCs;
--   - no direct INSERT/UPDATE/DELETE grant exists on the cost ledger.

-- ---------------------------------------------------------------------------
-- Request identity: lock the selected product depth before entitlement/cost.
-- ---------------------------------------------------------------------------

alter table public.divlab_analysis_requests
  add column if not exists analysis_depth text;

-- The parent request foundation is intentionally inert and has no request API.
-- If a future rebase contains rows without a product depth, do not guess a
-- backfill. Fail closed and require an explicit migration decision instead.
do $$
begin
  if exists (
    select 1
    from public.divlab_analysis_requests
    where analysis_depth is null
  ) then
    raise exception 'divlab_analysis_depth_backfill_required';
  end if;
end;
$$;

alter table public.divlab_analysis_requests
  alter column analysis_depth set not null;

alter table public.divlab_analysis_requests
  add constraint divlab_analysis_requests_analysis_depth_valid
  check (analysis_depth in ('light', 'deep'));

create or replace function public.divlab_analysis_requests_enforce_analysis_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.analysis_depth is distinct from old.analysis_depth then
    raise exception 'divlab_analysis_request_depth_immutable'
      using errcode = 'DAC10';
  end if;
  return new;
end;
$$;

drop trigger if exists divlab_analysis_requests_enforce_analysis_depth
  on public.divlab_analysis_requests;
create trigger divlab_analysis_requests_enforce_analysis_depth
  before update of analysis_depth on public.divlab_analysis_requests
  for each row
  execute function public.divlab_analysis_requests_enforce_analysis_depth();

revoke all on function public.divlab_analysis_requests_enforce_analysis_depth()
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_requests_enforce_analysis_depth()
  to service_role;

-- ---------------------------------------------------------------------------
-- Whole-job analysis cost ledger.
-- ---------------------------------------------------------------------------

create table if not exists public.divlab_analysis_cost_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.divlab_analysis_requests (id) on delete restrict,
  user_id uuid null references auth.users (id) on delete set null,
  analysis_depth text not null,
  projection_profile text not null,
  reserved_cost_micro_usd bigint not null,
  accounted_cost_micro_usd bigint null,
  input_tokens integer null,
  output_tokens integer null,
  total_tokens integer null,
  cost_source text null,
  terminal_status text null,
  admission_level text not null,
  status text not null default 'reserved',
  created_at timestamptz not null default now(),
  finalized_at timestamptz null,

  constraint divlab_analysis_cost_events_request_unique unique (request_id),
  constraint divlab_analysis_cost_events_depth_valid check (
    analysis_depth in ('light', 'deep')
  ),
  constraint divlab_analysis_cost_events_projection_profile_format check (
    char_length(projection_profile) between 1 and 64
    and projection_profile ~ '^[a-z0-9_.:-]+$'
  ),
  constraint divlab_analysis_cost_events_reserved_cost_positive check (
    reserved_cost_micro_usd > 0
  ),
  constraint divlab_analysis_cost_events_accounted_cost_positive check (
    accounted_cost_micro_usd is null or accounted_cost_micro_usd > 0
  ),
  constraint divlab_analysis_cost_events_token_counts_non_negative check (
    (input_tokens is null or input_tokens >= 0)
    and (output_tokens is null or output_tokens >= 0)
    and (total_tokens is null or total_tokens >= 0)
  ),
  constraint divlab_analysis_cost_events_cost_source_valid check (
    cost_source is null
    or cost_source in (
      'gateway_actual',
      'conservative_estimate',
      'fail_closed_ceiling'
    )
  ),
  constraint divlab_analysis_cost_events_terminal_status_valid check (
    terminal_status is null
    or terminal_status in (
      'completed',
      'failed',
      'cancelled',
      'provider_unavailable'
    )
  ),
  constraint divlab_analysis_cost_events_admission_level_valid check (
    admission_level in ('under_target', 'warning', 'above_warning')
  ),
  constraint divlab_analysis_cost_events_status_valid check (
    status in ('reserved', 'finalized')
  ),
  constraint divlab_analysis_cost_events_reserved_shape check (
    status <> 'reserved'
    or (
      accounted_cost_micro_usd is null
      and input_tokens is null
      and output_tokens is null
      and total_tokens is null
      and cost_source is null
      and terminal_status is null
      and finalized_at is null
    )
  ),
  constraint divlab_analysis_cost_events_finalized_shape check (
    status <> 'finalized'
    or (
      accounted_cost_micro_usd is not null
      and cost_source is not null
      and terminal_status is not null
      and finalized_at is not null
    )
  )
);

create index if not exists divlab_analysis_cost_events_created_at_idx
  on public.divlab_analysis_cost_events (created_at);

create index if not exists divlab_analysis_cost_events_user_created_idx
  on public.divlab_analysis_cost_events (user_id, created_at desc)
  where user_id is not null;

create index if not exists divlab_analysis_cost_events_status_created_idx
  on public.divlab_analysis_cost_events (status, created_at asc);

create index if not exists divlab_analysis_cost_events_depth_created_idx
  on public.divlab_analysis_cost_events (analysis_depth, created_at desc);

-- The request already has a cost_reservation_id placeholder from the parent
-- foundation. Bind it to the exact Analysis-domain reservation row now.
alter table public.divlab_analysis_requests
  add constraint divlab_analysis_requests_cost_reservation_fk
  foreign key (cost_reservation_id)
  references public.divlab_analysis_cost_events (id)
  on delete restrict;

-- ---------------------------------------------------------------------------
-- Bounded hard-limit aggregate.
-- Reserved amount remains the source of truth for both reserved/finalized rows.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_analysis_cost_reserved_sum_micro_usd(
  p_from timestamptz,
  p_to timestamptz
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(reserved_cost_micro_usd), 0)::bigint
  from public.divlab_analysis_cost_events
  where created_at >= p_from
    and created_at < p_to
    and status in ('reserved', 'finalized');
$$;

-- ---------------------------------------------------------------------------
-- Atomic reserve + request claim.
-- This RPC is the only v1 path that may create an Analysis cost reservation.
-- A successful admission changes the exact request queued -> running in the
-- same transaction, after entitlement has already been reserved.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_reserve_analysis_cost(
  p_request_id uuid,
  p_user_id uuid,
  p_analysis_depth text,
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
  v_request_status text;
  v_request_user_id uuid;
  v_request_depth text;
  v_entitlement_reservation_id uuid;
  v_existing_cost_reservation_id uuid;
  v_existing_user_id uuid;
  v_existing_depth text;
  v_existing_projection_profile text;
  v_existing_reserved_cost bigint;
  v_existing_admission_level text;
  v_day_from timestamptz;
  v_day_to timestamptz;
  v_month_from timestamptz;
  v_month_to timestamptz;
  v_day_sum bigint;
  v_month_sum bigint;
  v_month_after bigint;
  v_reservation_id uuid;
  v_monthly_level text;
begin
  if p_request_id is null
     or p_user_id is null
     or p_analysis_depth is null
     or p_analysis_depth not in ('light', 'deep')
     or p_projection_profile is null
     or char_length(p_projection_profile) not between 1 and 64
     or p_projection_profile !~ '^[a-z0-9_.:-]+$'
     or p_projected_cost_micro_usd is null
     or p_projected_cost_micro_usd <= 0
     or p_max_request_micro_usd is null
     or p_max_request_micro_usd <= 0
     or p_daily_hard_limit_micro_usd is null
     or p_daily_hard_limit_micro_usd <= 0
     or p_monthly_target_micro_usd is null
     or p_monthly_target_micro_usd <= 0
     or p_monthly_warning_micro_usd is null
     or p_monthly_warning_micro_usd <= 0
     or p_monthly_hard_limit_micro_usd is null
     or p_monthly_hard_limit_micro_usd <= 0
     or p_max_request_micro_usd > p_daily_hard_limit_micro_usd
     or p_daily_hard_limit_micro_usd > p_monthly_hard_limit_micro_usd
     or p_monthly_target_micro_usd > p_monthly_warning_micro_usd
     or p_monthly_warning_micro_usd > p_monthly_hard_limit_micro_usd
     or p_now is null
  then
    return jsonb_build_object('ok', false, 'reason', 'config_invalid');
  end if;

  if p_projected_cost_micro_usd > p_max_request_micro_usd then
    return jsonb_build_object('ok', false, 'reason', 'request_projected_over_limit');
  end if;

  -- Serialize all Analysis-domain spend admission across serverless instances.
  perform pg_advisory_xact_lock(hashtext('divlab_analysis_cost_budget_v1'));

  select
    status,
    user_id,
    analysis_depth,
    entitlement_reservation_id,
    cost_reservation_id
  into
    v_request_status,
    v_request_user_id,
    v_request_depth,
    v_entitlement_reservation_id,
    v_existing_cost_reservation_id
  from public.divlab_analysis_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'request_not_found');
  end if;

  if v_request_user_id is null or v_request_user_id is distinct from p_user_id then
    return jsonb_build_object('ok', false, 'reason', 'request_owner_mismatch');
  end if;

  if v_request_depth is distinct from p_analysis_depth then
    return jsonb_build_object('ok', false, 'reason', 'analysis_depth_mismatch');
  end if;

  -- Idempotent recovery: a worker may lose the response after a committed
  -- reservation. A retry with exactly the same parameters recovers the same id.
  if v_request_status = 'running' and v_existing_cost_reservation_id is not null then
    select
      user_id,
      analysis_depth,
      projection_profile,
      reserved_cost_micro_usd,
      admission_level
    into
      v_existing_user_id,
      v_existing_depth,
      v_existing_projection_profile,
      v_existing_reserved_cost,
      v_existing_admission_level
    from public.divlab_analysis_cost_events
    where id = v_existing_cost_reservation_id
      and request_id = p_request_id;

    if not found then
      return jsonb_build_object('ok', false, 'reason', 'reservation_integrity_missing');
    end if;

    if v_existing_user_id is distinct from p_user_id
       or v_existing_depth is distinct from p_analysis_depth
       or v_existing_projection_profile is distinct from p_projection_profile
       or v_existing_reserved_cost is distinct from p_projected_cost_micro_usd
    then
      return jsonb_build_object('ok', false, 'reason', 'reservation_parameters_mismatch');
    end if;

    return jsonb_build_object(
      'ok', true,
      'reservation_id', v_existing_cost_reservation_id,
      'monthly_level', v_existing_admission_level,
      'already_reserved', true
    );
  end if;

  if v_request_status <> 'queued' then
    return jsonb_build_object('ok', false, 'reason', 'request_not_queued');
  end if;

  if v_entitlement_reservation_id is null then
    return jsonb_build_object('ok', false, 'reason', 'entitlement_reservation_missing');
  end if;

  if v_existing_cost_reservation_id is not null then
    return jsonb_build_object('ok', false, 'reason', 'cost_already_reserved');
  end if;

  v_day_from := date_trunc('day', p_now at time zone 'UTC') at time zone 'UTC';
  v_day_to := v_day_from + interval '1 day';
  v_month_from := date_trunc('month', p_now at time zone 'UTC') at time zone 'UTC';
  v_month_to := v_month_from + interval '1 month';

  select public.divlab_analysis_cost_reserved_sum_micro_usd(v_day_from, v_day_to)
    into v_day_sum;
  select public.divlab_analysis_cost_reserved_sum_micro_usd(v_month_from, v_month_to)
    into v_month_sum;

  if v_day_sum is null or v_month_sum is null then
    return jsonb_build_object('ok', false, 'reason', 'aggregate_unavailable');
  end if;

  if v_day_sum + p_projected_cost_micro_usd > p_daily_hard_limit_micro_usd then
    return jsonb_build_object('ok', false, 'reason', 'daily_hard_limit');
  end if;

  if v_month_sum + p_projected_cost_micro_usd > p_monthly_hard_limit_micro_usd then
    return jsonb_build_object('ok', false, 'reason', 'monthly_hard_limit');
  end if;

  v_month_after := v_month_sum + p_projected_cost_micro_usd;
  if v_month_after >= p_monthly_warning_micro_usd then
    v_monthly_level := 'above_warning';
  elsif v_month_after >= p_monthly_target_micro_usd then
    v_monthly_level := 'warning';
  else
    v_monthly_level := 'under_target';
  end if;

  insert into public.divlab_analysis_cost_events (
    request_id,
    user_id,
    analysis_depth,
    projection_profile,
    reserved_cost_micro_usd,
    admission_level,
    status,
    created_at
  )
  values (
    p_request_id,
    p_user_id,
    p_analysis_depth,
    p_projection_profile,
    p_projected_cost_micro_usd,
    v_monthly_level,
    'reserved',
    p_now
  )
  returning id into v_reservation_id;

  update public.divlab_analysis_requests
  set
    status = 'running',
    cost_reservation_id = v_reservation_id,
    started_at = p_now
  where id = p_request_id
    and status = 'queued'
    and cost_reservation_id is null;

  if not found then
    raise exception 'divlab_analysis_cost_request_claim_failed'
      using errcode = 'DAC01';
  end if;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'monthly_level', v_monthly_level,
    'already_reserved', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Finalize whole-job cost after the worker's provider/Analyst attempt(s).
-- Idempotent. Reconciliation can never lower the hard-limit reservation.
-- ---------------------------------------------------------------------------

create or replace function public.divlab_finalize_analysis_cost(
  p_reservation_id uuid,
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
begin
  if p_reservation_id is null
     or p_accounted_cost_micro_usd is null
     or p_accounted_cost_micro_usd <= 0
     or p_cost_source is null
     or p_cost_source not in (
       'gateway_actual',
       'conservative_estimate',
       'fail_closed_ceiling'
     )
     or p_terminal_status is null
     or p_terminal_status not in (
       'completed',
       'failed',
       'cancelled',
       'provider_unavailable'
     )
     or (p_input_tokens is not null and p_input_tokens < 0)
     or (p_output_tokens is not null and p_output_tokens < 0)
     or (p_total_tokens is not null and p_total_tokens < 0)
     or p_now is null
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_finalize');
  end if;

  -- Same lock as admission: if reconciliation raises reserved spend, no new
  -- admission can observe the old lower hard-limit total concurrently.
  perform pg_advisory_xact_lock(hashtext('divlab_analysis_cost_budget_v1'));

  select status into v_status
  from public.divlab_analysis_cost_events
  where id = p_reservation_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reservation_not_found');
  end if;

  if v_status = 'finalized' then
    return jsonb_build_object(
      'ok', true,
      'reservation_id', p_reservation_id,
      'already_finalized', true
    );
  end if;

  if v_status <> 'reserved' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  update public.divlab_analysis_cost_events
  set
    reserved_cost_micro_usd = greatest(
      reserved_cost_micro_usd,
      p_accounted_cost_micro_usd
    ),
    accounted_cost_micro_usd = p_accounted_cost_micro_usd,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    cost_source = p_cost_source,
    terminal_status = p_terminal_status,
    status = 'finalized',
    finalized_at = p_now
  where id = p_reservation_id
    and status = 'reserved';

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'finalize_race');
  end if;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', p_reservation_id,
    'already_finalized', false
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS / least privilege.
-- Cost rows are internal operational data; request owners do not receive direct
-- browser access to projected/actual provider spend in this v1 slice.
-- ---------------------------------------------------------------------------

alter table public.divlab_analysis_cost_events enable row level security;

-- Intentionally no anon/authenticated policies.
revoke all on table public.divlab_analysis_cost_events
  from public, anon, authenticated, service_role;
grant select on table public.divlab_analysis_cost_events to service_role;

revoke all on function public.divlab_analysis_cost_reserved_sum_micro_usd(timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_cost_reserved_sum_micro_usd(timestamptz, timestamptz)
  to service_role;

revoke all on function public.divlab_reserve_analysis_cost(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from public, anon, authenticated;
grant execute on function public.divlab_reserve_analysis_cost(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to service_role;

revoke all on function public.divlab_finalize_analysis_cost(
  uuid, bigint, text, text, integer, integer, integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.divlab_finalize_analysis_cost(
  uuid, bigint, text, text, integer, integer, integer, timestamptz
) to service_role;
