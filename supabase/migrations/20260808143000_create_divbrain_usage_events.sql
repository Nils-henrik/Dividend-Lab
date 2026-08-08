-- DivBrain Issue #103: persistent usage ledger for Cost Guard pre-flight aggregation.
-- Persist schema in repository only. Do not apply remotely in the Cursor task.
--
-- Least privilege:
--   - RLS enabled
--   - no anon / authenticated policies or grants
--   - service_role: SELECT + INSERT only (immutable ledger; no UPDATE/DELETE)
-- Does not weaken existing DivBrain conversation/message RLS or grants.

-- ---------------------------------------------------------------------------
-- Usage events
-- ---------------------------------------------------------------------------

create table if not exists public.divbrain_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid null references public.divbrain_conversations (id) on delete set null,
  message_id uuid null references public.divbrain_messages (id) on delete set null,
  provider_id text not null,
  model_id text not null,
  input_tokens integer null,
  output_tokens integer null,
  total_tokens integer null,
  -- Integer micro-USD (1 USD = 1_000_000). Never floating-point money.
  cost_micro_usd bigint not null,
  cost_source text not null,
  latency_ms integer null,
  terminal_status text not null,
  created_at timestamptz not null default now(),
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
  constraint divbrain_usage_events_cost_micro_usd_positive check (
    cost_micro_usd > 0
  ),
  constraint divbrain_usage_events_cost_source_valid check (
    cost_source in (
      'gateway_actual',
      'conservative_estimate',
      'fail_closed_ceiling'
    )
  ),
  constraint divbrain_usage_events_latency_ms_non_negative check (
    latency_ms is null or latency_ms >= 0
  ),
  constraint divbrain_usage_events_terminal_status_valid check (
    terminal_status in (
      'completed',
      'failed',
      'cancelled',
      'provider_unavailable'
    )
  )
);

-- Bounded day/month aggregation: filter by created_at range and SUM in SQL.
create index if not exists divbrain_usage_events_created_at_idx
  on public.divbrain_usage_events (created_at);

create index if not exists divbrain_usage_events_user_id_created_at_idx
  on public.divbrain_usage_events (user_id, created_at);

-- Server-side aggregate helper for pre-flight budget checks.
-- SECURITY INVOKER: callers need table privileges (service_role only).
create or replace function public.divbrain_usage_cost_sum_micro_usd(
  p_from timestamptz,
  p_to timestamptz
)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(cost_micro_usd), 0)::bigint
  from public.divbrain_usage_events
  where created_at >= p_from
    and created_at < p_to;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (deny-by-default for browser roles)
-- ---------------------------------------------------------------------------

alter table public.divbrain_usage_events enable row level security;

-- Intentionally no policies for anon or authenticated.
-- Trusted server path uses service_role (bypasses RLS) with explicit grants.

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.divbrain_usage_events from public;
revoke all on table public.divbrain_usage_events from anon;
revoke all on table public.divbrain_usage_events from authenticated;

grant select, insert on table public.divbrain_usage_events to service_role;

revoke all on function public.divbrain_usage_cost_sum_micro_usd(timestamptz, timestamptz)
  from public;
revoke all on function public.divbrain_usage_cost_sum_micro_usd(timestamptz, timestamptz)
  from anon;
revoke all on function public.divbrain_usage_cost_sum_micro_usd(timestamptz, timestamptz)
  from authenticated;

grant execute on function public.divbrain_usage_cost_sum_micro_usd(timestamptz, timestamptz)
  to service_role;
