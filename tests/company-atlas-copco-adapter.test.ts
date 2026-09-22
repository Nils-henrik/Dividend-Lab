import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
  ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS,
  ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
  parseAtlasCopcoPressRelease,
  parseAtlasCopcoPressReleaseSitemap,
} from "@/lib/companies/ingestion/adapters/atlas-copco";

const XML = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>/en/media/press-releases/2026/20260920-new-product</loc>
    <lastmod>2026-09-20T08:00:00Z</lastmod>
  </url>
  <url>
    <loc>https://www.atlascopcogroup.com/en/media/press-releases/2026/20260921-acquisition</loc>
    <lastmod>2026-09-21T07:30:00Z</lastmod>
  </url>
  <url>
    <loc>/en/media/press-releases/2026</loc>
    <lastmod>2026-01-01</lastmod>
  </url>
  <url>
    <loc>/en/investors/reports-and-presentations/q2-2026</loc>
    <lastmod>2026-07-01</lastmod>
  </url>
  <url>
    <loc>https://attacker.example/en/media/press-releases/2026/fake</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
</urlset>`;

describe("Atlas Copco press release sitemap adapter", () => {
  it("använder den officiella sitemap-källan och respekterar crawl-delay", () => {
    assert.equal(
      ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
      "https://www.atlascopcogroup.com/en/sitemap.xml",
    );
    assert.equal(ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS, 1_000);
    assert.equal(ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT, 20);
  });

  it("accepterar endast Atlas Copcos pressmeddelanden och sorterar senaste först", () => {
    assert.deepEqual(parseAtlasCopcoPressReleaseSitemap(XML, 2), {
      status: "ok",
      candidates: [
        {
          sourceUrl:
            "https://www.atlascopcogroup.com/en/media/press-releases/2026/20260921-acquisition",
          sourceModifiedAt: "2026-09-21T07:30:00.000Z",
        },
        {
          sourceUrl:
            "https://www.atlascopcogroup.com/en/media/press-releases/2026/20260920-new-product",
          sourceModifiedAt: "2026-09-20T08:00:00.000Z",
        },
      ],
    });
  });

  it("begränsar alltid första upptäckten till högst 20 kandidater", () => {
    const entries = Array.from(
      { length: 25 },
      (_, index) => `
        <url>
          <loc>/en/media/press-releases/2026/item-${index}</loc>
          <lastmod>2026-09-${String((index % 20) + 1).padStart(2, "0")}</lastmod>
        </url>`,
    ).join("");

    const result = parseAtlasCopcoPressReleaseSitemap(
      `<urlset>${entries}</urlset>`,
      100,
    );

    assert.equal(result.status, "ok");
    assert.equal(result.status === "ok" ? result.candidates.length : 0, 20);
  });

  it("failar stängt för fel dokumenttyp och orimligt stor respons", () => {
    assert.deepEqual(parseAtlasCopcoPressReleaseSitemap("<html></html>"), {
      status: "invalid",
      reason: "unexpected_document",
    });
    assert.deepEqual(
      parseAtlasCopcoPressReleaseSitemap(
        `<urlset>${"x".repeat(1_000_001)}</urlset>`,
      ),
      { status: "invalid", reason: "too_large" },
    );
  });
});

describe("Atlas Copco press release detail adapter", () => {
  const sourceUrl =
    "https://www.atlascopcogroup.com/en/media/press-releases/2026/2026-et";

  it("läser endast officiell titel, datum och originallänk", () => {
    const html = `
      <main>
        <h1 class="cmp-title__text">
          Business Area President Power Technique &amp; Operations to retire
        </h1>
        <p class="cmp-pagedate">August 27, 2026</p>
        <div class="cmp-text"><p>Brödtext som inte ska sparas.</p></div>
      </main>`;

    assert.deepEqual(parseAtlasCopcoPressRelease(html, sourceUrl), {
      status: "ok",
      document: {
        documentType: "press_release",
        title:
          "Business Area President Power Technique & Operations to retire",
        sourceUrl,
        sourcePublisher: "Atlas Copco Group",
        publishedAt: "2026-08-27T00:00:00.000Z",
      },
    });
  });

  it("avvisar fel host, felaktigt datum och saknad metadata", () => {
    const validHtml = `
      <h1 class="cmp-title__text">Valid title</h1>
      <p class="cmp-pagedate">August 27, 2026</p>`;
    const invalidDateHtml = `
      <h1 class="cmp-title__text">Valid title</h1>
      <p class="cmp-pagedate">February 31, 2026</p>`;

    assert.deepEqual(
      parseAtlasCopcoPressRelease(
        validHtml,
        "https://attacker.example/en/media/press-releases/2026/fake",
      ),
      { status: "invalid", reason: "invalid_source_url" },
    );
    assert.deepEqual(parseAtlasCopcoPressRelease(invalidDateHtml, sourceUrl), {
      status: "invalid",
      reason: "missing_metadata",
    });
    assert.deepEqual(parseAtlasCopcoPressRelease("<html></html>", sourceUrl), {
      status: "invalid",
      reason: "missing_metadata",
    });
  });
});
