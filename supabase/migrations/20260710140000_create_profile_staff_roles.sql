-- Staff identity roles for DivLab profiles.
-- Roles are manually assigned via trusted admin/database operations only.

create table if not exists public.profile_staff_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (
    role in (
      'ceo_divlab',
      'founder',
      'moderator',
      'admin',
      'support',
      'verified'
    )
  ),
  created_at timestamptz not null default now(),
  constraint profile_staff_roles_user_role_unique unique (user_id, role)
);

create index if not exists profile_staff_roles_user_id_idx
  on public.profile_staff_roles (user_id);

alter table public.profile_staff_roles enable row level security;

drop policy if exists "Profile staff roles are publicly readable" on public.profile_staff_roles;
create policy "Profile staff roles are publicly readable"
  on public.profile_staff_roles
  for select
  using (true);

grant select on public.profile_staff_roles to anon, authenticated;

-- Assign roles manually in Supabase SQL editor (service role), for example:
-- insert into public.profile_staff_roles (user_id, role)
-- values
--   ('<user-uuid>', 'ceo_divlab'),
--   ('<user-uuid>', 'founder');
