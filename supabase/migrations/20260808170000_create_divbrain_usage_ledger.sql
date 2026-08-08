-- DivBrain Issue #105 / #103: atomic usage ledger + Cost Guard reservation.
-- Hardened replacement for unmerged PR #104 schema.
-- Persist schema in repository only. Do not apply remotely in the Cursor task.
--
-- Design:
--   - Pre-call projected charges are reserved atomically (check + insert)
--     under a transaction advisory lock before any provider/network generate.
--   - Hard-limit accounting uses reserved_cost_micro_usd for both reserved and
--     finalized rows (conservative over-reservation; never double-counts).
--   - accounted_cost_micro_usd stores reconciled actual/estimate for ops only
--     and must never reduce hard-limit totals.
--   - user_id is nullable ON DELETE SET NULL so account deletion preserves spend.
--
-- Least privilege:
--   - RLS enabled; no anon / authenticated policies or grants
--   - service_role: SELECT on table + EXECUTE on reserve/finalize/sum RPCs
--   - Mutations only via SECURITY DEFINER RPCs (no direct INSERT/UPDATE/DELETE)
--   - SECURITY DEFINER hardened with search_path + EXECUTE revoked from public/anon/auth

-- ---------------------------------------------------------------------------
-- Usage events (reservation + finalized accounting in one row)
-- ---------------------------------------------------------------------------

create table if not exists public.divbrain_usage_events (
  id uuid primary key default gen_random_uuid(),
  -- Privacy-safe: deleting auth.users anonymizes the actor, never erases spend.
  user_id uuid null references auth.users (id) on delete set null,
  conversation_id uuid null references public.divbrain_conversations (id) on delete set null,
  message_id uuid null references public.divbrain_messages (id) on delete set null,
  provider_id text not null,
  model_id text not null,
  input_tokens integer null,
  output_tokens integer null,
  total_tokens integer null,
  -- Integer micro-USD (1 USD = 1_000_000). Never floating-point money.
  -- Hard-limit source of truth for reserved + finalized rows.
  reserved_cost_micro_usd bigint not null,
  -- Observability / reconciliation only. Never used to lower hard-limit totals.
  accounted_cost_micro_usd bigint null,
  cost_source text null,
  latency_ms integer null,
  terminal_status text null,
  status text not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz null,
  constraint divbrain_usage_events_provider_id_length check (
    char_length(btrim(provider_id)) between 1 and 64
  ),
  constraint divbrain_usage_events_model_id_length check (
    char_length(btrim(model_id)) between 1 and 192
  ),
  constraint divbrain_usage_events_token_counts_non_negative check (
    (input_tokens is null or input_tokens >= 0)
    and (output_tokens is null or output_tokens >= 0)
    and (total_tokens is null or total_tokens >= 0)
  ),
  constraint divbrain_usage_events_reserved_cost_positive check (
    reserved_cost_micro_usd > 0
  ),
  constraint divbrain_usage_events_accounted_cost_positive check (
    accounted_cost_micro_usd is null or accounted_cost_micro_usd > 0
  ),
  constraint divbrain_usage_events_cost_source_valid check (
    cost_source is null
    or cost_source in (
      'gateway_actual',
      'conservative_estimate',
      'fail_closed_ceiling'
    )
  ),
  constraint divbrain_usage_events_latency_ms_non_negative check (
    latency_ms is null or latency_ms >= 0
  ),
  constraint divbrain_usage_events_terminal_status_valid check (
    terminal_status is null
    or terminal_status in (
      'completed',
      'failed',
      'cancelled',
      'provider_unavailable'
    )
  ),
  constraint divbrain_usage_events_status_valid check (
    status in ('reserved', 'finalized')
  ),
  constraint divbrain_usage_events_reserved_shape check (
    status <> 'reserved'
    or (
      accounted_cost_micro_usd is null
      and cost_source is null
      and terminal_status is null
      and finalized_at is null
    )
  ),
  constraint divbrain_usage_events_finalized_shape check (
    status <> 'finalized'
    or (
      accounted_cost_micro_usd is not null
      and cost_source is not null
      and terminal_status is not null
      and finalized_at is not null
    )
  )
);

-- Bounded day/month aggregation: filter by created_at range and SUM in SQL.
create index if not exists divbrain_usage_events_created_at_idx
  on public.divbrain_usage_events (created_at);

create index if not exists divbrain_usage_events_user_id_created_at_idx
  on public.divbrain_usage_events (user_id, created_at);

create index if not exists divbrain_usage_events_status_created_at_idx
  on public.divbrain_usage_events (status, created_at);

-- ---------------------------------------------------------------------------
-- Bounded hard-limit sum (reserved_cost for reserved + finalized rows)
-- ---------------------------------------------------------------------------

create or replace function public.divbrain_usage_reserved_cost_sum_micro_usd(
  p_from timestamptz,
  p_to timestamptz
)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(reserved_cost_micro_usd), 0)::bigint
  from public.divbrain_usage_events
  where created_at >= p_from
    and created_at < p_to
    and status in ('reserved', 'finalized');
$$;

-- ---------------------------------------------------------------------------
-- Atomic budget reservation (must precede provider.generate)
-- ---------------------------------------------------------------------------
-- Uses a transaction-scoped advisory lock so concurrent serverless instances
-- cannot jointly pass the same day/month balance (TOCTOU-safe).
-- Returns jsonb:
--   {"ok": true, "reservation_id": "<uuid>", "monthly_level": "under_target"|"warning"|"above_warning"}
--   {"ok": false, "reason": "<denial reason>"}

