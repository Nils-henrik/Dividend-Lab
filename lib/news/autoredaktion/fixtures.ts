import type { NewsArticle } from "@/types/news";

export const DRY_RUN_NOW = new Date("2026-09-11T08:20:00+02:00");

const BASE_SECTIONS: NewsArticle["sections"] = [
  {
    heading: "Stockholmsbörsen öppnar mot en svensk industri- och makrobild",
    paragraphs: [
      "SKF och den svenska bostadsmarknaden sätter ramen för morgonens BörsSverige. Det är svenska bolagsbesked och svensk statistik som styr urvalet, inte utländska indexrörelser.",
      "Researchen stängdes före öppning på Nasdaq Stockholm. Därför anges inga kursreaktioner för dagens handel som fakta.",
    ],
  },
  {
    heading: "SCB och Riksbanken ger den inhemska bakgrunden",
    paragraphs: [
      "Den preliminära inflationssiffran från SCB är fortsatt låg. Det är relevant för hur investerare läser ränteläget i Sverige, men det är inte ett färdigt räntebesked från Riksbanken.",
      "Bostadsstatistiken från Svensk Mäklarstatistik kompletterar bilden av hushållens aktivitet utan att bli ett resultatbesked för ett enskilt bolag.",
    ],
  },
];

function withCommonFields(
  article: Omit<NewsArticle, "category" | "source" | "featured" | "url"> & {
    slug: string;
  },
): NewsArticle {
  return {
    category: "market",
    source: "DivLab",
    featured: true,
    url: `/news/${article.slug}`,
    showDisclaimer: true,
    ...article,
  };
}

export function validBorssverigeFixture(): NewsArticle {
  return withCommonFields({
    id: "borssverige-11-september-2026-autoredaktion-dry-run",
    slug: "borssverige-11-september-2026-autoredaktion-dry-run",
    title:
      "BörsSverige 11 september: SKF, bostadsmarknaden och låg svensk inflation",
    summary:
      "SKF tar nästa steg i den svenska industristrukturen medan villaförsäljningen och SCB:s preliminära KPIF sätter ramen för Stockholmsbörsen.",
    publishedAt: "2026-09-11T08:20:00+02:00",
    imageUrl: null,
    readingMinutes: 6,
    seoTitle: "BörsSverige 11 september: SKF och bostadsmarknaden",
    seoDescription:
      "SKF, svensk bostadsstatistik och låg preliminär inflation. Här är morgonens viktigaste svenska börsnyheter den 11 september 2026.",
    seoKeywords: [
      "BörsSverige",
      "Stockholmsbörsen idag",
      "svenska aktier",
      "SKF",
      "SCB",
      "Riksbanken",
    ],
    intro: [
      "SKF, den svenska bostadsmarknaden och låg inflation sätter ramen för dagens BörsSverige. Det är svenska händelser som avgör urvalet.",
      "Researchen för den här morgonupplagan stängdes klockan 08.20, före öppning på Nasdaq Stockholm.",
    ],
    sections: BASE_SECTIONS,
  });
}

export function validNordenFixture(): NewsArticle {
  return withCommonFields({
    id: "norden-i-centrum-11-september-2026-autoredaktion-dry-run",
    slug: "norden-i-centrum-11-september-2026-autoredaktion-dry-run",
    title:
      "Norden i centrum – 11 september: Kemira i Helsingborg och BlueNord i Nordsjön",
    summary:
      "Finländska Kemira driver en batteripilot i Sverige medan norska BlueNord lyfter produktionen i den danska Nordsjön.",
    publishedAt: "2026-09-11T08:00:00+02:00",
    imageUrl: null,
    readingMinutes: 6,
    seoTitle: "Norden i centrum 11 september: Kemira och BlueNord",
    seoDescription:
      "Kemira startar järnfosfatpilot i Helsingborg och BlueNord lyfter produktionen. Dagens Norden i centrum den 11 september 2026.",
    seoKeywords: [
      "Norden i centrum",
      "nordiska börser",
      "Kemira",
      "BlueNord",
      "Oslo Børs",
      "Nasdaq Copenhagen",
    ],
    intro: [
      "Norden i centrum samlar morgonens viktigaste nordiska bolagsbesked från Sverige, Norge, Danmark och Finland.",
      "Kemira är noterat i Helsingfors men kör piloten i Helsingborg. BlueNord är noterat i Oslo och producerar i den danska Nordsjön.",
    ],
    sections: [
      {
        heading: "Kemira startar järnfosfatpilot i Helsingborg",
        paragraphs: [
          "Finländska Kemira har startat pilotproduktion av järnfosfat i Helsingborg. Det är ett nordiskt industribesked med tydlig svensk placering.",
          "Bolaget har inte fattat beslut om en fullskalig fabrik. Nästa steg är kundtester och processvalidering.",
        ],
      },
      {
        heading: "BlueNord lyfter produktionen i den danska Nordsjön",
        paragraphs: [
          "Norska BlueNord rapporterar högre augustiproduktion från Danish Underground Consortium. Tyra satte ett nytt dagsrekord.",
          "Det är ett norskt börsbolag med dansk energiproduktion, inte en generic världsmarknadsnotis.",
        ],
      },
    ],
  });
}

