# Autoredaktion v1.1 — source of truth

Status: **Autoredaktion v1.1 READY / release hardening phase B implemented**  
Approved templates: **Norden i centrum PASS ✅ / BörsSverige PASS ✅**  
Scheduler: the existing ChatGPT weekday jobs remain the only scheduler: **08:00 Norden i centrum / 08:20 BörsSverige**.

This document is the authoritative runbook for Autoredaktion v1.1 image production, managed publication handoff, production observation and live verification. It supersedes older v1.1 notes in `AUTOREDATION_V1.md` and `AUTOREDATION_V1_1_VISUAL_REWORK.md` where they differ.

## Editorial source of truth

`DIVLAB_REDAKTION_MASTER.md` remains authoritative for research, fact-checking, language, SEO and editorial quality. Release automation must never weaken those rules.

## Final managed flow

The weekday ChatGPT job owns the editorial phase and exactly one initial Git commit:

`research → fact-check → article → SEO → latest-main check → one managed branch + one initial commit`

The branch must be named exactly:

- `autoredaktion/norden-i-centrum-YYYY-MM-DD`
- `autoredaktion/borssverige-YYYY-MM-DD`

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

The preflight runs the same failure classes that blocked the first live attempt:

- lint;
- full TypeScript `tsc --noEmit`;
- `autoredaktion:validate-changed` (including exact `DivLab Redaktion` author/source contract);
- Autoredaktion tests;
- deterministic image tests.

This is intentionally before PR creation so simple contract/type failures do not consume a Quality Gate attempt.

## Automatic image production

Renderer: deterministic SVG composition + Sharp. No generative image model and no live logo/image service.

Output:

- format PNG;
- exactly 1280×720;
- `/news/generated/norden-i-centrum-YYYY-MM-DD.png`;
- `/news/generated/borssverige-YYYY-MM-DD.png`.

The binary PNG is produced inside GitHub Actions, where Sharp can write the file into the checked-out publication branch. The generated image and normalized article source are committed together in the one preparation commit marked `[autoredaktion-prepared]`. This removes the requirement for the ChatGPT GitHub connector to upload binary data.

### Autonomous no-image fallback — canonical contract

For **new managed Autoredaktion publications**, renderer failure means the following fields are **omitted** from the article module:

- `imageUrl`
- `thumbnailImageUrl`
- image-only optional metadata when no image exists

The runtime meaning is therefore `undefined`, not an explicit `null`. Historical/manual `NewsArticle` modules may still contain `null`; they are not rewritten.

This omission contract supersedes older v1/v1.1 wording that instructed the autonomous generator to emit `imageUrl: null`. A declared non-empty generated path remains fail-closed: missing, unreadable, wrong-sized, wrong-dated or otherwise invalid files block publication.

## BörsSverige — approved and frozen

Canonical master: `public/news-demo/borssverige-2026-09-01.png`.

Static pixels preserve:

- Stockholm/morning background;
- canonical DivLab branding;
- `BÖRSSVERIGE`;
- generic subtitle: `De viktigaste nyheterna om svenska börsbolag inför dagen.`

Only the existing date field is dynamic. No article headline, company logos, new panels/cards or generative image work may be added.

Template version: `borssverige-v2-2026-09-01-generic-master`.

## Norden i centrum — approved and frozen

Canonical master: `public/news-demo/file_000000008a308210b3b73b7b8e0ad122.png`.

Static pixels preserve the approved `NORDEN / I CENTRUM` composition, DivLab branding and established background. Only the date field and the discrete lower company row are dynamic.

Company selection is deterministic from the final article's `internalLinking.companies`, weighted by editorial hierarchy: title, summary, first intro paragraph, section headings, then section body.

Hard maximum: **4 companies**. Missing approved local assets are skipped and traced; zero companies is valid. Daily automation never fetches logos from the network and never invents substitutes.

Template version: `norden-v2-source-of-truth`.

## Generated-image validation

A declared generated image must pass:

