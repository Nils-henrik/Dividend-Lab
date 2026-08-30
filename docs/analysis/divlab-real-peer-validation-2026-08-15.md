# DivLab real peer validation — 2026-08-15

Status: internal validation checkpoint. Peer registry v1 is permanently present in `dividend-lab-dev`; real facts-only peer research versions have **not** yet been persisted. No production write, merge or public UI is included.

## Why this checkpoint exists

`analyst-v3-peer` now has a complete version-bound audit and content contract, but a synthetic fixture is not enough to prove economic usefulness. The real-company validation layer deliberately separates:

1. peer relationship curation;
2. facts-only peer research readiness;
3. target Analyst research/content;
4. qualitative review of the resulting peer context.

A curated relationship does not imply that the research loader can successfully certify the company. Missing coverage remains a blocker and never triggers an automatic substitute peer.

## Initial curated target sets

### Atlas Copco A — broad industrial comparables

Target: `ATCO-A.ST`

Members:

- `MTRS.ST` — Munters Group
- `SAND.ST` — Sandvik
- `EPI-A.ST` — Epiroc A

Interpretation boundary: broad Nordic industrial valuation context, **not** a claim that these are Atlas Copco's three named direct competitors. Business mix and end-market exposure differ materially.

Permanent dev peer-set v1:

- target id: `3ba09a23-e423-41e0-b8a4-b169f7beb4eb`
- peer-set id: `2a52ff57-f66c-4051-8ac5-bb1def41c348`

### Evolution — B2B iGaming ecosystem

Target: `EVO.ST`

Members:

- `HACK.ST` — Hacksaw
- `KAMBI.ST` — Kambi Group
- `GIG-SDB.ST` — GiG Software

Interpretation boundary: all three are B2B participants in the operator-facing iGaming technology/content ecosystem, but they do not have identical product mixes. GiG Software has a shorter standalone history and is intentionally allowed to fail readiness rather than being silently replaced.

Permanent dev peer-set v1:

- target id: `841eff89-b8e5-49fa-978e-1eed44a45df0`
- peer-set id: `afb69e36-fa84-4fcd-ad86-218de00438f0`

### Embracer Group B — listed gaming groups

Target: `EMBRAC-B.ST`

Members:

- `PDX.ST` — Paradox Interactive
- `SF.ST` — Stillfront Group
- `MTG-B.ST` — Modern Times Group MTG B

Interpretation boundary: broad Nordic listed-gaming context. Embracer's restructuring makes historic multiple comparison especially sensitive, and the set must not be converted into an automatic premium/discount signal.

Permanent dev peer-set v1:

- target id: `fa90cad2-0a9c-4faa-a1a8-3b810ba0a8bc`
- peer-set id: `2f024cc6-7763-420c-a476-aef5966991a4`

## Source-link integrity

Each of the nine peer members was read back from the normalized dev registry and verified to have two explicit relationship links:

- one target-company source;
- one peer-company source.

The registry remains immutable/versioned and is not mixed with valuation research.

## Facts-only peer research

Contract: `peer-research-readiness-v1`.

A peer research version may remain `publishable=false` as a public DivLab Analysis while still being eligible for peer comparison. This avoids generating irrelevant Bear/Base/Bull assumptions or making an unnecessary analyst-model call for every peer.

Readiness requires the existing deterministic/source checks for:

- company classification;
- supported fundamental methodology;
- fundamental coverage;
- multi-year fundamental coverage;
- fresh primary source;
- source traceability;
- primary-report evidence;
- valuation traceability;
- `valuation-provenance-v1`;
- at least two positive, traceable values among P/E, P/FCF, EV/EBIT and EV/EBITDA.

It intentionally does **not** require analyst valuation scenarios or technical publication checks because the peer-comparison engine does not consume those fields.

The ordinary DivLab Analysis publication gate is unchanged. A facts-only peer version must remain non-public/non-publishable.

## Database enforcement

Dev migration:

`20260815112542_allow_peer_ready_facts_research_in_peer_audits.sql`

PostgreSQL now accepts a peer audit member when the exact immutable peer research version is either:

1. ordinary full `publishable=true` Deep Research; or
2. certified by the deterministic SQL equivalent of `peer-research-readiness-v1`.

The target research version is **not widened** and still requires ordinary full publishability.

The rule is enforced both in audit persistence and deferred audit-integrity verification. Migration patching is fail-closed: if the expected previous predicate is absent, the migration aborts instead of guessing.

## Cost-safe target orchestration

`createDivLabPeerTargetAnalysis(...)` preflights the registry and all three peer-ready versions before any target analyst call.

When preflight passes:

