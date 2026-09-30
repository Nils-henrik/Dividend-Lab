# Bolagsplattform, fas 1–3

Extends the existing `/bolag/[slug]` model. It does not replace market data, official documents, follow, comments or the Mitt DivLab feed.

## Broker actions

`lib/companies/external-identifiers.ts` stores verified Avanza and Nordnet instrument URLs. `resolveBrokerLinks` shows a button only when the stored URL matches that broker's canonical path and has no query string. There is no DivLab affiliate identifier in the repository, so tracking parameters are rejected. A later tracked URL can replace the stored string without changing the button component.

## Blankning

Finansinspektionen's public register is read from the two ODS downloads the register page already uses: aggregated positions above 0.1% and current named positions above 0.5%. Files are capped at 1.5 MB and 8 seconds, cached for one hour, and matched by the catalog LEI. A missing LEI hides the section. A fetched register without that LEI uses "Ingen uppgift i FI:s aktuella blankningsregister." and never renders 0%. The current files are snapshots, so no short-interest history is shown.

## Insyn

FI's insider register is still a source link. The public CSV is the full register, not a bounded per-company feed that fits the existing request caps. Transactions are not invented.

## Rapporten i korthet

Differences are calculated only when a verified report snapshot has both the current amount and the comparison amount. There is no management quote field in that snapshot, so "Vad bolaget säger" is omitted.

## AI-portföljer

A company page asks the existing model-portfolio reader whether the catalog Yahoo symbol (`INVE-B.ST` style) is an open holding on exchange ST. If the reader is unavailable, the block is omitted.
