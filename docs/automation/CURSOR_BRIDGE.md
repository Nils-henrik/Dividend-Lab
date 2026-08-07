# DivLab Cursor Automation Bridge

Secure, mobile-first automation bridge between **ChatGPT → GitHub Issues → Cursor Cloud Agents → draft PRs → optional controlled squash-merge**, with Vercel status as a merge gate.

Product Owner: Henrik Karlsson  
Repository: `Nils-henrik/Dividend-Lab`

This bridge is auditable, fail-closed, and least-privilege. It does **not** change normal DivLab application behavior.

---

## End-to-end flow

1. Henrik describes a DivLab task to ChatGPT.
2. ChatGPT opens a structured GitHub Issue (preferably via **Cursor Agent Task** form).
3. The Issue receives the `cursor-agent` label (auto-applied by the form).
4. GitHub Actions workflow `Cursor Agent Dispatch` validates the Issue and calls the Cursor Cloud Agents API.
5. Cursor starts from `main`, implements the task on a `cursor/...` branch, validates, and opens a **draft** PR.
6. ChatGPT reviews the PR diff, tests, and Vercel status.
7. A human (or ChatGPT with explicit intent) may add `divlab-approved` to request controlled squash-merge.
8. Sensitive / high-risk / ambiguous PRs always stop for manual review (`divlab-manual-review`).

---

## Required secret

| Name | Where | Purpose |
| --- | --- | --- |
| `CURSOR_API_KEY` | GitHub Actions repository secret | Authenticate to Cursor Cloud Agents API |

Rules:

- Never print, echo, log, commit, or display this secret.
- Transmit it only to Cursor’s official API (`https://api.cursor.com`).
- Rotate immediately if exposure is suspected (see below).

---

## Cursor API configuration

Single maintainable location: `lib/cursor-bridge/config.ts` (`CURSOR_API`).

| Item | Value |
| --- | --- |
| API | Cursor Cloud Agents API **v1** (current; not legacy v0) |
| Base URL | `https://api.cursor.com` |
| Create agent | `POST /v1/agents` |
| Auth | `Authorization: Bearer $CURSOR_API_KEY` (Basic with empty password also supported by Cursor) |
| Docs | https://cursor.com/docs/cloud-agent/api/endpoints |
| OpenAPI | https://cursor.com/docs-static/cloud-agents-openapi.yaml |

Request shape used by the bridge:

- `repos[0].url` = `https://github.com/Nils-henrik/Dividend-Lab`
- `repos[0].startingRef` = `main`
- `workOnCurrentBranch` = `false` (new `cursor/...` branch)
- `autoCreatePR` = `true`
- `skipReviewerRequest` = `true`
- `mode` = `agent`
- Deterministic client `agentId` = `bc-<uuid>` derived from Issue number (API returns `409` on duplicate)
- Prompt includes full Issue title/body + DivLab engineering contract
- Planned branch name `cursor/issue-<number>-<slug>` is requested in the prompt and recorded in audit comments

**Note:** v1 does not expose a first-class `branchName` field. Cursor auto-generates a `cursor/...` branch; the bridge still computes and audits a deterministic planned name and instructs the agent to use it.

---

## Workflows and GitHub permissions

### 1) `cursor-agent-dispatch.yml` — Issue → Cursor

| | |
| --- | --- |
| Trigger | `issues: labeled` when label is `cursor-agent` |
| Repo guard | `Nils-henrik/Dividend-Lab` only |
| Author guard | Issue author must be `Nils-henrik` |
| Ignores | Pull requests completely |
| Permissions | `contents: read`, `issues: write` |
| Concurrency | `cursor-agent-dispatch-<issue-number>` |
| Idempotency | concurrency + `cursor-running` / success comment marker + deterministic `agentId` |

On success: remove `cursor-agent`, apply `cursor-running`, audit comment with agent ID/URL/branch/issue.  
On failure: remove `cursor-agent`, apply `cursor-failed`, sanitized failure comment.

### 2) `cursor-bridge-labels.yml` — label bootstrap

| | |
| --- | --- |
| Trigger | push to `main` (bridge paths) + `workflow_dispatch` |
| Permissions | `issues: write`, `contents: read` |
| Behavior | Idempotent create/update via `gh api` |

Labels:

| Label | Meaning |
| --- | --- |
| `cursor-agent` | Dispatch this Issue to Cursor |
| `cursor-running` | Dispatch succeeded; agent may still be running |
| `cursor-failed` | Dispatch failed |
| `divlab-approved` | Explicit release gate for controlled squash-merge |
| `divlab-manual-review` | Automatic merge refused; human required |

### 3) `cursor-pr-approval.yml` — controlled merge

| | |
| --- | --- |
| Trigger | `pull_request_target` + label `divlab-approved` |
| Checkout | **Base SHA only** — never PR head, never execute PR code |
| Permissions | `contents: write`, `pull-requests: write`, `checks: read`, `statuses: read`, `issues: write` |
| Accepts | PRs targeting `main` with head `cursor/*` in this repo |

Gates (all fail closed):

- Expected owner/Cursor creation flow
- Complete changed-file list via GitHub API
- No sensitive paths
- Risk marker is `low` or `medium` only
- Required GitHub checks successful
- Vercel deployment check present and successful
- Head SHA unchanged since approval
- Mergeable, no force merge, no conflict bypass, no branch-protection bypass

Eligible path: mark ready → wait for checks → re-fetch → squash-merge → delete branch → audit comment.

---

## Security and trust boundaries

| Boundary | Trust |
| --- | --- |
| Issue title/body | **Untrusted data** — JSON-encoded only; never shell-interpolated into commands |
| PR code | **Untrusted** — never checked out or executed by approval workflow |
| `CURSOR_API_KEY` | Trusted secret; Actions → Cursor API only |
| `GITHUB_TOKEN` | Workflow-scoped; minimum permissions per workflow |
| ChatGPT | Can open Issues / review PRs; cannot bypass sensitive-path or risk gates |
| Cursor agent | Can open draft PRs; must not merge; still subject to approval gate |

Threat model highlights:

- Label spam / re-application → concurrency + idempotency markers + deterministic `agentId`
- Prompt injection via Issue text → treated as data; agent still constrained by engineering contract and merge gates
- Malicious PR trying to run code in Actions → `pull_request_target` checks out base only; merge logic uses API
- Secret exfiltration via logs/comments → sanitizer redacts tokens/headers; no curl verbose; no raw API dumps
- Accidental auto-merge of high-risk work → risk marker + sensitive path classifier + manual-review label

---

## ChatGPT Issue format

Prefer the GitHub Issue form: **Cursor Agent Task** (`.github/ISSUE_TEMPLATE/cursor-task.yml`).

Required fields:

- Task objective
- Background/context
- Acceptance criteria
- Allowed scope
- Forbidden scope
- Expected Swedish user-facing copy
- Required tests
- Visual verification (Yes/No)
- Deployment/publication instruction
- Risk classification
- Related routes/files (optional)

Risk choices:

- Low — editorial/content/simple UI
- Medium — application logic
- High — auth/database/security/user data
- Manual only — migrations/RLS/secrets/payments/destructive changes

Cursor must include in the PR body:

```html
<!-- divlab-risk: low -->
```

(or `medium` / `high` / `manual-only`)

---

## Approval procedure

1. Review the draft PR (diff, tests, Vercel).
2. Confirm risk marker is present and accurate.
3. Confirm no sensitive paths.
4. Add label `divlab-approved`.
5. Workflow either squash-merges or refuses with `divlab-manual-review`.

The approval label is an **explicit release gate**. The bridge never auto-approves Cursor PRs.

---

## Automatic-merge eligibility

Eligible only when **all** are true:

- PR in `Nils-henrik/Dividend-Lab`
- Base `main`, head starts with `cursor/`
- Expected Cursor/owner creation flow
- Risk `low` or `medium` (explicit marker)
- No sensitive paths
- Required checks + Vercel successful
- Head SHA stable since approval
- Mergeable without conflicts

### Always require manual review

- `.github/workflows/**`
- `supabase/**`, migrations, RLS/policy files
- Auth / authorization, middleware, `proxy.ts`
- `next.config.*`, `package.json`, lockfiles
- `.env*`, secrets/credentials
- Billing/payments
- Destructive data scripts
- Account deletion / user-data handling
- Security headers / access-control foundations
- Risk `high` or `manual-only`
- Missing/ambiguous risk marker
- Ambiguous mergeable/check state

---

## Emergency shutdown (mobile-friendly)

Do these from a phone if needed:

