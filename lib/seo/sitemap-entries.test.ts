/**
 * SEO sitemap / robots unit tests.
 * Run via: npm run test:seo
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { learningArticles } from "@/data/learning";
import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-policy";
import {
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
  it("includes homepage, public listings and published article URLs", () => {
    const entries = buildSitemapEntries();
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

  it("only emits https://divlab.se URLs", () => {
    for (const entry of buildSitemapEntries()) {
      assert.match(entry.url, /^https:\/\/divlab\.se(\/|$)/);
      assert.doesNotMatch(entry.url, /vercel\.app|www\.divlab\.se/i);
    }
  });

  it("excludes private, auth and preview routes", () => {
    const urls = buildSitemapEntries().map((entry) => entry.url);

    for (const url of urls) {
      const path = url.slice(PRODUCTION_SITE_ORIGIN.length) || "/";
      for (const prefix of ROBOTS_DISALLOW_PATHS) {
        assert.equal(
          path === prefix || path.startsWith(prefix),
          false,
          `unexpected private route in sitemap: ${url}`,
        );
      }
    }

    assert.equal(
      urls.includes("https://divlab.se/forum/demo-interactions-preview"),
      false,
    );
  });

  it("sets lastModified only from reliable article dates", () => {
    const entries = buildSitemapEntries();
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
  it("sitemap() returns MetadataRoute entries with production URLs", () => {
    const entries = sitemap();
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
