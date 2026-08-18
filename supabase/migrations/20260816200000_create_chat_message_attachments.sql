-- Chat attachments v1 (Issue #239): private 1:1 file metadata + storage.
--
-- Model: authenticated clients SELECT only ready, message-linked rows for
-- conversations they participate in. All INSERT/UPDATE/DELETE of attachment
-- rows is service-role / security-definer RPC. Storage bucket is PRIVATE.
-- No permanent public object URLs. No storage.objects policies for this bucket.
--
-- Lifecycle:
--   pending  -> signed upload URL (not visible in transcript)
--   confirm  -> server sniffs bytes, status=ready, still unlinked
--   send     -> send_private_message_with_attachments links rows + inserts
--               the message in one transaction (empty body allowed iff
--               attachments are present)
--
-- Cleanup: conversation/account DELETE cascades attachment metadata via FK.
-- Physical private objects MUST be removed through the Supabase Storage API
-- in trusted application code. Do not DELETE FROM storage.objects directly.
-- Abandoned unlinked rows (message_id IS NULL, status <> 'deleted') older
-- than 24h are retired opportunistically before prepare; a BEFORE INSERT
-- trigger enforces a per-uploader active-unlinked cap of 10.

-- ---------------------------------------------------------------------------
-- Allow attachment-only messages (empty body) at the table layer.
-- send_private_message still requires a non-empty body (text-only path).
-- ---------------------------------------------------------------------------

alter table public.messages
  drop constraint if exists messages_body_length;

alter table public.messages
  add constraint messages_body_length check (
    char_length(btrim(body)) between 0 and 2000
  );

alter table public.messages
  add column if not exists has_attachments boolean not null default false;

-- ---------------------------------------------------------------------------
-- Attachment metadata
-- ---------------------------------------------------------------------------

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  message_id uuid null references public.messages (id) on delete cascade,
  uploader_id uuid not null references auth.users (id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null,
  checksum_sha256 text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_attachments_status_valid check (
    status in ('pending', 'uploaded', 'ready', 'failed', 'deleted')
  ),
  constraint message_attachments_filename_length check (
    char_length(btrim(original_filename)) between 1 and 200
  ),
  constraint message_attachments_mime_type_allowed check (
    mime_type in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv'
    )
  ),
  constraint message_attachments_byte_size_positive check (
    byte_size > 0 and byte_size <= 10485760
  ),
  constraint message_attachments_storage_bucket_length check (
    char_length(btrim(storage_bucket)) between 1 and 64
  ),
  constraint message_attachments_storage_path_length check (
    char_length(btrim(storage_path)) between 1 and 512
  ),
  constraint message_attachments_checksum_sha256_format check (
    checksum_sha256 is null
    or checksum_sha256 ~ '^[a-f0-9]{64}$'
  ),
  constraint message_attachments_storage_path_unique unique (storage_bucket, storage_path),
  constraint message_attachments_linked_ready check (
    message_id is null or status = 'ready'
  )
);

create index if not exists message_attachments_conversation_message_idx
  on public.message_attachments (conversation_id, message_id)
  where message_id is not null and status = 'ready';

create index if not exists message_attachments_message_id_idx
  on public.message_attachments (message_id)
  where message_id is not null;

create index if not exists message_attachments_uploader_unlinked_created_idx
  on public.message_attachments (uploader_id, created_at asc)
  where message_id is null and status <> 'deleted';

drop trigger if exists set_message_attachments_updated_at
  on public.message_attachments;
create trigger set_message_attachments_updated_at
  before update on public.message_attachments
  for each row
  execute function public.set_updated_at();

-- Linked attachments cannot be reassigned or unlinked.
create or replace function public.message_attachments_protect_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.message_id is not null
       and new.message_id is distinct from old.message_id then
      raise exception 'linked chat attachments cannot be reassigned';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists message_attachments_protect_link
  on public.message_attachments;
create trigger message_attachments_protect_link
  before update on public.message_attachments
  for each row
  execute function public.message_attachments_protect_link();

revoke all on function public.message_attachments_protect_link() from public;
revoke all on function public.message_attachments_protect_link()
  from anon, authenticated;
grant execute on function public.message_attachments_protect_link()
  to service_role;

-- ---------------------------------------------------------------------------
-- Atomic active-unlinked quota (concurrency-safe at insert boundary)
-- ---------------------------------------------------------------------------
-- Active unlinked rows: message_id IS NULL AND status <> 'deleted'.
-- Cap: 10 per uploader. Application still runs opportunistic 24h TTL cleanup
-- before prepare; this trigger is the hard concurrency guarantee.
-- Stable raise contract:
--   SQLSTATE CHQ20 / message chat_attachment_unlinked_quota_exceeded

create or replace function public.message_attachments_enforce_unlinked_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.message_id is not null or new.status = 'deleted' then
    return new;
  end if;

  -- Namespace 239000001 is chat unlinked-attachment quota (stable int).
  perform pg_catalog.pg_advisory_xact_lock(
    239000001,
    pg_catalog.hashtext(new.uploader_id::text)
  );

  select count(*)::integer
  into active_count
  from public.message_attachments
  where uploader_id = new.uploader_id
    and message_id is null
    and status <> 'deleted';

  if active_count >= 10 then
    raise exception 'chat_attachment_unlinked_quota_exceeded'
      using errcode = 'CHQ20';
  end if;

  return new;
