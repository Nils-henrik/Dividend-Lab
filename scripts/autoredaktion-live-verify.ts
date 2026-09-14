import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

import {
  buildAutoredaktionXCopy,
  canonicalArticleUrl,
  canonicalImageUrl,
  seriesFromManagedArticlePath,
} from "@/lib/news/autoredaktion/production-verification";
import type { NewsArticle } from "@/types/news";

const ORIGIN = (process.env.AUTOREDAKTION_LIVE_ORIGIN ?? "https://divlab.se").replace(/\/$/, "");
const ARTICLE_FILE = process.env.AUTOREDAKTION_ARTICLE_FILE?.trim();

function isNewsArticle(value: unknown): value is NewsArticle {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "title" in value &&
      "publishedAt" in value,
  );
}

async function loadArticle(file: string): Promise<NewsArticle> {
  const absolute = path.resolve(file);
  const imported = (await import(
    `${pathToFileURL(absolute).href}?autoredaktionLiveVerify=${Date.now()}`
  )) as Record<string, unknown>;
  const articles = Object.values(imported).filter(isNewsArticle);
  assert.equal(
    articles.length,
    1,
    `Expected exactly one NewsArticle export in ${file}; found ${articles.length}`,
  );
  return articles[0];
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attr(tag: string, name: string): string | null {
  const match = new RegExp(`${name}=["']([^"']*)["']`, "i").exec(tag);
  return match ? decodeHtml(match[1]) : null;
}

function metaContent(html: string, kind: "name" | "property", key: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (attr(tag, kind) === key) return attr(tag, "content");
  }
  return null;
}

function canonicalHref(html: string): string | null {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if ((attr(tag, "rel") ?? "").toLowerCase() === "canonical") {
      return attr(tag, "href");
    }
  }
  return null;
}

function htmlTitle(html: string): string {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? decodeHtml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

async function fetchText(url: string): Promise<{ response: Response; text: string }> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "cache-control": "no-cache",
      "user-agent": "DivLab-Autoredaktion-Live-Verify/1.0",
    },
  });
  const text = await response.text();
  return { response, text };
}

async function verifyHttp(article: NewsArticle) {
  assert.ok(article.slug, "Managed article must have slug");
  assert.equal(article.source, "DivLab Redaktion", "Live article source must be DivLab Redaktion");

  const articleUrl = canonicalArticleUrl(article, ORIGIN);
  const expectedDescription = article.seoDescription ?? article.summary;
  const expectedTitle = article.seoTitle ?? article.title;
  const expectedImage = canonicalImageUrl(article, ORIGIN);

  const articleFetch = await fetchText(articleUrl);
  assert.equal(articleFetch.response.status, 200, `${articleUrl} must return HTTP 200`);
  assert.ok(htmlTitle(articleFetch.text).includes(expectedTitle), "SEO title missing from live HTML");
  assert.equal(
    metaContent(articleFetch.text, "name", "description"),
    expectedDescription,
    "SEO description mismatch",
  );
  assert.equal(canonicalHref(articleFetch.text), articleUrl, "Canonical URL mismatch");
  assert.equal(
    metaContent(articleFetch.text, "property", "og:title"),
    expectedTitle,
    "og:title mismatch",
  );
  assert.equal(
    metaContent(articleFetch.text, "property", "og:description"),
    expectedDescription,
    "og:description mismatch",
  );

  if (expectedImage) {
    assert.ok(article.imageAlt?.trim(), "Generated live image must have accessible alt text");
    assert.equal(
      metaContent(articleFetch.text, "name", "twitter:card"),
      "summary_large_image",
      "twitter:card must be summary_large_image",
    );
    assert.equal(
      metaContent(articleFetch.text, "property", "og:image"),
      expectedImage,
      "og:image mismatch",
    );
    assert.equal(
      metaContent(articleFetch.text, "name", "twitter:image"),
      expectedImage,
      "twitter:image mismatch",
    );

    const imageResponse = await fetch(expectedImage, {
      redirect: "follow",
      headers: { "cache-control": "no-cache" },
    });
    assert.equal(imageResponse.status, 200, `${expectedImage} must return HTTP 200`);
    assert.match(
      imageResponse.headers.get("content-type") ?? "",
      /^image\/png\b/i,
      "Generated cover must be served as image/png",
    );
    const imageBytes = Buffer.from(await imageResponse.arrayBuffer());
    const metadata = await sharp(imageBytes).metadata();
    assert.equal(metadata.format, "png", "Generated cover must decode as PNG");
    assert.equal(metadata.width, 1280, "Generated cover width must be 1280");
    assert.equal(metadata.height, 720, "Generated cover height must be 720");
  }

  const listing = await fetchText(`${ORIGIN}/news`);
  assert.equal(listing.response.status, 200, "/news must return HTTP 200");
  assert.ok(
    listing.text.includes(`/news/${article.slug}`),
    "New article must be present in /news server-rendered HTML",
  );

  return { articleUrl, expectedImage };
}

async function verifyBrowser(article: NewsArticle, articleUrl: string, expectedImage: string | null) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [
      { name: "desktop", width: 1280, height: 800 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      try {
        await page.goto(articleUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.getByRole("heading", { level: 1, name: article.title, exact: true }).waitFor({
          state: "visible",
          timeout: 20_000,
        });
        const publishedTime = page.locator(`time[datetime="${article.publishedAt}"]`).first();
        assert.equal(await publishedTime.count(), 1, `${viewport.name}: published date missing`);
        const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
        assert.equal(canonical, articleUrl, `${viewport.name}: canonical mismatch`);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        assert.ok(
          overflow.scrollWidth <= overflow.clientWidth + 1,
          `${viewport.name}: article has horizontal overflow`,
        );

        if (expectedImage) {
          const hero = page.locator("article figure img").first();
          await hero.waitFor({ state: "visible", timeout: 20_000 });
          assert.equal(
            await hero.getAttribute("alt"),
            article.imageAlt,
            `${viewport.name}: article hero alt mismatch`,
          );
        }

        await page.goto(`${ORIGIN}/news`, { waitUntil: "domcontentloaded", timeout: 45_000 });
        const articleLink = page
          .locator(`a[href="/news/${article.slug}"]`)
          .filter({ hasText: article.title })
          .first();
        await articleLink.waitFor({ state: "visible", timeout: 20_000 });
        const listingOverflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        assert.ok(
          listingOverflow.scrollWidth <= listingOverflow.clientWidth + 1,
          `${viewport.name}: /news has horizontal overflow`,
        );

        if (expectedImage) {
          const row = articleLink.locator("xpath=ancestor::article[1]");
          await row.locator("img").first().waitFor({ state: "visible", timeout: 20_000 });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  assert.ok(ARTICLE_FILE, "AUTOREDAKTION_ARTICLE_FILE is required");
  const series = seriesFromManagedArticlePath(ARTICLE_FILE);
  assert.ok(series, `Unsupported managed article path: ${ARTICLE_FILE}`);
  const article = await loadArticle(ARTICLE_FILE);
  const { articleUrl, expectedImage } = await verifyHttp(article);
  await verifyBrowser(article, articleUrl, expectedImage);

  console.log(
    JSON.stringify(
      {
        ok: true,
        series,
        slug: article.slug,
        articleUrl,
        imageUrl: expectedImage,
        desktop: "PASS",
        mobile: "PASS",
        xText: buildAutoredaktionXCopy(article, series, ORIGIN),
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
