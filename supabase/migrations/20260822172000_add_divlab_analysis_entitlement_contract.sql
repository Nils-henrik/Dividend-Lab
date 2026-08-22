-- DivLab Analysis Entitlement Interface v1 metadata boundary.
-- Repository-only and inert: this migration does not configure an entitlement
-- provider, billing system, Request API, worker or Production analysis route.
--
-- The provider-neutral TypeScript interface returns an internal reservation UUID,
-- provider id and expiry. This migration makes that provenance durable and makes
-- stale entitlement fail closed at queued/running lifecycle transitions.

alter table public.divlab_analysis_requests
  add column if not exists entitlement_provider_id text null,
  add column if not exists entitlement_expires_at timestamptz null;

alter table public.divlab_analysis_requests
  add constraint divlab_analysis_requests_entitlement_provider_format
  check (
    entitlement_provider_id is null
    or (
      char_length(entitlement_provider_id) between 1 and 64
      and entitlement_provider_id ~ '^[a-z0-9_.:-]+$'
    )
  );

alter table public.divlab_analysis_requests
  add constraint divlab_analysis_requests_entitlement_metadata_shape
  check (
    (
      entitlement_reservation_id is null
      and entitlement_provider_id is null
      and entitlement_expires_at is null
    )
    or (
      entitlement_reservation_id is not null
      and entitlement_provider_id is not null
      and entitlement_expires_at is not null
    )
  );

alter table public.divlab_analysis_requests
  add constraint divlab_analysis_requests_entitlement_expiry_after_creation
  check (
    entitlement_expires_at is null
    or entitlement_expires_at > created_at
  );

-- Keep entitlement provenance immutable once set and reject stale reservations
-- at the exact lifecycle boundaries where entitlement begins authorizing work.
create or replace function public.divlab_analysis_requests_enforce_entitlement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.entitlement_provider_id is not null
     and new.entitlement_provider_id is distinct from old.entitlement_provider_id
  then
    raise exception 'divlab_analysis_entitlement_provider_immutable'
      using errcode = 'DAE01';
  end if;

  if old.entitlement_expires_at is not null
     and new.entitlement_expires_at is distinct from old.entitlement_expires_at
  then
    raise exception 'divlab_analysis_entitlement_expiry_immutable'
      using errcode = 'DAE02';
  end if;

  -- pending_entitlement -> queued is the first point where a reservation grants
  -- execution eligibility. It must still be live at queued_at.
  if old.status = 'pending_entitlement' and new.status = 'queued' then
    if new.entitlement_reservation_id is null
       or new.entitlement_provider_id is null
       or new.entitlement_expires_at is null
       or new.queued_at is null
       or new.entitlement_expires_at <= new.queued_at
    then
      raise exception 'divlab_analysis_entitlement_not_live_at_queue'
        using errcode = 'DAE03';
    end if;
  end if;

  -- queued -> running is cost-bearing admission. Cost Guard sets started_at in
  -- the same transaction as its reservation. If entitlement expired while the
  -- request waited in queue, reject the state transition and roll back cost.
  if old.status = 'queued' and new.status = 'running' then
    if new.entitlement_reservation_id is null
       or new.entitlement_provider_id is null
       or new.entitlement_expires_at is null
       or new.started_at is null
       or new.entitlement_expires_at <= new.started_at
    then
      raise exception 'divlab_analysis_entitlement_expired_before_running'
        using errcode = 'DAE04';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists divlab_analysis_requests_enforce_entitlement
  on public.divlab_analysis_requests;
create trigger divlab_analysis_requests_enforce_entitlement
  before update of
    status,
    entitlement_reservation_id,
    entitlement_provider_id,
    entitlement_expires_at,
    queued_at,
    started_at
  on public.divlab_analysis_requests
  for each row
  execute function public.divlab_analysis_requests_enforce_entitlement();

revoke all on function public.divlab_analysis_requests_enforce_entitlement()
  from public, anon, authenticated;
grant execute on function public.divlab_analysis_requests_enforce_entitlement()
  to service_role;
