import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { learningArticles } from "@/data/learning";
import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import {
  DIVLAB_EDITORIAL_AUTHOR,
  LEARNING_SEO_OVERRIDES,
} from "@/lib/seo/editorial-content";

describe("editorial search SEO", () => {
  it("normalizes every published news article with a unique search title and snippet", () => {
    const articles = getNewsArticlesWithSlug();
    const titles = new Set<string>();

    // News articles may carry approved article-native SEO metadata or receive a
    // legacy search override. The effective published output is the contract;
    // requiring one override row per article rejects valid native metadata.
    for (const article of articles) {
      assert.ok(article.slug);
      assert.ok(article.seoTitle?.trim(), `missing seoTitle: ${article.slug}`);
      assert.ok(
        article.seoDescription?.trim(),
        `missing seoDescription: ${article.slug}`,
      );
      assert.doesNotMatch(article.seoTitle ?? "", /\|\s*DivLab/i);
      assert.equal(
        titles.has(article.seoTitle as string),
        false,
        `duplicate seoTitle: ${article.seoTitle}`,
      );
      titles.add(article.seoTitle as string);
    }
  });

  it("normalizes the full Learning library with search copy, author and internal links", () => {
    const publishedSlugs = new Set(learningArticles.map((article) => article.slug));

    for (const article of learningArticles) {
      assert.ok(article.seoTitle?.trim(), `missing seoTitle: ${article.slug}`);
      assert.ok(article.description.trim(), `missing description: ${article.slug}`);
      assert.equal(article.authorName, DIVLAB_EDITORIAL_AUTHOR);
      assert.ok(
        (article.relatedArticleSlugs?.length ?? 0) >= 3,
        `too few related links: ${article.slug}`,
      );

      for (const relatedSlug of article.relatedArticleSlugs ?? []) {
        assert.notEqual(relatedSlug, article.slug);
        assert.ok(
          publishedSlugs.has(relatedSlug),
          `unknown related learning slug ${relatedSlug} from ${article.slug}`,
        );
      }
    }

    // Overrides remain supported for legacy articles, but an article may also
    // carry complete, approved SEO metadata and related links natively.
    assert.ok(Object.keys(LEARNING_SEO_OVERRIDES).length <= learningArticles.length);
  });

  it("uses search-intent language for the two daily market series", () => {
    const news = getNewsArticlesWithSlug();
    const borssverige = news.find(
      (article) => article.slug === "borssverige-12-augusti-2026",
    );
    const norden = news.find(
      (article) => article.slug === "norden-i-centrum-12-augusti-2026",
    );

    assert.match(borssverige?.seoTitle ?? "", /^Börsen idag /);
    assert.match(norden?.seoTitle ?? "", /^Nordiska börsen /);
  });
});
