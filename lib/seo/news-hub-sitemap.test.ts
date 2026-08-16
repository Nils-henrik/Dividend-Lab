import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";
import { absoluteUrl } from "@/lib/seo/site";

function articleModifiedAt(article: ReturnType<typeof getNewsArticlesWithSlug>[number]): Date | undefined {
  for (const value of [article.updatedAt, article.publishedAt]) {
    if (!value?.trim()) {
      continue;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

describe("news hub sitemap freshness", () => {
  it("sets /news lastModified to the freshest published article change", async () => {
    const expected = getNewsArticlesWithSlug()
      .map(articleModifiedAt)
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    assert.ok(expected, "expected at least one dated news article");

    const entries = await buildSitemapEntries();
    const newsHub = entries.find((entry) => entry.url === absoluteUrl("/news"));

    assert.ok(newsHub, "missing /news sitemap entry");
    assert.ok(newsHub.lastModified instanceof Date);
    assert.equal(newsHub.lastModified.toISOString(), expected.toISOString());
  });
});
