# Officiella bolagskällor – OMXS30

Senast verifierad: 2026-09-24. Completion pass v2.0 lade till Addtech, EQT, Evolution och NIBE.

Registret utökar piloten i `docs/company-data/PILOT_OFFICIAL_SOURCES.md`.
Endast källor som både svarade med den officiella bolagsdomänen och gav
bestämbar press-, rapport- och kalendermarkup är aktiverade. Migrationen
`20260924120000_seed_omxs30_company_sources.sql` och
`20260924223000_seed_omxs30_completion_company_sources.sql` lägger bara in
verifierade rader och rör inte befintliga följningar, dokument eller jobb.

## Aktiverade utöver piloten

| Bolag | Typ | URL | Origin |
| --- | --- | --- | --- |
| Saab | press_releases | https://www.saab.com/newsroom/press-releases | https://www.saab.com |
| Saab | financial_reports | https://www.saab.com/investors/reports-and-presentations | https://www.saab.com |
| Saab | financial_calendar | https://www.saab.com/investors/calendar | https://www.saab.com |
| Sandvik | press_releases | https://www.home.sandvik/en/investors/press-releases/ | https://www.home.sandvik |
| Sandvik | financial_reports | https://www.home.sandvik/en/investors/reports-presentations/ | https://www.home.sandvik |
| Sandvik | financial_calendar | https://www.home.sandvik/en/investors/calendar/ | https://www.home.sandvik |
| SCA | press_releases | https://www.sca.com/en/media/press-releases/ | https://www.sca.com |
| SCA | financial_reports | https://www.sca.com/en/investors/reports-and-presentations/interim-reports/ | https://www.sca.com |
| SCA | financial_calendar | https://www.sca.com/en/investors/ir-calendar/ | https://www.sca.com |
| Addtech | press_releases | https://www.addtech.com/investors-and-media/press-releases | https://www.addtech.com och https://news.cision.com |
| Addtech | financial_reports | https://www.addtech.com/investors-and-media/financial-reports | https://www.addtech.com och https://news.cision.com |
| Addtech | financial_calendar | https://www.addtech.com/investors-and-media/financial-calendar | https://www.addtech.com |
| EQT | press_releases | https://eqtgroup.com/news | https://eqtgroup.com |
| EQT | financial_reports | https://eqtgroup.com/shareholders/reports-and-presentations | https://eqtgroup.com |
| EQT | financial_calendar | https://eqtgroup.com/shareholders/financial-calendar | https://eqtgroup.com |
| Evolution | press_releases | https://www.evolution.com/investors/financial-publications/press-releases | https://www.evolution.com |
| Evolution | financial_reports | https://www.evolution.com/investors/financial-publications/reports | https://www.evolution.com |
| Evolution | financial_calendar | https://www.evolution.com/investors/financial-data/financial-calendar | https://www.evolution.com |
| NIBE | press_releases | https://www.nibegroup.com/news | https://www.nibegroup.com |
| NIBE | financial_reports | https://www.nibegroup.com/investors | https://www.nibegroup.com och https://storage.mfn.se |
| NIBE | financial_calendar | https://www.nibegroup.com/investors | https://www.nibegroup.com |

Delegering:

- Addtech är förstapartssidor som bäddar in Cision med `data-identifier="563F27D62CDF474CAF699BBDBA94EF71"`. Pressidan kräver `data-feed-to-show="PRM,RDV"` och rapportsidan `RPT,KMK`. Flödet hämtas bara från `https://publish.ne.cision.com/papi/NewsFeed/563F27D62CDF474CAF699BBDBA94EF71?pageSize=50&pageIndex=1`. Dokumentlänkar accepteras bara under `https://news.cision.com/addtech/r/`.
- EQT är förstapart. Press, rapporter och kalender läses ur sidans egen Next-payload. PDF:er på `cdn.sanity.io` används inte, eftersom den värden avvisar PDF-sökvägar i `robots.txt`.
- Evolution är förstapart. `robots.txt` tillåter hela sajten.
- NIBE press är förstapart på `www.nibegroup.com`. Rapport- och kalenderwidgetarna är inbäddade på investerarsidan och hämtas bara om den exakta widget-URL:en finns i sidans HTML. Engelska rapport-PDF:er accepteras bara från `https://storage.mfn.se/{uuid}/`.

Parserstrategi:

