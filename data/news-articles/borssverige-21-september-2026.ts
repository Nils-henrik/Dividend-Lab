import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 21 september 2026.
 * Editorial research cutoff: 2026-09-21T08:30:23+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.mfn.se/a/axvik/axvik-group-offentliggor-utfallet-av-erbjudandet-samt-meddelar-att-handel-pa-nasdaq-first-north-growth-market-inleds-den-21-september
 * P0_SOURCE[primary]: https://hmgroup.com/investors/financial-calendar/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-24/
 */
export const BORSSVERIGE_21_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-21-september-2026",
  slug: "borssverige-21-september-2026",
  title: "BörsSverige 21 september: Axvik till börsen – H&M och Riksbanken väntar",
  summary: "Axvik Group har sin första handelsdag på Nasdaq First North Growth Market i dag. Senare i veckan väntar H&M:s niomånadersrapport och Riksbankens nya penningpolitiska besked.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-21T08:34:30+02:00",
  url: "/news/borssverige-21-september-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-09-21.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-09-21.png",
  imageAlt: "BörsSverige 2026-09-21 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 4,
  seoTitle: "BörsSverige 21 september: Axvik, H&M och Riksbanken",
  seoDescription: "Svenska börsen i dag: Axvik gör första handelsdagen på First North. Senare i veckan väntar H&M:s rapport och Riksbankens räntebesked.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag Sverige",
    "svenska börsnyheter",
    "Axvik börsnotering",
    "H&M rapport september 2026",
    "Riksbanken 24 september 2026",
    "21 september 2026"
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "First North", "börsnotering", "detaljhandel", "Riksbanken", "penningpolitik"],
    companies: ["Axvik Group", "H&M"],
    tickers: ["AXVIK", "HM B"],
    relatedNewsSlugs: ["borssverige-19-september-2026", "borssverige-18-september-2026"]
  },
  showDisclaimer: true,
  intro: [
    "Måndagens svenska börsmorgon har en tydlig ny notering i fokus. Axvik Group har den 21 september som första handelsdag på Nasdaq First North Growth Market under kortnamnet AXVIK.",
    "Veckans större svenska katalysatorer ligger samtidigt på torsdag, då H&M publicerar sin niomånadersrapport och Riksbanken lämnar nytt penningpolitiskt besked. Artikeln bygger på information som var verifierbar fram till research-cutoff 08.30.23 svensk tid. Stockholmsbörsen hade då ännu inte öppnat, så inga kursreaktioner för måndagen beskrivs."
  ],
  sections: [
    {
      heading: "Axvik gör första handelsdagen på First North",
      paragraphs: [
        "Axvik Group har fått slutligt godkännande från Nasdaq Stockholm för upptagande till handel på Nasdaq First North Growth Market. Bolaget har meddelat att handeln i aktien inleds den 21 september under kortnamnet AXVIK.",
        "Erbjudandet omfattade 500 000 nyemitterade aktier till 55 kronor per aktie och tillförde bolaget cirka 27,5 miljoner kronor före kostnader. Priset motsvarar ett marknadsvärde på cirka 1,19 miljarder kronor för samtliga utestående aktier efter erbjudandet.",
        "Eftersom marknaden ännu inte hade öppnat vid artikelns cutoff redovisar DivLab ingen kursutveckling för premiärdagen."
      ]
    },
    {
      heading: "H&M rapporterar på torsdag",
      paragraphs: [
        "H&M Groups finansiella kalender anger att niomånadersrapporten för perioden 1 december 2025–31 augusti 2026 publiceras den 24 september.",
        "Rapporten blir en av veckans största svenska bolagshändelser. Fram till dess är det viktigt att skilja mellan verifierade kalenderuppgifter och förväntningar: några nya rapportsiffror för perioden var inte publicerade vid artikelns cutoff."
      ]
    },
    {
      heading: "Riksbanken lämnar nytt besked samma dag",
      paragraphs: [
        "Riksbanken publicerar sitt penningpolitiska beslut, inklusive styrräntan, och den penningpolitiska rapporten torsdagen den 24 september klockan 09.30.",
        "Beslutet är ännu inte känt och föregrips inte. För Stockholmsbörsen innebär torsdagen ändå en koncentrerad svensk nyhetsdag där både ett tungt storbolag och centralbanken lämnar nya besked med kort mellanrum."
      ]
    },
    {
      heading: "Det här bevakar BörsSverige efter öppning",
      paragraphs: [
        "Efter klockan 09.00 blir Axviks faktiska premiärhandel den mest konkreta nya datapunkten i dagens svenska flöde. Eventuella kursrörelser behöver verifieras separat innan de kan beskrivas som inträffade.",
        "Under resten av veckan ligger fokus på H&M:s rapport och Riksbankens besked. BörsSverige uppdaterar inte en morgonartikel i efterhand med obekräftade rörelser eller antaganden."
      ]
    }
  ],
  sources: [
    { text: "Axvik Group: handel på Nasdaq First North inleds 21 september 2026", href: "https://www.mfn.se/a/axvik/axvik-group-offentliggor-utfallet-av-erbjudandet-samt-meddelar-att-handel-pa-nasdaq-first-north-growth-market-inleds-den-21-september" },
    { text: "H&M Group: finansiell kalender – niomånadersrapport 24 september 2026", href: "https://hmgroup.com/investors/financial-calendar/" },
    { text: "Riksbanken: penningpolitiskt beslut och rapport 24 september 2026", href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-24/" }
  ]
};