- exists and non-empty;
- readable PNG;
- 1280×720;
- canonical series/date path;
- article/image Europe/Stockholm date match;
- approved template version and canonical source;
- no duplicate companies and no more than four for Norden;
- no company marks for BörsSverige;
- approved local asset availability for every used Norden company;
- masked static-region regression outside declared dynamic areas.

## Strict PR identity

A PR can be managed/merged automatically only when **all** of these are true:

- base is `main`;
- head matches exactly `autoredaktion/(borssverige|norden-i-centrum)-YYYY-MM-DD`;
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

Norden i centrum is the first release lane at 08:00. BörsSverige is second at 08:20.

Before BörsSverige creates its managed branch it must inspect the same-day Norden run. If Norden is still actively moving through preflight/PR/Quality Gate, BörsSverige waits and re-checks rather than writing a registry change from a stale `main`. When Norden is either successfully merged or definitively fail-closed, BörsSverige refreshes latest `main` and only then creates its one initial commit.

GitHub additionally serializes managed release handling through one global `autoredaktion-release-global` concurrency lane. The latest-main ancestor check is the final defense if the two series still race.

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

The exact merge SHA must first receive a successful `Vercel` status. The live verifier then checks `https://divlab.se/news/[slug]` and `/news` for:

- article HTTP 200;
- exact H1/title and published timestamp;
- SEO title and description;
- canonical URL on `https://divlab.se`;
- Open Graph title/description;
- when an image is present: `twitter:card=summary_large_image`, exact `og:image` and `twitter:image`;
- generated image HTTP 200, `image/png`, decodable PNG, exactly 1280×720;
- article present in `/news`;
- desktop 1280px and mobile 390px article rendering;
- desktop/mobile `/news` article visibility and no horizontal overflow;
- thumbnail exists in the article row when a generated image is present.

Only after every check passes is commit status `autoredaktion/production` set to `success`. The workflow then posts a compact success trace and an X-text suggestion to the managed PR. X is never posted automatically.

If any post-merge check fails, `autoredaktion/production` becomes `failure`. The workflow creates no commit, no second merge, no hotfix and no redeploy.

## Quality Gate

The ordinary Quality Gate still runs the complete repository checks:

- lint;
- typecheck;
- changed autonomous article validation;
- core tests;
- SEO/news tests;
- Autoredaktion image tests when relevant;
- Autoredaktion dry-run;
- visual image dry-run when relevant;
- DivBrain tests;
- cursor-bridge tests;
- production build.

`quality-gate.yml` also exposes a bounded `workflow_dispatch` entry used only for the single repaired-SHA retry. It does not add a scheduler.

## Future-day contract fixture

The Autoredaktion test suite contains future-day fixtures for the next publication date shape. They validate canonical BörsSverige/Norden branch identity, Swedish article filename mapping, optional image fallback, production-status observation and canonical `divlab.se` URL construction before the next real live run.

This prevents date-specific assumptions from making a green 14 September implementation fail on the next weekday.

## Existing production verification baseline

The v1.1 renderer/template transport was production-verified 12 September 2026: PRs #295/#296/#297/#298 established the approved templates, canary delivery, 1280×720 PNG transport, responsive news images, and OG/X reuse of the article image path.

## Activation requirements for weekday jobs

The existing 08:00 and 08:20 prompts must use this handoff:

1. read latest main/master/runbook;
2. research/fact-check and author the final article;
3. set source exactly `DivLab Redaktion`;
4. do not attempt binary PNG upload from ChatGPT;
5. use one canonical managed branch and one initial commit containing article + additive registry change;
6. wait for `autoredaktion/preflight=success` on the latest branch head;
7. create one **draft** PR with marker `<!-- AUTOREDAKTION_MANAGED_V2 -->` and label `autoredaktion`;
8. stop controlling CI/repair/Ready/merge/deployment; GitHub state machines own the rest;
9. BörsSverige must wait for same-day Norden to reach a terminal state before it creates its branch, then refresh latest `main`;
10. never trigger a Vercel deployment or redeploy manually as part of the daily publication.

A failed preflight means no PR. A failed second Quality Gate means no merge. A failed Vercel/live verification means no automatic hotfix/redeploy. Never bypass any gate.
