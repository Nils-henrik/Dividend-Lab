create table public.divlab_daily_case_runs (
  id uuid primary key default gen_random_uuid(),
  selection_date date not null,
  run_key text not null,
  as_of timestamptz not null,
  audit_version text not null,
  funnel_version text not null,
  market_shortlist_version text not null,
  desk_version text not null,
  universe_count integer not null,
  selected_for_preflight_count integer not null,
  preflight_ready_count integer not null,
  selected_for_deep_research_count integer not null,
  audit_packet jsonb not null,
  created_at timestamptz not null default now(),
  unique (selection_date, run_key),
  check (length(run_key) between 1 and 96 and run_key ~ '^[A-Za-z0-9._:-]+$'),
  check (as_of <= now() + interval '5 minutes'),
  check (length(audit_version) between 1 and 64),
  check (length(funnel_version) between 1 and 64),
  check (length(market_shortlist_version) between 1 and 64),
  check (length(desk_version) between 1 and 64),
  check (universe_count between 0 and 300),
  check (selected_for_preflight_count between 0 and 20 and selected_for_preflight_count <= universe_count),
  check (preflight_ready_count between 0 and selected_for_preflight_count),
  check (selected_for_deep_research_count between 0 and 4 and selected_for_deep_research_count <= preflight_ready_count),
  check (jsonb_typeof(audit_packet) = 'object'),
  check (octet_length(audit_packet::text) <= 8388608),
  check (audit_packet ->> 'version' is not null and audit_packet ->> 'version' = audit_version),
  check (audit_packet ->> 'selectionDate' is not null and audit_packet ->> 'selectionDate' = selection_date::text),
  check (audit_packet ->> 'runKey' is not null and audit_packet ->> 'runKey' = run_key),
  check (audit_packet ->> 'asOf' is not null and (audit_packet ->> 'asOf')::timestamptz = as_of),
  check (audit_packet #>> '{funnel,version}' is not null and audit_packet #>> '{funnel,version}' = funnel_version),
  check (audit_packet #>> '{funnel,marketShortlist,version}' is not null and audit_packet #>> '{funnel,marketShortlist,version}' = market_shortlist_version),
  check (audit_packet #>> '{funnel,desk,version}' is not null and audit_packet #>> '{funnel,desk,version}' = desk_version),
  check (audit_packet #>> '{stats,universe}' is not null and (audit_packet #>> '{stats,universe}')::integer = universe_count),
  check (audit_packet #>> '{stats,selectedForMethodologyPreflight}' is not null and (audit_packet #>> '{stats,selectedForMethodologyPreflight}')::integer = selected_for_preflight_count),
  check (audit_packet #>> '{stats,methodologyPreflightReady}' is not null and (audit_packet #>> '{stats,methodologyPreflightReady}')::integer = preflight_ready_count),
  check (audit_packet #>> '{stats,selectedForDeepResearch}' is not null and (audit_packet #>> '{stats,selectedForDeepResearch}')::integer = selected_for_deep_research_count),
  check (jsonb_typeof(audit_packet -> 'sources') = 'array' and jsonb_array_length(audit_packet -> 'sources') <= 2000),
  check (jsonb_typeof(audit_packet #> '{funnel,marketCandidateAudit}') = 'array' and jsonb_array_length(audit_packet #> '{funnel,marketCandidateAudit}') = universe_count),
  check (jsonb_typeof(audit_packet #> '{funnel,marketShortlist,selected}') = 'array' and jsonb_array_length(audit_packet #> '{funnel,marketShortlist,selected}') = selected_for_preflight_count),
  check (jsonb_typeof(audit_packet #> '{funnel,desk,preflightAudit}') = 'array' and jsonb_array_length(audit_packet #> '{funnel,desk,preflightAudit}') = selected_for_preflight_count),
  check (jsonb_typeof(audit_packet #> '{funnel,desk,selectionCandidateAudit}') = 'array' and jsonb_array_length(audit_packet #> '{funnel,desk,selectionCandidateAudit}') = preflight_ready_count),
  check (jsonb_typeof(audit_packet #> '{funnel,desk,selection,selected}') = 'array' and jsonb_array_length(audit_packet #> '{funnel,desk,selection,selected}') = selected_for_deep_research_count)
);

create index divlab_daily_case_runs_as_of_idx
  on public.divlab_daily_case_runs (as_of desc);

alter table public.divlab_daily_case_runs enable row level security;
revoke all on public.divlab_daily_case_runs from public, anon, authenticated, service_role;
grant select, insert on public.divlab_daily_case_runs to service_role;
