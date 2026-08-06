#!/usr/bin/env node
/**
 * Public experience browser verification for DivLab.
 *
 * Validates public navigation, key pages, SEO signals, Swedish pluralisation,
 * mobile menu behaviour and responsive overflow across viewports.
 *
 * Requires a running Next.js app on APP_URL (default http://localhost:3000).
 * Playwright Chromium must be installed (`npx playwright install chromium`).
 *
 * Screenshots: /opt/cursor/artifacts/screenshots/public-*
 * Report: /opt/cursor/artifacts/public-experience-report.json
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const SHOT_DIR = "/opt/cursor/artifacts/screenshots";
const REPORT_PATH = "/opt/cursor/artifacts/public-experience-report.json";
const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "412", width: 412, height: 915 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
];

mkdirSync(SHOT_DIR, { recursive: true });

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
    return true;
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  assert.ok(
    overflow.scrollWidth <= overflow.clientWidth + 1,
    `horizontal overflow ${overflow.scrollWidth} > ${overflow.clientWidth}`,
  );
}

function assertCanonical(href, expectedPath) {
  const expected =
    expectedPath === "/"
      ? ["https://divlab.se", "https://divlab.se/"]
      : [`https://divlab.se${expectedPath}`];
  assert.ok(
    expected.includes(href ?? ""),
    `canonical ${href} not in ${expected.join(", ")}`,
  );
}

async function assertHasPublicNav(page) {
  const labels = ["Börsnyheter", "Utbildning", "Frihetsmaskinen", "Forum", "Om DivLab"];
  for (const label of labels) {
    const count = await page.getByRole("link", { name: label, exact: true }).count();
    assert.ok(count >= 1, `missing nav link: ${label}`);
  }
}

async function getCanonicalHref(page) {
  return page.locator('link[rel="canonical"]').first().getAttribute("href");
}

async function getJsonLdTypes(page) {
  return page.evaluate(() => {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const types = [];
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "null");
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item && item["@type"]) {
            types.push(item["@type"]);
          }
        }
      } catch {
        // ignore invalid blocks in assertion aggregation
      }
    }
    return types;
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await check("homepage loads with DivLab branding", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await assert.ok(await page.getByRole("heading", { level: 1 }).count());
      const title = await page.title();
      assert.match(title, /DivLab/i);
      await assertHasPublicNav(page);
      const canonical = await getCanonicalHref(page);
      assertCanonical(canonical, "/");
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("WebSite") || types.includes("Organization"));
      await page.screenshot({
        path: `${SHOT_DIR}/public-homepage-desktop.png`,
        fullPage: true,
      });
    });

    await check("homepage mobile has no overflow and usable menu", async () => {
      await page.setViewportSize(VIEWPORTS[0]);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
      const menuButton = page.getByRole("button", { name: /Öppna meny|Stäng meny|Meny/i });
      await menuButton.click();
      await page.getByRole("navigation", { name: /Mobil navigering/i }).waitFor();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);
      const mobileNavVisible = await page
        .getByRole("navigation", { name: /Mobil navigering/i })
        .isVisible()
        .catch(() => false);
      assert.equal(mobileNavVisible, false);
      await page.screenshot({
        path: `${SHOT_DIR}/public-homepage-mobile.png`,
        fullPage: true,
      });
    });

    await check("Börsnyheter listing and pluralisation", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/news`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      const bodyText = await page.locator("body").innerText();
      assert.doesNotMatch(bodyText, /artikelr/i);
      assert.doesNotMatch(bodyText, /Förhandsvisning med exempelartiklar/i);
      assert.match(bodyText, /\d+ artiklar|\d+ artikel/);
      const title = await page.title();
      assert.match(title, /Börsnyheter/);
      const canonical = await getCanonicalHref(page);
      assertCanonical(canonical, "/news");
      await page.screenshot({
        path: `${SHOT_DIR}/public-news-desktop.png`,
        fullPage: true,
      });
      await page.setViewportSize(VIEWPORTS[0]);
      await page.reload({ waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOT_DIR}/public-news-mobile.png`,
        fullPage: true,
      });
    });

    await check("news article page has NewsArticle JSON-LD", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/news`, { waitUntil: "networkidle" });
      const href = await page.locator('a[href^="/news/"]').first().getAttribute("href");
      assert.ok(href);
      await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("NewsArticle"), `types=${types.join(",")}`);
      assert.ok(types.includes("BreadcrumbList"));
      const canonical = await getCanonicalHref(page);
      assert.match(canonical ?? "", /^https:\/\/divlab\.se\/news\//);
    });

    await check("Utbildning listing and article", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/learning`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      const title = await page.title();
      assert.match(title, /Utbildning|aktier|fonder|privatekonomi/i);
      await page.screenshot({
        path: `${SHOT_DIR}/public-learning-desktop.png`,
        fullPage: true,
      });
      await page.setViewportSize(VIEWPORTS[0]);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOT_DIR}/public-learning-mobile.png`,
        fullPage: true,
      });
      await page.setViewportSize(VIEWPORTS[3]);
      const articleHref = await page
        .locator('a[href^="/learning/"]')
        .first()
        .getAttribute("href");
      assert.ok(articleHref);
      await page.goto(`${BASE}${articleHref}`, { waitUntil: "networkidle" });
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("Article"), `types=${types.join(",")}`);
      const relatedVisible = await page
        .getByRole("heading", { name: "Relaterade ämnen" })
        .count();
      assert.ok(
        relatedVisible <= 1,
        `duplicated related topics: ${relatedVisible}`,
      );
    });

    await check("Forum overview and thread shell", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      const response = await page.goto(`${BASE}/forum`, {
        waitUntil: "networkidle",
      });
      assert.equal(response?.ok(), true);
      await assertHasPublicNav(page);
      await page.screenshot({
        path: `${SHOT_DIR}/public-forum-desktop.png`,
        fullPage: true,
      });
      await page.setViewportSize(VIEWPORTS[1]);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOT_DIR}/public-forum-mobile.png`,
        fullPage: true,
      });
    });

    await check("Frihetsmaskinen is public and crawlable content", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/frihetsmaskinen`, { waitUntil: "networkidle" });
      assert.match(await page.title(), /Frihetsmaskinen|ekonomisk frihet/i);
      const bodyText = await page.locator("body").innerText();
      assert.match(bodyText, /ekonomisk frihet|FIRE|kalkyl/i);
      assert.doesNotMatch(await page.url(), /login/);
      const canonical = await getCanonicalHref(page);
      assertCanonical(canonical, "/frihetsmaskinen");
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("WebApplication"));
      await page.screenshot({
        path: `${SHOT_DIR}/public-frihetsmaskinen-desktop.png`,
        fullPage: true,
      });
      await page.setViewportSize(VIEWPORTS[0]);
      await assertNoHorizontalOverflow(page);
      await page.screenshot({
        path: `${SHOT_DIR}/public-frihetsmaskinen-mobile.png`,
        fullPage: true,
      });
    });

    await check("login and registration pages", async () => {
      await page.setViewportSize(VIEWPORTS[0]);
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      assert.match(await page.locator("body").innerText(), /personliga DivLab-miljö|verktyg, forum/i);
      assert.doesNotMatch(await page.locator("body").innerText(), /din portfölj/i);
      await page.screenshot({
        path: `${SHOT_DIR}/public-login-mobile.png`,
        fullPage: true,
      });
      await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
      assert.match(await page.locator("body").innerText(), /forum|kommentarer|kontakter/i);
      await page.screenshot({
        path: `${SHOT_DIR}/public-register-mobile.png`,
        fullPage: true,
      });
    });

    await check("legal and editorial footer links", async () => {
      await page.setViewportSize(VIEWPORTS[3]);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      for (const path of [
        "/terms",
        "/privacy",
        "/cookies",
        "/disclaimer",
        "/editorial",
        "/about",
        "/contact",
      ]) {
        const response = await page.goto(`${BASE}${path}`, {
          waitUntil: "domcontentloaded",
        });
        assert.equal(response?.ok(), true, path);
      }
    });

    await check("404 handling", async () => {
      const response = await page.goto(`${BASE}/this-page-does-not-exist-divlab`, {
        waitUntil: "domcontentloaded",
      });
      assert.ok(response);
      assert.equal(response.status(), 404);
    });

    await check("robots and sitemap production URLs", async () => {
      const robots = await (await page.goto(`${BASE}/robots.txt`)).text();
      assert.match(robots, /Sitemap:\s*https:\/\/divlab\.se\/sitemap\.xml/i);
      assert.doesNotMatch(robots, /Disallow:\s*\/frihetsmaskinen/i);
      const sitemap = await (await page.goto(`${BASE}/sitemap.xml`)).text();
      assert.match(sitemap, /https:\/\/divlab\.se\/frihetsmaskinen/);
      assert.match(sitemap, /https:\/\/divlab\.se\/editorial/);
    });

    for (const viewport of VIEWPORTS) {
      await check(`no overflow on homepage @${viewport.name}`, async () => {
        await page.setViewportSize(viewport);
        await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page);
      });
    }
  } finally {
    await browser.close();
    writeFileSync(
      REPORT_PATH,
      JSON.stringify(
        {
          base: BASE,
          generatedAt: new Date().toISOString(),
          results,
          failed: results.filter((item) => !item.ok).length,
        },
        null,
        2,
      ),
    );
  }

  const failed = results.filter((item) => !item.ok).length;
  if (failed > 0) {
    console.error(`\n${failed} public browser checks failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} public browser checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
