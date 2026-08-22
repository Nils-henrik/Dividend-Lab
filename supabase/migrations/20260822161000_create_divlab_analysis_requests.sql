-- DivLab paid analysis request foundation v1.
-- Schema only: no public request endpoint, worker, billing, entitlement provider,
-- model execution or publication is enabled by this migration.
--
-- Security model:
--   - authenticated users may SELECT only their own request metadata;
--   - browser roles receive no INSERT/UPDATE/DELETE privileges;
--   - server/service_role owns all state changes;
--   - one non-terminal request per user prevents concurrent paid executions;
--   - queued work requires an internal entitlement reservation id;
--   - running work additionally requires an internal cost reservation id;
--   - completed work must reference a persisted DivLab analysis version;
--   - requests are durable audit records and are never hard-deleted by app code.

create table if not exists public.divlab_analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete set null,
  idempotency_key uuid not null,
  instrument_symbol text not null,
  exchange text not null,
  instrument_name text not null,
  yahoo_symbol text not null,
  status text not null default 'pending_entitlement',
  entitlement_reservation_id uuid null,
  cost_reservation_id uuid null,
  analysis_version_id uuid null references public.divlab_analysis_versions (id) on delete restrict,
  failure_code text null,
  created_at timestamptz not null default now(),
  queued_at timestamptz null,
  started_at timestamptz null,
  finished_at timestamptz null,

  constraint divlab_analysis_requests_status_valid check (
    status in ('pending_entitlement', 'queued', 'running', 'completed', 'failed')
  ),
  constraint divlab_analysis_requests_symbol_length check (
    char_length(btrim(instrument_symbol)) between 1 and 32
  ),
  constraint divlab_analysis_requests_exchange_length check (
    char_length(btrim(exchange)) between 1 and 16
  ),
  constraint divlab_analysis_requests_name_length check (
    char_length(btrim(instrument_name)) between 1 and 200
  ),
  constraint divlab_analysis_requests_yahoo_symbol_length check (
    char_length(btrim(yahoo_symbol)) between 1 and 64
  ),
  constraint divlab_analysis_requests_failure_code_format check (
    failure_code is null
    or (
      char_length(failure_code) between 1 and 96
      and failure_code ~ '^[a-z0-9_:-]+$'
    )
  ),
  constraint divlab_analysis_requests_timestamp_order check (
    (queued_at is null or queued_at >= created_at)
    and (started_at is null or (queued_at is not null and started_at >= queued_at))
    and (
      finished_at is null
      or finished_at >= coalesce(started_at, queued_at, created_at)
    )
  ),
  constraint divlab_analysis_requests_state_shape check (
    case status
      when 'pending_entitlement' then
        entitlement_reservation_id is null
        and cost_reservation_id is null
        and analysis_version_id is null
        and failure_code is null
        and queued_at is null
        and started_at is null
        and finished_at is null
      when 'queued' then
        entitlement_reservation_id is not null
        and cost_reservation_id is null
        and analysis_version_id is null
        and failure_code is null
        and queued_at is not null
        and started_at is null
        and finished_at is null
      when 'running' then
        entitlement_reservation_id is not null
        and cost_reservation_id is not null
        and analysis_version_id is null
        and failure_code is null
        and queued_at is not null
        and started_at is not null
        and finished_at is null
      when 'completed' then
        entitlement_reservation_id is not null
        and cost_reservation_id is not null
        and analysis_version_id is not null
        and failure_code is null
        and queued_at is not null
        and started_at is not null
        and finished_at is not null
      when 'failed' then
        analysis_version_id is null
        and failure_code is not null
        and finished_at is not null
        and (
          (
            queued_at is null
            and entitlement_reservation_id is null
            and started_at is null
            and cost_reservation_id is null
          )
          or (
            queued_at is not null
            and entitlement_reservation_id is not null
            and (
              (started_at is null and cost_reservation_id is null)
              or (started_at is not null and cost_reservation_id is not null)
            )
          )
        )
      else false
    end
  ),
  constraint divlab_analysis_requests_user_idempotency_unique
    unique (user_id, idempotency_key)
);

-- Fail closed at one active on-demand request per account. This is deliberately
-- conservative for v1 and can be widened only together with explicit plan limits.
create unique index if not exists divlab_analysis_requests_one_active_per_user_idx
  on public.divlab_analysis_requests (user_id)
  where user_id is not null
    and status in ('pending_entitlement', 'queued', 'running');

create index if not exists divlab_analysis_requests_user_created_idx
  on public.divlab_analysis_requests (user_id, created_at desc)
  where user_id is not null;

create index if not exists divlab_analysis_requests_status_created_idx
  on public.divlab_analysis_requests (status, created_at asc);

create index if not exists divlab_analysis_requests_analysis_version_idx
  on public.divlab_analysis_requests (analysis_version_id)
  where analysis_version_id is not null;

