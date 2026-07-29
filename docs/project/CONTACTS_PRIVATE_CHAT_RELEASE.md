# Contacts + Private Chat — Database Release Order

Do **not** apply remote migrations until each step below is completed.

## Shared-project constraint

Vercel Preview and Production for `dividend-lab` must be checked in the Vercel project environment variables before any remote apply:

1. Compare `NEXT_PUBLIC_SUPABASE_URL` (and related keys) for **Preview** vs **Production**.
2. If they resolve to the **same** Supabase project URL/ref, Preview and Production share one database.
3. If they share one project, **do not** apply these migrations from a Preview deploy workflow. Apply only as an explicit production-bound release after backup and preflight, or provision a dedicated non-production Supabase project first.

Until positively identified, treat shared-project risk as blocking for casual/preview migration applies.

## Exact deployment order

1. **Identify the production Supabase project**  
   Confirm project ref/URL used by production (`NEXT_PUBLIC_SUPABASE_URL` on Production). Record the project id.

2. **Create or confirm a current database backup**  
   Use Supabase dashboard backup / PITR / logical dump before schema changes.

3. **Run read-only preflight queries** on that project:

```sql
-- Duplicate historical two-participant conversations (pre-enhance risk)
with two_party as (
  select
    cp.conversation_id,
    (array_agg(cp.user_id order by cp.user_id::text))[1] as pair_low,
    (array_agg(cp.user_id order by cp.user_id::text))[2] as pair_high
  from public.conversation_participants cp
  group by cp.conversation_id
  having count(*) = 2
)
select pair_low, pair_high, count(*) as conversation_count
from two_party
where pair_low is distinct from pair_high
group by pair_low, pair_high
having count(*) > 1
order by conversation_count desc;

-- Message / participant volume
select count(*) as message_count from public.messages;
select count(*) as participant_count from public.conversation_participants;
select count(*) as conversation_count from public.conversations;

-- Account-deletion FK expectations (inspect definitions)
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and (
    conrelid::regclass::text in (
      'public.user_connections',
      'public.conversations',
      'public.conversation_participants',
      'public.messages'
    )
    or confrelid = 'auth.users'::regclass
  )
order by 1, 2;
```

4. **Apply migrations in order** (only on the positively identified target):
   - `supabase/migrations/20260728213000_create_user_connections.sql`
   - `supabase/migrations/20260728213100_enhance_private_conversations.sql`

5. **Verify migration result**
   - `user_connections` exists with RLS + RPC grants
   - `conversations.status` / pair columns populated for canonical DMs
   - unique index `conversations_dm_pair_uidx` present
   - no remaining duplicate two-participant pairs with null/conflicting pair columns
   - sample contact + message-request smoke RPCs succeed

6. **Smoke-test Vercel Preview against the migrated database**  
   Only if Preview points at that same migrated non-prod target, or after Production apply with an explicit prod smoke plan. Confirm contacts + private chat happy paths.

7. **Only then** mark PR #34 Ready for review and merge.
