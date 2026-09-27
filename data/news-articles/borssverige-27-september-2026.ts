import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 27 september 2026.
 * Editorial research cutoff: 2026-09-27T08:22:30+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/publiceringskalendern/
 * P0_SOURCE[primary]: https://www.konj.se/publikationer/kommande-publiceringar/kalenderhandelser/konjunkturbarometern-september/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-30/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/
 */
export const BORSSVERIGE_27_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-27-september-2026",
  slug: "borssverige-27-september-2026",
  title: "BörsSverige – veckan som kommer: utrikeshandel, konjunkturbarometer och Riksbanksprotokoll",
  summary: "Svenska börsveckan får tre tydliga kontrollpunkter: SCB:s utrikeshandel, Konjunkturinstitutets septemberbarometer och Riksbankens protokoll. DivLab går igenom vad som publiceras och vilka svenska sektorer som kan hamna i fokus.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-27T08:23:00+02:00",
  url: "/news/borssverige-27-september-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "BörsSverige vecka 40: SCB, KI och Riksbanken",
  seoDescription: "Inför Stockholmsbörsen vecka 40: svensk utrikeshandel 28 september, Konjunkturbarometern 29 september och Riksbankens protokoll 30 september.",
  seoKeywords: [
    "BörsSverige veckan som kommer",
    "Stockholmsbörsen vecka 40",
    "svensk utrikeshandel augusti 2026",
    "Konjunkturbarometern september 2026",
    "Riksbanken protokoll september 2026",
    "svenska börsen nästa vecka"
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "Sverige", "vecka 40", "utrikeshandel", "Konjunkturbarometern", "Riksbanken", "styrränta"],
    companies: ["Volvo", "Atlas Copco", "Sandvik", "H&M", "Swedbank", "SEB"],
    tickers: ["VOLV B", "ATCO A", "SAND", "HM B", "SWED A", "SEB A"],
    relatedNewsSlugs: ["borssverige-26-september-2026", "norden-i-centrum-27-september-2026", "borssverige-24-september-2026"]
  },
  showDisclaimer: true,
  intro: [
    "Vecka 40 öppnar med en ovanligt tydlig svensk makrotrappa. På måndag publicerar SCB utrikeshandeln med varor för augusti. På tisdag följer Konjunkturinstitutets septemberbarometer och på onsdag kommer protokollet från Riksbankens penningpolitiska möte.",
    "Utfallet i de kommande statistiksläppen var inte känt vid redaktionens cutoff. BörsSverige beskriver därför vad som publiceras och varför uppgifterna är relevanta, utan att föregripa siffror eller kursreaktioner."
  ],
  sections: [
    {
      heading: "Måndag: utrikeshandeln ger första signalen",
      paragraphs: [
        "SCB:s publiceringskalender anger att export, import och handelsnetto för augusti 2026 publiceras måndag den 28 september. Ny statistik på SCB:s webbplats publiceras normalt klockan 08.00 på helgfria vardagar.",
        "Utrikeshandeln ger en samlad bild av svenska varuflöden. För Stockholmsbörsen är den särskilt relevant som bakgrund till exportberoende verkstadsbolag, men statistiken kan inte översättas direkt till ett enskilt bolags orderingång eller vinst.",
        "Volvo, Atlas Copco och Sandvik är naturliga bevakningsnamn när exportbilden diskuteras. Deras försäljning påverkas dock också av produktmix, valutor, regional efterfrågan och bolagsspecifika beslut."
      ]
    },
    {
      heading: "Tisdag 08.00: Konjunkturbarometern för september",
      paragraphs: [
        "Konjunkturinstitutet publicerar Konjunkturbarometern för september tisdagen den 29 september klockan 08.00. Undersökningen mäter vad svenska företag och hushåll tror om ekonomin.",
        "Barometern kan ge tidiga signaler om efterfrågan, anställningsplaner och stämningsläget i näringslivet. Eftersom det är en enkät ska den läsas som en temperaturmätare, inte som ett färdigt mått på produktion eller konsumtion.",
        "För börsen blir skillnaden mellan företagens och hushållens svar viktig. H&M kan fungera som ett konsumentexempel, medan verkstadsbolagen är mer känsliga för företagens investeringsvilja. Inga slutsatser om aktiekurser kan dras innan utfallet och marknadsreaktionen har verifierats."
      ]
    },
    {
      heading: "Onsdag 09.30: Riksbankens protokoll",
      paragraphs: [
        "Riksbanken publicerar onsdagen den 30 september klockan 09.30 protokollet från det penningpolitiska mötet den 23 september. Dokumentet kan ge mer detalj om hur direktionen resonerade inför det senaste beslutet.",
        "Riksbanken lämnade den 24 september styrräntan oförändrad på 1,75 procent. Enligt kalendern börjar den beslutade räntenivån tillämpas den 30 september.",
        "Marknaden får därmed både ett formellt ikraftträdande och ett protokoll samma dag. För banker som Swedbank och SEB är räntebanan en viktig del av omvärlden, men räntenetto och aktievärdering beror även på inlåning, konkurrens, kreditförluster och tidigare marknadsförväntningar."
      ]
    },
    {
      heading: "Tre svenska sektorer att följa",
      paragraphs: [
        "Verkstad står först i kön när exportstatistiken ska tolkas. Det mest användbara är att se om handelsbilden stärker eller försvagar den breda efterfrågeberättelsen, inte att koppla ett månadsutfall direkt till en viss aktie.",
        "Konsumentbolag blir nästa fokus när hushållsdelen i Konjunkturbarometern publiceras. Ett förbättrat eller försämrat stämningsläge är relevant, men verklig försäljning och marginaler måste fortfarande hämtas från bolagens rapporter.",
        "Banker och fastigheter får onsdagens räntedokument som kontrollpunkt. Protokollets formuleringar kan påverka förväntningarna, men BörsSverige väntar med att beskriva en marknadsreaktion tills handeln har öppnat och färska uppgifter finns."
      ]
    },
    {
      heading: "DivLabs blick inför vecka 40",
      paragraphs: [
        "Veckans ordning är logisk: först handelsdata, sedan företagens och hushållens stämningsläge och därefter mer information om centralbankens resonemang. Tillsammans ger de tre publiceringarna en bredare bild av svensk efterfrågan och finansieringsmiljö.",
        "Den viktigaste redaktionella disciplinen är att hålla isär kalender och utfall. Datumen och tiderna är verifierade, men resultaten är ännu okända. Först efter publicering går det att avgöra om siffrorna förändrar bilden av svensk ekonomi eller Stockholmsbörsens sektorer."
      ]
    }
  ],
  sources: [
    {
      text: "SCB: Publiceringskalender med utrikeshandel för augusti den 28 september 2026",
      href: "https://www.scb.se/hitta-statistik/publiceringskalendern/"
    },
    {
      text: "Konjunkturinstitutet: Konjunkturbarometern september publiceras 29 september 2026 klockan 08.00",
      href: "https://www.konj.se/publikationer/kommande-publiceringar/kalenderhandelser/konjunkturbarometern-september/"
    },
    {
      text: "Sveriges Riksbank: Penningpolitiskt protokoll publiceras 30 september 2026 klockan 09.30",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-30/"
    },
    {
      text: "Sveriges Riksbank: Styrräntan oförändrad på 1,75 procent, 24 september 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/"
    }
  ]
};
