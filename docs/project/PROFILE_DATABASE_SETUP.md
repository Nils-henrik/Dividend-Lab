# Profile Database Setup

Dividend Lab profile data is stored in `public.profiles`.

The migrations live at:

`supabase/migrations/20260707181000_create_profiles.sql`
`supabase/migrations/20260707201500_profile_avatar_polish.sql`

If the project is not using the Supabase CLI yet, run the SQL manually in the Supabase dashboard SQL editor for the active project.

The migration creates:

- `public.profiles`
- row level security policies
- an `updated_at` trigger
- a trigger that creates a blank profile row when a new auth user is created

The avatar polish migration adds:

- `profiles.avatar_path`
- tighter profile field length limits
- the public `avatars` Supabase Storage bucket
- storage policies that let authenticated users upload, update and delete files only inside their own user-id folder

Avatar files should use user-owned paths such as `{user_id}/avatar.jpg`, `{user_id}/avatar.png` or `{user_id}/avatar.webp`. Public read access is acceptable because profile avatars are intended for public profile and forum identity surfaces.

Do not store private auth email addresses in `public.profiles`. Email should continue to come from Supabase Auth session data.

Do not use service role keys in the frontend.
