import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — 26 november 2026.
 * Editorial research cutoff: 2026-11-26T11:06:32+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://mfn.se/a/k33/k33-publishes-interim-report-for-q3-2026.iframe
 * P0_SOURCE[primary]: https://storage.mfn.se/a67651ad-75be-4e92-997d-f210d1998e95/q3-report-2026-k33-ab-publ.pdf
 */
export const BOLAGET_I_FOKUS_K33_26_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-26-november-2026",
  slug: "bolaget-i-fokus-26-november-2026",
  title: "Bolaget i fokus: K33 ökar Q3-intäkterna 35 procent – men vinsten är en bitcoineffekt",
  summary:
    "K33:s intäkter stiger 35 procent från Q2 till 261 MSEK och den justerade EBITDA-förlusten minskar. Kvartalsvinsten på 19,9 MSEK drivs dock främst av återförda bitcoin-nedskrivningar, inte av den löpande verksamheten.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-26T11:06:33+01:00",
  url: "/news/bolaget-i-fokus-26-november-2026",
  featured: true,
  imageAlt: "Bolaget i fokus den 26 november 2026 med K33:s kryptohandel och Q3-rapport i centrum.",
  readingMinutes: 5,
  seoTitle: "K33 Q3 2026: intäkterna återhämtas men vinsten är en bitcoineffekt",
  seoDescription:
    "K33 redovisar 261 MSEK i Q3-intäkter och 19,9 MSEK i resultat. Vi granskar handelsvolym, justerad EBITDA, bitcoinexponering och nya avtal.",
  seoKeywords: [
    "K33 Q3 2026",
    "K33 rapport",
    "K33 intäkter",
    "K33 bitcoin",
    "K33 EBITDA",
    "K33 aktie",
    "Bolaget i fokus"
  ],
  internalLinking: {
    topics: [
      "Bolaget i fokus",
      "kvartalsrapport",
      "kryptohandel",
      "bitcoin",
      "institutionell handel",
      "resultatkvalitet"
    ],
    companies: ["K33", "K33 Markets", "Sixty Six Capital", "Coinmotion", "Reverion Capital"],
    tickers: ["K33"],
    relatedNewsSlugs: [
      "bolaget-i-fokus-23-november-2026",
      "borssverige-26-november-2026",
      "norden-i-centrum-26-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "K33 visar en tydlig sekventiell återhämtning i tredje kvartalet. Koncernens intäkter steg 35 procent från Q2 till 261,0 MSEK och handelsvolymen i K33 Markets ökade 39 procent, trots att den globala spotmarknaden för bitcoin enligt bolaget minskade 12,6 procent.",
    "Den operativa förlusten krymper också. Justerad EBITDA förbättrades till minus 1,7 MSEK från minus 4,6 MSEK i andra kvartalet.",
    "Men rapportens vinst på 19,9 MSEK ska inte läsas som att kärnverksamheten redan är uthålligt lönsam. Resultatet drevs främst av icke-kassaflödespåverkande återföringar av tidigare nedskrivningar på koncernens bitcoininnehav. Någon kursreaktion används inte eftersom färsk marknadsdata nära cutoff inte har verifierats."
  ],
  sections: [
    {
      heading: "Handelsaktiviteten vänder upp från Q2",
      paragraphs: [
        "K33 redovisade intäkter på 260,963 MSEK i tredje kvartalet. Det är 35 procent högre än under Q2, när aktiviteten var svagare.",
        "K33 Markets handelsvolym ökade samtidigt 39 procent från föregående kvartal. Bolaget ställer det mot en nedgång på 12,6 procent i globala bitcoin-spotvolymer.",
        "Det är rapportens viktigaste operativa signal: K33 växer snabbare än den marknad bolaget jämför sig med under kvartalet och har dessutom fått Coinmotion som institutionell exekveringspartner."
      ]
    },
    {
      heading: "Årsjämförelsen är betydligt svagare",
      paragraphs: [
        "Mot tredje kvartalet 2025 minskade intäkterna från 933,266 MSEK till 260,963 MSEK. Den sekventiella återhämtningen sker alltså från en väsentligt lägre nivå än ett år tidigare.",
        "För årets första nio månader var intäkterna 1 193,720 MSEK, jämfört med 1 782,656 MSEK under motsvarande period 2025.",
        "Investerare behöver därför hålla två bilder i huvudet samtidigt: momentum förbättras från Q2, men koncernens omsättning är fortfarande klart lägre på årsbasis."
      ]
    },
    {
      heading: "Justerad EBITDA närmar sig noll",
      paragraphs: [
        "Rapporterad EBITDA uppgick till 0,059 MSEK, jämfört med 2,075 MSEK ett år tidigare och minus 6,441 MSEK i Q2.",
        "Justerad EBITDA var minus 1,696 MSEK. Det är en förbättring från minus 4,582 MSEK i Q2, men svagare än plus 2,089 MSEK under tredje kvartalet 2025.",
        "För januari–september blev justerad EBITDA minus 9,952 MSEK, jämfört med plus 0,411 MSEK året före. K33 har alltså minskat kvartalsförlusten, men har ännu inte visat uthållig justerad lönsamhet."
      ]
    },
    {
      heading: "Kvartalsvinsten kommer främst från bitcoinvärdering",
      paragraphs: [
        "EBIT blev 20,312 MSEK och periodens resultat 19,897 MSEK, jämfört med minus 3,244 respektive minus 4,900 MSEK ett år tidigare.",
        "K33 förklarar resultatvändningen främst med återföringar av tidigare nedskrivningar på koncernens bitcoininnehav. Effekten är icke-kassaflödespåverkande.",
        "Det betyder att den redovisade vinsten säger mer om värderingen av bitcoinexponeringen än om marginalen i den löpande handels- och tjänsteverksamheten. Den justerade EBITDA-förlusten är därför det bättre måttet på den operativa utvecklingen."
      ]
    },
    {
      heading: "Exponeringen är 219 bitcoin – men allt är inte direkt ägande",
      paragraphs: [
        "K33 uppger en total direkt och indirekt bitcoinexponering på cirka 219 BTC vid kvartalets slut. I siffran ingår exponering genom ägarandelen på 45,5 procent i Sixty Six Capital.",
        "Sixty Six Capital har i sin tur en köpoption på upp till 200 bitcoin med lösenpris 100 000 dollar per bitcoin och förfall i augusti 2027.",
        "Bolaget betonar att optionen ger möjlig uppsida över lösenpriset men inte är detsamma som direkt bitcoinägande. Det är en viktig skillnad när investerare bedömer både risk och substansvärde."
      ]
    },
    {
      heading: "Nya avtal kan bredda intjäningen",
      paragraphs: [
        "Efter kvartalet utökade K33 sitt managementavtal med Sixty Six Capital. Den årliga ersättningen höjdes från 200 000 till 330 000 kanadensiska dollar samtidigt som uppdraget breddades.",
        "K33 har också ingått ett villkorat avtal på 13 MSEK med Reverion Capital. Köpeskillingen består av Reverion-aktier värda 5 MSEK, avsedda att delas ut till K33:s aktieägare, och ett räntefritt konvertibellån på 8 MSEK till K33.",
        "Avtalet är beroende av att transaktionen slutförs och att nödvändiga godkännanden erhålls. Det ska därför inte räknas som säker intjäning ännu."
      ]
    },
    {
      heading: "Vad händer härnäst?",
      paragraphs: [
        "Den första kontrollpunkten är om handelsvolymen kan fortsätta växa snabbare än kryptomarknaden och föra justerad EBITDA över noll utan hjälp från värderingseffekter.",
        "Den andra är kvaliteten i bitcoinexponeringen. Direktägda tillgångar, indirekt ägande och optioner har olika risk, likviditet och värderingskänslighet.",
        "Slutligen behöver Coinmotion-samarbetet, det högre Sixty Six-arvodet och Reverion-affären börja synas i återkommande intäkter. Det är där K33 kan bevisa att Q3 var början på en varaktig förbättring och inte bara ett starkare handelskvartal."
      ]
    }
  ],
  sources: [
    {
      text: "K33:s officiella rapportmeddelande för Q3 2026 med intäkter, handelsvolym, EBITDA, resultat, bitcoinexponering och efterföljande avtal",
      href: "https://mfn.se/a/k33/k33-publishes-interim-report-for-q3-2026.iframe"
    },
    {
      text: "K33:s fullständiga officiella Q3-rapport 2026 med finansiella tabeller och bolagets kommentarer",
      href: "https://storage.mfn.se/a67651ad-75be-4e92-997d-f210d1998e95/q3-report-2026-k33-ab-publ.pdf"
    }
  ]
};
