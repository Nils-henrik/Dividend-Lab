# Autoredaktion v1.1 — source of truth

Status: **Autoredaktion v1.1 READY / release hardening phase A implemented**  
Approved templates: **Norden i centrum PASS ✅ / BörsSverige PASS ✅**  
Scheduler: the existing ChatGPT weekday jobs remain the only scheduler: **08:00 Norden i centrum / 08:20 BörsSverige**.

This document is the authoritative runbook for Autoredaktion v1.1 image production and the managed publication handoff. It supersedes older v1.1 notes in `AUTOREDATION_V1.md` and `AUTOREDATION_V1_1_VISUAL_REWORK.md` where they differ.

## Editorial source of truth

`DIVLAB_REDAKTION_MASTER.md` remains authoritative for research, fact-checking, language, SEO and editorial quality. Release automation must never weaken those rules.

## Managed flow after release hardening

The weekday ChatGPT job owns the editorial phase and exactly one initial Git commit:

`research → fact-check → article → SEO → latest-main check → one managed branch + one initial commit`

The branch must be named exactly:

- `autoredaktion/norden-i-centrum-YYYY-MM-DD`
- `autoredaktion/borssverige-YYYY-MM-DD`

The initial commit contains only the new article module and the additive `lib/news/get-articles.ts` registry change. ChatGPT does **not** create the PR until the branch receives a successful `autoredaktion/preflight` commit status.

GitHub then owns deterministic release preparation:

`branch push → normalize controlled fields → render/validate PNG in GitHub Actions → exact pre-PR lint/typecheck/article/image gates → preflight status → draft PR → Quality Gate`

After the PR exists, ChatGPT is no longer required to stay alive. `Autoredaktion Release State Machine` reacts to the completed Quality Gate:

- green exact-head gate → strict PR-policy check → draft becomes Ready → merge exact SHA;
- red gate → at most **one** deterministic repair commit on the **same branch**, then exactly one manually dispatched Quality Gate retry;
- second failure, stale head, unrelated diff or non-repairable error → STOPP / fail closed.

This phase deliberately does not implement the later post-merge deployment/live-verification hardening. Vercel's existing Git integration still deploys `main`; production observation and live verification are the next phase.

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

The release workflow verifies the successful Quality Gate SHA equals the current PR head before merge. A stale green run can never merge a newer head.

## Bounded self-repair / anti-loop

Per series + Europe/Stockholm date:

- one managed branch;
- one PR;
- one preparation commit maximum;
- Quality Gate attempt 1;
- if attempt 1 fails for a deterministic article/image contract error: one repair commit maximum on the same branch;
- Quality Gate attempt 2 is explicitly dispatched for the repaired SHA;
- if attempt 2 fails: STOPP;
- no second repair branch, PR or merge is created.

Expected deterministic repairs are intentionally narrow: exact `DivLab Redaktion` source, canonical image wiring, removal of invalid no-image fields and deterministic image regeneration. Editorial facts/prose, unrelated code failures and stale-main conflicts are never auto-rewritten by the repair stage.

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
8. stop controlling CI/repair/Ready/merge; GitHub state machine owns that phase.

A failed preflight means no PR. A failed second Quality Gate means no merge. Never bypass either gate.
