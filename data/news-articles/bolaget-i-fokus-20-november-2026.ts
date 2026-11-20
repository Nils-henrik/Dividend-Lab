import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — 20 november 2026.
 * Editorial research cutoff: 2026-11-20T11:02:33+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.mfn.se/a/paxman/paxman-publishes-its-interim-report-for-q3-2026
 * P0_SOURCE[primary-report]: https://storage.mfn.se/20a49a0c-556b-41ab-ab59-fcceb309233b/paxman-ab-interim-report-q3-2026-dgt.pdf
 */
export const BOLAGET_I_FOKUS_PAXMAN_20_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-paxman-20-november-2026",
  slug: "bolaget-i-fokus-paxman-20-november-2026",
  title: "Bolaget i fokus: Paxman mer än dubblar EBITDA – men kassan minskar",
  summary:
    "Paxmans omsättning ökade 18,4 procent och EBITDA steg till 18,1 MSEK i Q3. Samtidigt var kassaflödet från den löpande verksamheten fortsatt negativt och nettokassan sjönk till 98 MSEK.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-20T11:02:34+01:00",
  url: "/news/bolaget-i-fokus-paxman-20-november-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Paxman Q3 2026: EBITDA mer än dubblas, kassan minskar",
  seoDescription:
    "Paxman ökade Q3-omsättningen till 102,9 MSEK och EBITDA till 18,1 MSEK. Vi granskar USA-tillväxten, kassaflödet och nästa FDA-steg.",
  seoKeywords: [
    "Paxman Q3 2026",
    "Paxman EBITDA",
    "Paxman kassaflöde",
    "Paxman Neuropathy System",
    "Dignitana",
    "FDA De Novo",
    "PAX",
    "Bolaget i fokus"
  ],
  internalLinking: {
    topics: [
      "Bolaget i fokus",
      "medicinteknik",
      "kvartalsrapport",
      "skalpkylning",
      "USA",
      "FDA",
      "kassaflöde"
    ],
    companies: ["Paxman", "Dignitana"],
    tickers: ["PAX"],
    relatedNewsSlugs: [
      "borssverige-20-november-2026",
      "norden-i-centrum-20-november-2026",
      "bolaget-i-fokus-soltech-19-november-2026",
      "bolaget-i-fokus-homemaid-18-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Paxman levererar sitt hittills högsta EBITDA-resultat i tredje kvartalet. Omsättningen ökade till 102,9 MSEK från 86,9 MSEK och EBITDA steg till 18,1 MSEK från 7,8 MSEK.",
    "Resultatlyftet är tydligt, men kassaflödet ger en mer balanserad bild. Kassaflödet från den löpande verksamheten var minus 0,9 MSEK och nettokassan minskade till 98 MSEK från 129,5 MSEK ett år tidigare.",
    "Det som gör rapporten särskilt viktig är kombinationen av en växande försäkringsbaserad USA-affär och lanseringen av Paxman Neuropathy System. Bolaget går från en renodlad skalpkylningsspecialist mot ett bredare erbjudande för biverkningar vid cancerbehandling."
  ],
  sections: [
    {
      heading: "Omsättningen växer 18,4 procent",
      paragraphs: [
        "Koncernens omsättning uppgick till 102,9 MSEK i Q3, jämfört med 86,9 MSEK ett år tidigare. Det motsvarar en tillväxt på 18,4 procent.",
        "USA-intäkterna var 67,8 MSEK och ökade 27 procent i lokal valuta. Den försäkringsbaserade faktureringsmodellen, IBBM, var den starkaste delen: Paxmans IBBM-intäkter steg 106 procent till 24,9 MSEK.",
        "Dignitana bidrog med 21,0 MSEK i kvartalet, i princip oförändrat från 21,1 MSEK året före. Dignitana ingår i koncernen sedan den 1 juni 2025, vilket innebär att jämförelsekvartalet redan innehåller verksamheten."
      ]
    },
    {
      heading: "EBITDA lyfter – den justerade marginalen backar",
      paragraphs: [
        "EBITDA steg till 18,1 MSEK från 7,8 MSEK. EBITDA-marginalen förbättrades därmed till 17,5 procent från 9,0 procent.",
        "Den justerade EBITDA-marginalen var däremot 19,5 procent, jämfört med 20,1 procent ett år tidigare. Justeringen exkluderar kostnader kopplade till förvärvet, neuropatiprogrammet och flytten.",
        "Skillnaden är viktig. Den redovisade lönsamheten förbättras kraftigt, men den underliggande marginalen enligt bolagets eget justerade mått är något lägre. Bolaget uppger också att aktivering av tidigare utvecklingskostnader för neuropatiprogrammet på 3,6 MSEK bidrog till kvartalets resultat."
      ]
    },
    {
      heading: "Nettovinsten ökar men goodwill belastar",
      paragraphs: [
        "Kvartalets nettoresultat uppgick till 7,8 MSEK, jämfört med 1,3 MSEK ett år tidigare. Resultatet per aktie ökade till 0,34 kronor från 0,05 kronor.",
        "Resultatet belastades samtidigt av 5,3 MSEK i goodwillavskrivningar kopplade till förvärvet av Dignitana. Det är en redovisningskostnad som behöver skiljas från den löpande kontantgenereringen.",
        "Rörelseresultatet uppgick till 7,9 MSEK. Paxman beskriver en lägre kostnadsbas som en viktig förklaring till den starkare EBITDA-nivån."
      ]
    },
    {
      heading: "Kassaflödet är rapportens tydligaste motfråga",
      paragraphs: [
        "Kassaflödet från den löpande verksamheten var minus 0,9 MSEK, en förbättring från minus 6,0 MSEK men fortfarande negativt.",
        "Det totala nettokassautflödet var 8,3 MSEK, jämfört med 19,9 MSEK ett år tidigare. Investeringar i USA samt regulatoriskt arbete och utveckling av neuropatisystemet påverkade kvartalet.",
        "Likvida medel uppgick till 98 MSEK vid periodens slut, mot 129,5 MSEK ett år tidigare. Resultatförbättringen har alltså ännu inte vänt kassans riktning, vilket gör rörelsekapital och investeringstakt centrala inför 2027."
      ]
    },
    {
      heading: "USA-modellen ökar användningen",
      paragraphs: [
        "Paxman sålde 1 396 kylmössor genom den försäkringsbaserade modellen i Q3. Det var 108 procent fler än ett år tidigare och 5 procent fler än i föregående kvartal.",
        "IBBM stod för nästan hälften av intäkterna i Paxmans amerikanska verksamhet. Bolagets data visar dessutom fler patienter per plats och system i den försäkringsbaserade modellen än i självbetalningsmodellen.",
        "Orderboken i USA uppgick till 235 system. Den fortsatta övergången från självbetalning till försäkringsfakturering blir därför avgörande för om fler installerade system också ger högre återkommande användning."
      ]
    },
    {
      heading: "Neuropatisystemet blir nästa stora test",
      paragraphs: [
        "Paxman har lanserat sitt neuropatisystem för att motverka cytostatikainducerad perifer neuropati. Det är bolagets första större produktutvidgning bortom skalpkylning.",
        "Fyra system ska installeras hos en privat brittisk cancervårdsaktör i december. Paxman planerar samtidigt att bygga 150 kommersiellt färdiga system under fjärde kvartalet.",
        "I USA har FDA accepterat bolagets De Novo-ansökan för substantiell granskning. FDA:s målsatta granskningstid är 150 granskningsdagar, men Paxman anger att processen normalt kan ta cirka sex till tolv månader och kan innehålla kompletteringskrav."
      ]
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "Först följer vi om den försäkringsbaserade USA-modellen fortsätter att växa utan att den justerade marginalen försvagas ytterligare.",
        "Därefter blir kassaflödet avgörande. EBITDA har lyft, men bolaget behöver visa att högre försäljning och lägre kostnadsbas även kan stabilisera nettokassan när investeringarna fortsätter.",
        "Slutligen bevakar vi de första neuropatiinstallationerna i december, produktionen av 150 system och FDA:s substantiella granskning. Ingen kursreaktion tas med eftersom artikeln inte använder en separat, färsk marknadsdatakälla nära cutoff."
      ]
    }
  ],
  sources: [
    {
      text: "Paxmans officiella Q3-meddelande med försäljning, marginaler, nettokassa och regulatoriska milstolpar",
      href: "https://www.mfn.se/a/paxman/paxman-publishes-its-interim-report-for-q3-2026"
    },
    {
      text: "Paxmans fullständiga Q3-rapport med resultat, kassaflöde, USA-nyckeltal och planerna för neuropatisystemet",
      href: "https://storage.mfn.se/20a49a0c-556b-41ab-ab59-fcceb309233b/paxman-ab-interim-report-q3-2026-dgt.pdf"
    }
  ]
};