1. run ordinary Analyst v2 once in-memory;
2. build the final target research packet from that draft's scenario assumptions;
3. require final research `publishable=true`;
4. persist the target research version without analyst content;
5. create/read the version-bound peer audit;
6. reuse the exact same Analyst draft/model/usage;
7. append deterministic neutral peer context;
8. run `peer-analyst-quality-v1`;
9. persist `analyst-v3-peer` content through the dedicated RPC.

No second analyst-model call is required. If peer preflight fails, target Analyst is never invoked.

## Protected Preview validation surface

A temporary Preview-only research route exists solely for the nine curated peer symbols.

Safety boundaries:

- production/non-Preview returns 404;
- persistence requires the service-role client to resolve exactly to dev project `faaxloafogpsywfkpbrm`;
- production project ref is not accepted;
- arbitrary symbols are rejected;
- no model call is made by the peer-research route;
- responses are `no-store`;
- catalog-wide `batch=1` is dry-run-only;
- `batch=1&persist=1` is explicitly forbidden;
- batch concurrency is fixed at 3;
- optional primary-source diagnostics return only bounded metadata, never report text/excerpts.

Vercel Deployment Protection remains enabled. Protected connector access was successfully established without weakening the deployment boundary.

## First real nine-peer Preview batch

The protected Preview runtime executed all nine curated peers in one dry-run request. Result: **0/9 ready** and **0 writes**.

### Atlas Copco peer set

- `MTRS.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.
- `SAND.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.
- `EPI-A.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.

### Evolution peer set

- `HACK.ST`: additionally blocked by `multiYearFundamentalCoverage`; eligible P/E, P/FCF, EV/EBITDA.
- `KAMBI.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.
- `GIG-SDB.ST`: blocked by `multiYearFundamentalCoverage`, `freshPrimarySource`, `primaryEvidenceCoverage` and `peerMetricCoverage`; no eligible peer metric.

### Embracer peer set

- `PDX.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.
- `SF.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/FCF and EV/EBITDA.
- `MTG-B.ST`: blocked by `freshPrimarySource` and `primaryEvidenceCoverage`; eligible P/E, P/FCF, EV/EBITDA.

Interpretation: the common failure is a **systematic Nordic primary-report discovery/enrichment gap**, not nine independent valuation failures. Eight of nine already satisfy peer metric coverage; Hacksaw and GiG also expose shorter-history limitations, while GiG currently lacks enough positive traceable peer multiples.

A direct database check after the batch confirmed:

- zero `divlab_analysis_versions` for the nine curated peer symbols;
- zero new analysis versions in the dry-run window.

## Primary-source discovery correction

Current Nasdaq Company News exposes issuer/news filtering through its Freetext surface, while the existing CNS adapter passed display-name aliases through `company=` and used `count=` for the result window. Current Nasdaq disclosures for companies such as Sandvik and Munters prove that fresh 2026 reports and official `attachment.news.eu.nasdaq.com` PDFs exist, so weakening `freshPrimarySource` would be incorrect.

The adapter has therefore been corrected prospectively to:

- send the same bounded company aliases through `freeText=`;
- leave `company=` empty instead of pretending display names are CNS selector values;
- use `limit=` for the existing bounded query count;
- retain `showAttachments`, `showCnsSpecific` and `showCompany`;
- retain local issuer-name matching to reject free-text noise;
- retain the official attachment hostname allowlist;
- retain the same hard caps: max 12 accepted hits and max 20 CNS rows per alias;
- retain one official PDF attempt per company/pass.

This is a discovery-contract fix, **not** a larger research/network budget and not a quality-gate relaxation.

A dedicated root Quality Gate contract now prevents `company=<display name>` / `count=` from silently returning in a future refactor.

## Current real-data state

Permanent in dev:

- 3 target registry records;
- 3 immutable peer-set v1 records;
- 9 peer members;
- 12 peer-set source records;
- normalized member-to-source links.

Intentionally not yet present:

- real facts-only peer research versions for the nine peer members;
- real peer comparison audits for Atlas Copco, Evolution or Embracer;
- real `analyst-v3-peer` content for those targets.

## Next execution step

1. deploy the corrected CNS discovery code to a protected Preview once Vercel accepts the next Preview build;
2. repeat the exact nine-peer dry-run;
3. persist only peers that actually pass `peer-research-readiness-v1`;
4. leave failed peers as explicit blockers — no automatic substitution;
5. verify persisted peer versions are `publishable=false` and SQL `divlab_peer_research_ready(research_packet)=true`;
6. execute the first target through the single-call orchestrator only when all three registered peers are ready;
7. perform qualitative human review before allowing peer context to influence the AI-written thesis or scenarios.

No historical portfolio decision, trade, holding or prior research version is rewritten by this work.