end;
$$;

drop trigger if exists message_attachments_enforce_unlinked_quota
  on public.message_attachments;
create trigger message_attachments_enforce_unlinked_quota
  before insert on public.message_attachments
  for each row
  execute function public.message_attachments_enforce_unlinked_quota();

revoke all on function public.message_attachments_enforce_unlinked_quota()
  from public;
revoke all on function public.message_attachments_enforce_unlinked_quota()
  from anon, authenticated;
grant execute on function public.message_attachments_enforce_unlinked_quota()
  to service_role;

-- ---------------------------------------------------------------------------
-- RLS (participant SELECT of ready+linked rows only)
-- ---------------------------------------------------------------------------

alter table public.message_attachments enable row level security;
alter table public.message_attachments force row level security;

drop policy if exists "Participants can read linked chat attachments"
  on public.message_attachments;
create policy "Participants can read linked chat attachments"
  on public.message_attachments
  for select
  to authenticated
  using (
    status = 'ready'
    and message_id is not null
    and public.is_conversation_participant(
      conversation_id,
      (select auth.uid())
    )
  );

-- No INSERT / UPDATE / DELETE policies for authenticated clients.

revoke all on table public.message_attachments from anon;
revoke all on table public.message_attachments from authenticated;
grant select on table public.message_attachments to authenticated;

grant select, insert, update, delete
on table public.message_attachments
to service_role;

-- ---------------------------------------------------------------------------
-- Atomic send with attachments
-- ---------------------------------------------------------------------------

create or replace function public.send_private_message_with_attachments(
  p_conversation_id uuid,
  p_body text,
  p_attachment_ids uuid[]
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user_id uuid := auth.uid();
  normalized_body text := coalesce(btrim(coalesce(p_body, '')), '');
  attachment_ids uuid[] := coalesce(p_attachment_ids, '{}'::uuid[]);
  unique_count integer;
  matched_count integer;
  total_bytes bigint;
  result_row public.messages;
begin
  if acting_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if p_conversation_id is null then
    raise exception 'Conversation is required.';
  end if;

  if char_length(normalized_body) > 2000 then
    raise exception 'Message is too long.';
  end if;

  select count(distinct attachment_id)::integer
  into unique_count
  from unnest(attachment_ids) as attachment_id;

  if unique_count <> cardinality(attachment_ids) then
    raise exception 'Duplicate attachments are not allowed.';
  end if;

  if cardinality(attachment_ids) > 3 then
    raise exception 'Too many attachments.';
  end if;

  if char_length(normalized_body) = 0 and cardinality(attachment_ids) = 0 then
    raise exception 'Message is required.';
  end if;

  if not public.can_send_private_message(p_conversation_id, acting_user_id) then
    raise exception 'You cannot send a message in this conversation.';
  end if;

  if cardinality(attachment_ids) > 0 then
    perform 1
    from public.message_attachments
    where id = any(attachment_ids)
      and conversation_id = p_conversation_id
      and uploader_id = acting_user_id
      and status = 'ready'
      and message_id is null
    for update;

    select
      count(*)::integer,
      coalesce(sum(byte_size), 0)::bigint
    into matched_count, total_bytes
    from public.message_attachments
    where id = any(attachment_ids)
      and conversation_id = p_conversation_id
      and uploader_id = acting_user_id
      and status = 'ready'
      and message_id is null;

    if matched_count is distinct from cardinality(attachment_ids) then
      raise exception 'Attachments are not ready.';
    end if;

    if total_bytes > 20971520 then
      raise exception 'Attachments are too large together.';
    end if;
  end if;

  insert into public.messages (
    conversation_id,
    sender_id,
    body,
    has_attachments
  )
  values (
    p_conversation_id,
    acting_user_id,
    normalized_body,
    cardinality(attachment_ids) > 0
  )
  returning * into result_row;

  if cardinality(attachment_ids) > 0 then
    update public.message_attachments
    set
      message_id = result_row.id,
      status = 'ready'
    where id = any(attachment_ids)
      and conversation_id = p_conversation_id
      and uploader_id = acting_user_id
      and status = 'ready'
      and message_id is null;

    if not found then
      raise exception 'Attachments could not be linked.';
    end if;

    if (
      select count(*)::integer
      from public.message_attachments
      where message_id = result_row.id
        and id = any(attachment_ids)
    ) is distinct from cardinality(attachment_ids) then
      raise exception 'Attachments could not be linked.';
    end if;
  end if;

  return result_row;
end;
$$;

revoke all on function public.send_private_message_with_attachments(uuid, text, uuid[])
  from public;
grant execute on function public.send_private_message_with_attachments(uuid, text, uuid[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No authenticated or public storage.objects policies for this bucket.
-- Uploads and downloads use short-lived signed URLs created by the trusted server.
-- Physical object deletion is performed only via the Storage API in app code.
