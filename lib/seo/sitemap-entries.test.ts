/**
 * SEO sitemap / robots unit tests.
 * Run via: npm run test:seo
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { learningArticles } from "@/data/learning";
import { MODEL_PORTFOLIO_INDEXABLE_PATHS } from "@/lib/model-portfolios/public";
import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-policy";
import {
  REQUIRED_INDEXABLE_PRODUCT_PATHS,
  STATIC_PUBLIC_PATHS,
  buildSitemapEntries,
} from "@/lib/seo/sitemap-entries";
import { PRODUCTION_SITE_ORIGIN, absoluteUrl } from "@/lib/seo/site";

describe("absoluteUrl", () => {
  it("uses the canonical production origin", () => {
    assert.equal(PRODUCTION_SITE_ORIGIN, "https://divlab.se");
    assert.equal(absoluteUrl("/"), "https://divlab.se");
    assert.equal(absoluteUrl("/news"), "https://divlab.se/news");
    assert.equal(absoluteUrl("learning"), "https://divlab.se/learning");
  });
});

describe("buildSitemapEntries", () => {
  it("includes homepage, public listings and published article URLs", async () => {
    const entries = await buildSitemapEntries();
    const urls = new Set(entries.map((entry) => entry.url));

    for (const path of STATIC_PUBLIC_PATHS) {
      assert.ok(urls.has(absoluteUrl(path)), `missing static path ${path}`);
    }

    for (const article of getNewsArticlesWithSlug()) {
      assert.ok(
        article.slug,
        "news articles in sitemap source must have a slug",
      );
      assert.ok(
        urls.has(absoluteUrl(`/news/${article.slug}`)),
        `missing news article ${article.slug}`,
      );
    }

    for (const article of learningArticles) {
      assert.ok(
        urls.has(absoluteUrl(`/learning/${article.slug}`)),
        `missing learning article ${article.slug}`,
      );
    }
  });

  it("includes the public AI portfolio product routes", async () => {
    const entries = await buildSitemapEntries();
    const urls = new Set(entries.map((entry) => entry.url));

    for (const path of MODEL_PORTFOLIO_INDEXABLE_PATHS) {
      assert.ok(
        STATIC_PUBLIC_PATHS.includes(
          path as (typeof STATIC_PUBLIC_PATHS)[number],
        ),
        `portfolio path missing from STATIC_PUBLIC_PATHS: ${path}`,
      );
      assert.ok(
        REQUIRED_INDEXABLE_PRODUCT_PATHS.includes(
          path as (typeof REQUIRED_INDEXABLE_PRODUCT_PATHS)[number],
        ),
        `portfolio path missing from REQUIRED_INDEXABLE_PRODUCT_PATHS: ${path}`,
      );
      assert.ok(urls.has(absoluteUrl(path)), `missing portfolio path ${path}`);
    }
  });

  it("only emits https://divlab.se URLs", async () => {
    for (const entry of await buildSitemapEntries()) {
      assert.match(entry.url, /^https:\/\/divlab\.se(\/|$)/);
      assert.doesNotMatch(entry.url, /vercel\.app|www\.divlab\.se/i);
    }
  });

  it("excludes private, auth and preview routes", async () => {
    const urls = (await buildSitemapEntries()).map((entry) => entry.url);

    for (const url of urls) {
      const path = url.slice(PRODUCTION_SITE_ORIGIN.length) || "/";
      for (const prefix of ROBOTS_DISALLOW_PATHS) {
        // Match exact path or a true path-segment prefix so /portfolio does not
        // falsely exclude the public /portfolios product hub.
        const isPrivate =
          path === prefix ||
          path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
        assert.equal(
          isPrivate,
          false,
          `unexpected private route in sitemap: ${url}`,
        );
      }
    }

    assert.equal(
      urls.includes("https://divlab.se/forum/demo-interactions-preview"),
      false,
    );
    assert.ok(urls.includes("https://divlab.se/portfolios"));
  });

  it("sets lastModified only from reliable article dates", async () => {
    const entries = await buildSitemapEntries();
    const newsWithDates = getNewsArticlesWithSlug().filter((article) =>
      Boolean(article.publishedAt),
    );

    for (const article of newsWithDates) {
      const entry = entries.find(
        (item) => item.url === absoluteUrl(`/news/${article.slug}`),
      );
      assert.ok(entry);
      assert.ok(entry.lastModified instanceof Date);
      assert.equal(
        entry.lastModified?.toISOString(),
        new Date(article.publishedAt).toISOString(),
      );
    }

    const staticHome = entries.find((entry) => entry.url === absoluteUrl("/"));
    assert.ok(staticHome);
    assert.equal(staticHome.lastModified, undefined);
  });
});

describe("Next.js metadata routes", () => {
  it("sitemap() returns MetadataRoute entries with production URLs", async () => {
    const entries = await sitemap();
    assert.ok(entries.length >= STATIC_PUBLIC_PATHS.length);
    assert.ok(
      entries.every((entry) => entry.url.startsWith("https://divlab.se")),
    );
  });

  it("robots() allows public crawling and references the production sitemap", () => {
    const config = robots();
    assert.equal(config.sitemap, "https://divlab.se/sitemap.xml");
    assert.equal(config.host, "https://divlab.se");

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    assert.ok(rules);
    assert.equal(rules.userAgent, "*");
    assert.equal(rules.allow, "/");

    const disallow = Array.isArray(rules.disallow)
      ? rules.disallow
      : [rules.disallow];

    for (const path of ROBOTS_DISALLOW_PATHS) {
      assert.ok(disallow.includes(path), `robots missing disallow ${path}`);
    }
  });
});
