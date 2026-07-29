# Contacts + Private Chat — Database Release Order

Do **not** apply remote migrations until each step below is completed.

## Preflight status (2026-07-29)

**Decision: NOT READY — BLOCKERS FOUND**

### Positively identified

- Production site `divlab.se` embeds `NEXT_PUBLIC_SUPABASE_URL` project ref **`faaxloafogpsywfkpbrm`** (masked host `faax****.supabase.co`).
- Read-only PostgREST probes against that project show the contacts/private-chat migrations are **not** applied yet:
  - `public.user_connections`: absent
  - contact / message-request RPCs introduced by these migrations: absent
  - `conversations.status|initiated_by|pair_user_low|pair_user_high|responded_at`: absent
  - legacy `conversations`, `conversation_participants`, `messages`, `is_conversation_participant`, `create_private_conversation`: present

### Not yet positively confirmed (blockers)

- Vercel **Preview** and **Development** `NEXT_PUBLIC_SUPABASE_URL` (Preview URLs are SSO-protected; no Vercel/Supabase management token available in this agent environment)
- Whether Preview shares `faaxloafogpsywfkpbrm` with Production
- Whether `faaxloafogpsywfkpbrm` is the project previously called `dividend-lab-dev`
- Whether a separate staging project exists
- Production backup / PITR availability and latest recovery point
- `supabase_migrations.schema_migrations` history rows for:
  - `20260728213000_create_user_connections`
  - `20260728213100_enhance_private_conversations`
- Aggregate production messaging/duplicate preflight counts (private tables deny anonymous aggregate access)
- Local CLI is **not linked** to a remote project (`supabase/.temp/project-ref` absent)

Until the blockers above are cleared with read-only dashboard/CLI access, treat Preview/Production as a **shared-project risk** and do not apply migrations.

## Shared-project constraint

1. Compare `NEXT_PUBLIC_SUPABASE_URL` for **Production**, **Preview**, and **Development** in Vercel.
2. If Preview and Production resolve to the same project ref, they share one database.
3. If shared, do **not** apply these migrations from a casual Preview workflow. Apply only as an explicit controlled release after backup + preflight.

## Exact deployment order

### Path A — Preview and Production share one Supabase project

1. Confirm backup / PITR on `faaxloafogpsywfkpbrm`.
2. Use a controlled low-traffic window.
3. Apply both migrations in order on that project.
4. Immediately verify database invariants (queries below).
5. Smoke-test the Ready Vercel Preview against the migrated database.
6. Verify existing production messaging remains functional with the backward-compatible schema.
7. Mark PR #34 Ready for review.
8. Merge PR #34.
9. Verify the resulting production deployment.

### Path B — Preview has a separate Supabase project

1. Apply migrations to Preview/staging first.
2. Run full smoke tests there.
3. Confirm production backup on `faaxloafogpsywfkpbrm`.
4. Apply migrations to production.
5. Verify database invariants.
6. Mark PR Ready and merge.
7. Verify production.

**Applicable path:** unknown until Preview env is positively identified. Default operating assumption until then: **Path A risk**.

## Required read-only preflight SQL (aggregates only)

