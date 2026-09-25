# Company page data parity

Read-only smoke date: 2026-09-25. No production database writes.

The company page reads one generic `CompanyOfficialData` contract. Persisted
`company_documents`, `company_facts` and `company_ownership` are preferred.
Investor still has a temporary live fallback inside `getCompanyOfficialData`
when those rows are empty, so the rich Investor page does not depend on a
page-level `slug === "investor"` branch.

## Migration order

Apply after `20260924223000_seed_omxs30_completion_company_sources.sql`:

1. `20260925120000_company_official_data_parity.sql`

The migration adds `company_facts`, `company_ownership`, source coverage
columns, the `baseline_refresh` job type, and
`enqueue_stale_company_baseline_refreshes`. It does not start a crawl.

## Scheduler

Each cron invocation (`17 */6 * * *`) recovers stale locks, enqueues at most
two companies, then claims one job. Uninitialized automated sources come
before merely stale ones. Followed companies come before unfollowed companies
inside each group. `initial_sync` on first follow is unchanged. Blocked and
source-link rows are not fetched.

## Reused draft work

- PR #396: Essity and H&M parsers, source URLs, nine-month/full-year
  classification, and their fixture tests.
- PR #397: Alfa Laval, ASSA ABLOY and Handelsbanken parsers, collectors and
  fixture tests. NIBE from that branch was not reused; main already has the
  verified NIBE widget path.

## OMXS30 coverage (2026-09-25 read-only smoke)

| Company | Press | Reports | Calendar | CEO | Ownership | Dividend | Mode/Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Investor | LINK official source only | LINK official source only | LINK official source only | PASS automated | PASS automated | PASS automated | Press and calendar HTML embed AlertIR (`alertir_embed_not_automated`). Report landing returned no dated PDF (`no_valid_documents`). CEO, ownership and dividend parsed from first-party pages. Page keeps a temporary live fallback for the embed. |
| Volvo | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 5 press, 2 reports, 1 future event. |
| Ericsson | BLOCKED listing_http_status | BLOCKED listing_http_status | BLOCKED listing_http_status | LINK official source only | LINK official source only | LINK official source only | Hardened fetch rejected the listing. No documents fabricated. |
| Atlas Copco | BLOCKED detail_timeout | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 12 reports and 6 calendar events. Press detail timed out. |
| AstraZeneca | BLOCKED sitemap_http_status | BLOCKED listing_http_status | BLOCKED listing_http_status | LINK official source only | LINK official source only | LINK official source only | Sitemap and listing fetches failed closed. |
| ABB | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 301, not followed. No stable dated trio in the first HTML body. |
| Addtech | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | Cision feed verified from the issuer pages: 20 press, 7 reports, 2 future events. |
| Alfa Laval | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | LINK official source only | 3 financial news items and 1 report PDF. Calendar is not automated. |
| ASSA ABLOY | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | LINK official source only | 20 press items and 8 dated reports from the embedded JSON. |
| Boliden | BLOCKED redirect 301 | BLOCKED redirect 301 | BLOCKED redirect 301 | BLOCKED redirect 301 | BLOCKED redirect 301 | BLOCKED redirect 301 | 2026-09-25 probe returned 301 and was not followed. Earlier audit was 403. |
| Epiroc | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | 403 for DivLabBot. |
| EQT | LINK official source only | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | Press parser returned `no_valid_documents`. 12 reports and 1 future event. |
| Essity | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | LINK official source only | 5 press and 5 reports. Calendar parser returned `no_valid_documents`. |
| Evolution | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 5 press, 6 reports, 1 future event. |
| Handelsbanken | LINK official source only | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | Press is not automated. 1 report and 5 future events from the IR page. |
| H&M | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 9 press, 1 nine-month report, 1 future event. |
| Hexagon | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | BLOCKED 403 | 403 for DivLabBot. |
| Industrivärden | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. MFN widget has no verified issuer feed. |
| Lifco | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 308, not followed. No dated document list. |
| NIBE | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | Main widget path: 11 press, 9 reports, 6 future events. PR #397 NIBE URLs were not reused. |
| Nordea | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. Reports lack a day date and the calendar widget is protected. |
| Saab | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 4 press, 2 reports, 1 future event. |
| Sandvik | PASS automated | PASS automated | PASS automated | LINK official source only | LINK official source only | LINK official source only | 13 press, 1 report, 5 future events. |
| SCA | PASS automated | BLOCKED listing_too_large | PASS automated | LINK official source only | LINK official source only | LINK official source only | 20 press and 5 future events. Report HTML exceeded the byte cap. |
| SEB | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. No verified feed id. |
| Skanska | BLOCKED redirect 308 | BLOCKED redirect 308 | BLOCKED redirect 308 | BLOCKED redirect 308 | BLOCKED redirect 308 | BLOCKED redirect 308 | 2026-09-25 probe returned 308 and was not followed. Earlier audit was 403. |
| SKF | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. Shell without document links. |
| Swedbank | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. No report links in HTML. |
| Tele2 | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 301, not followed. Shell without document links. |
| Telia | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | LINK official source only | Probe 200. Shell without document links. |

Empty panels distinguish a real empty result, a source link, a temporary fetch
failure and a missing schema. Nothing in this table is mock data.