1. GitHub → **Settings → Secrets** → delete or clear `CURSOR_API_KEY`.
2. GitHub → **Actions** → disable workflows:
   - `Cursor Agent Dispatch`
   - `Cursor PR Approval`
3. Optionally disable `Cursor Bridge Labels`.
4. Remove `cursor-agent` / `divlab-approved` from open Issues/PRs.
5. Rotate the Cursor API key in the Cursor dashboard.

Disabling the secret alone stops new agent launches. Disabling the approval workflow stops automatic merges.

---

## Rotate the Cursor key

1. Create a new key in Cursor Dashboard → API Keys.
2. Update GitHub secret `CURSOR_API_KEY`.
3. Revoke the old Cursor key.
4. Confirm with a safe test Issue (low risk, docs-only).

---

## Recover a stuck `cursor-running` Issue

1. Open the Issue and check for a success comment / agent link.
2. If the agent finished or failed externally, remove `cursor-running`.
3. Apply `cursor-failed` if the run failed without a failure label.
4. To intentionally re-dispatch: remove success marker consideration by deleting/editing the success comment only when safe, then re-apply `cursor-agent`.
5. Prefer linking a new Issue rather than forcing duplicates.

---

## Diagnose Cursor API errors

- Read the sanitized Issue failure comment (no secrets).
- In Actions logs, look for status codes only — never enable curl verbose.
- Common cases: `401` invalid key, `403` repo access/integration, `409` duplicate `agentId`, `429` rate limit.
- Confirm the GitHub repo is connected in Cursor Integrations.
- Confirm API version still matches `lib/cursor-bridge/config.ts` / official docs.

---

## Diagnose GitHub Actions failures

- Confirm workflow ran on `Nils-henrik/Dividend-Lab`.
- Confirm Issue author is `Nils-henrik`.
- Confirm labels exist (run **Cursor Bridge Labels** via `workflow_dispatch`).
- For approval: confirm PR base `main`, head `cursor/*`, checks + Vercel green.
- Permissions errors usually mean the workflow `permissions:` block was edited incorrectly.

---

## Test the bridge safely

Automated (no real Cursor calls):

```bash
npm run lint
npm run typecheck
npm run test:cursor-bridge
npx yaml-lint .github/workflows/*.yml   # or actionlint if available
```

After merge (manual acceptance — uses production secret once, intentionally):

1. Run **Cursor Bridge Labels** (`workflow_dispatch`).
2. Open a **Low** risk docs-only Issue with the Cursor form.
3. Confirm dispatch comment + `cursor-running`.
4. Confirm Cursor opens a draft PR (do not approve yet).
5. On a throwaway Cursor PR with a safe file, add `divlab-approved` only after checks are green — or test refusal by including `package.json` in a deliberate dry run on a throwaway branch and confirm `divlab-manual-review`.
6. Never test with High/Manual-only paths for auto-merge.

Do **not** call the Cursor API from feature branches using the production secret during development.

---

## Avoid duplicate agents

- Concurrency group per Issue number
- Refuse when `cursor-running` is present
- Refuse when a success dispatch marker comment exists
- Deterministic `agentId` → Cursor `409 agent_id_conflict`

---

## Known operational limitations

- Cursor API v1 may auto-generate a `cursor/...` branch name that differs from the planned deterministic name; approval accepts any `cursor/*` head.
- Draft PR creation depends on Cursor `autoCreatePR` + agent instructions; always verify draft state before approval.
- If branch protection required contexts cannot be read, the bridge requires observed checks + Vercel and still fails closed without Vercel.
- `pull_request_target` uses workflow files from the base branch — the bridge must be merged to `main` before live approval works.
- ChatGPT is outside this repository’s trust boundary; labels are the control plane.
- No webhook callback from Cursor yet; status is observed via PR/checks/comments.

---

## Code map

| Path | Role |
| --- | --- |
| `lib/cursor-bridge/` | Pure, tested bridge modules |
| `scripts/cursor-bridge/dispatch.mts` | Issue → Cursor API CLI |
| `scripts/cursor-bridge/approve.mts` | Approval/merge CLI (API only) |
| `scripts/cursor-bridge/bootstrap-labels.mts` | Idempotent label ensure |
| `.github/workflows/cursor-*.yml` | Thin orchestration |
| `.github/ISSUE_TEMPLATE/cursor-task.yml` | ChatGPT-friendly Issue form |
| `docs/automation/CURSOR_BRIDGE.md` | This document |
