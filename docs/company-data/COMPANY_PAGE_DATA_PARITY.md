# Company page data parity

Read-only smoke date: 2026-09-28. No production database writes.

The company page reads one generic `CompanyOfficialData` contract. Persisted
`company_documents`, `company_facts` and `company_ownership` are preferred.
Investor still has a temporary live fallback inside `getCompanyOfficialData`
when those rows are empty, so the rich Investor page does not depend on a
page-level `slug === "investor"` branch.

## Migration order

Apply after `20260924223000_seed_omxs30_completion_company_sources.sql`:

1. `20260925120000_company_official_data_parity.sql`
2. `20260928120000_company_ingestion_fairness.sql`

The migration adds `company_facts`, `company_ownership`, source coverage
columns, the `baseline_refresh` job type, and
`enqueue_stale_company_baseline_refreshes`. It does not start a crawl.

## Scheduler

Vercel Hobby allows one cron run per day. The schedule is `17 3 * * *`
(03:17 UTC). A six-hour schedule is rejected by the Hobby plan and is not used.

Each invocation recovers stale locks, enqueues at most eight companies, then
claims and runs jobs until eight have finished or fewer than 12 seconds remain
of the shared 45-second route budget. The platform limit stays 60 seconds.
A later job receives only the time still left. It does not get a new 45-second
budget. Retry stays capped at 3. Blocked and source-link rows are not fetched.
`initial_sync` on first follow is unchanged.

Queue order, in both the planner and the claim/enqueue functions:

1. Never-checked automated sources (`last_checked_at` and `last_failure_reason` are both null).
2. Followed companies whose stale sources have not failed.
3. Retryable failed sources. A source whose only recorded error is `job_deadline_exceeded` sorts after other retries.
4. Other stale automated sources.

A failed fetch now sets `last_checked_at` as well as `last_failure_reason`, so a blocker is `failed_retryable` instead of looking never-checked. Successful categories are still saved. The failed category is retried on a later stale cycle, not ahead of companies that have never been fetched. Each source attempt is capped at 18 seconds inside the shared 45-second route budget, so one listing cannot consume the whole invocation when sibling categories remain.

Seventeen supported automated companies still fit an initial pass in three daily runs when fetches stay inside the budget. A slow company can use one day's remaining time and then waits behind never-checked work.

A daily cron cannot refresh every 12 hours. A source is eligible again after
20 hours, so yesterday's check is stale at the next 03:17 run. Followed
companies stay at the front of every batch. Unfollowed companies use the
remaining slots and cycle about every three days when the batch is full.

## Reused draft work

- PR #396: Essity and H&M parsers, source URLs, nine-month/full-year
  classification, and their fixture tests.
- PR #397: Alfa Laval, ASSA ABLOY and Handelsbanken parsers, collectors and
  fixture tests. NIBE from that branch was not reused; main already has the
  verified NIBE widget path.

## Future listings

The ingestion contract is per issuer: an allowlisted HTTPS origin, a source URL, and a parser. Company profiles already carry `exchange` and `countryCode`. Nothing in the queue assumes a `.se` host. No DAX or Nasdaq issuer is seeded in this change.

## OMXS30 coverage (2026-09-28)

`PASS automated` means the code has a verified first-party parser. `LINK` is an official page without a safe parser. `BLOCKED` is a fresh read-only failure that stayed fail-closed. `PARTIAL` means at least one category succeeded and another is still blocked.

| Company | Press | Reports | Calendar | CEO | Ownership | Dividend | Last result | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Investor | LINK | PARTIAL | LINK | PASS automated | PASS automated | PASS automated | PARTIAL | Press and calendar stay source-link because the page embeds AlertIR. No third-party crawl. Reports still `no_valid_documents`. |
| Volvo | PASS automated | PASS automated | PASS automated | PASS automated | LINK | LINK | PARTIAL | CEO from the executive board page. Ownership and dividend are not in first-party HTML. |
| Ericsson | BLOCKED | BLOCKED | BLOCKED | LINK | LINK | LINK | BLOCKED | Fresh `403` on the listing, press archive and sitemap. Not bypassed. |
| Atlas Copco | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | LINK | PARTIAL | Press uses the official sitemap and at most four detail pages. The static listing only exposes 2024 teasers. Ownership as of 2025-12-31. |
| AstraZeneca | BLOCKED | BLOCKED | BLOCKED | LINK | LINK | LINK | BLOCKED | Fresh `403` on the press page, media centre and sitemap. Not bypassed. |
| ABB | LINK | LINK | LINK | LINK | LINK | LINK | LINK | No stable dated trio in the first HTML body. |
| Addtech | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | LINK | PARTIAL | CEO and ownership dated 2026-08-31. No dividend per share in the official HTML. |
| Alfa Laval | PASS automated | PASS automated | LINK | LINK | LINK | LINK | PARTIAL | Calendar is not automated. |
| ASSA ABLOY | PASS automated | PASS automated | LINK | LINK | LINK | LINK | PARTIAL | Calendar has no verified date list. |
| Boliden | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | Redirect or bot response, not followed. |
| Epiroc | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | 403 for DivLabBot. |
| EQT | PARTIAL | PASS automated | PASS automated | LINK | LINK | LINK | PARTIAL | Press parser can return `no_valid_documents`. |
| Essity | PASS automated | PASS automated | PARTIAL | PASS automated | LINK | LINK | PARTIAL | CEO parsed. Ownership and dividend HTML had no table. |
| Evolution | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | LINK | PARTIAL | Ownership rows keep each holding date. |
| Handelsbanken | LINK | PASS automated | PASS automated | LINK | LINK | LINK | PARTIAL | Press is not automated. |
| H&M | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | PASS automated | Dividend is the stated SEK 7.10, not the sum of instalments. Ownership as at 31 August 2026. |
| Hexagon | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | 403 for DivLabBot. |
| Industrivärden | LINK | LINK | LINK | LINK | LINK | LINK | LINK | MFN widget has no verified issuer feed. |
| Lifco | LINK | LINK | LINK | LINK | LINK | LINK | LINK | No dated document list. |
| NIBE | PASS automated | PASS automated | PASS automated | LINK | LINK | LINK | PASS automated | Management and shareholder pages had no first-party table. |
| Nordea | LINK | LINK | LINK | LINK | LINK | LINK | LINK | Reports lack a day date and the calendar widget is protected. |
| Saab | PASS automated | PASS automated | PASS automated | PASS automated | LINK | LINK | PARTIAL | CEO from group management. Ownership is an MFN widget. Dividend page is a board proposal. |
| Sandvik | PASS automated | PASS automated | PASS automated | PASS automated | LINK | LINK | PARTIAL | Ownership and dividend pages have no first-party table. |
| SCA | PASS automated | PASS automated | PASS automated | LINK | LINK | LINK | PARTIAL | Report HTML over the byte cap is parsed from the kept prefix only. |
| SEB | LINK | LINK | LINK | LINK | LINK | LINK | LINK | No verified feed id. |
| Skanska | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | Redirect, not followed. |
| SKF | LINK | LINK | LINK | LINK | LINK | LINK | LINK | Shell without document links. |
| Swedbank | LINK | LINK | LINK | LINK | LINK | LINK | LINK | No report links in HTML. |
| Tele2 | LINK | LINK | LINK | LINK | LINK | LINK | LINK | Shell without document links. |
| Telia | LINK | LINK | LINK | LINK | LINK | LINK | LINK | Shell without document links. |

Empty panels distinguish a real empty result, a source link, a temporary fetch
failure and a missing schema. Nothing in this table is mock data.