- Saab: statisk listmarkup med datum och titel, engelska rapport-PDF:er under `/globalassets/`, kommande kalenderposter.
- Sandvik: presslistan på den officiella IR-sidan, rapportsektionens datum plus rapport-PDF, kalenderposter med `datetime` och `data-link`.
- SCA: `dateTime` tillsammans med press- eller kalenderlänk, samt delårsrapportens datum och PDF.
- Addtech: Cision `PRM` för press och `RPT` för rapporter. Kalendern är statiska `<p><strong>dd/mm/åååå</strong>`-poster.
- EQT: nyhetsobjekt med `publishedDate` och `/news/{slug}`, rapportblock med datum och rapporttitel, samt kalenderevent med `eventType` `interim_reports` eller `annual_reports`.
- Evolution: `date-stamp` plus förstapartslänk under `/investors/financial-publications/press-releases/`. Kalendern är kort och händelsetext på samma sida.
- NIBE: `<time dateTime>` och `/news/{slug}` för press. Rapportarkivet och kalendertabellen kommer från de två widget-URL:er som investerarsidan bäddar in.

## Inte aktiverade

Följande bolag har inte fått källrader. Varje rad återstår för att tre
maskinläsbara officiella källor inte kunde verifieras utan att kringgå
åtkomstkontroll, gissa en adress eller använda en generell aggregator.

| Bolag | Kontrollerade sidor | Blockerare vid kontroll 2026-09-24 |
| --- | --- | --- |
| ABB | `https://global.abb/group/en/investors/quarterly-results` (200, AEM-skal) och `https://new.abb.com/news` (avbrutet svar) | Ingen stabil press-, rapport- och kalendertrio i första HTML-svaret. |
| Alfa Laval | `https://www.alfalaval.com/investors/` (200, Cision-skript) och `/investors/press-releases/` (404) | Cision-skalet innehåller inget feed-id eller dokumentlista. |
| ASSA ABLOY | `/group/en/news-media/press-releases`, `/group/en/investors/reports-presentations` (200) och `/group/en/investors/calendar` (404) | HTML saknar datumsatta dokumentlänkar och delegerat flöde. |
| Boliden | `https://www.boliden.com/investor-relations/` och `https://investors.boliden.com/en` | 403 för DivLabBot. Inget publikt flöde hittades utan att kringgå spärren. |
| Epiroc | `https://www.epirocgroup.com/en/investors` och `/en/media` | 403 för DivLabBot. Ingen officiell feed kunde verifieras. |
| Essity | `https://www.essity.com/media/press-releases/` och `/investors/calendar/` | Iframes utan dokument eller datum i HTML. |
| Handelsbanken | `https://www.handelsbanken.com/en/investor-relations` | Hämtad HTML saknar dokumentlänkar. `/investor-relations/reports` svarade 404. |
| H&M | `https://hmgroup.com/investors/reports/`, `/media/news/` och `/investors/financial-calendar/` | Rapporter har PDF men inget dagdatum. Kalendern listar inga datumsatta händelser. |
| Hexagon | `https://hexagon.com/investors` och `/sv-se/investors` | 403 för DivLabBot. |
| Industrivärden | `https://www.industrivarden.se/` (200, MFN-widget utan exponerad token-URL) och `/en/` (404) | Widgetanropet kunde inte bindas till en verifierad, utfärdarspecifik feed. |
| Lifco | `https://www.lifco.se/investors` och `/investors/press-releases` | Ingen datum satt dokumentlista. `?lang=en` avvisas av den befintliga hämtningen. |
| Nordea | press-, delårsrapport- och kalendersidorna under `www.nordea.com` | Press finns som JSON. Rapporternas datum är bara årtal. Kalendern är Euroland-iframe utan datum i HTML, och widgeten kräver reCAPTCHA. |
| SEB | `https://sebgroup.com/investor-relations` och `/press` | Cision nämns, men sidan exponerar inget feed-id eller dokumentlista. |
| Skanska | `https://www.skanska.com/investors/` | 403 för DivLabBot. |
| SKF | `https://www.skf.com/group/investors` och `/group/investors/reports-and-presentations` | Skal utan dokumentlänkar. |
| Swedbank | `https://www.swedbank.com/investor-relations/reports-and-presentations.html` | Inga rapportlänkar i HTML. Sök-API:t är inte en dokumentkälla. |
| Tele2 | `https://www.tele2.com/investors/` och `/media/` | Skal utan dokumentlänkar. |
| Telia | `https://www.teliacompany.com/en/investors` och `/en/newsroom` | Skal utan dokumentlänkar. |
