# DivBrain Implementation Roadmap v1

**Status:** Executable phased plan + engineering tickets
**Audience:** Engineers implementing DivBrain in Cursor Agent sessions
**Companion docs:** [`product-blueprint.md`](./product-blueprint.md), [`technical-blueprint.md`](./technical-blueprint.md)

Each phase is independently reviewable. Tickets are sized for roughly **one focused Cursor Agent session** unless noted.

**Isolation rule:** Implement on `feature/divbrain-*` branches based on `origin/main`. Do **not** mix with `feature/auth-profile-integrity` / PR #7.

---

## Phase overview

| Phase | Name | Objective |
|-------|------|-----------|
| **1A** | Technical foundation only | Domain, safety, persistence, Henrik allowlist, UnconfiguredProvider, honest `/brain` shell, eval seed, cost **hooks** — **no live provider**. Not the full Internal Alpha milestone. |
| **1B** | Provider benchmark + selection | Benchmark a small provider set on the Swedish eval suite; wire the lowest-cost winner; begin live token/cost logging |
| **1C** | DivLab Learning retrieval | Structured retrieval + numbered citations — completes the meaningful **Internal Alpha** product loop with 1A+1B |
| **1D** | Sources, evals, cost controls | Harden sources UI, grow evals to 100–300, budgets/limits before broader controlled use |
| **2** | Controlled internal usage | Ops metrics + UX polish under Henrik (then carefully expanded) real use — **still unpaid** |
| **3** | Verified financial tools | First read-only tools with freshness + RLS |
| **4** | Later premium Beta prep | **Deferred** — not early roadmap; entitlements/billing only after demand + readiness gates |
| **Later** | Premium capabilities | Portfolio interpretation, news/events, Börsdata & Analys |

**Internal Alpha product milestone** = Phases **1A + 1B + 1C** (at minimum). Phase 1A alone is the non-generating foundation.

**Early roadmap exclusion (Founder):** no billing, paywall, entitlement database, admin panel, vectors, streaming, multi-agent, portfolio AI, or production migration apply in Phases 1A–1D.

---

## Phase 1A — Technical foundation (not full Internal Alpha)

### Objective

Ship a durable **non-generating** foundation: architecture modules, RLS-ready migration (created in code; apply only via env progression), server repository/service, deterministic guardrails, **Henrik-only allowlist**, unconfigured provider, eval seed (expanded to ≈60–80 across 1A-3a/1A-3b), usage/cost **hooks**, honest `/brain` shell — **without** selecting or connecting a live model.

Phase 1A does **not** complete the Internal Alpha product milestone.

### Exact user value

Henrik sees a credible DivBrain surface that explains what works / does not work, can create and **permanently delete** conversations (once migration applied in a safe env), and never receives fake AI answers.

### Dependencies

- Supabase Auth session helpers (`lib/auth/session.ts`)
- Design system / AppShell
- Clean branch from `origin/main`
- Blueprint docs in `docs/divbrain/`
- Non-public env for `DIVBRAIN_ALPHA_USER_IDS` (Henrik’s user id)

### Files / modules likely affected

- `lib/divbrain/**` (new)
- `components/brain/**` (replace mock panel usage on `/brain`)
- `app/brain/page.tsx`, `app/brain/actions.ts` (new)
- `data/brain.ts` (remove or quarantine fake insights from product paths)
- `supabase/migrations/YYYYMMDDHHMMSS_create_divbrain_tables.sql` (new)
- `docs/divbrain/**` (already present)
- Test runner config (new, minimal)
- Possibly `lib/constants/navigation.ts` status label only if needed

### Database work

- Create `divbrain_conversations`, `divbrain_messages` + indexes + RLS
- Owner **permanent DELETE** of conversation cascades to messages; account delete cascades to conversations
- Soft archive optional and never a substitute for delete; no direct message DELETE required
- **No automatic retention jobs**
- Env progression: code → **dev** → Preview/staging → production only with separate approval
- **Do not apply to production** as part of 1A unless explicitly approved as a release

### Security requirements

- RLS owner-only; no anon access
- Owner-only conversation DELETE; another user must never archive/restore/delete others’ conversations
- No service role in user paths
- `server-only` on policy/identity/provider/repository/service/allowlist
- Henrik-only allowlist via non-public env
- Blocked turns: **no full content persistence**; safe reason codes only
- No secrets in client bundles

