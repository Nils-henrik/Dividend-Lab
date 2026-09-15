# Autoredaktion v1.1 — source of truth

Status: **Autoredaktion v1.1 READY / managed release state machine active**  
Approved templates: **Norden i centrum PASS ✅ / BörsSverige PASS ✅ / Bolaget i fokus PASS ✅ / USA i fokus PASS ✅**  
Scheduler: ChatGPT scheduled jobs are the only editorial scheduler: **08:00 Norden i centrum (weekdays) / 08:20 BörsSverige (weekdays) / 11:00 Bolaget i fokus (weekdays) / 14:00 USA i fokus (daily), Europe/Stockholm**.

This document is the authoritative runbook for Autoredaktion v1.1 image production, managed publication handoff, production observation and live verification. It supersedes older v1.1 notes in `AUTOREDATION_V1.md` and `AUTOREDATION_V1_1_VISUAL_REWORK.md` where they differ.

## Editorial source of truth

`DIVLAB_REDAKTION_MASTER.md` remains authoritative for general research, fact-checking, language, SEO and editorial quality. `DIVLAB_REDAKTION_P0_FACT_GATE.md` is the mandatory fact gate. The canonical series addendum for the 11:00 series is `DIVLAB_BOLAGET_I_FOKUS_MASTER.md`. Release automation must never weaken those rules.

Series mandates:

- **Norden i centrum:** Sweden, Norway, Denmark and Finland; Nordic market focus.
- **BörsSverige:** Sweden only; Swedish listed companies, Swedish market and relevant Swedish macro.
- **Bolaget i fokus:** one single materially newsworthy verified company event. Sweden first, then Nordics; an international company only when exceptionally relevant to DivLab's Swedish readers. No filler, rumor-driven angle or broad market sweep. If no sufficiently strong verified candidate exists, report `BLOCKED: inget tillräckligt nyhetsvärdigt och verifierat bolag` and create no branch.
- **USA i fokus:** United States only as the primary market; US-listed companies, S&P 500, Nasdaq, Dow Jones, Federal Reserve, US Treasury rates and US macro. Non-US events may be used only when they have a direct, material link to the US market.

USA i fokus at 14:00 must distinguish verified facts from events that have not happened yet. A US data release scheduled after the editorial research cutoff may be previewed with its verified scheduled time, but no result or market reaction may be invented. On Saturday/Sunday the article must explicitly treat the US cash market as closed and use the latest verified session plus the next confirmed US catalysts instead of pretending there is a same-day opening.

Bolaget i fokus at 11:00 must only describe a share-price reaction when current trading has been independently verified close to the editorial research cutoff. A press release, report or secondary headline is never sufficient evidence by itself that a share is rising or falling.

## Final managed flow

Each scheduled ChatGPT job owns the editorial phase and exactly one initial Git commit:

`research → fact-check → P0 Fact Gate PASS → article → SEO → latest-main check → one managed branch + one initial commit`

The branch must be named exactly:

- `autoredaktion/norden-i-centrum-YYYY-MM-DD`
- `autoredaktion/borssverige-YYYY-MM-DD`
- `autoredaktion/bolaget-i-fokus-YYYY-MM-DD`
- `autoredaktion/usa-i-fokus-YYYY-MM-DD`

The initial commit contains only the new article module and the additive `lib/news/get-articles.ts` registry change. ChatGPT does **not** create the PR until the branch receives a successful `autoredaktion/preflight` commit status.

GitHub then owns deterministic release preparation:

`branch push → normalize controlled fields → render/validate PNG in GitHub Actions → exact pre-PR lint/typecheck/article/image gates → preflight status → draft PR → Quality Gate`

After the PR exists, ChatGPT is no longer required to stay alive. `Autoredaktion Release State Machine` reacts to the completed Quality Gate:

- green exact-head gate → strict PR-policy check → latest-main check → draft becomes Ready → merge exact SHA;
- red gate → at most **one** deterministic repair commit on the **same branch**, then exactly one manually dispatched Quality Gate retry;
- second failure, stale head, stale main, unrelated diff or non-repairable error → STOPP / fail closed.

After a successful managed merge, `Autoredaktion Production Verify` owns the asynchronous production phase:

`exact managed merge SHA → observe Vercel status on that exact SHA → divlab.se live checks → desktop/mobile verification → autoredaktion/production status → X-text`

The production verifier is observation-only. It never calls a Vercel deploy hook, Vercel CLI deploy command, redeploy API, creates a hotfix commit or pushes to `main`.

## Pre-PR contract

No managed PR may be opened until the latest branch head has status:

`autoredaktion/preflight = success`

Preflight includes:

- lint;
- full TypeScript `tsc --noEmit`;
- `autoredaktion:validate-changed` including source exactly `DivLab Redaktion`;
- series/geography/series-identity validation;
- Autoredaktion tests;
- deterministic image render/validation.

