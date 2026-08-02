import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 * Market figures verified against Wednesday 29 July 2026 closes
 * (US equity indices, Fed decision, Brent move, Stockholm week-to-date).
 *
 * Cover image: original AI-generated editorial illustration.
 * Local optimized copy: public/news-demo/borsveckan-ai-frossa-oljerusning-rantehot.webp
 */
export const BORSVECKAN_I_KORTHET_AI_FROSSA_OLJERUSNING_RANTEHOT_ARTICLE: NewsArticle =
  {
    id: "borsveckan-i-korthet-ai-frossa-oljerusning-rantehot",
    slug: "borsveckan-i-korthet-ai-frossa-oljerusning-rantehot",
    title:
      "Börsveckan i korthet: AI-frossa, oljerusning och nytt räntehot",
    summary:
      "Stockholm håller sig på plus – men under ytan växer oron för dyr olja, fallande AI-aktier och högre amerikanska räntor.",
    category: "market",
    source: "DivLab",
    publishedAt: "2026-07-30T08:00:00+02:00",
    url: "/news/borsveckan-i-korthet-ai-frossa-oljerusning-rantehot",
    featured: true,
    imageUrl: "/news-demo/borsveckan-ai-frossa-oljerusning-rantehot.webp",
    imageAlt:
      "Mörk börsillustration med fallande röd kurva, stigande oljepris och en stadssilhuett i bakgrunden.",
    imageCaption: "AI-genererad illustration.",
    readingMinutes: 2,
    seoTitle: "Börsveckan: AI-frossa, oljerusning och räntehot",
    seoDescription:
      "Wall Street föll tungt, oljan rusade och flera Fed-ledamöter ville höja räntan. Här är börsveckans viktigaste händelser i korthet.",
    seoKeywords: [
      "börsveckan",
      "Wall Street",
      "Dow Jones",
      "Nasdaq",
      "S&P 500",
      "OMXS30",
      "Fed",
      "ränta",
      "oljepris",
      "Brentolja",
      "AI",
      "halvledare",
    ],
    showDisclaimer: true,
    intro: [
      "Börsveckan började med lättnad. Bara några dagar senare ser läget betydligt mörkare ut.",
      "Stockholmsbörsen håller sig fortfarande på plus för veckan – men på Wall Street har över 1 100 Dow Jones-punkter försvunnit under en enda kväll. Samtidigt rusar oljepriset och den amerikanska centralbanken har börjat tala ett språk som marknaden helst hade sluppit höra.",
    ],
    sections: [
      {
        heading: "Stockholm ser lugnt ut – kanske för lugnt",
        paragraphs: [
          "OMXS30 steg 0,6 procent i måndags och ytterligare 0,2 procent i tisdags. Under onsdagen vände index ned med 0,16 procent.",
          "Det innebär att de svenska storbolagen fortfarande ligger omkring 0,6 procent högre för veckan hittills. Det breda OMXSPI-indexet har stigit ungefär 1 procent.",
          "Bakom de små indexrörelserna har enskilda aktier däremot kastats åt båda håll. Hexagon steg nästan 13 procent efter sin rapport, medan oron från USA började pressa marknaden under onsdagseftermiddagen.",
        ],
      },
      {
        heading: "Wall Street fick ett brutalt uppvaknande",
        paragraphs: [
          "Onsdagens amerikanska handel slutade tydligt på minus:",
          "Dow Jones föll 2,19 procent – motsvarande 1 153 punkter.",
          "S&P 500 backade 1,52 procent.",
          "Nasdaq tappade 1,74 procent.",
          "Industribolag och teknikaktier hörde till de största förlorarna. Nedgången kom samtidigt som investerare började ifrågasätta hur länge de enorma investeringarna i AI kan fortsätta utan att vinsterna hänger med.",
        ],
      },
      {
        heading: "Tre obehagliga siffror",
        paragraphs: [
          "Nästan 19 procent: Så mycket har det amerikanska halvledarindexet fallit sedan juni.",
          "Nästan 9 procent: Så långt ligger Nasdaq under sin topp från juni.",
          "Nästan 8 procent: Så kraftigt steg Brentoljan under onsdagen när konflikten i Mellanöstern åter trappades upp.",
          "Dyr olja är inte bara ett problem vid bensinpumpen. Den kan också hålla inflationen uppe, pressa företagens kostnader och göra det svårare för centralbankerna att sänka räntorna.",
        ],
      },
      {
        heading: "Fed höjde inte – men tre ledamöter ville",
        paragraphs: [
          "USA:s centralbank lämnade styrräntan oförändrad på 3,50–3,75 procent.",
          "Det verkligt intressanta var att tre av tolv röstande ledamöter ville höja räntan med 0,25 procentenheter. Det är ett tydligt tecken på att inflationsoron lever – trots marknadens tidigare förhoppningar om lägre räntor.",
        ],
      },
      {
        heading: "Det viktigaste nu",
        paragraphs: [
          "Stockholmsbörsen har inte rasat. Men skyddsnätet ser tunnare ut än i början av veckan.",
          "Om oljepriset stannar på höga nivåer samtidigt som försäljningen av AI- och chipaktier fortsätter kan både räntor och högt värderade aktier hamna under ny press.",
          "Nästa stora test blir hur marknaden tar emot de återstående amerikanska teknikrapporterna – och om torsdagens Stockholmshandel klarar att stå emot den kraftiga nedgången på Wall Street.",
        ],
      },
    ],
  };