### Tests

- Guardrails vs fixture (seed in 1A-3a; full ≈60–80 in 1A-3b)
- Source validation/serialization
- Context ordering + delimiters
- Provider unavailable
- Allowlist reject path
- Blocked-request non-persistence behavior
- Owner delete cascade behavior (where testable without prod apply)
- Error mapping
- Eval fixture integrity

### Browser verification

- 1440×900, 768×1024, 390×844
- Empty, blocked, provider_unavailable, not-allowlisted, composer a11y

### Acceptance criteria

- [ ] Architecture modules exist and are typed; product name **DivBrain** in new UI copy
- [ ] Migration present, reviewed; applied at most in dev/preview per process — not casually to prod
- [ ] Owner permanent conversation delete supported in schema/RLS; archive optional only
- [ ] `/brain` honest foundation shell (no fake answers)
- [ ] Unconfigured provider returns `provider_unavailable`
- [ ] Allowlist enforces Henrik-only access
- [ ] Blocked requests do not persist full prompt bodies
- [ ] Cost/usage **hooks** present; no claim of live provider cost logging
- [ ] Lint + build pass; deterministic tests pass
- [ ] No AI SDK / no provider keys / no provider selection

### Explicit exclusions

Live provider selection, Learning retrieval (1C), vectors, tools, portfolio AI, streaming, billing, admin, entitlement DB, auto-retention jobs

### Complexity

**L** (multi-session; split via tickets below — each ticket one focused session)

### Cost risks

Near zero provider cost; watch accidental dependency adds

### Rollback

Revert feature branch; leave migration unapplied in higher envs; navigation remains “Under utveckling”

---

## Phase 1B — Provider benchmark and selection

### Objective

**Do not guess a vendor.** Benchmark a **small number** of providers behind `DivBrainProvider` using the **same Swedish eval suite**. Select the **lowest-cost** provider that meets defined quality, safety, latency and source-handling requirements. Then complete the request lifecycle end-to-end with that single winner.

### Exact user value

Henrik gets real educational answers (still bounded); failures are calm and typed; cost is justified by measured quality.

### Dependencies

- 1A merged to main (or stacked cleanly)
- Migration applied in target **non-prod** env (dev → preview/staging)
- Server env secrets via approved secret store
- Written pass bars for quality/safety/latency/sources before selection

### Files / modules likely affected

- `lib/divbrain/provider*.ts`, `providers/*`, `service.ts`, `cost.ts`
- `app/brain/actions.ts`
- Env example docs (no real secrets committed)

### Database work

- Possibly extend `provider_meta` usage only; avoid schema churn

### Security requirements

- Keys server-only
- Output validation before persist
- Timeouts + cancellation
- Allowlist still Henrik-only

### Tests

- Adapter error mapping (mocked fetch)
- Benchmark harness runs eval suite per candidate (no silent vendor lock-in)
- Idempotent/duplicate submit behavior
- Cost field presence

### Browser verification

- Completed turn, failed turn, cancelled feel
- No raw provider errors

### Acceptance criteria

- [ ] ≥2 candidate adapters evaluated on the same Swedish suite (small set)
- [ ] Winner documented with cost/quality/safety/latency/source rationale
- [ ] One provider factory selectable by env after selection
- [ ] No fake fallback text on failure
- [ ] Usage tokens persisted safely
- [ ] Streaming **not** required

### Explicit exclusions

Permanent multi-provider production routing, tools, Learning retrieval (can stub), public launch, billing

### Complexity

**M–L**

### Cost risks

Benchmark spend — cap candidate set and token budgets; enforce 1A constants before enablement

### Rollback

Set provider to `unconfigured`; keys revoked

---

## Phase 1C — DivLab Learning retrieval

### Objective

Retrieve top Learning articles/excerpts; attach structured citations.

### Exact user value

Answers navigate into DivLab Utbildning with visible sources.

### Dependencies

- 1B (or 1A+mocked provider for retrieval unit tests)
- `data/learning/*` corpus

### Files / modules likely affected

- `lib/divbrain/learning-retrieve.ts`
- `context.ts`, `sources.ts`
- UI citation components

### Database work