This is intentionally before PR creation so simple contract/type failures do not consume a Quality Gate attempt.

## Automatic image production

Renderer: deterministic SVG composition + Sharp. No generative image model and no live logo/image service during a daily run.

Output:

- format PNG;
- exactly 1280×720;
- `/news/generated/norden-i-centrum-YYYY-MM-DD.png`;
- `/news/generated/borssverige-YYYY-MM-DD.png`;
- `/news/generated/bolaget-i-fokus-YYYY-MM-DD.png`;
- `/news/generated/usa-i-fokus-YYYY-MM-DD.png`.

The binary PNG is produced inside GitHub Actions. The generated image and normalized article source are committed together in the one preparation commit marked `[autoredaktion-prepared]`.

### Autonomous no-image fallback — canonical contract

For new managed publications, renderer failure means image-only fields are omitted from the article module. Historical/manual articles may still contain `null`; they are not rewritten.

A declared non-empty generated path remains fail-closed: missing, unreadable, wrong-sized, wrong-dated or otherwise invalid files block publication.

## BörsSverige — approved and frozen

Canonical master: `public/news-demo/borssverige-2026-09-01.png`.

Static pixels preserve Stockholm/morning background, canonical DivLab branding, `BÖRSSVERIGE` and the generic subtitle `De viktigaste nyheterna om svenska börsbolag inför dagen.` Only the existing date field is dynamic. No article headline or company logos are injected.

Template version: `borssverige-v2-2026-09-01-generic-master`.

## Norden i centrum — approved and frozen