create or replace function public.divbrain_reserve_usage_budget(
  p_user_id uuid,
  p_conversation_id uuid,
  p_provider_id text,
  p_model_id text,
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
set search_path = public
as $$
declare
  v_day_from timestamptz;
  v_day_to timestamptz;
  v_month_from timestamptz;
  v_month_to timestamptz;
  v_day_sum bigint;
  v_month_sum bigint;
  v_reservation_id uuid;
  v_monthly_level text;
begin
  if p_user_id is null
     or p_provider_id is null
     or btrim(p_provider_id) = ''
     or char_length(btrim(p_provider_id)) > 64
     or p_model_id is null
     or btrim(p_model_id) = ''
     or char_length(btrim(p_model_id)) > 192
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

  -- Serialize budget admission across concurrent instances for this project.
  perform pg_advisory_xact_lock(hashtext('divbrain_usage_budget_v1'));

  v_day_from := date_trunc('day', p_now at time zone 'UTC') at time zone 'UTC';
  v_day_to := v_day_from + interval '1 day';
  v_month_from := date_trunc('month', p_now at time zone 'UTC') at time zone 'UTC';
  v_month_to := v_month_from + interval '1 month';

  select public.divbrain_usage_reserved_cost_sum_micro_usd(v_day_from, v_day_to)
    into v_day_sum;
  select public.divbrain_usage_reserved_cost_sum_micro_usd(v_month_from, v_month_to)
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

  if v_month_sum >= p_monthly_warning_micro_usd then
    v_monthly_level := 'above_warning';
  elsif v_month_sum >= p_monthly_target_micro_usd then
    v_monthly_level := 'warning';
  else
    v_monthly_level := 'under_target';
  end if;

  insert into public.divbrain_usage_events (
    user_id,
    conversation_id,
    provider_id,
    model_id,
    reserved_cost_micro_usd,
    status,
    created_at
  )
  values (
    p_user_id,
    p_conversation_id,
    btrim(p_provider_id),
    btrim(p_model_id),
    p_projected_cost_micro_usd,
    'reserved',
    p_now
  )
  returning id into v_reservation_id;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'monthly_level', v_monthly_level
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Finalize reservation after provider attempt (durable cost representation)
-- ---------------------------------------------------------------------------
-- Idempotent for already-finalized rows. Never deletes or reduces reserved_cost.
-- accounted_cost may be lower/higher than reserved; hard limits stay on reserved.

create or replace function public.divbrain_finalize_usage_budget(
  p_reservation_id uuid,
  p_accounted_cost_micro_usd bigint,
  p_cost_source text,
  p_terminal_status text,
  p_input_tokens integer default null,
  p_output_tokens integer default null,
  p_total_tokens integer default null,
  p_latency_ms integer default null,
  p_message_id uuid default null,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
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
     or (p_latency_ms is not null and p_latency_ms < 0)
     or p_now is null
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid_finalize');
  end if;

  select status into v_status
  from public.divbrain_usage_events
  where id = p_reservation_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'reservation_not_found');
  end if;

  if v_status = 'finalized' then
    return jsonb_build_object('ok', true, 'reservation_id', p_reservation_id, 'already_finalized', true);
  end if;

  if v_status <> 'reserved' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_status');
  end if;

  update public.divbrain_usage_events
  set
    accounted_cost_micro_usd = p_accounted_cost_micro_usd,
    cost_source = p_cost_source,
    terminal_status = p_terminal_status,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    latency_ms = p_latency_ms,
    message_id = coalesce(p_message_id, message_id),
    status = 'finalized',
    finalized_at = p_now
  where id = p_reservation_id
    and status = 'reserved';

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'finalize_race');
  end if;

  return jsonb_build_object('ok', true, 'reservation_id', p_reservation_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (deny-by-default for browser roles)
-- ---------------------------------------------------------------------------

alter table public.divbrain_usage_events enable row level security;

-- Intentionally no policies for anon or authenticated.
-- Trusted server path uses service_role with explicit grants + RPCs.

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.divbrain_usage_events from public;
revoke all on table public.divbrain_usage_events from anon;
revoke all on table public.divbrain_usage_events from authenticated;

-- SELECT for trusted server observability; mutations only via DEFINER RPCs.
grant select on table public.divbrain_usage_events to service_role;

revoke all on function public.divbrain_usage_reserved_cost_sum_micro_usd(timestamptz, timestamptz)
  from public;
revoke all on function public.divbrain_usage_reserved_cost_sum_micro_usd(timestamptz, timestamptz)
  from anon;
revoke all on function public.divbrain_usage_reserved_cost_sum_micro_usd(timestamptz, timestamptz)
  from authenticated;

grant execute on function public.divbrain_usage_reserved_cost_sum_micro_usd(timestamptz, timestamptz)
  to service_role;

revoke all on function public.divbrain_reserve_usage_budget(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from public;
revoke all on function public.divbrain_reserve_usage_budget(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from anon;
revoke all on function public.divbrain_reserve_usage_budget(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) from authenticated;

grant execute on function public.divbrain_reserve_usage_budget(
  uuid, uuid, text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to service_role;

revoke all on function public.divbrain_finalize_usage_budget(
  uuid, bigint, text, text, integer, integer, integer, integer, uuid, timestamptz
) from public;
revoke all on function public.divbrain_finalize_usage_budget(
  uuid, bigint, text, text, integer, integer, integer, integer, uuid, timestamptz
) from anon;
revoke all on function public.divbrain_finalize_usage_budget(
  uuid, bigint, text, text, integer, integer, integer, integer, uuid, timestamptz
) from authenticated;

grant execute on function public.divbrain_finalize_usage_budget(
  uuid, bigint, text, text, integer, integer, integer, integer, uuid, timestamptz
) to service_role;
