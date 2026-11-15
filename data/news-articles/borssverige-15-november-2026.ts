import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — Veckan som kommer, 15 november 2026.
 * Editorial research cutoff: 2026-11-15T08:23:01+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.nibegroup.com/investors/events/2026-11-17-
 * P0_SOURCE[primary]: https://corporate.sveafastigheter.se/en/invitation-to-the-presentation-of-sveafastigheters-interim-report-january-september-2026/
 * P0_SOURCE[primary]: https://corporate.sveafastigheter.se/en/the-merger-between-sveafastigheter-and-klarabo-has-been-completed/
 * P0_SOURCE[primary]: https://corporate.revolutionrace.com/en/press-releases/revolutionrace-revises-financial-calendar-for-2026-27
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=FM0105
 */
export const BORSSVERIGE_15_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-15-november-2026",
  slug: "borssverige-15-november-2026",
  title: "Veckan som kommer: NIBE rapporterar – Sveafastigheter möter första fusionstestet",
  summary:
    "NIBE rapporterar på tisdag, Sveafastigheter visar pro forma efter KlaraBo-fusionen på onsdag och RevolutionRace följer på torsdag. Sparbarometern ger veckans hushållssignal.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-15T08:23:06+01:00",
  url: "/news/borssverige-15-november-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-11-15.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-11-15.png",
  imageAlt: "BörsSverige 2026-11-15 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Stockholmsbörsen veckan: NIBE, Sveafastigheter och RevolutionRace",
  seoDescription:
    "Veckan som kommer på Stockholmsbörsen: NIBE rapporterar på tisdag, Sveafastigheter på onsdag och RevolutionRace på torsdag medan Sparbarometern publiceras.",
  seoKeywords: [
    "Stockholmsbörsen veckan",
    "veckan som kommer börsen",
    "NIBE Q3 2026",
    "Sveafastigheter rapport 2026",
    "Sveafastigheter KlaraBo fusion",
    "RevolutionRace Q1 2026 2027",
    "Sparbarometern Q3 2026"
  ],
  internalLinking: {
    topics: [
      "BörsSverige",
      "veckan som kommer",
      "rapportperiod",
      "värmepumpar",
      "fastigheter",
      "fusion",
      "e-handel",
      "hushållssparande",
      "Sverige"
    ],
    companies: ["NIBE Industrier", "Sveafastigheter", "RevolutionRace"],
    tickers: ["NIBE B", "SVEAF", "RVRC"],
    relatedNewsSlugs: [
      "borssverige-14-november-2026",
      "borssverige-12-november-2026",
      "borssverige-11-november-2026",
      "norden-i-centrum-15-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Nästa svenska börsvecka får tre tydliga rapportdagar. NIBE öppnar på tisdag, Sveafastigheter följer på onsdag med den första rapporten efter KlaraBo-fusionen och RevolutionRace publicerar sitt första kvartal på torsdag.",
    "NIBE blir veckans bredaste konjunktur- och industrisignal. Sveafastigheter får samtidigt ett mer bolagsspecifikt test: rapporten ska visa både resultatet för januari–september och pro forma-information för den sammanslagna fastighetskoncernen.",
    "På makrosidan publiceras Sparbarometern för tredje kvartalet på torsdag. Det här är en framåtblickande plan; inga framtida utfall, kursreaktioner eller obekräftade förväntningar används."
  ],
  sections: [
    {
      heading: "NIBE sätter tonen på tisdag",
      paragraphs: [
        "NIBE Industrier publicerar sin delårsrapport för januari–september, inklusive tredje kvartalet, tisdagen den 17 november klockan 08.00. Rapporten presenteras senare samma dag.",
        "För investerare blir omsättning, rörelseresultat, marginal och kassaflöde centrala kontrollpunkter. NIBE:s exponering mot klimatlösningar gör dessutom efterfrågan på värmepumpar och andra energieffektiva lösningar relevant för en bredare läsning av europeisk bygg- och installationsaktivitet.",
        "Den viktiga frågan är inte bara om kvartalet förbättrades, utan hur ledningen beskriver efterfrågan, lager och lönsamhet framåt. Dessa svar kan bedömas först när rapporten är offentlig."
      ]
    },
    {
      heading: "Sveafastigheter visar fusionens första redovisningsbild",
      paragraphs: [
        "Sveafastigheter publicerar rapporten för januari–september onsdagen den 18 november klockan 07.30. Tillförordnade vd:n Sophia Mattsson-Linnala presenterar rapporten klockan 09.00.",
        "Fusionen med KlaraBo registrerades och slutfördes den 30 september. KlaraBos tillgångar och skulder tas därför in i Sveafastigheters koncernbalansräkning per detta datum, medan KlaraBos intäkter och kostnader inte ingår i resultaträkningen för januari–september.",
        "Bolaget har uppgett att rapporten ska innehålla intjäningsförmåga för den kombinerade koncernen samt en pro forma-resultaträkning för årets första nio månader. Engångskostnader kopplade till fusionen väntas uppgå till cirka 55 miljoner kronor och redovisas inom central administration."
      ]
    },
    {
      heading: "Så bör Sveafastigheters siffror läsas",
      paragraphs: [
        "Rapporten får flera lager: den historiska resultaträkningen, den sammanslagna balansräkningen och pro forma-bilden. Därför bör läsaren skilja på redovisat utfall och information som illustrerar hur den kombinerade koncernen skulle ha sett ut.",
        "Hyresintäkter, driftnetto, förvaltningsresultat, belåningsgrad och räntetäckning blir naturliga kontrollpunkter. Minst lika viktigt är hur bolaget beskriver integrationskostnader, finansiering och möjligheten att realisera de motiv som låg bakom fusionen.",
        "Den första rapporten efter fusionen kan alltså förändra bilden av både resultat och finansiell risk, men någon slutsats ska inte dras innan rapporten och dess pro forma-bilaga är verifierade."
      ]
    },
    {
      heading: "RevolutionRace rapporterar på torsdag",
      paragraphs: [
        "RevolutionRace publicerar delårsrapporten för första kvartalet i räkenskapsåret 2026/27 torsdagen den 19 november klockan 07.30. Bolagets räkenskapsår löper från juli till juni.",
        "Finanskalendern reviderades efter förvärvet av ICANIWILL. Därmed blir rapporten en kontrollpunkt för försäljning, lönsamhet, kassaflöde och hur den utökade verksamheten beskrivs.",
        "För ett konsument- och e-handelsbolag är efterfrågan och lagerbindningen särskilt viktiga att följa. Artikeln föregriper varken kvartalets siffror eller integrationsutfall."
      ]
    },
    {
      heading: "Sparbarometern ger torsdagens hushållssignal",
      paragraphs: [
        "SCB publicerar Sparbarometern för tredje kvartalet torsdagen den 19 november. Statistiken tas fram av Finansinspektionen och ger en preliminär bild av hushållens finansiella sparande och förmögenhet.",
        "För Stockholmsbörsen blir datapunkten ett komplement till bolagsrapporterna. Hushållens sparande och balansräkningar påverkar förutsättningarna för konsumtion, bostadsmarknad och finansiell motståndskraft.",
        "Veckans läsordning blir därför tydlig: NIBE ger en industrisignal på tisdag, Sveafastigheter ett fastighets- och fusionstest på onsdag, och RevolutionRace samt Sparbarometern belyser konsument- och hushållssidan på torsdag."
      ]
    },
    {
      heading: "Vad följer vi efter rapporterna?",
      paragraphs: [
        "Förra veckan besvarade Scandic och Embracer öppna frågor om resultat och kassaflöde. Nästa vecka flyttas fokus till om NIBE visar uthållig efterfrågan, hur Sveafastigheters sammanslagna balansräkning ser ut och hur RevolutionRace beskriver sin utökade verksamhet.",
        "De viktigaste uppföljningarna blir verifierade förändringar i marginal, kassaflöde och guidning samt skillnaden mellan redovisade och pro forma-baserade mått hos Sveafastigheter.",
        "En kommande BörsSverige-artikel bör prioritera de faktiska rapportbeskeden och endast koppla dem till Sparbarometern om statistiken materiellt förändrar bilden av hushållens finansiella läge."
      ]
    }
  ],
  sources: [
    {
      text: "NIBE Group: officiell händelsesida med delårsrapport för januari–september den 17 november 2026 klockan 08.00",
      href: "https://www.nibegroup.com/investors/events/2026-11-17-"
    },
    {
      text: "Sveafastigheter: officiell inbjudan med rapportpublicering den 18 november 2026 klockan 07.30 och presentation klockan 09.00",
      href: "https://corporate.sveafastigheter.se/en/invitation-to-the-presentation-of-sveafastigheters-interim-report-january-september-2026/"
    },
    {
      text: "Sveafastigheter: officiellt besked om slutförd KlaraBo-fusion, redovisningseffekter, cirka 55 miljoner kronor i engångskostnader och pro forma-information",
      href: "https://corporate.sveafastigheter.se/en/the-merger-between-sveafastigheter-and-klarabo-has-been-completed/"
    },
    {
      text: "RevolutionRace: officiell reviderad finanskalender med Q1-rapport den 19 november 2026 klockan 07.30 efter ICANIWILL-förvärvet",
      href: "https://corporate.revolutionrace.com/en/press-releases/revolutionrace-revises-financial-calendar-for-2026-27"
    },
    {
      text: "Statistiska centralbyrån: officiell publiceringskalender för Sparbarometern avseende tredje kvartalet den 19 november 2026",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=FM0105"
    }
  ]
};
