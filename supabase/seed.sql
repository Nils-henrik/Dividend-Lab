-- Local development only. Not applied to hosted projects.
--
-- The 20260707181000_create_profiles migration defines RLS policies on
-- public.profiles but relies on the default table privileges that hosted
-- Supabase grants to the anon / authenticated roles (row access stays governed
-- by the RLS policies). The local Supabase CLI's postgres-role default
-- privileges omit SELECT/INSERT/UPDATE, so profile reads fail on a fresh local
-- stack with: permission denied for table profiles.
--
-- Every other table already ships explicit grants in its migration; only
-- profiles depends on the default grants. Restore exactly the privileges the
-- profile RLS policies already assume so local dev matches hosted behaviour.
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
