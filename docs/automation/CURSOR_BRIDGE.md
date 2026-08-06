# Cursor automation bridge

Secure, mobile-first automation between ChatGPT, GitHub Issues, Cursor Cloud Agents, and Vercel for Dividend Lab.

## End-to-end flow

1. Henrik describes a DivLab task to ChatGPT.
2. ChatGPT creates a structured GitHub Issue in `Nils-henrik/Dividend-Lab` (use the **Cursor Cloud Agent Task** issue form).
3. The Issue receives the `cursor-agent` label (the form applies it automatically).
4. GitHub Actions workflow **Cursor Agent Dispatch** reads the Issue safely and calls the Cursor Cloud Agents API.
5. Cursor starts from `main`, works on branch `cursor/issue-<number>-<slug>`, validates changes, and opens a **draft** PR.
6. ChatGPT (or Henrik) reviews the PR diff, tests, and Vercel preview status.
7. After explicit review, `divlab-approved` may be applied to eligible Cursor PRs.
8. Workflow **DivLab PR Approval Merge** squash-merges only non-sensitive, fully green PRs.
9. Sensitive or high-risk work always stops for manual review.

## Required secret

| Secret | Purpose |
|--------|---------|
| `CURSOR_API_KEY` | Cursor Cloud Agents API key (Dashboard → API Keys or team service account) |

Never log, echo, commit, or expose this key. GitHub Actions injects it only into the dispatch step environment.

## Cursor API configuration

| Setting | Value |
|---------|--------|
| API version | **v1** (public beta) |
| Create endpoint | `https://api.cursor.com/v1/agents` |
| Auth | `Authorization: Bearer <CURSOR_API_KEY>` (Basic also supported) |
| Official docs | https://cursor.com/docs/cloud-agent/api/endpoints |
| OpenAPI | https://cursor.com/docs-static/cloud-agents-openapi.yaml |
| Maintainable constant | `scripts/automation/cursor-bridge/config.ts` → `CURSOR_API_CREATE_AGENT_URL` |

Dispatch payload (summary):

- `agentId`: deterministic per issue (`bc-91809180-9180-4000-8000-<issue-hex>`) for idempotent creates (409 on duplicate).
- `repos`: `[{ url: "https://github.com/Nils-henrik/Dividend-Lab", startingRef: "main" }]`
- `autoCreatePR`: `true` (draft PR requested in agent prompt; API has no separate draft flag).
- `mode`: `agent`
- `prompt.text`: full issue body plus DivLab engineering contract.

Repository must be connected in Cursor Integrations before agents can run.

## GitHub workflows and permissions

### `cursor-agent-dispatch.yml`

- **Trigger:** `issues` → `labeled` with `cursor-agent`
- **Repository:** `Nils-henrik/Dividend-Lab` only
- **Author:** `Nils-henrik` only
- **Permissions:** `contents: read`, `issues: write`
- **Concurrency:** `cursor-dispatch-issue-<number>`

### `cursor-bridge-bootstrap.yml`

- **Trigger:** push to `main` (bridge paths) or `workflow_dispatch`
- **Permissions:** `contents: read`, `issues: write`
- Creates labels idempotently via `gh api`

### `divlab-pr-approve.yml`

- **Trigger:** `pull_request_target` → `labeled` with `divlab-approved`
- **Permissions:** `contents: write`, `pull-requests: write`, `issues: write`
- **Never checks out the PR branch** — checks out trusted `main` automation scripts only
- **Concurrency:** `divlab-merge-pr-<number>`

## Security and trust boundaries

| Zone | Trust level | Notes |
|------|-------------|-------|
| Issue title/body | Untrusted | Read from `GITHUB_EVENT_PATH`; never shell-interpolated |
| Cursor API key | Highly sensitive | Only in dispatch step `env`; never logged |
| PR head code | Untrusted | Never checked out or executed in merge workflow |
| Automation scripts on `main` | Trusted | Merge workflow uses `main` scripts only |
| `divlab-approved` label | Explicit human gate | Never auto-applied |

Fail-closed defaults: ambiguous checks, missing Vercel, SHA drift, sensitive paths, or high/manual risk all block merge.

## ChatGPT issue format

Use the repository issue form **Cursor Cloud Agent Task**. Minimum fields:

- Task objective, background, acceptance criteria
- Allowed / forbidden scope
- Swedish copy (when UI changes)
- Required tests
- Visual verification requirement
- Deployment instruction
- **Risk classification** (dropdown)
- Related routes/files (optional)

ChatGPT should set title prefix `[Cursor]` and ensure `cursor-agent` label is present.

## Label meanings

| Label | Meaning |
|-------|---------|
| `cursor-agent` | Request dispatch to Cursor (removed after handling) |
| `cursor-running` | Agent successfully dispatched; duplicate dispatch blocked |
| `cursor-failed` | Dispatch failed; fix and re-apply `cursor-agent` to retry |
| `divlab-approved` | Human approval to attempt automated squash-merge |
| `divlab-manual-review` | Automatic merge refused; human must merge manually |

## Approval procedure

1. Review Cursor draft PR: diff, tests, Vercel preview.
2. Confirm risk classification is Low or Medium and no sensitive paths changed.
3. Apply `divlab-approved` only when ready.
4. Workflow marks PR ready, waits for checks, re-validates head SHA, squash-merges if eligible.
5. Do **not** apply `divlab-approved` on High or Manual-only tasks.