None required

### Security requirements

- Untrusted delimiters around excerpts
- No policy override from article text
- Safe URLs only

### Tests

- Ranking determinism on fixture queries
- Citation IDs stable
- Injection-like article content cannot change decision

### Browser verification

- Citation tap → Learning route
- Mobile source shell

### Acceptance criteria

- [ ] Educational prompts cite ≥1 Learning source when matched
- [ ] No match → honest limited answer / clarification, not invention

### Explicit exclusions

Vector DB, news/forum retrieval

### Complexity

**M**

### Cost risks

Over-large excerpts — enforce caps

### Rollback

Feature flag `DIVBRAIN_LEARNING_RETRIEVAL=off`

---

## Phase 1D — Sources, evals and cost controls

### Objective

Harden source UX, grow evals to ~100–300, enforce rate/token budgets, optional usage table.

### Exact user value

Trustworthy citations + predictable availability under load.

### Dependencies

1B + 1C

### Files / modules likely affected

- Eval fixtures, CI test script
- `cost.ts`, constants, maybe `divbrain_usage_events` migration
- Source UI polish

### Database work

Optional usage_events migration

### Security / tests / browser

- CI gate on guardrail suite
- Budget exceeded → calm rate_limit UI
- Freshness labels visible

### Acceptance criteria

- [ ] ≥100 eval cases; unique IDs; category coverage checklist green
- [ ] Per-user soft limits enforced server-side
- [ ] Cost aggregates reviewable from DB/logs

### Explicit exclusions

Paid entitlements UI, multi-agent

### Complexity

**M**

### Cost risks

Eval generation via paid models — **do not**; author fixtures manually/curated

### Rollback

Relax limits via constants; disable usage table reads

---

## Phase 2 — Controlled internal usage

### Objective

Operate DivBrain under real (still unpaid) use with the **existing Henrik-only allowlist** from 1A; gather quality/cost signal; polish UX. Expand the env allowlist only with explicit Founder approval — still no admin panel.

### Exact user value

Real feedback loop without public promise of AI completeness and without monetization pressure.

### Dependencies

1D; staging migration validation; production only with separate approval if needed for internal use

### Work

- Ops notes for failure modes
- Fix top eval failures
- UX copy polish (Swedish editor pass)
- Weekly cost/quality review
- Optional: add a second allowlisted id via env **only if Founder approves**

### Acceptance criteria

- [ ] Allowlist still server-only env (no entitlement DB)
- [ ] Weekly cost/quality review artifact exists
- [ ] No P0 privacy/safety incidents
- [ ] Still unpaid

### Exclusions

Public marketing “AI fully live”, portfolio tools, billing, admin panel

### Complexity

**S–M**

### Rollback

Disable provider / empty allowlist

---

## Phase 3 — Verified financial tools

### Objective

Add first **read-only** tools against verified DivLab data (e.g. company snapshot fields that actually exist), with freshness metadata.

### Exact user value

Interpretation of real DivLab records — still non-advice.

### Dependencies

Stable data APIs/tables; Phase 2 confidence

### Security

- Tool sensitivity classification
- User-private tools session-bound
- Guardrail `toolCallPermitted`

### Acceptance criteria

- [ ] Tool results always carry freshness + source
- [ ] Unavailable fields never invented
- [ ] Eval cases for tool hallucination resistance

### Exclusions

Order execution, portfolio mutation, live broker quotes unless explicitly approved

### Complexity

**L**

### Rollback

Unregister tools; context announces unavailable

---

## Phase 4 — Later premium Beta prep (deferred)

### Objective

**Not part of the early technical roadmap.** Prepare a controlled premium Beta only after free-audience value, sources, cost controls, evals, privacy/legal readiness and demonstrated demand (product blueprint §12.2 / §16).

### Exact user value

Eventually: optional paid DivBrain with clear limits and trust — **after** DivLab has proven unpaid value.

### Dependencies

Phases 1–3 confidence; legal/disclaimer + transcript retention/export/deletion docs; demand evidence; billing primitive elsewhere if/when needed

### Acceptance criteria

- [ ] Paid launch checklist complete (Founder gate)
- [ ] Eval suite CI required
- [ ] Support path for blocked/failed
- [ ] Unit economics accepted by Founder
- [ ] Retention/export/deletion documented

