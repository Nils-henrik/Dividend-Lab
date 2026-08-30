# DivLab Master Update — Specialist Research Readiness v2

Date: 2026-08-22
Status: ACTIVE_PR / PREVIEW_CANARY_ONLY / AUDIT_OPEN
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

Do not use deployments as an edit loop. Perform source inspection and code/test updates first, then use one bounded canary build when a candidate head is ready. A Vercel `next build` proves compilation and Next.js TypeScript validation, but it does not by itself prove `npm test`, lint, database tests or browser regressions.

## Implementation working record — 2026-08-22 late

This record is evidence of implementation progress only. It is **not** an acceptance record and does not change the release boundary below.

### SEB

- The bank metric and funding extractors now combine multiple verified primary report excerpts metric-by-metric while retaining each metric's own `sourceId`. An explicitly ambiguous newer row still blocks stale fallback.
- Bank capital context now follows the same source-bound multi-document rule: a Fact Book that lacks a capital reference may fall through to the verified issuer release for the capital buffer/regulatory-requirement fact, while an explicitly ambiguous newer capital fact blocks stale fallback. Every confirmed capital reference retains its own `sourceId`.
- The existing Nasdaq/CNS hit may select SEB's already-trusted Fact Book attachment only in dedicated multi-document Deep Research. The ordinary model-portfolio one-document path retains its prior first-PDF behavior.
- Fact Book projection is deterministic and issuer-specific. It requires the exact `Key figures - SEB Group, nine quarters` section, a contiguous nine-quarter header, the requested report period as the unique final column, and exact supported row labels.
- The parser covers both flattened and observed PDF text-layer shapes, including alternating quarter/year lines and one numeric cell per following line. It remains section-bounded at `Own funds requirement, Basel III` and fails closed on incomplete/misaligned rows.
- Supported projected current-quarter facts remain only Net ECL level, Cost/income ratio, LCR and NSFR. No other metric is inferred.
- Existing SEB release evidence continues to supply source-bound ROE, CET1 and capital-buffer context separately from Fact Book provenance.
- A deterministic full `buildBankResearch` regression intentionally orders the Fact Book newer than the release and feeds the observed SEB release narrative. `research_ready` is allowed only when CET1/ROE/capital buffer retain the release `sourceId`, ECL/C-I/LCR/NSFR retain the Fact Book `sourceId`, and P/B remains traceable. The dedicated follow-up test also requires market and fundamental source IDs in valuation provenance.

### Investor

- Dedicated Nordic discovery restores the already-bounded 100-row period-only report window without increasing the fixed 3-current + 2-annual request ceiling. Shared issuer matching remains mandatory.
- The financial-specialist extractor accepts the verified Investor issuer-release form only when an explicit NAV-per-share token is present and derives discount/premium deterministically from that source-bound NAV/share plus the current market price.
- Unrelated equity, market-cap or EPS values remain insufficient and cannot synthesize NAV/share.
- A dedicated integration regression exercises period-only CNS discovery -> allowlisted Nasdaq release body -> source-bound NAV/share -> deterministic discount while preserving the five-request CNS ceiling.

### EQT

- The existing financial-specialist Research engine remains the accepted deterministic base for `asset_manager` and retains explicit Total AUM, fee-generating AUM and trailing P/E requirements.
- Explicit EUR + scale AUM/FAUM shorthand, invisible Unicode normalization and fail-closed bare AUM values remain regression-covered.

### Regression and safety

- Unsupported company families remain fail-closed in analysis-engine dispatch: insurance, real estate, financial-other, ETF/fund and unknown do not fall through to a specialist engine.
- The new specialist canary is Preview-only, target-allowlisted and founder/CEO/admin authenticated before Research starts.
- The canary has no Analyst call, no `persist`/`publish` option, no dev-admin client and no publication service. Structured results keep `persistence: null` and `publication: null`.
- A dedicated safety regression asserts that the specialist evidence/readiness files have no Supabase write or publication dependency.
- No P0 persistence/publication or unsupported-methodology regression was found in the source audit.

