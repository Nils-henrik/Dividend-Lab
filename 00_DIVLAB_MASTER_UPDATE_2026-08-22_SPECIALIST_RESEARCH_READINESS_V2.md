# DivLab Master Update — Specialist Research Readiness v2

Date: 2026-08-22
Status: ACTIVE_PR / PREVIEW_CANARY_ONLY
Parent: `agent/global-source-discovery-v1` / PR #270
Branch: `agent/specialist-research-readiness-v2`

## Entry condition

The accepted global-analysis Preview stack has completed founder-authenticated MSFT Research 100/100 + Analyst 100/100 with SEC provenance preserved and no persistence/publication. The monster observation/canary work also verified EQT as `research_ready` while leaving two specialist Research P1s intentionally fail-closed:

1. SEB bank Research lacks enough source-bound current evidence for credit-loss/ECL, margin/efficiency and funding/liquidity context including LCR/NSFR.
2. Investor investment-company Research lacks verified NAV/share and discount evidence.

These gaps were deliberately not weakened or guessed into passing states. This slice is the dedicated follow-up authorized by that acceptance record.

## Objective

Close only the two verified specialist Research integration gaps using bounded, official, source-bound evidence while preserving every existing methodology and quality gate.

This slice must not broaden DivLab into unsupported company families or global production analysis.

## Locked targets

### SEB — `SEB-A.ST`

The bank Research path may advance only if official source evidence can support the existing required bank concepts. The repair may improve extraction/discovery for:

- credit-loss / ECL context;
- margin / efficiency context;
- funding and liquidity context;
- LCR / NSFR when those values are present in a verified official source.

Existing source-bound ROE, CET1, capital buffer and P/B evidence must remain intact.

No absent metric may be synthesized from prose, estimated from unrelated ratios or copied from an unverified search result.

### Investor — `INVE-B.ST`

The investment-company Research path may advance only if verified official evidence supports:

- NAV per share; and
- current discount/premium, or sufficient source-bound NAV/share + market price inputs for the existing deterministic discount calculation.

The implementation may improve exact issuer/report discovery or extraction only within a bounded official-source contract. It must not use broad web scraping or generic search snippets as primary evidence.

### EQT regression canary — `EQT.ST`

EQT is already `research_ready` and must remain so. Any change that regresses its source-bound Total AUM/FAUM path is a blocker.

## Source policy

Preferred evidence order remains:

1. official issuer financial report / fact book / results document;
2. already verified Nasdaq/CNS issuer release and its allowlisted release body;
3. existing traceable provider values only where the established methodology explicitly permits them.

All extracted values must carry the existing `sourceId` provenance. New evidence adapters must be issuer-bounded or contract-bounded, not generic scraping utilities.

Request budgets and text ceilings may not be increased merely to force a pass. If a necessary official document cannot be reached under a defensible bounded adapter, the target remains fail-closed and the exact limitation is recorded.

## Quality and methodology boundary

This slice may not:

- lower bank Research quality requirements;
- lower financial-specialist Research requirements;
- change Analyst 100/100 or Research 100/100 thresholds;
- auto-promote missing metrics to known;
- route insurance, real estate, financial-other, ETF/fund or unknown families into a supported specialist engine;
- alter the successful MSFT/Volvo operating-company paths;
- expand global `canRunAnalysis`;
- enable persistence or publication;
- merge to `main` or deploy production behavior.

## Implementation rule

Observe the current extraction/readiness code first. Patch only the exact source/evidence layer responsible for the missing specialist fields.

Prefer deterministic extraction helpers with explicit source matching over prompt-only repair. AI may interpret already verified evidence only after the deterministic Research contract is ready; AI must not manufacture Research readiness.

## Required regression tests

Automated tests must prove at minimum:

1. SEB evidence extraction cannot mark ECL, efficiency or liquidity fields known without matching source-bound evidence;
2. when verified SEB official evidence contains supported labels/values, the existing bank Research fields receive those values with source IDs;
3. Investor NAV/share cannot be inferred from unrelated market-cap/equity values;
4. verified Investor NAV/share evidence can feed the existing investment-company Research path;
5. discount/premium is deterministic from source-bound NAV/share and current share price when the established specialist methodology permits that calculation;
6. EQT remains `research_ready` under its existing official release evidence;
7. unsupported families remain fail-closed;
8. no persistence/publication path is introduced.

## Canary acceptance

The slice is code-complete only after one exact commit passes the ordinary repository validation/build path and a bounded Preview canary records:

- SEB: either `research_ready` with every newly required field source-bound, or an exact remaining fail-closed blocker;
- Investor: either `research_ready` with NAV/share + discount traceable, or an exact remaining fail-closed blocker;
- EQT: still `research_ready`;
- no P0 safety regression;
- no persistence/publication.

