import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 6 november 2026.
 * Editorial research cutoff: 2026-11-06T08:07:03+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.maersk.com/news/articles/2026/11/05/maersk-higher-earnings-raises-full-year-guidance
 * P0_SOURCE[primary]: https://orsted.com/en/company-announcement-list/2026/11/orsted-delivers-strong-earnings-with-19--ebitda-gr-152708491
 * P0_SOURCE[primary]: https://www.norges-bank.no/en/topics/monetary-policy/Monetary-policy-meetings/2026/november-2026/?tabs=165398
 */
export const NORDEN_I_CENTRUM_6_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-6-november-2026",
  slug: "norden-i-centrum-6-november-2026",
  title: "Maersk höjer prognosen kraftigt – Ørsted lyfter EBITDA",
  summary:
    "Maersk höjer helårsprognosen efter att Q3-intäkterna ökat 27 procent och EBIT mer än fördubblats. Ørsted stärker underliggande EBITDA, medan Norges Bank lämnar räntan på 4,5 procent.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-06T08:07:08+01:00",
  url: "/news/norden-i-centrum-6-november-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-11-06.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-11-06.png",
  imageAlt: "Norden i centrum 2026-11-06 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska börsen idag: Maersk höjer prognosen kraftigt",
  seoDescription:
    "Maersk höjer helårsprognosen efter ett starkt Q3. Ørsted lyfter EBITDA men tar nedskrivningar, och Norges Bank behåller räntan på 4,5 procent.",
  seoKeywords: [
    "nordiska börsen idag",
    "Maersk Q3 2026",
    "Maersk prognos",
    "Ørsted Q3 2026",
    "Norges Bank ränta",
    "nordiska börser",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "rapportperiod",
      "frakt och logistik",
      "vindkraft",
      "ränta",
      "inflation",
      "Danmark",
      "Norge"
    ],
    companies: ["A.P. Møller - Mærsk", "Ørsted"],
    tickers: ["MAERSK-B", "ORSTED"],
    relatedNewsSlugs: [
      "norden-i-centrum-5-november-2026",
      "norden-i-centrum-4-november-2026",
      "norden-i-centrum-3-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Fredagens nordiska morgon ger svar på tre av gårdagens viktigaste öppna frågor. A.P. Møller - Mærsk höjer sin helårsprognos kraftigt efter att intäkterna ökat 27 procent och EBIT mer än fördubblats i tredje kvartalet.",
    "Ørsted visar samtidigt 19 procents tillväxt i EBITDA exklusive nya partnerskap och avbokningsavgifter under årets första nio månader. Bakom den starkare driften finns dock stora nedskrivningar och ett lägre redovisat resultat.",
    "I Norge lämnar centralbanken styrräntan oförändrad på 4,5 procent. Beskedet innebär ingen lättnad för låntagare och Norges Bank håller dörren öppen för en ny höjning om inflationstrycket kräver det."
  ],
  sections: [
    {
      heading: "Maersks intäkter stiger 27 procent",
      paragraphs: [
        "Maersks intäkter uppgick till 18,1 miljarder dollar i Q3, en ökning med 27 procent jämfört med samma kvartal i fjol. EBITDA steg till 4,7 miljarder dollar från 2,7 miljarder och EBIT ökade till 3,3 miljarder från 1,3 miljarder dollar.",
        "Lyftet drevs framför allt av Ocean, där EBIT steg till 2,6 miljarder dollar från 567 miljoner. Bolaget pekar på stabila volymer och högre fraktrater, samtidigt som hamnträngsel och störningar band upp kapacitet.",
        "Logistics & Services ökade intäkterna med 13 procent och förbättrade EBIT-marginalen till 5,8 procent från 5,5 procent. Terminalverksamheten nådde samtidigt rekordhöga intäkter enligt bolaget."
      ]
    },
    {
      heading: "Helårsprognosen höjs i flera steg",
      paragraphs: [
        "Maersk räknar nu med ett underliggande EBITDA på 14,0–14,5 miljarder dollar för 2026. Den tidigare prognosen var 10,5–12,5 miljarder dollar.",
        "Prognosen för underliggande EBIT höjs till 8,0–8,5 miljarder dollar från 4,5–6,5 miljarder. Bolaget väntar sig dessutom ett fritt kassaflöde över 3 miljarder dollar, jämfört med den tidigare bedömningen över noll.",
        "För nordiska investerare är förändringen viktig eftersom den visar hur snabbt kapacitetsbrist och högre fraktrater kan slå igenom i resultatet. Nästa kontrollpunkt är om marknadsläget består när flaskhalsar och fraktpriser förändras."
      ]
    },
    {
      heading: "Ørsteds underliggande EBITDA växer 19 procent",
      paragraphs: [
        "Ørsteds EBITDA exklusive nya partnerskap och avbokningsavgifter ökade till 20,2 miljarder danska kronor under årets första nio månader, från 17,0 miljarder. Det motsvarar en tillväxt på 19 procent.",
        "I tredje kvartalet var samma EBITDA-mått 5,26 miljarder danska kronor, jämfört med 3,06 miljarder året före. Högre vindhastigheter, högre priser och ökad produktion från nya havsbaserade vindkraftsparker bidrog till utvecklingen.",
        "Bolaget behåller sin helårsprognos om EBITDA över 28 miljarder danska kronor exklusive nya partnerskap och avbokningsavgifter. Prognosen för bruttoinvesteringar sänks samtidigt med 5 miljarder till 45–50 miljarder kronor på grund av ändrad betalningstidpunkt för vissa projekt."
      ]
    },
    {
      heading: "Nedskrivningar dämpar Ørsteds resultat",
      paragraphs: [
        "Den starkare driften översätts inte fullt ut till redovisad vinst. Ørsted tog nedskrivningar på 3,44 miljarder danska kronor i Q3 och redovisade en förlust på 728 miljoner kronor för kvartalet.",
        "För årets första nio månader uppgick nedskrivningarna till 5,98 miljarder danska kronor. Periodens vinst var 2,58 miljarder kronor, 3,9 miljarder lägre än samma period året före, främst på grund av icke kassaflödespåverkande nedskrivningar kopplade till högre räntor för amerikanska projekt.",
        "Skillnaden mellan underliggande EBITDA och redovisat resultat gör projektgenomförande, finansieringskostnader och nya värderingsjusteringar till de viktigaste frågorna framåt."
      ]
    },
    {
      heading: "Norges Bank håller räntan på 4,5 procent",
      paragraphs: [
        "Norges Bank beslutade enhälligt att lämna styrräntan oförändrad på 4,5 procent efter höjningen i september. Den nivån gäller från den 6 november.",
        "Centralbanken bedömer att inflationen fortfarande är för hög och att en stram penningpolitik behövs under en tid. Tolvmånadersinflationen var 3,4 procent i september och kärninflationen, KPI-JAE, var 3,0 procent.",
        "Norges Bank säger att räntan kan höjas om inflationsutsikterna kräver det. Nästa räntebesked kommer den 17 december, då banken också publicerar nya prognoser."
      ]
    },
    {
      heading: "Det följer vi härnäst",
      paragraphs: [
        "Gårdagens tre utpekade kontrollpunkter har därmed fått verifierade svar: Maersks vinstutsikter har stärkts tydligt, Ørsteds operativa utveckling förbättras men nedskrivningarna är fortsatt stora, och Norges Bank signalerar hög ränta längre snarare än snabb lättnad.",
        "För Maersk följer vi fraktrater, kapacitetsläget och om den höjda prognosen håller. För Ørsted blir projektens tidplaner, finansieringskostnader och värderingar centrala. I Norge är decembermötet nästa tydliga datapunkt för räntan.",
        "Rapporter och bolagsbesked som publiceras efter artikelns cutoff måste verifieras separat innan de kan beskrivas som utfall."
      ]
    }
  ],
  sources: [
    {
      text: "A.P. Møller - Mærsk: officiellt Q3-meddelande med intäkter, EBITDA, EBIT, segmentsiffror och höjd helårsprognos, publicerat den 5 november 2026",
      href: "https://www.maersk.com/news/articles/2026/11/05/maersk-higher-earnings-raises-full-year-guidance"
    },
    {
      text: "Ørsted: officiellt Q3-meddelande med EBITDA, investeringar, nedskrivningar, resultat och helårsprognos, publicerat den 5 november 2026 klockan 08.00 CET",
      href: "https://orsted.com/en/company-announcement-list/2026/11/orsted-delivers-strong-earnings-with-19--ebitda-gr-152708491"
    },
    {
      text: "Norges Bank: officiellt räntebesked med styrränta, inflationsbedömning och nästa prognostillfälle, publicerat den 5 november 2026 klockan 10.00",
      href: "https://www.norges-bank.no/en/topics/monetary-policy/Monetary-policy-meetings/2026/november-2026/?tabs=165398"
    }
  ]
};
