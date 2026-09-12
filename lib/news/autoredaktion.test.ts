import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  upsertAutoredaktionRegistrySource,
  validateAutoredaktionArticle,
  validateRegistryPreservesBase,
} from "@/lib/news/autoredaktion";
import type { NewsArticle } from "@/types/news";

const NOW = new Date("2026-09-14T08:15:00+02:00");

function validBorssverige(
  overrides: Partial<NewsArticle> = {},
): NewsArticle {
  const article: NewsArticle = {
    id: "borssverige-14-september-2026-test",
    slug: "borssverige-14-september-2026-test",
    title: "BörsSverige 14 september: svenska bolag sätter morgonens agenda",
    summary:
      "Stockholmsbörsen går mot en svensk nyhetsmorgon med nya bolagsbesked och färsk statistik från Sverige.",
    category: "market",
    source: "DivLab Redaktion",
    publishedAt: "2026-09-14T08:10:00+02:00",
    url: "/news/borssverige-14-september-2026-test",
    featured: true,
    imageUrl: null,
    readingMinutes: 4,
    seoTitle: "BörsSverige 14 september: svenska börsen i dag",
    seoDescription:
      "Dagens BörsSverige samlar svenska bolagsbesked, Stockholmsbörsen och svensk makro inför börsöppningen den 14 september 2026.",
    seoKeywords: [
      "BörsSverige",
      "Stockholmsbörsen idag",
      "svenska börsen idag",
      "Sverige börs",
    ],
    internalLinking: {
      topics: ["Stockholmsbörsen", "Sverige", "svensk makro"],
      relatedNewsSlugs: ["borssverige-8-september-2026-skf-vertevo-bostadsmarknaden"],
    },
    showDisclaimer: true,
    intro: [
      "Svenska bolag och svensk makro står i centrum inför måndagens handel på Stockholmsbörsen. Researchen är avgränsad till verifierade svenska besked.",
    ],
    sections: [
      {
        heading: "Svenska bolagsbesked före börsöppning",
        paragraphs: [
          "Flera svenska bolag har lämnat besked inför dagen. Informationen är verifierad före Stockholmsbörsens öppning och ingen kursreaktion för dagens handel anges som fakta.",
        ],
      },
      {
        heading: "SCB och Riksbanken sätter svensk makro i fokus",
        paragraphs: [
          "Svensk statistik från SCB och besked från Riksbanken är viktiga för hur marknaden bedömer räntor, kronan och svenska hushåll.",
        ],
      },
    ],
  };

  return { ...article, ...overrides };
}

function validNorden(overrides: Partial<NewsArticle> = {}): NewsArticle {
  const article: NewsArticle = {
    id: "norden-i-centrum-14-september-2026",
    slug: "norden-i-centrum-14-september-2026",
    title: "Norden i centrum 14 september: nordiska bolag inför börsdagen",
    summary:
      "Sverige, Norge, Danmark och Finland ger flera verifierade bolags- och makrobesked inför den nordiska börsdagen.",
    category: "market",
    source: "DivLab Redaktion",
    publishedAt: "2026-09-14T08:00:00+02:00",
    url: "/news/norden-i-centrum-14-september-2026",
    featured: true,
    imageUrl: null,
    readingMinutes: 5,
    seoTitle: "Norden i centrum 14 september: nordiska börser i dag",
    seoDescription:
      "Dagens Norden i centrum sammanfattar viktiga verifierade nyheter från Sverige, Norge, Danmark och Finland inför börsdagen.",
    seoKeywords: [
      "Norden i centrum",
      "nordiska börser",
      "Oslo Børs",
      "Stockholmsbörsen",
    ],
    internalLinking: {
      topics: ["Norden", "Sverige", "Norge", "Danmark", "Finland"],
      relatedNewsSlugs: ["norden-i-centrum-8-september-2026"],
    },
    showDisclaimer: true,
    intro: [
      "De nordiska marknaderna går in i måndagen med nya besked från Sverige, Norge, Danmark och Finland.",
    ],
    sections: [
      {
        heading: "Sverige och Norge öppnar den nordiska morgonen",
        paragraphs: [
          "Svenska och norska bolagsbesked ger de tydligaste signalerna inför handeln i Stockholm och Oslo.",
        ],
      },
      {
        heading: "Danmark och Finland kompletterar marknadsbilden",
        paragraphs: [
          "Danska och finska besked ger ytterligare nordisk kontext inför handeln i Köpenhamn och Helsingfors.",
        ],
      },
    ],
  };

  return { ...article, ...overrides };
}

function validateBors(
  article: NewsArticle,
  allArticles: NewsArticle[] = [article],
) {
  return validateAutoredaktionArticle(article, "borssverige", {
    allArticles,
    now: NOW,
  });
}

