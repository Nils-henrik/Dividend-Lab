# Coordinated access hardening – production approval recorded

The owner explicitly approved this package on 2026-10-22. This change covers production grants, RLS and scheduler configuration. Do not
merge/release the scheduler route until the production owner has explicitly
approved the steps below. The SQL files are review proposals outside the automatic
migrations directory. Generate proper migration files through the Supabase CLI
when the approved change is ready to be applied.

## Scope

- Require a dedicated `MODEL_PORTFOLIO_CRON_SECRET` bearer credential in addition
  to the scheduler marker. Reject unauthenticated requests before reading JSON,
  creating run rows or contacting providers. Both scheduled and manual requests
  use the same boundary; there is no marker-only fallback.
- Update exactly eight reviewed pg_cron commands to retrieve the credential from
  Vault at runtime. Keep job IDs, schedules, active flags and unrelated jobs.
- Remove unnecessary client TRUNCATE, TRIGGER and REFERENCES privileges. Leave
  legitimate DML and service_role permissions intact.
- Limit learning-comment writes to article/user/body on INSERT and body on UPDATE.
  Existing SELECT RLS already prevents owners restoring hidden comments; this
  closes excess field privileges rather than claiming a proven unhide exploit.
- Restrict forum revision reads to visible parent content. For reply revisions,
  both the reply and thread must be visible. This does not erase historical
  personal information from revisions while their parent remains visible.

## Review and verification

The review used the production policy expressions captured on 2026-10-22. Tests
use synthetic rows in isolated PGlite PostgreSQL 18.6; production runs PostgreSQL
17.6.1. These tests verify SQL syntax/role/RLS behavior for the affected minimal
schema, not the entire Supabase migration history or live pg_cron/network stack.
The scheduler test supplies a stand-in `cron.alter_job` with the signature verified
from the production catalog and a synthetic Vault table. It never calls the
production endpoint or an AI provider.

Run from the repository root, keeping the verification dependency out of the app:

```sh
npm install --prefix .tmp/security-db @electric-sql/pglite@0.5.11 --ignore-scripts --no-audit --no-fund
node docs/security/verification/verify-access.mjs
node docs/security/verification/verify-scheduler.mjs
node --import ./tests/shims/register-server-only.mjs --import tsx --test lib/model-portfolios/cron-auth.route.test.ts tests/model-portfolio-cron-auth.test.ts
npm run typecheck
npm run lint
npm run build
```

Confirmed: anonymous/member visibility, owner content edits, denial of cross-user
edits, protected moderation fields, legitimate comment insertion, preserved server
moderation, missing-secret failure, catalog-drift failure, bounded scheduler
updates and no plaintext credential embedded in job commands.

## Production sequence after explicit approval

1. Re-read the live policies/grants and eight-job inventory; stop on drift. Save
   the previous definitions and current deployment identifier for recovery.
2. Generate one strong random credential without logging it. Provision it as a
   sensitive production `MODEL_PORTFOLIO_CRON_SECRET` in Vercel and as
   `divlab_model_portfolio_cron_secret` in Supabase Vault. Use the same value.
   Do not reuse, retrieve or rotate the existing company-ingestion CRON_SECRET.
3. Apply `proposals/model-portfolio-scheduler.sql`. Existing code tolerates the
   added Authorization header, so this can safely precede the guarded route.
   Verify eight jobs retain their schedules/active flags, contain Authorization
   and reference Vault without exposing the resolved credential.
4. Test/stage the scheduler code with the production configuration, then release
   it. Verify marker-only and wrong-token requests return 404 without running work.
   Observe one normal scheduled run rather than triggering an extra cost-bearing
   manual evaluation solely for testing.
5. Apply `proposals/moderation-and-revision-access.sql` in its own transaction.
   Verify post-change catalogs and security advisors. Check ordinary comment
   insertion/editing and visible/hidden revision behavior using dedicated test
   accounts with agreed synthetic production fixtures or a faithful staging copy.
6. If validation fails, keep the protected endpoint closed; pause only the eight
   affected jobs while investigating. Do not silently restore public marker-only
   execution. Grant/policy rollback must restore the saved definitions explicitly
   and be reviewed for the original exposure.

Approval of this package does not approve MFA enrollment, account/role changes,
project separation, WAF/CSP changes, main-branch protection changes or new indexes.
Those need their own concrete review after the outstanding settings are visible.


## Installation record

Owner approval received 2026-10-22. Scheduler credential provisioned in Vercel production and Vault. Scheduler migration `20261022183257` and independent grants/RLS migration `20261022183353` applied successfully. The independent access change was installed before the application release because it has no dependency on the new scheduler guard. All eight job IDs, schedules and active flags are unchanged. Live no-row role checks confirm member content-column permission and denial of protected moderation-column and anonymous writes. Existing service_role grants and moderation RPC execution privilege were preserved. No blanket service_role DML grant was added; moderation uses the existing privileged RPC.
