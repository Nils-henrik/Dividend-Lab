import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — 2 november 2026.
 * Editorial research cutoff: 2026-11-02T10:59:10+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary-report]: https://www.mfn.se/a/immunovia/immunovia-publishes-interim-report-for-july-september-2026.iframe
 * P0_SOURCE[primary-marketplace]: https://view.news.eu.nasdaq.com/view?id=b9ac6f35c11f89e45b41b880f032aed4a&lang=en&src=listed
 * P0_SOURCE[primary-study]: https://www.mdpi.com/2077-0383/15/19/7355
 */
export const BOLAGET_I_FOKUS_IMMUNOVIA_2_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-immunovia-2-november-2026",
  slug: "bolaget-i-fokus-immunovia-2-november-2026",
  title: "Bolaget i fokus: Immunovia ökar intäkterna åtta gånger – emissionen blir nästa test",
  summary:
    "Immunovias Q3-intäkter stiger till 843 000 kronor och rörelseförlusten minskar. Samtidigt gör en kassa på 19,6 miljoner kronor den planerade företrädesemissionen central för USA-satsningen.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-02T10:59:15+01:00",
  url: "/news/bolaget-i-fokus-immunovia-2-november-2026",
  featured: true,
  imageAlt: "Bolaget i fokus 2026-11-02 – Immunovias rapport, kassa och finansiering av PancreaSure.",
  readingMinutes: 5,
  seoTitle: "Immunovia Q3 2026: högre intäkter och emission i fokus",
  seoDescription:
    "Immunovia ökar Q3-intäkterna till 843 000 kronor och minskar förlusten. Kassa, Medicare-process och en emission på cirka 63 miljoner står nu i centrum.",
  seoKeywords: [
    "Immunovia Q3 2026",
    "Immunovia rapport",
    "Immunovia emission",
    "IMMNOV",
    "PancreaSure",
    "Medicare",
    "Bolaget i fokus"
  ],
  internalLinking: {
    topics: ["rapportperiod", "medicinteknik", "diagnostik", "kassaflöde", "företrädesemission", "USA"],
    companies: ["Immunovia", "AcadeMedia", "Loomis", "Paradox Interactive"],
    tickers: ["IMMNOV", "ACAD", "LOOMIS", "PDX"],
    relatedNewsSlugs: [
      "norden-i-centrum-2-november-2026",
      "bolaget-i-fokus-loomis-30-oktober-2026",
      "bolaget-i-fokus-paradox-29-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Immunovia blir dagens Bolaget i fokus efter att ha publicerat ett tredje kvartal där försäljningen växte från en låg bas samtidigt som förlusten minskade. Nettoomsättningen steg till 843 000 kronor från 101 000 kronor ett år tidigare.",
    "Rörelseförlusten minskade till 17,7 miljoner kronor från 25,1 miljoner. Men kvartalets operativa kassaflöde var fortfarande minus 14,9 miljoner kronor och kassan uppgick till 19,6 miljoner vid periodens slut.",
    "Därför är huvudfrågan större än själva intäktsökningen: kan den planerade företrädesemissionen ge bolaget tillräcklig finansiering för att bygga försäljning, kliniskt underlag och ersättning för PancreaSure i USA?"
  ],
  sections: [
    {
      heading: "Försäljningen växer, men från en liten bas",
      paragraphs: [
        "Nettoomsättningen på 843 000 kronor bestod enligt bolaget av försäljning av PancreaSure-testet och royaltyintäkter. Det är drygt åtta gånger nivån på 101 000 kronor under motsvarande kvartal 2025, men beloppet visar också att den kommersiella skalan ännu är begränsad.",
        "Förlustminskningen var tydligare i kronor. Rörelseresultatet förbättrades med 7,4 miljoner kronor till minus 17,7 miljoner, medan resultatet per aktie förbättrades till minus 0,03 kronor från minus 0,10 kronor.",
        "Det operativa kassaflödet förbättrades mer försiktigt, till minus 14,9 miljoner kronor från minus 16,1 miljoner. Bolaget hänförde förbättringen till lägre kostnader för kliniska studier. För investerare blir det viktigt att skilja mellan bättre resultat och en affär som ännu inte finansierar sig själv."
      ]
    },
    {
      heading: "Kommersialiseringen hänger på användning och ersättning",
      paragraphs: [
        "PancreaSure är ett blodbaserat test för tidig upptäckt av bukspottkörtelcancer hos personer med förhöjd risk. Immunovia lämnade den 28 september in en formell begäran om Medicare-täckning, enligt kvartalsrapporten.",
        "Ett nytt referentgranskat underlag ger samtidigt stöd åt testets prestanda i den studerade högriskgruppen. Analysen redovisade 77,5 procents känslighet för tidiga cancerfall och 93,6 procents specificitet; för cancer i stadium I var känsligheten 80,0 procent.",
        "Studien är ett kliniskt bevissteg, inte ett försäljningsutfall. För bolagsvärdet blir den avgörande övergången om resultaten kan bidra till ersättningsbeslut och återkommande användning på amerikanska övervakningscenter."
      ]
    },
    {
      heading: "Kassan gör emissionen till rapportens viktigaste punkt",
      paragraphs: [
        "Likvida medel uppgick till 19,6 miljoner kronor vid kvartalets slut, jämfört med 26,6 miljoner ett år tidigare. Ställt mot ett kvartalsvis operativt kassautflöde på 14,9 miljoner visar det varför extern finansiering är central.",
        "Immunovia har aviserat en företrädesemission av units på cirka 63 miljoner kronor före kostnader. Omkring 50 miljoner kronor, motsvarande cirka 80 procent, täcks av teckningsåtaganden och en bottengaranti. Åtagandena var enligt Nasdaq-meddelandet inte säkrade med bankgaranti, spärrade medel eller pant.",
        "Bolaget avser att använda nettolikviden till fortsatt kommersialisering i USA, kliniska studier som ska stödja ersättning samt rörelsekapital. Emissionen är därmed inte ett sidospår till rapporten utan en förutsättning för nästa fas i strategin."
      ]
    },
    {
      heading: "Det här avgör nästa steg",
      paragraphs: [
        "Det första att följa är de slutliga emissionsvillkoren och teckningsutfallet. Ett högt utfall stärker finansieringen men aktieägare måste samtidigt väga in utspädningen från nya aktier och de medföljande teckningsoptionerna.",
        "Det andra är Medicare-processen. En täckningsbedömning kan vara viktigare för den långsiktiga intäktspotentialen än enskilda kvartalsförändringar från dagens låga försäljningsnivå.",
        "Det tredje är om fler kliniker börjar använda PancreaSure och om användningen blir återkommande. Tills de signalerna syns i omsättning och kassaflöde bör kvartalets förbättring läsas som ett steg framåt, inte som att finansierings- och kommersialiseringsrisken är löst."
      ]
    }
  ],
  sources: [
    {
      text: "Immunovia: regulatoriskt Q3-meddelande med omsättning, rörelseresultat, kassaflöde, kassa, Medicare-ansökan och emissionsöversikt, publicerat den 2 november 2026 klockan 08.30 CET",
      href: "https://www.mfn.se/a/immunovia/immunovia-publishes-interim-report-for-july-september-2026.iframe"
    },
    {
      text: "Nasdaq Nordic: Immunovias officiella emissionsmeddelande med storlek, täckningsgrad, användning av likviden, villkor och finansieringsrisk, publicerat den 28 september 2026 klockan 18.30 CEST",
      href: "https://view.news.eu.nasdaq.com/view?id=b9ac6f35c11f89e45b41b880f032aed4a&lang=en&src=listed"
    },
    {
      text: "Journal of Clinical Medicine: referentgranskad retrospektiv analys av PancreaSure med känslighet och specificitet i den studerade högriskgruppen, publicerad den 22 september 2026",
      href: "https://www.mdpi.com/2077-0383/15/19/7355"
    }
  ]
};