## Automatic-merge eligibility

Required:

- PR targets `main`
- Head branch starts with `cursor/`
- Repository `Nils-henrik/Dividend-Lab`
- No sensitive path categories (see below)
- Risk classification not High or Manual-only
- Head SHA unchanged since approval event
- All checks completed; none failed/cancelled/skipped unexpectedly
- At least one successful Vercel-related check
- No merge conflicts; branch protection not blocking

## Changes that always require manual review

Blocked path categories (automatic):

- `.github/workflows/**`
- `supabase/**`
- migrations
- RLS / database policy files
- authentication / authorization code
- `middleware.ts`, `proxy.ts`, `next.config.ts`
- `package.json`, lockfiles
- `.env*` files
- secrets / credential configuration
- billing / payment code
- destructive data scripts
- account deletion / user-data handling
- security headers / access-control foundations
- path traversal / invalid paths

Blocked by risk classification:

- **High — auth/database/security/user data**
- **Manual only — migrations/RLS/secrets/payments/destructive changes**

## Disable the bridge immediately (mobile-friendly)

**Emergency shutdown (≈2 minutes from phone):**

1. Open https://github.com/Nils-henrik/Dividend-Lab/actions
2. Disable workflows:
   - **Cursor Agent Dispatch**
   - **DivLab PR Approval Merge**
   - (Optional) **Cursor Bridge Label Bootstrap**
3. GitHub → Settings → Secrets → disable or delete `CURSOR_API_KEY` usage by rotating the key in Cursor Dashboard.

Dispatch and merge stop immediately. Open PRs are unaffected until manually merged.

## Rotate the Cursor API key

1. Cursor Dashboard → API Keys → revoke old key / create new key.
2. GitHub repo → Settings → Secrets → Actions → edit `CURSOR_API_KEY`.
3. Re-enable dispatch workflow if disabled.
4. Test with a throwaway issue (see safe testing below).

## Recover a stuck `cursor-running` issue

1. Open the issue on GitHub mobile/web.
2. Confirm whether a Cursor agent is actually running at https://cursor.com/agents
3. If finished or failed in Cursor but issue still shows `cursor-running`:
   - Remove `cursor-running`
   - Re-apply `cursor-agent` only if a new agent run is intended
4. If dispatch failed previously, check for `cursor-failed` and read the safe error comment.

## Diagnose Cursor API errors

1. Read the **safe error comment** on the issue (sanitized; no tokens).
2. GitHub Actions → **Cursor Agent Dispatch** → failed run logs (dispatch step only; no API key in logs).
3. Common causes:
   - Repository not connected in Cursor Integrations
   - Invalid or rotated `CURSOR_API_KEY`
   - API rate limits / beta outages
   - `409 agent_id_conflict` (idempotent — agent already exists for issue)
4. Official status: Cursor docs / support; compare request shape to `config.ts` endpoint.

## Diagnose GitHub Actions failures

| Workflow | Check |
|----------|--------|
| Dispatch | Secret present, author `Nils-henrik`, label `cursor-agent`, not duplicate `cursor-running` |
| Bootstrap | `gh` permissions, label API errors (usually harmless if idempotent) |
| Merge | Sensitive paths, risk text in PR body, Vercel check name/status, SHA drift |

## Test the bridge safely

**Do not** call the production Cursor API from feature branches using the live secret.

After merge to `main`:

1. Run **Cursor Bridge Label Bootstrap** via `workflow_dispatch` (or wait for push).
2. Create a **Low** risk test issue with trivial doc-only scope (or use form with minimal UI copy change).
3. Confirm dispatch comment shows agent ID and planned branch.
4. Let Cursor open draft PR; verify checks on preview.
5. **Do not** apply `divlab-approved` until intentionally testing merge gate.
6. For merge test, use a trivial eligible PR and apply `divlab-approved` only after review.

## Avoid duplicate agents

- Do not re-apply `cursor-agent` while `cursor-running` is present.
- Workflow concurrency groups per issue number.
- Deterministic `agentId` per issue returns API 409 instead of duplicate agents.
- Removing and re-adding `cursor-agent` after success is blocked until `cursor-running` is cleared.

## Known operational limitations

- Cursor v1 API does not expose a dedicated “draft PR” flag; draft behavior is instructed in the agent prompt.
- Branch name `cursor/issue-<n>-<slug>` is planned deterministically; Cursor may auto-name branches until push — correlate via issue comment branch name.
- Merge workflow checks out automation scripts from `main`, not the PR branch (scripts must be merged before approval workflow uses latest logic).
- Vercel check matching uses name contains `vercel` (case-insensitive).
- GitHub check-run API may not list legacy commit statuses; repo should use check runs for CI/Vercel.
- `envVars` on Cursor API is beta and not used by this bridge.
- Webhooks for agent completion are not yet used (coming to Cursor API).

## Related files

- Workflows: `.github/workflows/cursor-agent-dispatch.yml`, `cursor-bridge-bootstrap.yml`, `divlab-pr-approve.yml`
- Scripts: `scripts/automation/cursor-bridge/`
- Tests: `tests/automation/cursor-bridge.test.ts`
- Issue form: `.github/ISSUE_TEMPLATE/cursor-task.yml`