```sql
-- Migration history
select version, name
from supabase_migrations.schema_migrations
where version in ('20260728213000', '20260728213100')
   or name ilike '%user_connections%'
   or name ilike '%enhance_private_conversations%'
order by version;

-- Messaging volume
select count(*) as conversation_count from public.conversations;
select count(*) as participant_count from public.conversation_participants;
select count(*) as message_count from public.messages;

-- Two-participant vs other shapes
select
  case
    when c = 2 then 'two_participant'
    when c < 2 then 'fewer_than_two'
    else 'more_than_two'
  end as shape,
  count(*) as conversation_count
from (
  select conversation_id, count(*)::int as c
  from public.conversation_participants
  group by conversation_id
) s
group by 1
order by 1;

-- Duplicate unordered pairs
with two_party as (
  select
    cp.conversation_id,
    (array_agg(cp.user_id order by cp.user_id::text))[1] as pair_low,
    (array_agg(cp.user_id order by cp.user_id::text))[2] as pair_high
  from public.conversation_participants cp
  group by cp.conversation_id
  having count(*) = 2
),
dupes as (
  select pair_low, pair_high, count(*)::int as conversation_count
  from two_party
  where pair_low is distinct from pair_high
  group by pair_low, pair_high
  having count(*) > 1
)
select
  count(*) as duplicate_pair_groups,
  coalesce(max(conversation_count), 0) as largest_duplicate_group_size
from dupes;

-- Messages belonging to duplicate two-participant conversations
with two_party as (
  select
    cp.conversation_id,
    (array_agg(cp.user_id order by cp.user_id::text))[1] as pair_low,
    (array_agg(cp.user_id order by cp.user_id::text))[2] as pair_high
  from public.conversation_participants cp
  group by cp.conversation_id
  having count(*) = 2
),
dup_conversations as (
  select tp.conversation_id
  from two_party tp
  join (
    select pair_low, pair_high
    from two_party
    where pair_low is distinct from pair_high
    group by pair_low, pair_high
    having count(*) > 1
  ) d on d.pair_low = tp.pair_low and d.pair_high = tp.pair_high
)
select count(*) as messages_in_duplicate_two_party_conversations
from public.messages m
join dup_conversations d on d.conversation_id = m.conversation_id;

-- Orphans / empty conversations
select count(*) as orphaned_participants
from public.conversation_participants cp
left join public.conversations c on c.id = cp.conversation_id
where c.id is null;

select count(*) as orphaned_messages
from public.messages m
left join public.conversations c on c.id = m.conversation_id
where c.id is null;

select count(*) as conversations_without_participants
from public.conversations c
left join public.conversation_participants cp on cp.conversation_id = c.id
where cp.conversation_id is null;

-- Account-deletion FK rules
select
  conrelid::regclass as table_name,
  conname,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and (
    conrelid::regclass::text in (
      'public.profiles',
      'public.user_connections',
      'public.conversations',
      'public.conversation_participants',
      'public.messages'
    )
    or confrelid = 'auth.users'::regclass
  )
order by 1, 2;
```

## Post-migration verification checklist (aggregates only)

```sql
-- Both migration versions recorded
select version
from supabase_migrations.schema_migrations
where version in ('20260728213000', '20260728213100')
order by version;

-- user_connections + RLS
select
  to_regclass('public.user_connections') is not null as table_exists,
  relrowsecurity as rls_enabled
from pg_class
where oid = 'public.user_connections'::regclass;

-- Normalized contact-pair uniqueness
select indexname
from pg_indexes
where tablename = 'user_connections'
  and indexdef ilike '%unique%user_low_id%user_high_id%';

-- Conversation state/pair columns + unique DM pair index
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'conversations'
  and column_name in ('status','initiated_by','pair_user_low','pair_user_high','responded_at')
order by column_name;

select indexname
from pg_indexes
where tablename = 'conversations'
  and indexname = 'conversations_dm_pair_uidx';

-- No duplicate normalized pairs
select count(*) as duplicate_normalized_pairs
from (
  select pair_user_low, pair_user_high, count(*)
  from public.conversations
  where pair_user_low is not null and pair_user_high is not null
  group by 1, 2
  having count(*) > 1
) d;

-- Two-participant conversations should have populated pairs
select count(*) as two_party_missing_pair_columns
from public.conversations c
where (
  select count(*) from public.conversation_participants cp where cp.conversation_id = c.id
) = 2
and (c.pair_user_low is null or c.pair_user_high is null);

-- Message / participant totals unchanged vs preflight snapshot
select count(*) as message_count from public.messages;
select count(*) as participant_count from public.conversation_participants;
```

Also verify via authenticated smoke tests (not SQL dumps):

- contact count RPC returns aggregate counts only
- unrelated user cannot probe contact graph / conversation membership
- unauthorized table mutation privileges remain revoked

## Rollback / incident plan

Because `20260728213100_enhance_private_conversations.sql` consolidates historical duplicate conversations, a simple down migration cannot reliably reconstruct the prior structure.

### Stop conditions before applying

- Preview/Production project relationship still unknown
- Backup / PITR not confirmed
- Aggregate duplicate preflight not completed
- Either migration already partially present / conflicting

### Abort conditions during application

- Migration raises the explicit duplicate-consolidation exception
- Unexpected constraint/index/function name conflicts
- Row counts diverge unexpectedly mid-run

### If migration succeeds but smoke tests fail

1. Pause contact/chat write traffic if needed (feature flags / maintenance window).
2. Do **not** merge old application code that assumes pre-pair schema if the DB has already been transformed irreversibly.
3. Restore from the confirmed backup/PITR recovery point if invariants are broken.
4. Keep PR #34 Draft until a human owner confirms restore or forward-fix success.

### Success confirmation before merge

Requires explicit human confirmation of: backup restore point, migration history rows, invariant queries, and Preview/production smoke tests.

## Migrations to apply (only after approval)

1. `supabase/migrations/20260728213000_create_user_connections.sql`
2. `supabase/migrations/20260728213100_enhance_private_conversations.sql`