### Existing specialist stack inherited by this branch

This branch already contains the earlier OMXS30 specialist architecture. The current slice is therefore a Research-readiness/source-evidence repair, not a rebuild of specialist Analyst engines.

Present in the inherited stack:

- Analysis dispatch for `operating_company`, `bank` and `financial_specialist`;
- bank-v3 Analyst generation, P/B scenarios, bank Research quality gate and bank Analyst quality gate;
- investment-company / asset-manager Analyst generation, specialist scenarios, specialist Research quality gate and specialist Analyst quality gate;
- Preview analysis operator routing to the correct engine;
- specialist persistence/publication schemas and schema-dispatched public-read machinery from the earlier methodology slice.

These components exist in source, but their end-to-end specialist runtime acceptance with the newly repaired Research inputs is still outstanding.

## Ground-up build audit — 2026-08-22 23:58 CEST

### Audited snapshot

- PR: `#289` — `fix(analysis): specialist research readiness v2`.
- Runtime code head: `8f50cf47b7f0a8804f0b170d005e6da93273621f`.
- Exact code-head Vercel deployment: `dpl_FYo74xRUbmwTRKWYAcGWLFBfKAE1`.
- Deployment state: `READY`.
- The exact code-head build completed optimized Next.js compilation, Next.js TypeScript validation, static generation and output deployment successfully.
- PR remains Draft and unmerged.
- This audit-document update is documentation only. Any later documentation commit must not be confused with the already verified runtime code head above.

### What is confirmed present

#### Source and Research foundation

- Global/Nordic Research loading and source normalization are present.
- Bounded Nasdaq/CNS issuer discovery is present.
- Allowlisted Nasdaq release-body retrieval is present.
- Bounded official PDF retrieval/extraction is present.
- SEB-specific Fact Book selection and deterministic current-period projection are present.
- Multi-document bank metric, funding and capital extraction with per-fact provenance is present.
- Investor NAV/share extraction and deterministic discount calculation are present.
- EQT AUM/FAUM/trailing-P/E specialist Research is present.
- Technical history/levels and provider fundamentals remain available to specialist quality gates.

#### Methodology and quality architecture

- Operating-company Analyst remains separate from specialist methodologies.
- Bank-v3 and financial-specialist Analyst services already exist.
- Bank Research and Analyst quality gates exist.
- Financial-specialist Research and Analyst quality gates exist.
- Unsupported methodologies remain fail-closed rather than being forced through a wrong engine.
- Existing publication/read architecture is schema-dispatched rather than treating specialist output as generic analyst-v2.

#### Preview safety and observability

- Dedicated deterministic specialist canary exists for exactly SEB, Investor and EQT.
- Canary UI displays classification, Research status, source/evidence counts, metric values, metric source IDs, blockers/warnings and persistence/publication state.
- Endpoint authorization occurs before expensive Research execution.
- Preview page is noindex and is unavailable outside Preview.

### What is NOT yet proven

#### 1. Exact-head repository test suite is not yet evidenced

The READY deployment proves `next build`, including its TypeScript phase. Repository scripts show that unit/regression tests and lint are separate commands. Therefore the audit does **not** treat the Vercel build alone as proof that:

- `npm test` passed on the exact candidate;
- `npm run lint` passed;
- `npm run test:all` passed;
- database/migration tests passed;
- browser/auth regressions passed.

Before a specialist stack is promoted toward merge/release acceptance, the required repository validation set must be run and recorded on the final source candidate.

#### 2. No founder-authenticated specialist Research canary has run on the current repaired head

The earlier three requests returned HTTP 401 before Research because that Preview session was not authenticated. They are auth-precondition observations only.

Still required on one exact candidate deployment:

- SEB canary;
- Investor canary;
- EQT canary.

