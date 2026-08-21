import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getRelatedContentForNewsArticle } from "@/lib/news/internal-links";
import type { NewsArticle } from "@/types/news";

function newsArticle(
  slug: string,
  overrides: Partial<NewsArticle> = {},
): NewsArticle {
  return {
    id: slug,
    slug,
    title: slug,
    summary: `Sammanfattning för ${slug}`,
    category: "company",
    source: "DivLab",
    publishedAt: "2026-08-21T08:00:00+02:00",
    url: `/news/${slug}`,
    featured: false,
    ...overrides,
  };
}

function learningArticle(
  slug: string,
  title: string,
  description: string,
) {
  return {
    slug,
    title,
    description,
    excerpt: description,
  };
}

describe("getRelatedContentForNewsArticle", () => {
  it("prioritizes explicit editorial relationships and ignores missing/self slugs", () => {
    const current = newsArticle("current", {
      internalLinking: {
        relatedNewsSlugs: ["target", "missing", "current"],
      },
    });
    const target = newsArticle("target", { title: "Målsidan" });
    const unrelated = newsArticle("unrelated", {
      title: "Helt annat ämne",
      summary: "Ingen gemensam signal finns här.",
    });

    const links = getRelatedContentForNewsArticle(current, {
      newsArticles: [current, unrelated, target],
      learningArticles: [],
    });

    assert.equal(links[0]?.href, "/news/target");
    assert.equal(links.some((link) => link.href === "/news/current"), false);
    assert.equal(links.some((link) => link.href === "/news/missing"), false);
  });

  it("matches a shared company signal but not an unrelated article that only shares Q2", () => {
    const current = newsArticle("latour-q2", {
      title: "Latour växlar upp i Q2",
      seoKeywords: ["Latour", "Latour Q2", "Q2 2026"],
    });
    const latour = newsArticle("latour-analys", {
      title: "Latour och substansvärdet",
      seoKeywords: ["Latour", "substansvärde"],
    });
    const bahnhof = newsArticle("bahnhof-q2", {
      title: "Bahnhof rapporterar Q2",
      seoKeywords: ["Bahnhof", "Q2 2026"],
    });

    const links = getRelatedContentForNewsArticle(current, {
      newsArticles: [current, bahnhof, latour],
      learningArticles: [],
    });

    assert.equal(links.some((link) => link.href === "/news/latour-analys"), true);
    assert.equal(links.some((link) => link.href === "/news/bahnhof-q2"), false);
  });

  it("connects report news to the quarterly-report Learning guide", () => {
    const current = newsArticle("bolag-q2", {
      title: "Bolaget släpper Q2-rapport",
      summary: "Kvartalsrapporten visar högre omsättning och marginal.",
    });

    const links = getRelatedContentForNewsArticle(current, {
      newsArticles: [current],
      learningArticles: [
        learningArticle(
          "sa-laser-du-en-kvartalsrapport",
          "Så läser du en kvartalsrapport",
          "Lär dig förstå rapport, omsättning, marginal och kassaflöde.",
        ),
        learningArticle(
          "fire-ekonomisk-frihet",
          "FIRE och ekonomisk frihet",
          "En guide om sparkvot och långsiktigt sparande.",
        ),
      ],
    });

    assert.equal(
      links.some(
        (link) => link.href === "/learning/sa-laser-du-en-kvartalsrapport",
      ),
      true,
    );
    assert.equal(
      links.some((link) => link.href === "/learning/fire-ekonomisk-frihet"),
      false,
    );
  });

  it("fails closed when there is no meaningful relevance signal", () => {
    const current = newsArticle("bioteknik", {
      title: "Nytt forskningsresultat inom bioteknik",
      summary: "Studien gäller en ny laboratoriemetod.",
    });
    const unrelated = newsArticle("fastighet", {
      title: "Fastighetsbolag säljer kontor",
      summary: "Transaktionen gäller en kontorsfastighet i Göteborg.",
    });

    const links = getRelatedContentForNewsArticle(current, {
      newsArticles: [current, unrelated],
      learningArticles: [
        learningArticle(
          "ranta-pa-ranta",
          "Ränta på ränta",
          "Så växer långsiktigt sparande över tid.",
        ),
      ],
    });

    assert.deepEqual(links, []);
  });

  it("respects the requested result limit", () => {
    const current = newsArticle("current", {
      internalLinking: {
        relatedNewsSlugs: ["a", "b", "c"],
        relatedLearningSlugs: ["guide"],
      },
    });

    const links = getRelatedContentForNewsArticle(current, {
      newsArticles: [
        current,
        newsArticle("a"),
        newsArticle("b"),
        newsArticle("c"),
      ],
      learningArticles: [
        learningArticle("guide", "Guide", "En uttryckligen relaterad guide."),
      ],
      limit: 2,
    });

    assert.equal(links.length, 2);
  });
});