-- ---------------------------------------------------------------------------
-- Immutable identity + allowed lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.divlab_analysis_requests_enforce_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Every request is born before entitlement. No trusted caller may insert
  -- directly into queued/running/completed/failed and skip the state machine.
  if tg_op = 'INSERT' then
    if new.status <> 'pending_entitlement' then
      raise exception 'divlab_analysis_request_initial_status_invalid'
        using errcode = 'DAR00';
    end if;
    return new;
  end if;

  if new.idempotency_key is distinct from old.idempotency_key
     or new.instrument_symbol is distinct from old.instrument_symbol
     or new.exchange is distinct from old.exchange
     or new.instrument_name is distinct from old.instrument_name
     or new.yahoo_symbol is distinct from old.yahoo_symbol
     or new.created_at is distinct from old.created_at
  then
    raise exception 'divlab_analysis_request_identity_immutable'
      using errcode = 'DAR01';
  end if;

  -- auth.users ON DELETE SET NULL is the only same-state owner change allowed.
  -- It anonymizes the audit row without erasing request/cost history.
  if new.user_id is distinct from old.user_id then
    if old.user_id is not null
       and new.user_id is null
       and new.status = old.status
       and new.entitlement_reservation_id is not distinct from old.entitlement_reservation_id
       and new.cost_reservation_id is not distinct from old.cost_reservation_id
       and new.analysis_version_id is not distinct from old.analysis_version_id
       and new.failure_code is not distinct from old.failure_code
       and new.queued_at is not distinct from old.queued_at
       and new.started_at is not distinct from old.started_at
       and new.finished_at is not distinct from old.finished_at
    then
      return new;
    end if;

    raise exception 'divlab_analysis_request_owner_immutable'
      using errcode = 'DAR02';
  end if;

  -- Once a reservation or lifecycle timestamp exists, later transitions may
  -- carry it forward but never replace or erase it.
  if old.entitlement_reservation_id is not null
     and new.entitlement_reservation_id is distinct from old.entitlement_reservation_id
  then
    raise exception 'divlab_analysis_request_entitlement_reservation_immutable'
      using errcode = 'DAR05';
  end if;

  if old.cost_reservation_id is not null
     and new.cost_reservation_id is distinct from old.cost_reservation_id
  then
    raise exception 'divlab_analysis_request_cost_reservation_immutable'
      using errcode = 'DAR06';
  end if;

  if old.queued_at is not null and new.queued_at is distinct from old.queued_at then
    raise exception 'divlab_analysis_request_queued_at_immutable'
      using errcode = 'DAR07';
  end if;

  if old.started_at is not null and new.started_at is distinct from old.started_at then
    raise exception 'divlab_analysis_request_started_at_immutable'
      using errcode = 'DAR08';
  end if;

  if old.finished_at is not null and new.finished_at is distinct from old.finished_at then
    raise exception 'divlab_analysis_request_finished_at_immutable'
      using errcode = 'DAR09';
  end if;

  -- A failure may only contain the reservations/timestamps already reached by
  -- the previous lifecycle state. This prevents queued -> failed from being
  -- used to manufacture a cost reservation without ever entering running.
  if new.status = 'failed' then
    if old.status = 'pending_entitlement'
       and (
         new.entitlement_reservation_id is not null
         or new.cost_reservation_id is not null
         or new.queued_at is not null
         or new.started_at is not null
       )
    then
      raise exception 'divlab_analysis_request_failed_stage_invalid'
        using errcode = 'DAR10';
    end if;

    if old.status = 'queued'
       and (new.cost_reservation_id is not null or new.started_at is not null)
    then
      raise exception 'divlab_analysis_request_failed_stage_invalid'
        using errcode = 'DAR10';
    end if;
  end if;

  if new.status = old.status then
    raise exception 'divlab_analysis_request_status_update_required'
      using errcode = 'DAR03';
  end if;

  if not (
    (old.status = 'pending_entitlement' and new.status in ('queued', 'failed'))
    or (old.status = 'queued' and new.status in ('running', 'failed'))
    or (old.status = 'running' and new.status in ('completed', 'failed'))
  ) then
    raise exception 'divlab_analysis_request_transition_invalid'
      using errcode = 'DAR04';
  end if;

  return new;
end;
$$;

drop trigger if exists divlab_analysis_requests_enforce_lifecycle
  on public.divlab_analysis_requests;
create trigger divlab_analysis_requests_enforce_lifecycle
  before insert or update on public.divlab_analysis_requests
  for each row
  execute function public.divlab_analysis_requests_enforce_lifecycle();

revoke all on function public.divlab_analysis_requests_enforce_lifecycle()
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_requests_enforce_lifecycle()
  to service_role;

-- ---------------------------------------------------------------------------
-- RLS / least privilege
-- ---------------------------------------------------------------------------

alter table public.divlab_analysis_requests enable row level security;

drop policy if exists "Owners can read their DivLab analysis requests"
  on public.divlab_analysis_requests;
create policy "Owners can read their DivLab analysis requests"
  on public.divlab_analysis_requests
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Browser users can observe their own job status only. They cannot manufacture
-- entitlement/cost reservations, mutate state or attach a result version.
revoke all on table public.divlab_analysis_requests from public, anon, authenticated, service_role;
grant select on table public.divlab_analysis_requests to authenticated;
grant select, insert, update on table public.divlab_analysis_requests to service_role;

-- No DELETE grant: request/job rows are durable audit records. Account deletion
-- anonymizes user_id through ON DELETE SET NULL instead of erasing execution history.
