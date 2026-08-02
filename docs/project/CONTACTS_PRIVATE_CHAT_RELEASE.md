# Contacts + Private Chat — Database Release Order

Do **not** apply remote migrations until each step below is completed and Product Owner approval is given.

## Preflight status

**Decision: NOT READY — MANUAL ACTION REQUIRED**

A Product Owner preflight reply was received, but it contained **unfilled template placeholders** (`[REF]`, `[YES / NO]`, `[PLAN]`, etc.) rather than verified values. Those placeholders are treated as **not provided**. Do not invent mapping, backup, history, or aggregate numbers.

Agent environment still cannot authenticate to Vercel or Supabase management APIs:

- `VERCEL_TOKEN`: unset
- `SUPABASE_ACCESS_TOKEN`: unset
- Local repo is **not linked** to a remote Supabase project
- Vercel Preview URLs are SSO-protected

### Positively identified

| Item | Value |
|---|---|
| Production site | `divlab.se` |
| Production Supabase project ref | `faaxloafogpsywfkpbrm` |
| Masked hostname | `faax****.supabase.co` |
| Contacts/chat migrations applied? | **No** (PostgREST: `user_connections` absent; new RPCs absent; pair/status columns absent) |
| Legacy messaging present? | **Yes** (`conversations`, `conversation_participants`, `messages`, `is_conversation_participant`, `create_private_conversation`) |

### Still blocking (awaiting real values)

| Item | Status |
|---|---|
| Preview `NEXT_PUBLIC_SUPABASE_URL` project ref | not provided (placeholder) |
| Development `NEXT_PUBLIC_SUPABASE_URL` project ref | not provided (placeholder) |
| Preview == Production? | not provided (placeholder) |
| Display name for `faaxloafogpsywfkpbrm` | not provided (placeholder) |
| `dividend-lab-dev` relationship | not provided (placeholder) |
| Plan / PITR / latest recovery point / retention / sufficient? | not provided (placeholders) |
| Migration history `20260728213000` / `20260728213100` | not provided (placeholders) |
| Aggregate duplicate/message preflight counts | not provided (placeholders) |
| Selected release path | **not selectable** until Preview mapping is real |

## Henrik manual checklist (required)

Complete these read-only checks and reply with the listed fields only (no secrets).

### 1) Vercel environment mapping

