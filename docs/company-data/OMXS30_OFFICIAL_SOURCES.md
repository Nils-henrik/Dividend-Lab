# Officiella bolagskällor – OMXS30

Senast verifierad: 2026-09-24

Registret utökar piloten i `docs/company-data/PILOT_OFFICIAL_SOURCES.md`.
Endast källor som både svarade med den officiella bolagsdomänen och gav
bestämbar press-, rapport- och kalendermarkup är aktiverade. Migrationen
`20260924120000_seed_omxs30_company_sources.sql` lägger bara in de raderna och
rör inte befintliga följningar, dokument eller jobb.

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

Parserstrategi:

- Saab: statisk listmarkup med datum och titel, engelska rapport-PDF:er under `/globalassets/`, kommande kalenderposter.
- Sandvik: presslistan på den officiella IR-sidan, rapportsektionens datum plus rapport-PDF, kalenderposter med `datetime` och `data-link`.
- SCA: `dateTime` tillsammans med press- eller kalenderlänk, samt delårsrapportens datum och PDF.

## Aktiverade i fast lane 2

Verifierat 2026-09-24 med `DivLabBot/1.0`. Migrationen
`20260924213000_seed_omxs30_fast_lane_company_sources.sql` lägger bara in raderna
nedan.

| Bolag | Typ | URL | Origin |
| --- | --- | --- | --- |
| Alfa Laval | press_releases | https://www.alfalaval.com/media/newsroom/ | https://www.alfalaval.com |
| Alfa Laval | financial_reports | https://www.alfalaval.com/media/newsroom/ | https://www.alfalaval.com |
| ASSA ABLOY | press_releases | https://www.assaabloy.com/group/en/news-media/press-releases | https://www.assaabloy.com |
| ASSA ABLOY | financial_reports | https://www.assaabloy.com/group/en/investors/reports-presentations/interim-reports | https://www.assaabloy.com |
| Handelsbanken | financial_reports | https://www.handelsbanken.com/en/investor-relations | https://www.handelsbanken.com |
| Handelsbanken | financial_calendar | https://www.handelsbanken.com/en/investor-relations | https://www.handelsbanken.com |
| NIBE | press_releases | https://www.nibegroup.com/investors/pm-news-reports/news-reports-2026 | https://www.nibegroup.com |
| NIBE | financial_reports | https://www.nibegroup.com/investors/pm-news-reports/news-reports-2026 | https://www.nibegroup.com |
| NIBE | financial_calendar | https://www.nibegroup.com/investors/calendar-2025-2026 | https://www.nibegroup.com |

Parserstrategi:

- Alfa Laval: blocket `news-room-financial-news-block` har datum och artikellänk. Rapport-PDF hämtas bara från artikelns länk `Press release as PDF` under `/contentassets/`.
- ASSA ABLOY: pressidan bäddar in exakt `/rest/api/v1/press-releases.en.json` och detaljsidor `.../press-releases/id.{id}`. Delårsrapportens PDF:er ligger base64-kodade i interim-sidan. Publiceringsdatum tas från pressposten `Quarterly Report Q{n} {year}`.
- Handelsbanken: IR-sidan har senaste rapporten som `/tron/xgpu/info/contents/v1/document/72-282351` och kalenderposter `Date`/`Event` under årsrubrik. Datumet för rapporten tas från samma sidas matchande kalenderpost.
- NIBE: `datetime` och artikellänk på nyhetssidan. Rapport-PDF är samma origins `/download/...pdf` med `report` i länktexten. Kalendern har `small.smallxgrey` och förstaparts-URL.

## Kvarvarande blockerare i den här batchen

