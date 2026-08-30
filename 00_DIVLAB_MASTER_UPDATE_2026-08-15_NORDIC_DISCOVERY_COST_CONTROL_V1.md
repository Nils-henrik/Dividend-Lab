# DIVLAB MASTER UPDATE — Nordic discovery + cost-control v1

Date: 2026-08-15
Status: ACTIVE_PR / INTERNAL_VALIDATION
Scope: Deep Research source discovery, peer validation and engineering cost control.

## Acceptance rule

This Master Update is valid only if the exact commit containing this file passes the full standard GitHub Quality Gate: lint, TypeScript, core tests, SEO/news tests, DivBrain tests, Cursor bridge tests and Next.js production build. If that commit fails, this update must be treated as unaccepted until the implementation is corrected and re-verified.

## Permanent engineering rule — Vercel is not the code-review loop

DivLab analysis work must minimize unnecessary Vercel Preview builds.

Default workflow:

1. batch related production changes, regression tests and Master documentation together;
2. build one Git tree / one meaningful commit checkpoint rather than one commit per small file;
3. run GitHub Quality Gate first;
4. use a protected Vercel Preview only when real runtime behaviour against external providers cannot be established in CI;
5. do not create Preview builds solely for documentation, static contracts or small intermediate edits;
6. do not weaken Deployment Protection to make validation easier.

This cost-control rule is part of the implementation discipline for Deep Research and the portfolio AI work.

## Nasdaq Nordic report discovery

### Ordinary model-portfolio research

Ordinary portfolio research remains scoped to Nasdaq Nordic Main Market through `NordicMainMarkets`. Existing conservative defaults remain unchanged.

### Dedicated Deep Research

When `preferFinancialReports=true`, dedicated Deep Research may use the broader Nasdaq exchange-notice scope so First North issuers are not excluded before local issuer filtering.

This does **not** increase the bounded request budget:

- max 5 CNS search terms;
- max 20 CNS rows per search term;
- max 12 accepted issuer-matched hits;
- one official PDF attempt per company/pass;
- official `attachment.news.eu.nasdaq.com` allowlist remains;
- issuer-side matching remains mandatory.

The broader scope is therefore a discovery correction, not a request-volume expansion.

## Conservative issuer-name normalization

Nasdaq may expose the same issuer with a different legal/display suffix than DivLab's curated name, for example `StillFront AB` versus `Stillfront Group`.

Issuer matching now treats non-identity legal/generic words such as AB/ASA/Oyj/Plc/Ltd/Group/Holding/Company/Corp/Inc/series markers as non-distinguishing.

Fail-closed rule:

- a one-token company identity only matches another one-token identity with the exact same normalized token;
- multi-token identities require at least two significant matching tokens;
- a generic shared prefix alone must not create a match.

This prevents broad freetext discovery from becoming permissive issuer matching.

## Real peer runtime baseline before this checkpoint

Latest protected nine-peer dry-run before the issuer-normalization checkpoint produced five ready peers:

- Munters (`MTRS.ST`)
- Sandvik (`SAND.ST`)
- Epiroc A (`EPI-A.ST`)
- Paradox (`PDX.ST`)
- MTG B (`MTG-B.ST`)

Atlas Copco's curated set remained 3/3 research-ready.

Observed blockers:

- Hacksaw: multi-year fundamental history;
- Kambi: zero accepted primary-source rows under the prior Main-Market-only scope;
- GiG Software: multi-year history + primary evidence + peer metric coverage;
- Stillfront: zero accepted primary-source rows in that batch despite prior readiness, traced to issuer-name variation risk.

The batch was dry-run only: no peer research rows were persisted and no target Analyst call was made.

## Verification boundary for Kambi / Stillfront fixes

The First North scope correction and legal-name normalization must not be claimed as real-company runtime-success merely because unit/static tests pass.

After a larger code checkpoint is accumulated, one protected Preview may be used to re-run the relevant real-company batch. Until that runtime run exists:

- Kambi remains runtime-unverified after the scope correction;
- Stillfront remains runtime-unverified after the name-normalization correction;
- no peer set beyond already proven data may be promoted based on assumption.

## Next gated sequence

1. full GitHub Quality Gate for the commit containing this update;
2. continue batching non-runtime Deep Research work without additional Preview builds;
3. when the batch is large enough to justify runtime cost, perform one protected nine-peer dry-run;
4. persist only versions that pass `peer-research-readiness-v1` and only after dedicated DEV credentials are safely available;
5. SQL-verify every persisted peer version;
6. first real Atlas Copco version-bound peer audit;
7. first real single-call `analyst-v3-peer`;
8. no production merge/deploy until explicit release intent.

## Scope boundary

No production write, no production deploy, no historical portfolio rewrite and no weakening of any research quality gate is authorized by this update.
