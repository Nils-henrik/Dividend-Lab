-- Enforce case-insensitive, whitespace-normalized username uniqueness.
-- Fails fast if normalized duplicates already exist (no automatic resolution).

do $$
declare
  conflict_count integer;
begin
  select count(*) into conflict_count
  from (
    select lower(btrim(username)) as normalized_username
    from public.profiles
    where username is not null
      and btrim(username) <> ''
    group by lower(btrim(username))
    having count(*) > 1
  ) duplicates;

  if conflict_count > 0 then
    raise exception
      'profiles username uniqueness migration blocked: % normalized duplicate group(s) exist',
      conflict_count;
  end if;
end
$$;

alter table public.profiles
  drop constraint if exists profiles_username_not_blank;

alter table public.profiles
  add constraint profiles_username_not_blank check (
    username is null or btrim(username) <> ''
  );

alter table public.profiles
  drop constraint if exists profiles_username_key;

create unique index if not exists profiles_username_normalized_unique
  on public.profiles (lower(btrim(username)))
  where username is not null;

-- Login and public profile lookup use equality on username. The format check
-- (^[a-z0-9_]{3,20}$) guarantees stored usernames are already normalized
-- lowercase values, so this btree index supports indexed lookups after the
-- legacy unique constraint index is removed.
create index if not exists profiles_username_lookup_idx
  on public.profiles (username)
  where username is not null;
