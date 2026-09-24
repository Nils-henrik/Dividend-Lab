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

## Inte aktiverade

Följande bolag har inte fått källrader. Ingen av dem kunde verifieras med tre
förstapartskällor som workern kan läsa utan tredjepartsaggregator, påhittad URL
eller JavaScript-rendering.

| Bolag | Blockerare vid kontroll 2026-09-24 |
| --- | --- |
| ABB | Kvartalsrapporter finns på `https://global.abb`, men press och kalender på `new.abb.com` svarade inte inom tidsgränsen. |
| Addtech | Press, rapporter och kalender renderas av Cision-widget (`tx-pxa-cision`) utan dokument i sidans HTML. |
| Alfa Laval | Investerarsidan är ett tunt skal med Cision och saknar statiska dokumentlänkar. |
| ASSA ABLOY | Listsidorna innehåller inte press-, rapport- eller kalenderdokument i HTML. |
| Boliden | `https://www.boliden.com/investor-relations/` svarade 403 för DivLabBot. |
| Epiroc | `https://www.epirocgroup.com/en/investors` svarade 403 för DivLabBot. |
| EQT | Nyhetssidan är en Next.js-vy utan stabila dokumentfält i den första HTML-svaret. |
| Essity | Press- och kalendersidorna saknar datumsatta dokumentlänkar i HTML. |
| Evolution | Dokumenten pekar på `storage.mfn.se`, en delegerad filvärd, och kalendern är inte datumsatta poster i HTML. |
| Handelsbanken | Press- och rapportsidorna saknar dokumentlänkar i den hämtade HTML:en. |
| H&M | Rapport- och nyhetssidorna är läsbara, men `https://hmgroup.com/investors/financial-calendar/` listar inga datumsatta händelser. |
| Hexagon | `https://hexagon.com/investors` svarade 403 för DivLabBot. |
| Industrivärden | `https://www.industrivarden.se/en/` svarade 404. |
| Lifco | Rapportsidan kräver `?lang=en`, vilket den befintliga hämtningen avvisar, och press/kalender är inte verifierade som statisk markup. |
| NIBE | Kalendern ligger på `https://www.nibegroup.com` efter redirect och saknar verifierad press- och rapportparsning. |
| Nordea | Delårsrapporter saknar PDF-länkar i den hämtade HTML:en. |
| SEB | Pressidan länkar till `news.cision.com` och rapportsidorna saknar dokument i HTML. |
| Skanska | Kalender och press saknar datumsatta dokument i HTML. Rapport-PDF:er ligger på `edit.skanska.com` och är inte separat allowlistade. |
| SKF | `https://www.skf.com/group/investors` returnerar ett skal utan dokumentlänkar. |
| Swedbank | Press, rapporter och kalender saknar dokumentlänkar i HTML. |
| Tele2 | `https://www.tele2.com/investors/` och `/media/` returnerar skal utan dokumentlänkar. |
| Telia | `https://www.teliacompany.com/en/investors` och nyhetsrummet returnerar skal utan dokumentlänkar. |
