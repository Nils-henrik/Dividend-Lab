alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_username_format,
  drop constraint if exists profiles_display_name_length,
  drop constraint if exists profiles_bio_length,
  drop constraint if exists profiles_favorite_sector_length,
  drop constraint if exists profiles_investor_goal_length,
  drop constraint if exists profiles_avatar_path_length;

alter table public.profiles
  add constraint profiles_username_format check (
    username is null or username ~ '^[a-z0-9_]{3,20}$'
  ),
  add constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 40
  ),
  add constraint profiles_bio_length check (
    bio is null or char_length(bio) <= 240
  ),
  add constraint profiles_favorite_sector_length check (
    favorite_sector is null or char_length(favorite_sector) <= 40
  ),
  add constraint profiles_investor_goal_length check (
    investor_goal is null or char_length(investor_goal) <= 120
  ),
  add constraint profiles_avatar_path_length check (
    avatar_path is null or char_length(avatar_path) <= 180
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
