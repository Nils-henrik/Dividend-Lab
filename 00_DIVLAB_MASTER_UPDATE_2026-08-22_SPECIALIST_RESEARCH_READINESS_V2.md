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

## Release boundary

Successful completion of this slice authorizes only a later parent-stack review. It does not authorize production global analysis, a merge to `main`, persistence/publication, or new methodology families.