All three results must record persistence/publication off. A blocked Research result is acceptable only when it exposes an exact, defensible blocker and no gate is weakened to turn it green.

#### 3. Investor derived-discount provenance is weaker than the desired final contract

`discountToNavPct` is deterministically calculated from NAV/share plus the frozen current share price. The metric itself currently carries the NAV primary-source ID, while the market-price source is verified separately in the packet/canary.

This is enough to prove that a market source exists, but it is weaker than explicit derivation lineage. Before final specialist provenance acceptance, one of the following must be implemented and tested:

- attach both NAV and market-price source IDs to the derived discount metric; or
- introduce an explicit derivation-provenance object that names the NAV input source and market-price input source.

The specialist canary must then verify that exact lineage rather than merely verifying NAV provenance plus the existence of any market source.

#### 4. Bank Research exposes stale Analyst-readiness semantics

`buildBankResearch` currently returns `analystReady: false` and the blocker `bank_analyst_schema_v3_required`, while the branch already contains and uses the bank-v3 Analyst engine.

This does not remove the actual bank Analyst engine, but it creates contradictory state semantics. Before broad specialist Analyst runtime acceptance, the stale readiness contract must be reconciled so a consumer cannot conclude that bank Analyst support is missing when the dispatch/service layer actually supports it.

The repair must not bypass the bank Research/Analyst quality gates.

#### 5. The new canary proves deterministic Research readiness, not complete specialist analysis quality

The dedicated canary intentionally does **not** invoke AI Analyst generation. Therefore a green SEB/Investor/EQT canary will close this source/evidence Research-readiness slice, but it will not prove the full specialist product path.

A later no-persist/no-publish runtime acceptance must run the existing specialist services and require, on the same execution:

- SEB bank Research quality = 100/100 and bank Analyst quality = 100/100;
- Investor specialist Research quality = 100/100 and specialist Analyst quality = 100/100;
- EQT specialist Research quality = 100/100 and specialist Analyst quality = 100/100;
- source IDs used by the Analyst remain known and traceable;
- persistence remains null/off;
- publication remains null/off.

#### 6. Persistence/public-read has not been revalidated with the newly hardened Research shape

The specialist persistence/publication and schema-dispatched read machinery exists from the earlier methodology stack, but this current slice has intentionally not written or published anything.

Before production release, a controlled DEV/Preview validation must prove:

- specialist persistence writes the expected schema only after both 100/100 gates;
- specialist public read dispatches by stored schema correctly;
- no specialist row is parsed as operating-company analyst-v2;
- existing previously published operating-company analysis remains readable and unchanged;
- no production write is used as a validation shortcut.

#### 7. Breadth beyond the three repair canaries remains outstanding

The wider OMXS30 specialist registry also includes:

- Nordea (`NDA-SE.ST`);
- Handelsbanken (`SHB-A.ST`);
- Swedbank (`SWED-A.ST`);
- Industrivärden (`INDU-C.ST`).

These are not blockers for closing this narrow P1 Research repair, but they are required before claiming broad OMXS30 specialist coverage.

#### 8. Investment-company ambiguity handling needs hardening before wider reuse

The exact Investor release shape is regression-covered. The financial-specialist extractor currently selects a valid matching value from the newest eligible primary evidence rather than applying the bank path's explicit ambiguity-blocking behavior across competing NAV values/periods.

Before broadening the same extractor to multiple investment companies and report shapes, add deterministic tests for:

- multiple NAV/share values in one report;
- prior-period versus current-period NAV values;
- conflicting primary documents;
- explicit current-period binding;
- fail-closed behavior when the current value cannot be identified uniquely.

#### 9. Runtime acceptance records can be made more self-identifying

The canary currently exposes target, metrics and provenance but does not include an explicit Git commit SHA/deployment identifier/run timestamp in the JSON result. This is not a safety blocker for the current slice, but adding `executedAt` and an immutable build identifier before broader rollout would make acceptance evidence stronger and easier to audit.

