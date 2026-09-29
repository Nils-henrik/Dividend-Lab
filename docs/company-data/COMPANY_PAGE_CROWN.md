# Company Page Crown Jewel v2

Deeper first-party coverage for the existing OMXS30 pages. The index rule from Company Page Max v1 is unchanged: a page is indexable only with at least two stable substance signals. Delayed quotes, valuation, Yahoo annuals and Yahoo cash dividends still do not count. The threshold is not lower.

`auditOmxs30Coverage()` in `lib/companies/coverage-audit.ts` is the deterministic registry audit. It does not read production. `lastSuccess` and `lastFailure` stay null there; those timestamps live on `company_sources` after cron.

## Coverage before and after

Before is the registry on `main` after PR #417. After is this branch. Modes are `automated`, `link` (`source_link_only`) or `blocked`. Index means the automated categories alone can reach two stable signals once cron has stored them. Editorial articles can still add a signal at render time, and market data still cannot.

| Slug | Before | After | Index from automated coverage |
| --- | --- | --- | --- |
| industrivarden | link / link / link | automated press, reports, calendar | no → yes (reports, press, calendar) |
| nordea | link | automated press, reports, dividend; calendar stays link | no → yes (reports, press, dividend) |
| swedbank | link | automated press, reports; calendar stays link | no → yes (reports, press) |
| tele2 | link | automated press, reports, calendar, CEO | no → yes (reports, press, calendar, management) |
| skanska | blocked | link. Press list is client-rendered, report `<time>` is empty, calendar has no static dates | no |
| abb | link | link. Q2 date exists, but the document host is stream.swisscom.ch and the download list is empty | no |
| boliden | blocked | blocked. `/investor-relations/` redirects to investors.boliden.com, which returns 403. The www sitemap is stories, not IR | no |
| epiroc | blocked | blocked. Cloudflare `cf-mitigated: challenge` on robots.txt | no |
| hexagon | blocked | blocked. Cloudflare `cf-mitigated: challenge` on robots.txt | no |
| lifco | link | link. Next shell, no dated documents. The only PDFs found were a privacy policy on network.s-z.se | no |
| seb | link | link. 200 responses without dated documents or a feed id | no |
| skf | link | link. Title-only shell | no |
| telia | link | link. Short shell, no document list | no |

The other followable OMXS30 names keep the Phase 2 modes from v1. Addtech, Alfa Laval, Assa Abloy, AstraZeneca, Atlas Copco, EQT, Ericsson, Essity, Evolution, Handelsbanken, H&M, Investor, NIBE, Saab, Sandvik, SCA and Volvo were already able to clear two stable signals from automated coverage.

Production does not change until `supabase/migrations/20260929120000_seed_omxs30_crown_company_sources.sql` is applied and the existing `17 3 * * *` cron runs. This change does not apply that migration and does not write production data. The migration updates existing source rows in place, including `support_mode`, so a later apply does not leave the old link-only URL as the row cron ignores. Nordea and Swedbank calendars stay `source_link_only` because their parsers return no dated events.

## What was read

Checked with `DivLabBot/1.0`, no redirects followed, no challenge bypass:

- Industrivärden RSS `https://www.industrivarden.se/rss/` is `application/rss+xml` with `xml:base` on `www.industrivarden.se` and `pubDate`. Press items and report items are different URLs, so the unique `(company_id, source_url)` key can store both. Calendar dates are used only when the same heading contains exactly one year, for example `Årsstämma 2027`. A month-and-day without a year is skipped.
- Tele2 dated cards, PDFs and calendar links are on `https://www.tele2.com/investors/`. The dedicated media, report and calendar routes are shells. CEO is the single `quote-with-reference` name paired with `President and Group CEO`.
- Nordea dated press is on `https://www.nordea.com/en/investors`. The dividend article URL is discovered from that page. Record date `6 August 2026` is stored. `13 August or as soon as possible` has no year and is omitted. Kind is `decided`, not a board proposal and not a paid cash event.
- Swedbank dated teasers are on `https://www.swedbank.com/investor-relations.html`. The timestamp time has no zone, so only the calendar date is stored. `internetbank.swedbank.se` links with query strings are rejected.

## Senaste rapporten i siffror

`ReportSnapshot` is a cached read of the issuer page. It is not an index signal and it is not stored. Currency is taken only from an explicit label (`EURm`, `, EUR`, `SEK`, `mdkr` / `kronor`). A comparison amount is shown only when the current amount and the comparison amount are both in the source, and the comparison period is named. Missing metrics are omitted. EBITDAaL is not mapped to EBIT. Substansvärde is not mapped to revenue.

Adapters:

- Nordea: EURm table columns `Q[1-4] 20xx` plus the same quarter one year earlier, and the DEPS row in EUR. The same metric repeated with the same figures is shown once. A later table with a different figure for that metric drops the snapshot.
- Tele2: the verified sentences for total revenue, net profit, earnings per share and equity free cash flow. Revenue has no comparison amount. Parenthetical comparisons count only when the prior-year quarter is also written on the page.
- Industrivärden: `Substansvärdet den 30 juni` in mdkr and kronor per aktie, with the article `<time datetime>`.

Every other company returns no snapshot.

## Dividend, owners, current events

Official dividend facts can now store `dividend_kind`, `dividend_ex_date`, `dividend_record_date` and `dividend_payment_date`. Yahoo remains cash history only. CAGR still requires an unbroken series of completed calendar-year cash sums, and the growth line also shows the latest completed year's cash sum.

Ownership is still one snapshot: rows from another `asOf` are not mixed in. No new issuer had a stable same-date owner table, so no new ownership parser was added.

Current events keep one row per kind, at most six, in the order calendar, report, official dividend, press, DivLab article, material price move. A later row is dropped when its URL or normalized title was already used. An official dividend row requires a per-share amount, a kind other than `unspecified`, and a source URL.

## Requests

A company page still loads the existing delayed quote, statement modules and dividend chart, plus the official rows already in the database. Discovery still does not mass-fetch quotes.

After this change, Nordea, Tele2 and Industrivärden add one cached chain of two allowlisted fetches (listing, then the selected article). The cache revalidates every 12 hours. Every other company adds zero snapshot requests. The ingestion cron schedule stays `17 3 * * *` and the daily batch stays 8. The supported universe is now 21 issuers, so a full pass still fits three daily batches. New issuer fetches run only for that company's due sources, with the existing byte cap, timeout, origin allowlist and `redirect: error`.

## Not in this change

No DAX 40 or Nasdaq-100 files. Autoredaktionen is untouched. No anti-bot bypass, no Börskollen, no new paid provider, no OCR and no model extraction on the request path. ABB stays out of ingestion.
