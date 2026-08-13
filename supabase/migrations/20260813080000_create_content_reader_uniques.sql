create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.content_reader_secret (
  singleton boolean primary key default true check (singleton),
  secret bytea not null,
  created_at timestamptz not null default now()
);

insert into private.content_reader_secret (singleton, secret)
values (true, extensions.gen_random_bytes(32))
on conflict (singleton) do nothing;

create table if not exists public.content_reader_uniques (
  content_type text not null check (content_type in ('news', 'learning')),
  content_slug text not null check (char_length(content_slug) between 1 and 180),
  reader_hash text not null check (char_length(reader_hash) = 64),
  first_seen_at timestamptz not null default now(),
  primary key (content_type, content_slug, reader_hash)
);

create index if not exists content_reader_uniques_first_seen_idx
  on public.content_reader_uniques (first_seen_at desc);

alter table public.content_reader_uniques enable row level security;

revoke all on table public.content_reader_uniques from anon, authenticated;
revoke all on table private.content_reader_secret from anon, authenticated;

create or replace function public.record_content_reader(
  p_content_type text,
  p_content_slug text,
  p_ip text,
  p_user_agent text
)
returns bigint
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_secret bytea;
  v_reader_hash text;
  v_count bigint;
begin
  if p_content_type not in ('news', 'learning') then
    raise exception 'invalid content type';
  end if;

  if p_content_slug is null or char_length(p_content_slug) < 1 or char_length(p_content_slug) > 180 then
    raise exception 'invalid content slug';
  end if;

  if p_ip is null or btrim(p_ip) = '' or p_user_agent is null or btrim(p_user_agent) = '' then
    select count(*)
      into v_count
      from public.content_reader_uniques
     where content_type = p_content_type
       and content_slug = p_content_slug;
    return v_count;
  end if;

  select secret
    into v_secret
    from private.content_reader_secret
   where singleton = true;

  if v_secret is null then
    raise exception 'reader secret unavailable';
  end if;

  v_reader_hash := encode(
    extensions.digest(
      v_secret
      || convert_to(p_content_type, 'UTF8')
      || convert_to(E'\n', 'UTF8')
      || convert_to(p_content_slug, 'UTF8')
      || convert_to(E'\n', 'UTF8')
      || convert_to(btrim(p_ip), 'UTF8')
      || convert_to(E'\n', 'UTF8')
      || convert_to(p_user_agent, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.content_reader_uniques (
    content_type,
    content_slug,
    reader_hash
  )
  values (
    p_content_type,
    p_content_slug,
    v_reader_hash
  )
  on conflict (content_type, content_slug, reader_hash) do nothing;

  select count(*)
    into v_count
    from public.content_reader_uniques
   where content_type = p_content_type
     and content_slug = p_content_slug;

  return v_count;
end;
$$;

create or replace function public.get_content_reader_counts(
  p_content_type text,
  p_content_slugs text[]
)
returns table(content_slug text, unique_readers bigint)
language sql
stable
security definer
set search_path = public
as $$
  select cru.content_slug, count(*)::bigint as unique_readers
    from public.content_reader_uniques cru
   where cru.content_type = p_content_type
     and cru.content_slug = any(coalesce(p_content_slugs, array[]::text[]))
   group by cru.content_slug;
$$;

revoke all on function public.record_content_reader(text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_content_reader_counts(text, text[]) from public, anon, authenticated;

grant execute on function public.record_content_reader(text, text, text, text) to service_role;
grant execute on function public.get_content_reader_counts(text, text[]) to service_role;