### Audit decision for PR #289

No new P0 safety issue was found. The architecture remains correctly fail-closed and Preview-only for this slice.

PR #289 is **not yet accepted** because runtime Research evidence is still missing and Investor derivation provenance should be made explicit before final canary certification. Repository test/lint evidence also remains outstanding on the final source candidate.

The exact code head `8f50cf47b7f0a8804f0b170d005e6da93273621f` is a valid compiled baseline, not a release certificate.

## Locked forward plan

### P0 — finish Specialist Research Readiness v2

1. Harden Investor discount derivation provenance so the discount explicitly traces both NAV/share and the frozen market-price input.
2. Tighten the Investor specialist canary contract to require that derivation lineage.
3. Re-run the focused deterministic regression set for SEB, Investor, EQT, canary contract and safety boundary.
4. Run exact-candidate `npm test` and lint; run the broader repository validation set required by the parent stack before merge acceptance.
5. Obtain one READY Preview build for the final source candidate.
6. Founder-authenticated canary on the same candidate: SEB -> Investor -> EQT.
7. Record for each target: classification, Research status, source/evidence counts, metric values, source IDs, blockers/warnings, persistence null, publication null.
8. If a target blocks, patch only the exact source/evidence/readiness cause and repeat; do not lower a quality requirement.
9. Update this master with the runtime acceptance or exact remaining blocker.

### P1 — full specialist Analyst acceptance

1. Reconcile the stale `bankResearch.analystReady` / `bank_analyst_schema_v3_required` semantics with the existing bank-v3 engine.
2. Add/prepare a no-persist/no-publish full specialist execution canary or use the existing Preview analysis operator with sufficiently explicit observability.
3. Run SEB through `createDivLabBankAiAnalysis` and require bank Research 100/100 + Analyst 100/100.
4. Run Investor through `createDivLabFinancialSpecialistAnalysis` and require specialist Research 100/100 + Analyst 100/100.
5. Run EQT through the same financial-specialist service and require Research 100/100 + Analyst 100/100.
6. Verify Analyst/source provenance, scenario basis, confidence calibration and zero persistence/publication on those acceptance runs.
7. Diagnose any quality blocker from observed evidence/output; do not prompt-tune or gate-lower merely to force 100/100.

### P1 — persistence, readback and stack consolidation

1. Run controlled DEV/Preview specialist persistence only after full 100/100 acceptance.
2. Verify schema pair/version, stored packet, Analyst content, source provenance and immutable chart data.
3. Verify public-read dispatch for bank and financial-specialist schemas.
4. Re-test an existing operating-company published analysis for regression.
5. Run database/migration contract tests and browser/auth regressions required by the parent methodology master.
6. Consolidate the historical draft PR/branch stack deliberately; do not merge overlapping stale branches independently into `main`.
7. Only after consolidated review decide whether the accepted stack may advance toward `main`/production.

### P2 — breadth and robustness

1. Add canary/regression coverage for Nordea, Handelsbanken and Swedbank using the bank engine.
2. Add Industrivärden coverage using investment-company methodology.
3. Add ambiguity-safe NAV/current-period binding before treating the investment-company extractor as broadly reusable.
4. Add exact build/run identity to specialist canary responses.
5. Re-run a wider specialist/operating-company regression matrix after stack consolidation.
6. Keep insurance, real estate, financial-other, ETF/fund and unknown fail-closed until separately versioned methodologies exist.

### Separate future phases — not part of this slice

- OMXS30 index analysis requires its own index methodology; it must not use a company annual-report valuation engine.
- Additional global markets require their own verified primary-source adapters and acceptance passes.
- Production persistence/publication remains a separate authorization after the Preview/DEV stack is accepted.

## Release boundary

Successful completion of this slice authorizes only a later parent-stack review. It does not authorize production global analysis, a merge to `main`, persistence/publication, or new methodology families.