export function missingSeoDescriptionFixture(): NewsArticle {
  const article = validBorssverigeFixture();
  return {
    ...article,
    id: "borssverige-11-september-2026-missing-seo",
    slug: "borssverige-11-september-2026-missing-seo",
    url: "/news/borssverige-11-september-2026-missing-seo",
    seoDescription: "",
  };
}

export function usaDominatedBorssverigeFixture(): NewsArticle {
  return withCommonFields({
    id: "borssverige-11-september-2026-usa-dominated",
    slug: "borssverige-11-september-2026-usa-dominated",
    title: "BörsSverige: Wall Street och Nasdaq styr natten",
    summary:
      "USA-börsen rusade efter Federal Reserve-spekulationer. S&P 500, Dow Jones och Nasdaq tog över nyhetsflödet medan Asien följde med Tokyo och Shanghai.",
    publishedAt: "2026-09-11T08:20:00+02:00",
    imageUrl: null,
    seoTitle: "Wall Street och Nasdaq: S&P 500 leder USA-börsen",
    seoDescription:
      "Federal Reserve, Nvidia och Wall Street satte tonen. Nasdaq och S&P 500 steg medan Tokyo och Shanghai följde den amerikanska rörelsen.",
    seoKeywords: ["Wall Street", "Nasdaq", "S&P 500", "Federal Reserve", "USA-börsen"],
    intro: [
      "Natten tillhörde Wall Street. Nasdaq och S&P 500 steg efter nya AI-besked från amerikanska bolag.",
      "I Asien följde Tokyo och Shanghai samma amerikanska riskvilja. Inget av urvalet gäller den inhemska handelsdagen.",
    ],
    sections: [
      {
        heading: "Federal Reserve och Wall Street sätter agendan",
        paragraphs: [
          "Federal Reserve-spekulationerna drev USA-börsen. Dow Jones och NYSE-handeln blev huvudnumret.",
          "Nasdaq-lyftet förklaras med amerikanska teknikbolag och AI-handeln på Wall Street.",
        ],
      },
      {
        heading: "Tokyo och Shanghai kopierar den amerikanska rörelsen",
        paragraphs: [
          "Hang Seng, Nikkei och Shanghai öppnade mot samma global markets-tema.",
          "World market-narrativet lämnar inte rum för bolag eller makro från den inhemska marknaden.",
        ],
      },
    ],
  });
}

export function brokenImageFixture(): NewsArticle {
  const article = validBorssverigeFixture();
  return {
    ...article,
    id: "borssverige-11-september-2026-broken-image",
    slug: "borssverige-11-september-2026-broken-image",
    url: "/news/borssverige-11-september-2026-broken-image",
    imageUrl: "/news-demo/this-file-does-not-exist-autoredaktion.png",
  };
}

export function duplicateSlugFixture(existingSlug: string): NewsArticle {
  const article = validBorssverigeFixture();
  return {
    ...article,
    id: "borssverige-11-september-2026-duplicate-slug",
    slug: existingSlug,
    url: `/news/${existingSlug}`,
  };
}

export const INVALID_TYPESCRIPT_SNIPPET = `
type NewsArticleLike = { id: string; slug: string; title: string };

export const BROKEN_TODAY_ARTICLE: NewsArticleLike = {
  id: 291,
  slug: null,
  title: undefined,
};
`;
