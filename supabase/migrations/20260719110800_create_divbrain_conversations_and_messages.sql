-- DivBrain Ticket 1A-6: conversations + messages persistence foundation.
-- Persist schema in repository only. Do not apply to production in this ticket.
-- Table names use the divbrain_ prefix to avoid collision with private messaging
-- (public.conversations / public.messages).
--
-- Message write model (Model A): authenticated clients SELECT only.
-- All message INSERT/UPDATE/DELETE is deferred to trusted server-side
-- repository/orchestration (Tickets 1A-7a / 1A-7b). No provider_meta column.

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

create table if not exists public.divbrain_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  summary text null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  constraint divbrain_conversations_title_length check (
    char_length(btrim(title)) between 1 and 120
  ),
  constraint divbrain_conversations_schema_version_positive check (
    schema_version >= 1
  )
);

create index if not exists divbrain_conversations_user_id_updated_at_idx
  on public.divbrain_conversations (user_id, updated_at desc);

create index if not exists divbrain_conversations_user_id_updated_at_active_idx
  on public.divbrain_conversations (user_id, updated_at desc)
  where archived_at is null;

drop trigger if exists set_divbrain_conversations_updated_at
  on public.divbrain_conversations;
create trigger set_divbrain_conversations_updated_at
  before update on public.divbrain_conversations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------

create table if not exists public.divbrain_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.divbrain_conversations (id) on delete cascade,
  role text not null,
  content text not null,
  completion_status text not null,
  safety_classification text null,
  sources jsonb not null default '[]'::jsonb,
  error_code text null,
  created_at timestamptz not null default now(),
  constraint divbrain_messages_role_valid check (
    role in ('user', 'assistant', 'system')
  ),
  constraint divbrain_messages_completion_status_valid check (
    completion_status in (
      'pending',
      'generating',
      'completed',
      'blocked',
      'failed',
      'cancelled',
      'provider_unavailable'
    )
  ),
  -- Aligned with merged guardrail decisions (lib/divbrain/guardrails.ts),
  -- not the older blueprint aliases allow_with_disclaimer / require_clarification.
  constraint divbrain_messages_safety_classification_valid check (
    safety_classification is null
    or safety_classification in (
      'allow',
      'allow_with_constraints',
      'block'
    )
  ),
  constraint divbrain_messages_content_rules check (
    char_length(content) <= 4000
    and (
      completion_status <> 'completed'
      or char_length(btrim(content)) > 0
    )
  ),
  constraint divbrain_messages_sources_is_array check (
    jsonb_typeof(sources) = 'array'
  ),
  constraint divbrain_messages_error_code_valid check (
    error_code is null
    or error_code in (
      'authentication_required',
      'access_denied',
      'invalid_request',
      'not_found',
      'safety_blocked',
      'provider_unavailable',
      'rate_limited',
      'persistence_failed',
      'stale_or_unavailable_data',
      'cancelled',
      'internal_error'
    )
  )
);

create index if not exists divbrain_messages_conversation_id_created_at_id_idx
  on public.divbrain_messages (conversation_id, created_at, id);

-- Keep conversation list ordering fresh when messages are appended
-- (trusted server-side inserts only under Model A).
create or replace function public.touch_divbrain_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.divbrain_conversations
  set updated_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists touch_divbrain_conversation_after_message
  on public.divbrain_messages;
create trigger touch_divbrain_conversation_after_message
  after insert on public.divbrain_messages
  for each row
  execute function public.touch_divbrain_conversation_after_message();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.divbrain_conversations enable row level security;
alter table public.divbrain_messages enable row level security;

-- Conversations: owner-only SELECT / INSERT / UPDATE / DELETE.
-- Anon has no policies (deny all).

drop policy if exists "Owners can select their divbrain conversations"
  on public.divbrain_conversations;
create policy "Owners can select their divbrain conversations"
  on public.divbrain_conversations
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Owners can insert their divbrain conversations"
  on public.divbrain_conversations;
create policy "Owners can insert their divbrain conversations"
  on public.divbrain_conversations
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Owners can update their divbrain conversations"
  on public.divbrain_conversations;
create policy "Owners can update their divbrain conversations"
  on public.divbrain_conversations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Owners can delete their divbrain conversations"
  on public.divbrain_conversations;
create policy "Owners can delete their divbrain conversations"
  on public.divbrain_conversations
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Messages (Model A): authenticated SELECT only via parent ownership.
-- No INSERT / UPDATE / DELETE policies for authenticated clients.
-- Message writes are server-owned (later 1A-7a / 1A-7b).

drop policy if exists "Owners can select divbrain messages in their conversations"
  on public.divbrain_messages;
create policy "Owners can select divbrain messages in their conversations"
  on public.divbrain_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.divbrain_conversations as conversation
      where conversation.id = conversation_id
        and conversation.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can insert divbrain messages in their active conversations"
  on public.divbrain_messages;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on table public.divbrain_conversations from public;
revoke all on table public.divbrain_conversations from anon;
revoke all on table public.divbrain_conversations from authenticated;

grant select, delete on table public.divbrain_conversations to authenticated;
grant insert (user_id, title, summary, archived_at)
  on table public.divbrain_conversations to authenticated;
grant update (title, summary, archived_at)
  on table public.divbrain_conversations to authenticated;

revoke all on table public.divbrain_messages from public;
revoke all on table public.divbrain_messages from anon;
revoke all on table public.divbrain_messages from authenticated;

grant select on table public.divbrain_messages to authenticated;

revoke all on function public.touch_divbrain_conversation_after_message() from public;
revoke all on function public.touch_divbrain_conversation_after_message() from anon;
revoke all on function public.touch_divbrain_conversation_after_message() from authenticated;
