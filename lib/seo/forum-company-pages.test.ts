import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { forumCompanyDirectoryJsonLd } from "@/lib/seo/forum-company-json-ld";
import { STATIC_PUBLIC_PATHS } from "@/lib/seo/sitemap-entries";

const directorySource = readFileSync(
  new URL("../../app/forum/bolag/page.tsx", import.meta.url),
  "utf8",
);
const detailSource = readFileSync(
  new URL("../../app/forum/bolag/[companySlug]/page.tsx", import.meta.url),
  "utf8",
);
const sitemapCompanySource = readFileSync(
  new URL("./sitemap-forum-companies.ts", import.meta.url),
  "utf8",
);

describe("forum company SEO indexing policy", () => {
  it("keeps the company directory indexable with canonical metadata and structured data", () => {
    assert.ok(STATIC_PUBLIC_PATHS.includes("/forum/bolag"));
    assert.match(directorySource, /buildForumMetadata/);
    assert.match(directorySource, /path:\s*"\/forum\/bolag"/);
    assert.match(directorySource, /forumCompanyDirectoryJsonLd/);
    assert.match(directorySource, /breadcrumbJsonLd/);

    const jsonLd = forumCompanyDirectoryJsonLd([
      { name: "Investor", slug: "investor", primaryTicker: "INVE-B" },
      { name: "Nvidia", slug: "nvidia", primaryTicker: "NVDA" },
    ]);

    assert.equal(jsonLd["@type"], "CollectionPage");
    const itemList = jsonLd.mainEntity as Record<string, unknown>;
    assert.equal(itemList["@type"], "ItemList");
    assert.equal(itemList.numberOfItems, 2);
  });

  it("keeps placeholder company detail pages out of the index and sitemap", () => {
    assert.match(detailSource, /index:\s*false/);
    assert.match(detailSource, /follow:\s*true/);
    assert.match(detailSource, /placeholders until company-specific forum content launches/);
    assert.match(sitemapCompanySource, /return \[\];/);
    assert.doesNotMatch(sitemapCompanySource, /from\("forum_companies"\)/);
  });
});