### Exclusions

Full multi-market terminal, advisory claims; **do not start billing work during 1A–1D**

### Complexity

**L** (when started)

### Rollback

Remain internal / free-only

---

## Later premium capabilities (ordered)

1. Portfolio interpretation (user-owned only)
2. Watchlist context
3. Approved Börsnyheter / event explanation
4. Börsdata & Analys deep-dives
5. Forum retrieval (policy-gated)
6. Streaming default
7. Conversation summaries for long threads
8. Vector retrieval **if** metrics demand

---

## Engineering tickets

Tickets are independently reviewable. Stack on `feature/divbrain-*` from `origin/main`.

### 1A-1 — Architecture doc freeze + package boundaries

- **Goal:** Confirm `docs/divbrain/*` linked from docs index if appropriate; scaffold `lib/divbrain/` file stubs with types/constants/errors/results
- **Accept:** Imports compile; no UI change required
- **Exclude:** Provider keys, migration apply

### 1A-2 — Source model utilities

- **Goal:** `sources.ts` validation, freshness/verification enums, serialization
- **Tests:** URL safety, HTML rejection, JSON round-trip
- **Exclude:** UI

### 1A-3a — Deterministic guardrail engine + seed evals

- **Goal:** `safety.ts` decision model + approximately **20–30** representative Swedish eval cases across critical categories (advice, fabrication, injection, privacy, education sample)
- **Accept:** Deterministic classifications; unique case IDs; tests pass for the seed set
- **Exclude:** Full 60–80 fixture; model calls

### 1A-3b — Expand Swedish eval fixture to ≈60–80

- **Goal:** Grow fixture to approximately **60–80** cases with required category coverage; fixture integrity tests (no duplicate IDs)
- **Accept:** Category checklist green; guardrail assertions for new cases
- **Exclude:** Model calls; Learning retrieval cases (those land in 1C-3)

### 1A-4 — Identity, policy, context assembly (server-only)

- **Goal:** `identity.ts`, `policy.ts`, `context.ts` with ordering + delimiters + budgets; usage/cost **hook** types only
- **Tests:** Order + delimiter presence; size truncation
- **Exclude:** Retrieval implementation; live cost logging

### 1A-5 — Provider interface + UnconfiguredProvider

- **Goal:** `provider.ts` contract; unavailable result; no fake text
- **Tests:** Unconfigured behavior
- **Exclude:** Real SDK; vendor selection

### 1A-6 — Supabase migration + RLS

- **Goal:** Chronological migration for `divbrain_*` tables, constraints, indexes, RLS including **owner conversation DELETE** cascade; no direct message DELETE required
- **Review:** Anon deny; owner checks; cross-user archive/delete denied; no collision with `messages`
- **Exclude:** Apply to production

### 1A-7a — Repository CRUD and ownership-safe data access