| Bolag | Inspekterade URL:er | Varför automation är osäker |
| --- | --- | --- |
| Alfa Laval kalender | `https://www.alfalaval.com/investors/`, `https://www.alfalaval.com/investors/financial-calendar/`, `https://www.alfalaval.com/investors/calendar/` | `/investors/` är ett Cision-skal utan datumsatta poster. De två kalenderstigarna svarade 404. |
| ASSA ABLOY kalender | `https://www.assaabloy.com/group/en/investors/events-calendar` bäddar in `https://tools.eurolandir.com/tools/fincalendar2/?companycode=S-ASSA&lang=en-GB` | Widgetens HTML säger `Loading...` för listan. Bara nästa händelse finns i första svaret, och resten kräver Eurolands skript. |
| Handelsbanken press | `https://www.handelsbanken.com/en/press-and-news/press-releases` | Sidan säger uttryckligen att inga pressmeddelanden finns. Regulatoriskt arkiv pekar på `https://news.cision.com/handelsbanken`. |
| Hexagon | `https://investors.hexagon.com/financial-information/reports-and-presentations` iframe `https://airtools-hexagon.prod-mid-euw3.investis.com/en/node/204`; kalender `https://investors.hexagon.com/upcoming-investor-events` iframe `.../en/node/4018`; press `https://hexagon.com/company/newsroom/press-releases` | Investis och `hexagon.com` svarade 403 för DivLabBot. Förstapartssidan har ingen datumlistad rapport, press eller kalender utanför de blockerade iframe-värdarna. |
| Lifco | `https://www.lifco.se/investors/press-releases`, `https://www.lifco.se/investors/financial-reports`, `https://www.lifco.se/investors/financial-calendar` och `?lang=en` | Båda kalender-URL:erna svarar 200 men är Next.js-skal utan datum, rapporter eller pressposter. Årsrapportlistan på `/annual-reports` har PDF:er på `network.s-z.se` utan publiceringsdag. Querysträngen är inte blockeraren. |
| Skanska | `https://group.skanska.com/investors/` redirectar 302 till `https://www.skanska.com/group/en/investors`. Rapportstigen redirectar till `https://www.skanska.com/group/en/investors/financial-reports` | DivLabBot får 403 på `www.skanska.com`. Workern följer inte redirect och får inte byta user-agent. |
| SKF | `https://www.skf.com/group/investors`, `https://www.skf.com/group/investors/reports`, `https://www.skf.com/group/news-and-media`, `https://www.skf.com/financial-reports-service/`, `https://www.skf.com/financial-reports-service/reports` | Investorsidorna är ett tomt skal. Tjänstens rot och `/reports` svarade 404. Exemplet `.../download/2244/report/Q1_2026_Eng` är en PDF utan list- eller kalenderändpunkt. |
| Telia | `https://www.teliacompany.com/`, `https://www.teliacompany.com/en/investors`, `https://www.teliacompany.com/en/newsroom`, `https://www.teliacompany.com/en/reports-and-presentations`, `https://www.teliacompany.com/en/investors/reports` | Sidorna är klientshell utan datumsatta dokument i första HTML-svaret. `/en/investors/financial-calendar` finns inte som eget datumarkiv i den hämtade shellen. |

## Inte aktiverade

Följande bolag har inte fått källrader. Ingen av dem kunde verifieras med tre
förstapartskällor som workern kan läsa utan tredjepartsaggregator, påhittad URL
eller JavaScript-rendering.

| Bolag | Blockerare vid kontroll 2026-09-24 |
| --- | --- |
| ABB | Kvartalsrapporter finns på `https://global.abb`, men press och kalender på `new.abb.com` svarade inte inom tidsgränsen. |
| Addtech | Press, rapporter och kalender renderas av Cision-widget (`tx-pxa-cision`) utan dokument i sidans HTML. |
| Boliden | `https://www.boliden.com/investor-relations/` svarade 403 för DivLabBot. |
| Epiroc | `https://www.epirocgroup.com/en/investors` svarade 403 för DivLabBot. |
| EQT | Nyhetssidan är en Next.js-vy utan stabila dokumentfält i den första HTML-svaret. |
| Essity | Press- och kalendersidorna saknar datumsatta dokumentlänkar i HTML. |
| Evolution | Dokumenten pekar på `storage.mfn.se`, en delegerad filvärd, och kalendern är inte datumsatta poster i HTML. |
| H&M | Rapport- och nyhetssidorna är läsbara, men `https://hmgroup.com/investors/financial-calendar/` listar inga datumsatta händelser. |
| Industrivärden | `https://www.industrivarden.se/en/` svarade 404. |
| Nordea | Delårsrapporter saknar PDF-länkar i den hämtade HTML:en. |
| SEB | Pressidan länkar till `news.cision.com` och rapportsidorna saknar dokument i HTML. |
| Swedbank | Press, rapporter och kalender saknar dokumentlänkar i HTML. |
| Tele2 | `https://www.tele2.com/investors/` och `/media/` returnerar skal utan dokumentlänkar. |