1. Open [Vercel Dashboard](https://vercel.com) → project **dividend-lab**.
2. Go to **Settings → Environment Variables**.
3. For each of **Production**, **Preview**, and **Development**, open `NEXT_PUBLIC_SUPABASE_URL`.
4. From the hostname `https://<ref>.supabase.co`, record only `<ref>`.

Report back:

```text
Production ref:
Preview ref:
Development ref:
Preview == Production? yes/no
Development == Production? yes/no/n/a
```

Also open [Supabase Dashboard](https://supabase.com/dashboard) → project list and report:

```text
Project display name for faaxloafogpsywfkpbrm:
Is that project the one previously called dividend-lab-dev? yes/no/unknown
Other remote projects used by this app (refs only):
```

### 2) Backup / PITR

On Supabase project `faaxloafogpsywfkpbrm`:

1. Open **Project Settings → Subscription / Add-ons** (or **Billing**) and note plan.
2. Open **Database → Backups** (or **Settings → Database → Backups / Point-in-Time Recovery**).
3. Record whether daily backups and/or PITR are enabled.

Report back:

```text
Plan:
Daily backups enabled? yes/no
PITR enabled? yes/no
Latest backup / earliest PITR restore point (timestamp if visible):
Retention window:
Sufficient for this migration? yes/no
```

### 3) Migration history (SQL Editor, read-only)

In Supabase SQL Editor for `faaxloafogpsywfkpbrm`, run:

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

Report whether these versions appear:

- `20260728213000`
- `20260728213100`

### 4) Aggregate data preflight (SQL Editor, read-only)

Run the **Required read-only preflight SQL** section below on `faaxloafogpsywfkpbrm`.

Paste back **aggregate numbers only** (no UUIDs, emails, usernames, message bodies).

Required numeric fields from the SQL above:

```text
conversation_count:
participant_count:
message_count:
two_participant:
fewer_than_two:
more_than_two:
duplicate_pair_groups:
largest_duplicate_group_size:
conversations_in_duplicate_groups:
duplicate_conversations_to_remove:
messages_to_move:
duplicate_groups_with_conflicting_subjects:
duplicate_participant_rows:
orphaned_participants:
orphaned_messages:
conversations_without_participants:
name_conflict_rows (count of rows from query 8; ideally 0):
```

## Selected release path

**Not selected** — Preview/Production mapping was not provided as real values.

- If Preview ref == Production ref `faaxloafogpsywfkpbrm` → **Path A (shared)**
- If Preview ref is a different remote project → **Path B (separate Preview)**
- If Preview has no Supabase URL / NONE → treat as **Path A risk for production** (no separate Preview DB to stage on); confirm before apply

Until mapping is confirmed, operate under **Path A risk** (do not casually migrate from Preview).

### Controlled migration plan (for Product Owner approval — not approved yet)

Do **not** execute until:

1. Real preflight values replace all placeholders
2. Backup/PITR is marked sufficient
3. Both migration versions are ABSENT (or already PRESENT — then skip apply and verify only)
4. Aggregates show no hard blockers (see below)
5. Product Owner replies with explicit text approving the selected path

**Hard blockers (stop):**

- Preview mapping unknown
- Backup/PITR not sufficient or unknown
- Either migration PRESENT while objects absent (history drift) or objects partially present
- `name_conflict_rows` > 0 before apply
- Unexpected orphan volumes that break assumptions (investigate before apply)
- `duplicate_groups_with_conflicting_subjects` > 0 → review impact (subjects discarded from non-canonical rows; messages still preserved) before approving

**Soft caution (proceed only with awareness):**

- Large `messages_to_move` / `duplicate_conversations_to_remove` → longer lock window; prefer low traffic
- `fewer_than_two` / `more_than_two` conversations → migration leaves non-1:1 rows without pair uniqueness; confirm expected

#### If Path A (shared Preview/Production = `faaxloafogpsywfkpbrm`)

1. Freeze: no parallel schema changes; prefer low-traffic window
2. Capture pre-apply aggregates (message_count, participant_count, duplicate_* )
3. Apply **together, in order**, on `faaxloafogpsywfkpbrm` only:
   - `20260728213000_create_user_connections.sql`
   - `20260728213100_enhance_private_conversations.sql`
4. Run post-migration verification SQL from this doc
5. Confirm `message_count` unchanged; duplicate normalized pairs = 0
6. Smoke Kontakter + private chat on Preview/production app against migrated DB
7. Only then: Ready for Review → merge → watch production deploy
8. Rollback if needed: **PITR/restore only** (no down migration)

#### If Path B (Preview ref ≠ Production)

1. Apply both migrations on **Preview project only**; verify + smoke there first
2. Re-confirm Production backup/PITR
3. Schedule Production apply of the same two files on `faaxloafogpsywfkpbrm`
4. Production post-verify + smoke
5. Only then: Ready → merge → deploy
6. Rollback: PITR/restore on the affected project

**Explicit hold:** Migration approval has **not** been given. Agent must not apply, merge, mark Ready, or deploy.

## Migration safety review (code vs known production shape)

Reviewed `20260728213000_create_user_connections.sql` and `20260728213100_enhance_private_conversations.sql` against production probes:

| Concern | Assessment |
|---|---|
| Duplicate consolidation | Moves messages to earliest conversation; merges `last_read_at`; deletes only redundant rows; aborts if duplicates remain |
| Message preservation | Message rows are updated in place (same ids/timestamps/senders); local migration test preserved all messages |
| Participant remapping | Upserts participants onto canonical row; deletes duplicate participant rows after merge |
| Canonical pair uniqueness | Unique index created only after consolidation + backfill |
| Idempotency | `IF NOT EXISTS` / `CREATE OR REPLACE`; safe if re-applied after success; partial remote apply was **not** observed |
| Failure mid-migration | Relies on migration transaction rollback; if runner aborts mid-file, restore/PITR is the recovery path |
| Legacy RPC compatibility | Replaces `create_private_conversation` and hardens `is_conversation_participant`; expected and covered by local tests |
| RLS / privileges | New table SELECT-only for clients; mutations via DEFINER RPCs; conversation UPDATE revoked |
| Rollback realism | **Restore/PITR is the only realistic rollback** after consolidation (no faithful down migration) |

No migration defect requiring a code change was identified from available evidence. Aggregate production duplicate scope remains unknown until Henrik’s SQL preflight.

## Required read-only preflight SQL (aggregates only)

Confirm target project is `faaxloafogpsywfkpbrm` before running.

```sql
-- 0) Sanity: confirm we are on the expected project DB
select current_database() as database_name;

-- 1) Migration history
select version, name
from supabase_migrations.schema_migrations
where version in ('20260728213000', '20260728213100')
   or name ilike '%user_connections%'
   or name ilike '%enhance_private_conversations%'
order by version;

-- 2) Volume
select count(*)::bigint as conversation_count from public.conversations;
select count(*)::bigint as participant_count from public.conversation_participants;
select count(*)::bigint as message_count from public.messages;

-- 3) Participant-count shapes
select
  case
    when c = 2 then 'two_participant'
    when c < 2 then 'fewer_than_two'
    else 'more_than_two'
  end as shape,
  count(*)::bigint as conversation_count
from (
  select conversation_id, count(*)::int as c
  from public.conversation_participants
  group by conversation_id
) s
group by 1
order by 1;

-- 4) Duplicate unordered pairs + largest group
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
  count(*)::bigint as duplicate_pair_groups,
  coalesce(max(conversation_count), 0)::int as largest_duplicate_group_size,
  coalesce(sum(conversation_count), 0)::bigint as conversations_in_duplicate_groups
from dupes;

-- 5) Messages that would move during consolidation
with two_party as (
  select
    cp.conversation_id,
    (array_agg(cp.user_id order by cp.user_id::text))[1] as pair_low,
    (array_agg(cp.user_id order by cp.user_id::text))[2] as pair_high
  from public.conversation_participants cp
  group by cp.conversation_id
  having count(*) = 2
),
ranked as (
  select
    tp.conversation_id,
    row_number() over (
      partition by tp.pair_low, tp.pair_high
      order by c.created_at asc, c.id asc
    ) as pair_rank
  from two_party tp
  join public.conversations c on c.id = tp.conversation_id
  where tp.pair_low is distinct from tp.pair_high
),
non_canonical as (
  select conversation_id from ranked where pair_rank > 1
)
select
  (select count(*) from non_canonical)::bigint as duplicate_conversations_to_remove,
  (
    select count(*)
    from public.messages m
    join non_canonical n on n.conversation_id = m.conversation_id
  )::bigint as messages_to_move;

-- 6) Conflicting non-null subjects inside duplicate groups
with two_party as (
  select
    cp.conversation_id,
    (array_agg(cp.user_id order by cp.user_id::text))[1] as pair_low,
    (array_agg(cp.user_id order by cp.user_id::text))[2] as pair_high
  from public.conversation_participants cp
  group by cp.conversation_id
  having count(*) = 2
),
dup_pairs as (
  select pair_low, pair_high
  from two_party
  where pair_low is distinct from pair_high
  group by pair_low, pair_high
  having count(*) > 1
),
subjects as (
  select
    tp.pair_low,
    tp.pair_high,
    count(distinct nullif(btrim(coalesce(c.subject, '')), ''))::int as distinct_subjects
  from two_party tp
  join dup_pairs d on d.pair_low = tp.pair_low and d.pair_high = tp.pair_high
  join public.conversations c on c.id = tp.conversation_id
  group by tp.pair_low, tp.pair_high
)
select count(*)::bigint as duplicate_groups_with_conflicting_subjects
from subjects
where distinct_subjects > 1;

-- 7) Duplicate participant rows / orphans / empty conversations
select count(*)::bigint as duplicate_participant_rows
from (
  select conversation_id, user_id, count(*)
  from public.conversation_participants
  group by 1, 2
  having count(*) > 1
) d;

select count(*)::bigint as orphaned_participants
from public.conversation_participants cp
left join public.conversations c on c.id = cp.conversation_id
where c.id is null;

select count(*)::bigint as orphaned_messages
from public.messages m
left join public.conversations c on c.id = m.conversation_id
where c.id is null;

select count(*)::bigint as conversations_without_participants
from public.conversations c
left join public.conversation_participants cp on cp.conversation_id = c.id
where cp.conversation_id is null;

-- 8) Name conflicts that could break migration objects
select 'index' as kind, indexname as name
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'conversations_dm_pair_uidx',
    'user_connections_requester_status_idx',
    'user_connections_addressee_status_idx',
    'user_connections_accepted_low_idx',
    'user_connections_accepted_high_idx',
    'conversations_status_updated_at_idx',
    'conversations_initiated_by_status_idx'
  )
union all
select 'constraint', conname
from pg_constraint
where conname in (
  'conversations_status_check',
  'conversations_normalized_pair_check',
  'user_connections_status_check',
  'user_connections_no_self',
  'user_connections_normalized_pair',
  'user_connections_unique_pair'
)
union all
select 'relation', c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'user_connections'
order by 1, 2;

-- 9) Account-deletion FK rules
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

## Post-migration verification (aggregates only)

```sql
select version
from supabase_migrations.schema_migrations
where version in ('20260728213000', '20260728213100')
order by version;

select to_regclass('public.user_connections') is not null as table_exists,
       relrowsecurity as rls_enabled
from pg_class
where oid = 'public.user_connections'::regclass;

select count(*)::bigint as duplicate_normalized_pairs
from (
  select pair_user_low, pair_user_high
  from public.conversations
  where pair_user_low is not null and pair_user_high is not null
  group by 1, 2
  having count(*) > 1
) d;

select count(*)::bigint as two_party_missing_pair_columns
from public.conversations c
where (
  select count(*) from public.conversation_participants cp where cp.conversation_id = c.id
) = 2
and (c.pair_user_low is null or c.pair_user_high is null);

select count(*)::bigint as message_count from public.messages;
select count(*)::bigint as participant_count from public.conversation_participants;
```

Also smoke-test authenticated privacy: contact-count returns aggregates only; unrelated users cannot probe contact graph or conversation membership.

## Rollback / incident plan

Because consolidation rewrites historical conversation topology, **restore/PITR is the only realistic rollback** after a successful enhance migration.

Stop before apply if: mapping unknown, backup/PITR unconfirmed, preflight incomplete, or partial objects appear.

Abort during apply if: consolidation raises, unexpected name conflicts, or counts diverge.

If migration succeeds but smoke fails: pause contact/chat writes if needed; do not merge older app assumptions; restore from confirmed recovery point; keep PR Draft until human confirmation.

## Migrations to apply (only after approval)

1. `supabase/migrations/20260728213000_create_user_connections.sql`
2. `supabase/migrations/20260728213100_enhance_private_conversations.sql`
