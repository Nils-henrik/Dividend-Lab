-- DivBrain attachments v1 (Issue #166): private file metadata + storage.
-- Model A: authenticated clients SELECT attachment metadata only.
-- All INSERT/UPDATE/DELETE of attachment rows is service-role / server-owned.
-- Storage bucket is PRIVATE. No permanent public object URLs.
--
-- Cleanup: conversation DELETE cascades attachment rows. A BEFORE DELETE trigger
-- on divbrain_conversations removes private storage objects for that conversation
-- (bounded best-effort cleanup; orphaned objects without metadata are not
-- accessible via app APIs because paths are server-generated and ownership-checked).

-- ---------------------------------------------------------------------------
-- Attachments metadata
-- ---------------------------------------------------------------------------

create table if not exists public.divbrain_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.divbrain_conversations (id) on delete cascade,
  message_id uuid null references public.divbrain_messages (id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null,
  checksum_sha256 text null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint divbrain_attachments_status_valid check (
    status in ('pending', 'uploaded', 'ready', 'failed', 'deleted')
  ),
  constraint divbrain_attachments_filename_length check (
    char_length(btrim(original_filename)) between 1 and 200
  ),
  constraint divbrain_attachments_mime_type_length check (
    char_length(btrim(mime_type)) between 1 and 120
  ),
  constraint divbrain_attachments_byte_size_positive check (
    byte_size > 0 and byte_size <= 20971520
  ),
  constraint divbrain_attachments_storage_bucket_length check (
    char_length(btrim(storage_bucket)) between 1 and 64
  ),
  constraint divbrain_attachments_storage_path_length check (
    char_length(btrim(storage_path)) between 1 and 512
  ),
  constraint divbrain_attachments_checksum_sha256_format check (
    checksum_sha256 is null
    or checksum_sha256 ~ '^[a-f0-9]{64}$'
  ),
  constraint divbrain_attachments_storage_path_unique unique (storage_bucket, storage_path)
);

create index if not exists divbrain_attachments_user_conversation_created_idx
  on public.divbrain_attachments (user_id, conversation_id, created_at desc);

create index if not exists divbrain_attachments_message_id_idx
  on public.divbrain_attachments (message_id)
  where message_id is not null;

create index if not exists divbrain_attachments_conversation_status_idx
  on public.divbrain_attachments (conversation_id, status);

drop trigger if exists set_divbrain_attachments_updated_at
  on public.divbrain_attachments;
create trigger set_divbrain_attachments_updated_at
  before update on public.divbrain_attachments
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage cleanup on permanent conversation delete
-- ---------------------------------------------------------------------------

create or replace function public.cleanup_divbrain_attachment_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  attachment_row record;
begin
  for attachment_row in
    select storage_bucket, storage_path
    from public.divbrain_attachments
    where conversation_id = old.id
  loop
    begin
      delete from storage.objects
      where bucket_id = attachment_row.storage_bucket
        and name = attachment_row.storage_path;
    exception
      when others then
        -- Best-effort: never block conversation deletion on storage cleanup.
        null;
    end;
  end loop;

  return old;
end;
$$;

drop trigger if exists cleanup_divbrain_attachment_storage_before_conversation_delete
  on public.divbrain_conversations;
create trigger cleanup_divbrain_attachment_storage_before_conversation_delete
  before delete on public.divbrain_conversations
  for each row
  execute function public.cleanup_divbrain_attachment_storage();

-- ---------------------------------------------------------------------------
-- RLS (Model A for metadata writes)
-- ---------------------------------------------------------------------------

alter table public.divbrain_attachments enable row level security;

drop policy if exists "Owners can select their divbrain attachments"
  on public.divbrain_attachments;
create policy "Owners can select their divbrain attachments"
  on public.divbrain_attachments
  for select
  to authenticated
  using (user_id = auth.uid());

-- No INSERT / UPDATE / DELETE policies for authenticated clients.

revoke all on table public.divbrain_attachments from anon;
revoke all on table public.divbrain_attachments from authenticated;
grant select on table public.divbrain_attachments to authenticated;

grant select, insert, update, delete
on table public.divbrain_attachments
to service_role;

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
  'divbrain-attachments',
  'divbrain-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No broad authenticated storage.objects policies for this private bucket.
-- Uploads use short-lived signed upload URLs created by the trusted server.
-- Downloads use short-lived signed download URLs created by the trusted server.
-- Service role retains full storage access for server-owned operations.

drop policy if exists "DivBrain attachments are not publicly readable"
  on storage.objects;
drop policy if exists "No public divbrain attachment reads"
  on storage.objects;
