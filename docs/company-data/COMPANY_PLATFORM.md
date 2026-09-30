# Bolagsplattform, fas 1–3

Extends the existing `/bolag/[slug]` model. It does not replace market data, official documents, follow, comments or the Mitt DivLab feed.

## Broker actions

`lib/companies/external-identifiers.ts` stores verified Avanza and Nordnet instrument URLs. `resolveBrokerLinks` shows a button only when the stored URL matches that broker's canonical path and has no query string. There is no DivLab affiliate identifier in the repository, so tracking parameters are rejected. A later tracked URL can replace the stored string without changing the button component.

## Blankning

Finansinspektionen's public register is read from the two exact current ODS URLs: aggregated positions above 0.1% and current named positions above 0.5%. Requests reject redirects, require the ODS content type, and stay inside the byte and timeout caps. Headers, checksums and row shape are validated exactly. A drifted file, a 0% row, or a duplicate LEI or issuer name fails closed and is not shown as a number. Matching uses the stored LEI together with the known issuer name and ISIN when those are present. A missing register row stays "Ingen uppgift i FI:s aktuella blankningsregister." and is never rendered as 0%. A transport failure is not stored as that snapshot. The current files are snapshots, so no short-interest history is shown.

## Mitt DivLab

Recent follow events use the event timestamp. "Ny idag" means the event falls on the current Stockholm date. "Senaste 24 h" is used only when a real timestamp is inside 24 hours and the Stockholm date is not today. A date-only row may say "Ny idag" on that date and never "Senaste 24 h". Older events have no recency badge. Calendar labels such as Idag, Imorgon and Om N dagar stay separate. There is no read or unread state.

## Insyn

FI's insider register is still a source link. The public CSV is the full register, not a bounded per-company feed that fits the existing request caps. Transactions are not invented.

## Rapporten i korthet

Differences are calculated only when a verified report snapshot has both the current amount and the comparison amount. There is no management quote field in that snapshot, so "Vad bolaget säger" is omitted.

## AI-portföljer

A company page links only active or paused public DivLab model portfolios where the quantity is finite and above zero and the symbol matches the canonical instrument exactly. Draft and unknown portfolios are excluded. A failed read returns null and the block is omitted, which is distinct from an empty holding list. Neither case says that the company is unheld.

## Dataparitet

`auditCatalogDataParity()` walks every `getPilotCompanies()` entry. There is no 30-company page switch. The same page model, modules and fallback copy apply to the current catalog and to a later catalog company.

Each cell is one of: PASS REAL DATA, SOURCE LINK ONLY, BLOCKED BY SOURCE, TEMPORARILY UNAVAILABLE, or NOT APPLICABLE / NO VERIFIED DATA. Only PASS REAL DATA is complete. A blocked or source-link cell keeps its official https URL and is not rendered as parsed rows or as zero.

Delayed price, valuation, annual statements and paid dividend history are real provider data for a verified `.ST` symbol. The company page calls that provider through an explicit three-slot source chain. Backup slots stay empty where no independent machine-readable path exists, and a missing field stays missing. A live fetch failure is temporarily unavailable on the page and is not written into the static audit as a number. Rendered labels say fördröjd marknadsdata. The transport host and quote URL stay in the provider layer.

Official press, reports, calendar, CEO, ownership and dividend follow `COMPANY_OFFICIAL_COVERAGE`. Report snapshots are parsed only for Nordea, Tele2 and Industrivärden. Other companies keep the report archive or source link. FI short interest uses the stored LEI and issuer name. A missing register row stays absence. Insider transactions stay a Finansinspektionen source link.

A catalog company without a verified Avanza URL, Nordnet URL or FI identity must be listed in `CATALOG_IDENTIFIER_FAIL_CLOSED` with a fail-closed reason. The current catalog has no such exception.

The remaining source-link and blocked categories were checked against the adapters already in this repository. No unused issuer RSS, issuer JSON or verifiable Cision binding can be turned on without a new source migration or a company-specific page branch. Those categories stay fail-closed. Boliden, Epiroc and Hexagon stay blocked. ABB, Lifco, SEB, SKF, Skanska and Telia stay source-link only, together with the profile fields whose official HTML has no stable table.