- **Goal:** Typed server-only repository: list/read/create/rename/archive/restore/**delete** conversations; list/add messages; explicit column selection; session-derived owner only
- **Accept:** Safe result/error types; delete cascades via FK; no raw Supabase errors to UI layer
- **Exclude:** Full request lifecycle orchestration; streaming

### 1A-7b — Application-service orchestration and request lifecycle

- **Goal:** Service layer: auth → allowlist → validate → guardrails → branch blocked (no persist) vs allowed (persist → context → UnconfiguredProvider → persist safe result)
- **Accept:** Blocked content never persisted; provider_unavailable honest; no fake answers
- **Exclude:** Real provider; Learning retrieval; safety-event analytics store

### 1A-8 — Henrik-only Alpha allowlist (server-only)

- **Goal:** Enforce `DIVBRAIN_ALPHA_USER_IDS` (or equivalent) after auth; calm unavailable UI for others
- **Accept:** No admin panel; no entitlement DB
- **Exclude:** Multi-tenant plan system

### 1A-9a — `/brain` shell, layout and honest empty states

- **Goal:** Replace placeholder with DivBrain shell + history area + empty + provider-unavailable states; remove fake insights from this route
- **Browser:** Desktop/tablet/mobile layout checklist
- **Exclude:** Composer interaction polish; live generation; provider connection

### 1A-9b — Composer, message states and responsive interaction

- **Goal:** Composer usability, loading/blocked/failed presentation, keyboard focus, responsive interaction
- **Browser:** 1440×900, 768×1024, 390×844; a11y focus
- **Exclude:** Live provider connection; fabricated assistant answers

### 1A-10 — Test runner + CI scripts

- **Goal:** Minimal vitest/node:test; `npm test` script; run in lint/build workflow if present
- **Note:** Prefer smallest dependency; avoid lockfile churn beyond necessity
- **Exclude:** E2E Playwright suites unless already standard

### 1B-1a — Provider benchmark contract, scorecard and first thin adapter

- **Goal:** Benchmark harness + cost/quality/safety/latency/source scorecard + **one** thin candidate adapter against the Swedish eval suite
- **Accept:** Scorecard filled for candidate A; secrets server-only; small candidate set planned (not expanded)
- **Exclude:** Multiple complete adapters in one session; production selection

### 1B-1b — Additional candidate adapter(s) and comparative evaluation

- **Goal:** Add remaining thin adapter(s) in the **same small** candidate set; run comparative eval; recommend lowest-cost winner meeting bars
- **Accept:** Documented comparison; no permanent multi-provider production routing
- **Exclude:** Expanding beyond the planned small candidate set

### 1B-2 — Select winner + wire factory

- Document selection; env-based single provider; timeout; usage mapping; secrets server-only

### 1B-3 — Wire service → UI completed turns

- Actions, loading state, retry/cancel semantics

### 1B-4 — Cost persistence + internal logging

- Safe `provider_meta` / usage fields (allowed turns only) — **live** token/cost logging begins here

### 1C-1 — Learning retriever

- Score + excerpt + `DivBrainSource` emission

### 1C-2 — Citation UI

- Numbered sources; links to `/learning/[slug]`

### 1C-3 — Retrieval eval cases

- Add Learning-grounding cases to fixture

### 1D-1 — Expand evals to 100–300

- Category coverage audit

### 1D-2 — Rate limits + token budgets enforcement

- Server-side counters

### 1D-3 — Optional `divbrain_usage_events`

- Migration + repository writes (dev → preview → prod approval path)

### 2-1 — Swedish editorial pass on system-facing UI strings

### 2-2 — Top failure remediation sprint (eval-driven)

### 2-3 — Weekly cost/quality review ritual (ops, not a feature)

### 3-1 — Tool registry interface + first read-only tool

### 3-2 — Freshness + unavailable field protocol for tools

### 3-3 — Tool-related eval pack

### 4-x — Premium Beta tickets (deferred)

- Entitlements, paid checklist, support runbook — **start only after Founder demand/readiness gate**; not scheduled in early roadmap

---

## Recommended first five implementation tickets

Execute in this dependency order (unchanged parent IDs; 1A-3 starts with **1A-3a**):

1. **1A-1** — Package boundaries, types and safe error taxonomy
2. **1A-2** — Source and citation model
3. **1A-3** — Guardrails and Swedish eval fixture — begin with **1A-3a** (engine + 20–30 cases), then **1A-3b** (expand to ≈60–80)
4. **1A-5** — Provider interface and UnconfiguredProvider (**no vendor selection** in 1A)
5. **1A-6** — Database migration and RLS (create in code; apply via env progression; owner DELETE cascade)

Then continue with:

6. **1A-4** — Context assembly (identity, policy, budgets, delimiters; cost hooks only)
7. **1A-7a** → **1A-7b** — Repository CRUD, then application-service lifecycle
8. **1A-8** — Henrik-only allowlist
9. **1A-9a** → **1A-9b** — `/brain` shell/empty states, then composer/message interaction
10. **1A-10** — Focused tests and validation

---

## Documentation convention note

Blueprints live under `docs/divbrain/` rather than only `docs/ai/`, because DivBrain is a **product + security + data** domain. `docs/ai/` holds legacy Brain notes; `docs/divbrain/` is the canonical current source. A later cleanup may turn `DIVIDEND_BRAIN.md` into a short pointer.

---

## Document control

| Field | Value |
|-------|-------|
| Version | 1.2 |
| Date | 2026-07-18 |
| Changes | Clarify Alpha vs 1A; permanent delete; ticket splits 1A-3/7/9 and 1B-1; cost-hook timing |
