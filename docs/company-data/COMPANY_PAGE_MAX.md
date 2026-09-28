# Company Page Max v1

Generic OMXS30 company pages. One `CompanyPageModel` is built for every followable company. There is no Investor-only page branch.

## Sources

| Section | Source | If missing |
| --- | --- | --- |
| Price, change, volume, 52-week range | Existing Yahoo chart history | — |
| Valuation ratios | Existing Yahoo quoteSummary fields already requested for fundamentals, plus forward P/E, EV, EV/EBITDA, beta, trailing EPS and shares outstanding when that response contains them | — |
| Annual financials | Same Yahoo session, statement modules only on the company page | Empty or unavailable copy. No zero-filled years |
| Paid dividend history | Yahoo chart `events=div`, 10-year range, company page only | Empty history. No growth figure |
| Official dividend, CEO, owners, reports, press, calendar | Phase 2 `CompanyOfficialData` | Existing link, empty or unavailable state |
| DivLab news | Published articles matched on company name, alias or ticker metadata | Empty copy |
| Peers | Other followable companies with the same catalog sector, slug order, at most 8 | Empty copy |
| Insiders | Link to Finansinspektionen only | No transactions |

No new paid provider. No Börskollen. No production writes.

## Dividend semantics

- `board_proposal`: explicit kind, or a coverage note that says the page is a board proposal and no amount is stored. The amount is not labeled as decided.
- `decided`: only when a caller passes that kind. Current persisted facts do not.
- `paid`: Yahoo ex-date cash dividends.
- `unspecified`: a stored official per-share amount without a decision flag. It is labeled "Officiell utdelning per aktie".

Official yield is `per share / delayed price` only when the currencies match. Yahoo payout is shown only when the raw value is already a fraction from 0 to 1.5.

Growth is a CAGR of calendar-year cash sums. It needs an unbroken run that ends in the latest completed Stockholm year. Five-year growth needs six years. Three-year growth needs four. A partial current year is excluded.

## Financial history

Rows come from Yahoo annual income, balance and cash-flow statements. A year with no real figure is omitted. EBIT is not copied into operating income. Free cash flow uses Yahoo's own field, or operating cash flow plus capital expenditure when capital expenditure is zero or negative. Net debt is debt minus cash on the same statement date. Money fields need the quote currency.

## Insiders

Finansinspektionen's insider register has no stable per-company feed that can be read without a search form. This version does not scrape it. The page links to `https://www.fi.se/sv/vara-register/insynsregistret/`.

## Indexing

A page is indexable when at least two of these are present: delayed price, a real valuation field, financial history, an official dividend that is not a bare proposal, paid dividend history, a report, a press release, a future calendar event, a named CEO, or an ownership snapshot. Thinner pages stay `noindex, follow`. Breadcrumbs and Corporation structured data omit price.

## Cost

The company page adds one statement-module quoteSummary request and one 10-year dividend chart request, both cached. Watchlist discovery still loads quotes only for followed companies. Related peers are links, not quotes. The daily ingestion cron stays `17 3 * * *`.

## Schema

No new migration. Insider rows, dividend kind and ex-dates are not persisted.
