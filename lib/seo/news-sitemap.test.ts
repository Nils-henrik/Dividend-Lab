import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { NewsArticle } from "@/types/news";
import {
  buildGoogleNewsSitemapEntries,
  renderGoogleNewsSitemap,
} from "@/lib/seo/news-sitemap";

function article(overrides: Partial<NewsArticle>): NewsArticle {
  return {
    id: "test",
    slug: "test",
    title: "Test & börs <nyhet>",
    summary: "Test",
    category: "market",
    source: "DivLab",
    publishedAt: "2026-08-12T08:00:00+02:00",
    url: "/news/test",
    featured: false,
    ...overrides,
  };
}

describe("Google News sitemap", () => {
  it("only includes articles published during the latest 48 hours", () => {
    const now = new Date("2026-08-12T10:00:00+02:00");
    const entries = buildGoogleNewsSitemapEntries(
      [
        article({ slug: "fresh", publishedAt: "2026-08-12T08:00:00+02:00" }),
        article({ slug: "boundary", publishedAt: "2026-08-10T10:00:00+02:00" }),
        article({ slug: "old", publishedAt: "2026-08-10T09:59:59+02:00" }),
        article({ slug: "future", publishedAt: "2026-08-12T10:01:00+02:00" }),
      ],
      now,
    );

    assert.deepEqual(
      entries.map((entry) => entry.url),
      ["https://divlab.se/news/fresh", "https://divlab.se/news/boundary"],
    );
  });

  it("renders Google News XML with the DivLab publication and escaped titles", () => {
    const entries = buildGoogleNewsSitemapEntries(
      [article({})],
      new Date("2026-08-12T10:00:00+02:00"),
    );
    const xml = renderGoogleNewsSitemap(entries);

    assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
    assert.match(xml, /<news:name>DivLab<\/news:name>/);
    assert.match(xml, /<news:language>sv<\/news:language>/);
    assert.match(xml, /Test &amp; börs &lt;nyhet&gt;/);
    assert.match(xml, /https:\/\/divlab\.se\/news\/test/);
  });
});