Canonical master: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`.

Static pixels preserve the approved `NORDEN / I CENTRUM` composition, DivLab branding and established background. Only the date field and the discrete lower company row are dynamic.

Company selection is deterministic from the final article's `internalLinking.companies`, weighted by editorial hierarchy. Hard maximum: **4 companies**. Missing approved local assets are skipped and traced; zero companies is valid. Daily automation never fetches logos from the network and never invents substitutes.

Template version: `norden-v2-source-of-truth`.

## Bolaget i fokus — approved and frozen

Canonical master: `public/news-demo/bolaget-i-fokus-2026-09-15.png`.

The exact approved Stockholm/lunch composition is reused for every weekday article. The DivLab logo, title/subtitle, waterfront scene and ferry Emelie are part of the frozen series identity. There is **no daily dynamic region** for date, company logo, article headline or other editorial text.

Daily automation must not call image generation, live image search or logo fetching for this series. The deterministic renderer only creates the date-specific canonical 1280×720 PNG output from the frozen master so social metadata and the publication diff remain canonical.

Template version: `bolaget-i-fokus-v1-2026-09-15-static-master`.

## USA i fokus — approved and frozen

Canonical master: `public/news-demo/usa-i-fokus-2026-09-07.png`.

Static pixels preserve the approved New York/Wall Street composition, canonical DivLab branding, `USA I FOKUS`, the generic subtitle `De viktigaste börsnyheterna från USA inför dagen.` and the lower topic strip. Only the existing top-right date field is dynamic.

No daily article headline, company logos, live image search, generative image call or new panel/card may be added by the daily automation.

Template version: `usa-i-fokus-v1-2026-09-07-generic-master`.

## Generated-image validation

A declared generated image must pass:

- exists and non-empty;
- readable PNG;
- 1280×720;
- canonical series/date path;
- article/image Europe/Stockholm date match;
- approved template version and canonical source;
- company mark limits for the relevant template;
- approved local asset availability for every used Norden company;
- masked static-region regression outside declared dynamic areas.

BörsSverige and USA i fokus have no dynamic company row. Norden has maximum four company marks. Bolaget i fokus has no editorially dynamic content; its reusable master is static and any technical mask is non-content-bearing only.

## Strict PR identity

A PR can be managed/merged automatically only when **all** of these are true:

- base is `main`;
- head matches exactly `autoredaktion/(borssverige|norden-i-centrum|bolaget-i-fokus|usa-i-fokus)-YYYY-MM-DD`;
- PR is still open and draft;
- PR body contains `<!-- AUTOREDAKTION_MANAGED_V2 -->`;
- PR has label `autoredaktion`;
- exact branch head has successful `autoredaktion/preflight` status;
- diff contains exactly the canonical article file + `lib/news/get-articles.ts` + optional canonical generated PNG;
- no unrelated code/docs/workflow files are present;
- commit budget is at most three commits: initial publication, optional preparation, optional single CI repair;
- no more than one `[autoredaktion-ci-repair]` commit exists.

The release workflow verifies the successful Quality Gate SHA equals the current PR head and verifies that current `main` is still an ancestor of that head immediately before merge. A stale green run or stale registry base can never be merged.

## Daily-series sequencing

Weekdays use four lanes:

1. Norden i centrum — 08:00 Europe/Stockholm.
2. BörsSverige — 08:20 Europe/Stockholm, after same-day Norden reaches a terminal state.
3. Bolaget i fokus — 11:00 Europe/Stockholm, after same-day Norden and BörsSverige have reached terminal states and after refreshing latest `main`.
4. USA i fokus — 14:00 Europe/Stockholm, after all earlier same-day managed publications have reached terminal states and after refreshing latest `main`.

On weekends only the daily USA i fokus scheduler runs. It must refresh latest `main` before creating its one branch.

If an earlier same-day series is still actively moving through preflight/PR/Quality Gate when a later job starts, the later job may wait only within its bounded job window. It must never create a stale registry write. If it cannot safely establish a terminal predecessor state and latest main, it reports BLOCKED and creates no duplicate branch/PR/deployment.

GitHub additionally serializes managed release handling through one global `autoredaktion-release-global` concurrency lane. The latest-main ancestor check is the final defense if jobs still overlap.

## Bounded self-repair / anti-loop

Per series + Europe/Stockholm date:

- one managed branch;
- one PR;
- one preparation commit maximum;
- Quality Gate attempt 1;
- if attempt 1 fails for a deterministic article/image contract error: one repair commit maximum on the same branch;
- Quality Gate attempt 2 is explicitly dispatched for the repaired SHA;
- if attempt 2 fails: STOPP;
- no second repair branch, PR or merge is created;
- max one merge to `main`;
- max one production deployment caused by the managed publication;
- no automated post-merge hotfix or redeploy.

Expected deterministic repairs are intentionally narrow: exact `DivLab Redaktion` source, canonical image wiring, removal of invalid no-image fields and deterministic image regeneration. Editorial facts/prose, unrelated code failures and stale-main conflicts are never auto-rewritten by the repair stage.

## Vercel deployment budget

Vercel Git preview deployments are disabled for `autoredaktion/*` branches in `vercel.json`. GitHub preflight and Quality Gate are the branch validation systems.

Therefore a normal managed publication has no Vercel deployment during branch preparation/repair. The single merge to `main` is the only publication action that is allowed to cause a production deployment.

The post-merge workflow observes the `Vercel` commit status attached to the exact merge SHA. It can wait for that same status to become successful, but it cannot trigger a new deployment. Failure or timeout means `autoredaktion/production = failure` and STOPP.

## Production/live verification contract

A managed merge is not `LIVE` merely because it exists on `main`.

The exact merge SHA must first receive a successful `Vercel` status. The live verifier then checks `https://divlab.se/news/[slug]` and `/news` for article HTTP 200, exact H1/title/date, SEO metadata, canonical URL, Open Graph/X metadata, generated image when present, article listing, desktop/mobile rendering and no horizontal overflow.

Only after every check passes is commit status `autoredaktion/production` set to `success`. The workflow then posts a compact success trace and an X-text suggestion to the managed PR. X is never posted automatically.

If any post-merge check fails, `autoredaktion/production` becomes `failure`. The workflow creates no commit, no second merge, no hotfix and no redeploy.

## Quality Gate

The ordinary Quality Gate runs the complete repository checks: lint, typecheck, changed autonomous article validation, core tests, SEO/news tests, relevant image tests, Autoredaktion dry-run, visual image dry-run, DivBrain tests, cursor-bridge tests and production build.

`quality-gate.yml` also exposes a bounded `workflow_dispatch` entry used only for the single repaired-SHA retry. It does not add a scheduler.

## Activation requirements for scheduled jobs

Every scheduled prompt must use this handoff:

1. read latest `main`, `DIVLAB_REDAKTION_MASTER.md`, `DIVLAB_REDAKTION_P0_FACT_GATE.md`, `AUTOREDATION_V1.md` and this document; `Bolaget i fokus` must additionally read `DIVLAB_BOLAGET_I_FOKUS_MASTER.md`;
2. research broadly, prefer primary sources, run a separate fact-check and require P0 Fact Gate PASS before handoff;
3. set source exactly `DivLab Redaktion`;
4. do not attempt the daily binary PNG upload from ChatGPT;
5. use one canonical managed branch and one initial commit containing article + additive registry change;
6. wait for `autoredaktion/preflight=success` on the latest branch head;
7. create one **draft** PR with marker `<!-- AUTOREDAKTION_MANAGED_V2 -->` and label `autoredaktion`;
8. stop controlling CI/repair/Ready/merge/deployment; GitHub state machines own the rest;
9. later series must wait for earlier same-day managed publications to reach terminal state and then refresh latest `main` before creating their branch;
10. never trigger a Vercel deployment or redeploy manually as part of the daily publication.

A failed P0 Fact Gate means no branch. A failed preflight means no PR. A failed second Quality Gate means no merge. A failed Vercel/live verification means no automatic hotfix/redeploy. Never bypass any gate.