A legitimate unavailable official metric remains a valid fail-closed result. The acceptance goal is correct specialist readiness, not a higher nominal pass count.

## Vercel discipline

The project is currently constrained by Vercel build-rate limits after the completed stacked acceptance work. Do not use deployments as an edit loop. Perform source inspection and code/test updates first, then use one bounded canary build when the branch is ready.

## Implementation working record — 2026-08-22 late

This record is evidence of implementation progress only. It is **not** an acceptance record and does not change the release boundary below.

### SEB

- The bank metric and funding extractors now combine multiple verified primary report excerpts metric-by-metric while retaining each metric's own `sourceId`. An explicitly ambiguous newer row still blocks stale fallback.
- The existing Nasdaq/CNS hit may select SEB's already-trusted Fact Book attachment only in dedicated multi-document Deep Research. The ordinary model-portfolio one-document path retains its prior first-PDF behavior.
- Fact Book projection is deterministic and issuer-specific. It requires the exact `Key figures - SEB Group, nine quarters` section, a contiguous nine-quarter header, the requested report period as the unique final column, and exact supported row labels.
- The parser covers both flattened and observed PDF text-layer shapes, including alternating quarter/year lines and one numeric cell per following line. It remains section-bounded at `Own funds requirement, Basel III` and fails closed on incomplete/misaligned rows.
- Supported projected current-quarter facts remain only Net ECL level, Cost/income ratio, LCR and NSFR. No other metric is inferred.
- Existing SEB release evidence continues to supply source-bound ROE, CET1 and capital-buffer context separately from Fact Book provenance.

### Investor

- Dedicated Nordic discovery restores the already-bounded 100-row period-only report window without increasing the fixed 3-current + 2-annual request ceiling. Shared issuer matching remains mandatory.
- The financial-specialist extractor accepts the verified Investor issuer-release form only when an explicit NAV-per-share token is present and derives discount/premium deterministically from that source-bound NAV/share plus the current market price.
- Unrelated equity, market-cap or EPS values remain insufficient and cannot synthesize NAV/share.
- A dedicated integration regression now exercises period-only CNS discovery -> allowlisted Nasdaq release body -> source-bound NAV/share -> deterministic discount while preserving the five-request CNS ceiling.

### Regression and safety

- EQT's explicit EUR + scale AUM/FAUM regression remains covered and must remain `research_ready`.
- Unsupported company families remain fail-closed in analysis-engine dispatch.
- A dedicated safety regression asserts that this evidence/readiness slice has no Supabase/dev-admin/publication dependency and that the existing Preview operator keeps persistence/publication explicit opt-ins with publication requiring persistence and founder authorization.

### Validation state

- An earlier branch commit (`3e1913069797d4c752fd95abbff581730bf8d7de`) completed a full Vercel Next.js build, including TypeScript, successfully.
- Subsequent source-shape hardening commits have not yet received the required exact-head build because the Vercel project hit its daily deployment-rate ceiling.
- Therefore this slice remains `ACTIVE_PR / PREVIEW_CANARY_ONLY`. No exact-head acceptance is claimed, the PR remains draft, and no parent/main/production merge is authorized until the required exact build and bounded SEB/Investor/EQT Preview canary have completed.

### Dedicated Preview canary operator prepared

- A new Preview-only endpoint, `/api/internal/analysis/specialist-research-canary`, is locked to exactly `SEB-A.ST`, `INVE-B.ST` and `EQT.ST` and requires founder/CEO/admin authentication before any Research fetch starts.
- The endpoint runs only `loadDivLabResearchInputs` plus deterministic bank/financial-specialist Research builders. It does not call an Analyst model, does not accept `persist`/`publish`, has no analysis service-role/publication dependency and returns `persistence: null` plus `publication: null` on both success and structured failure paths.
- SEB canary READY requires `research_ready`, expected bank classification, source-bound CET1, ROE, Net ECL, Cost/income, LCR, NSFR and capital buffer, plus traceable P/B provenance.
- Investor canary READY requires `research_ready`, expected investment-company classification, source-bound NAV/share and deterministic discount plus a traceable market-data source for the current-price input.
- EQT canary READY requires `research_ready`, expected asset-manager classification and source-bound Total AUM, fee-generating AUM and trailing P/E.
- The existing noindex `/analyses/internal-preview/sources` page now has three explicit specialist-canary buttons and exposes Research status, provenance, source/evidence counts, metric source IDs, blockers and the enforced persistence/publication-off state.
- A static contract regression locks the Preview guard, founder auth, target allowlist, deterministic-only builders and absence of write/AI execution paths.
- This operator preparation is not acceptance. Exact-head repository validation/build and one bounded founder-authenticated run for all three targets are still required before the master status may advance.

## Release boundary

Successful completion of this slice authorizes only a later parent-stack review. It does not authorize production global analysis, a merge to `main`, persistence/publication, or new methodology families.
