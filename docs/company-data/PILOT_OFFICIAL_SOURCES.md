# Officiella bolagskällor – pilot

Senast verifierad: 2026-09-24

Följbara bolagssidor omfattar hela OMXS30 (30 bolag) via
`lib/companies/catalog.ts`. De fem bolagen nedan är fortfarande de enda med
verifierade hämtningsadaptrar och rader i `company_sources`. Övriga OMXS30-bolag
kan följas, men ett nytt följ skapar inte ett importjobb förrän en officiell
källa och en testad adapter finns.

Det här registret är startpunkten för DivLabs billiga bolagsbevakning. Varje
pilotbolag har en officiell sida för pressmeddelanden, finansiella rapporter och
finansiell kalender. Databasen lagrar källorna via migrationen
`20260921185839_seed_pilot_company_sources.sql`.

| Bolag | Pressmeddelanden | Rapporter | Kalender |
| --- | --- | --- | --- |
| Investor | [Investor AB](https://www.investorab.com/investors-media/press-releases) | [Rapporter och presentationer](https://www.investorab.com/investors-media/reports-presentations/) | [Eventkalender](https://www.investorab.com/investors-media/events-calendar) |
| Volvo | [Volvo Group News & Media](https://www.volvogroup.com/en/news-and-media.html) | [Rapporter och presentationer](https://www.volvogroup.com/en/investors/reports-and-presentations.html) | [Finansiell kalender](https://www.volvogroup.com/en/investors/financial-calendar.html) |
| Ericsson | [Regulatoriska nyheter](https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3) | [Finansiella rapporter](https://www.ericsson.com/en/investors/financial-reports-and-presentations) | [Finansiell kalender](https://www.ericsson.com/en/investors/financial-calendar) |
| Atlas Copco | [Pressmeddelanden](https://www.atlascopcogroup.com/en/media/press-releases) | [Rapporter och presentationer](https://www.atlascopcogroup.com/en/investors/reports-and-presentations) | [Kalender och event](https://www.atlascopcogroup.com/en/investors/calendar-and-events) |
| AstraZeneca | [Pressmeddelanden](https://www.astrazeneca.com/media-centre/press-releases.html) | [Resultat och presentationer](https://www.astrazeneca.com/investor-relations/results-and-presentations.html) | [Event](https://www.astrazeneca.com/investor-relations/events.html) |

## Billig hämtningsmodell

1. Ett nytt bolag har ingen återkommande hämtning innan någon följer det.
2. Första följningen köar en begränsad initial hämtning, till exempel senaste 20
   dokumenten eller högst tolv månader bakåt.
3. Ett schemalagt jobb väljer endast bolag som har minst en rad i
   `company_follows` och aktiva officiella källor.
4. Pressmeddelanden kan kontrolleras oftare än rapporter och kalender. Använd
   villkorade HTTP-anrop med ETag eller Last-Modified där källan stödjer det.
5. DivLab lagrar metadata och originallänk. Rapporttext och PDF visas från
   bolagets egen webbplats i stället för att kopieras.
6. När sista följaren lämnar ett bolag upphör den återkommande hämtningen.

Migrationen `20260921190629_enqueue_company_ingestion_on_follow.sql` omsätter
aktiveringsprincipen i databasen. Den första följningen skapar högst ett aktivt
`initial_sync`-jobb om bolaget har en officiell källa men aldrig har hämtats.
Kön är helt privat för `service_role`. Om den sista följaren lämnar innan jobbet
har startat markeras det väntande jobbet som avbrutet.

En framtida worker måste kontrollera att bolaget fortfarande har följare när
jobbet tas, begränsa historiken och uppdatera `last_checked_at`. Workern ingår
inte i denna migration.

Köjobbet tas atomiskt genom `claim_company_ingestion_job()`. Funktionen använder
`FOR UPDATE SKIP LOCKED`, kräver att bolaget fortfarande har minst en följare
och är `security invoker`. Endast `service_role` får köra funktionen. Detta gör
att två samtidiga workers inte kan få samma jobb utan att skapa en privilegierad
klientväg för vanliga användare.

Varje webbplats behöver en egen, testad adapter. Registret aktiverar inte
automatisk hämtning i sig och ska inte tolkas som att webbskrapning redan är
godkänd enligt respektive webbplats villkor.

## Första adapterbeslutet – 2026-09-22

- Investors officiella pressida bäddar in AlertIR. `vp053.alertir.com/robots.txt`
  blockerar all robotåtkomst, så DivLab ska inte automatisera den vägen.
- Atlas Copcos `robots.txt` annonserar den officiella sitemap-filen och anger
  `crawl-delay: 1`. Den blockerar sökresultat och URL:er med query-parametrar,
  men inte den rena engelska sitemap-filen eller pressmeddelandesökvägarna.
- Första adaptern läser därför endast Atlas Copcos engelska sitemap, accepterar
  en strikt host/path-allowlist och returnerar högst 20 kandidater.
- Sitemapens `lastmod` används bara för upptäckt och sortering. Det är inte ett
  publiceringsdatum; faktisk titel och publiceringstid måste verifieras från
  detaljsidan innan något sparas i `company_documents`.
- Detaljparsern läser endast sidans H1, officiella datum och originallänk.
  Pressmeddelandets brödtext kopieras inte till DivLab.
- Den serverstyrda workern hämtar endast HTTPS från Atlas Copcos exakta origin,
  följer inte redirects och stoppar query-URL:er, oväntad innehållstyp,
  timeout och svar över adaptergränsen.
- Workern väntar minst en sekund mellan detaljanrop, gör högst tre försök med
  backoff och sparar idempotent på `(company_id, source_url)`.
- Köclaimen filtreras till bolag som har en färdig adapter. Övriga pilotbolags
  väntande jobb tas inte förrän deras respektive adapter har verifierats.
- Den interna worker-routen kräver exakt `Authorization: Bearer <CRON_SECRET>`
  och returnerar inga råa databasfel.
- Före varje claim återställs jobb vars worker-lease varit låst i mer än 15
  minuter. Efter tre försök markeras jobbet som misslyckat i stället för att
  loopa.
- Automatisk körning aktiveras separat i `vercel.json` först när hemligheten
  finns i Vercel och databasmigrationerna är verifierade.