describe("Autoredaktion v1 article validator", () => {
  it("A: accepts a valid BörsSverige article and imageUrl null", () => {
    const article = validBorssverige();
    const result = validateBors(article);
    assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
  });

  it("B: rejects a duplicate slug", () => {
    const article = validBorssverige();
    const duplicate = validBorssverige({ id: "another-id" });
    const result = validateBors(article, [article, duplicate]);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some((issue) => issue.code === "duplicate_slug"),
      true,
    );
  });

  it("D: rejects a missing SEO description", () => {
    const article = validBorssverige({ seoDescription: "" });
    const result = validateBors(article);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some((issue) => issue.code === "missing_seo_description"),
      true,
    );
  });

  it("E: rejects a BörsSverige article dominated by US-market content", () => {
    const article = validBorssverige({
      summary:
        "Wall Street, USA och Nasdaq dominerar morgonen efter nya besked från Federal Reserve och amerikansk makro.",
      intro: [
        "USA står i centrum. Wall Street och Nasdaq följer Federal Reserve medan amerikansk makro, New York och S&P 500 styr berättelsen.",
      ],
      sections: [
        {
          heading: "Wall Street och Nasdaq styr",
          paragraphs: [
            "USA, Wall Street, Nasdaq, S&P 500 och Federal Reserve dominerar. Amerikansk makro och New York är dagens huvudtema.",
            "Asien, Kina och Japan följer USA, medan Nasdaq och Wall Street fortsätter att vara artikelns tydliga huvudfokus.",
          ],
        },
      ],
      seoKeywords: ["Wall Street", "Nasdaq", "USA", "Federal Reserve"],
      internalLinking: { topics: ["USA", "Wall Street"] },
    });
    const result = validateBors(article);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some(
        (issue) => issue.code === "borssverige_foreign_dominance",
      ),
      true,
    );
  });

  it("F: rejects a broken local image path", () => {
    const article = validBorssverige({
      imageUrl: "/news-demo/autoredaktion-file-that-does-not-exist.png",
    });
    const result = validateBors(article);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some((issue) => issue.code === "missing_image_asset"),
      true,
    );
  });

  it("rejects a fabricated present-tense Swedish market reaction before 09:00", () => {
    const article = validBorssverige({
      intro: [
        "Stockholmsbörsen stiger kraftigt i dag samtidigt som svenska bolag står i centrum före öppning.",
      ],
    });
    const result = validateBors(article);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some((issue) => issue.code === "preopen_market_reaction"),
      true,
    );
  });

  it("accepts a valid Norden i centrum article", () => {
    const article = validNorden();
    const result = validateAutoredaktionArticle(article, "norden-i-centrum", {
      allArticles: [article],
      now: NOW,
    });

    assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
  });
});

describe("Autoredaktion v1 registry safety", () => {
  const baseRegistry = `import { DEMO_NEWS_ARTICLES } from "@/data/news-demo";\nimport { applyNewsSearchSeo } from "@/lib/seo/editorial-content";\nimport type { NewsArticle } from "@/types/news";\n\nconst PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [\n  ...DEMO_NEWS_ARTICLES,\n];\n`;

  it("G: registering the same daily article twice is idempotent", () => {
    const entry = {
      exportName: "BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE",
      modulePath: "borssverige-14-september-2026",
    };
    const once = upsertAutoredaktionRegistrySource(baseRegistry, entry);
    const twice = upsertAutoredaktionRegistrySource(once, entry);

    assert.equal(twice, once);
    assert.equal(
      twice.match(/BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE/g)?.length,
      2,
      "one import reference and one published reference expected",
    );
  });

  it("H: Norden first and BörsSverige second preserves both registry entries", () => {
    const withNorden = upsertAutoredaktionRegistrySource(baseRegistry, {
      exportName: "NORDEN_I_CENTRUM_14_SEPTEMBER_2026_ARTICLE",
      modulePath: "norden-i-centrum-14-september-2026",
    });
    const withBoth = upsertAutoredaktionRegistrySource(withNorden, {
      exportName: "BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE",
      modulePath: "borssverige-14-september-2026",
    });

    assert.match(withBoth, /NORDEN_I_CENTRUM_14_SEPTEMBER_2026_ARTICLE/);
    assert.match(withBoth, /BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE/);

    const preservation = validateRegistryPreservesBase(withNorden, withBoth);
    assert.equal(
      preservation.ok,
      true,
      JSON.stringify(preservation.issues, null, 2),
    );
  });

  it("fails closed when a stale write drops an entry from the latest base", () => {
    const latestBase = upsertAutoredaktionRegistrySource(baseRegistry, {
      exportName: "NORDEN_I_CENTRUM_14_SEPTEMBER_2026_ARTICLE",
      modulePath: "norden-i-centrum-14-september-2026",
    });
    const staleBorsWrite = upsertAutoredaktionRegistrySource(baseRegistry, {
      exportName: "BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE",
      modulePath: "borssverige-14-september-2026",
    });
    const result = validateRegistryPreservesBase(latestBase, staleBorsWrite);

    assert.equal(result.ok, false);
    assert.equal(
      result.issues.some((issue) => issue.code === "stale_registry_write"),
      true,
    );
  });
});
