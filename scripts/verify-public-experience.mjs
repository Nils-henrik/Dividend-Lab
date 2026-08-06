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
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "412", width: 412, height: 915 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "wide", width: 1536, height: 960 },
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

async function assertStickyPanelClearsHeader(page, panelSelector) {
  const panel = page.locator(panelSelector);
  await panel.waitFor();
  await panel.evaluate((element) => {
    const documentTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: Math.max(0, documentTop - 96 + 1),
      behavior: "instant",
    });
  });
  await page.waitForTimeout(100);

  const geometry = await page.evaluate((selector) => {
    const header = document.querySelector(".divlab-shell-header");
    const resultPanel = document.querySelector(selector);
    if (!header) {
      throw new Error("public header not found");
    }
    if (!resultPanel) {
      throw new Error(`result panel not found: ${selector}`);
    }
    const headerRect = header.getBoundingClientRect();
    const panelRect = resultPanel.getBoundingClientRect();
    const styles = getComputedStyle(resultPanel);
    return {
      headerBottom: headerRect.bottom,
      headerSafeBottom: Math.max(headerRect.bottom, headerRect.height),
      panelTop: panelRect.top,
      position: styles.position,
      stickyTop: Number.parseFloat(styles.top),
    };
  }, panelSelector);

  assert.equal(geometry.position, "sticky");
  assert.equal(geometry.stickyTop, 96);
  assert.ok(
    geometry.panelTop <= geometry.stickyTop + 1,
    `panel did not reach sticky position: top=${geometry.panelTop}, expected=${geometry.stickyTop}`,
  );
  assert.ok(
    geometry.panelTop >= geometry.headerSafeBottom + 8,
    `sticky panel overlaps header: panel top=${geometry.panelTop}, header-safe bottom=${geometry.headerSafeBottom}`,
  );

  return geometry.panelTop - geometry.headerSafeBottom;
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
  const labels = ["Börsnyheter", "Utbildning", "Verktyg", "Forum", "Om DivLab"];
  for (const label of labels) {
    const count = await page.getByRole("link", { name: label, exact: true }).count();
    assert.ok(count >= 1, `missing nav link: ${label}`);
  }
  assert.ok(
    (await page.getByRole("link", { name: "Logga in", exact: true }).count()) >= 1,
    "missing Logga in",
  );
  assert.ok(
    (await page.getByRole("link", { name: "Skapa konto", exact: true }).count()) >= 1,
    "missing Skapa konto",
  );
}

function assertNoObsoletePublicCopy(bodyText) {
  assert.doesNotMatch(bodyText, /Förhandsvisning med exempelartiklar/i);
  assert.doesNotMatch(bodyText, /artikelr/i);
  assert.doesNotMatch(bodyText, /ett lugn perspektiv/i);
  assert.doesNotMatch(
    bodyText,
    /demonstrationsexempel,\s*redaktionellt förberedda exempelartiklar/i,
  );
  assert.doesNotMatch(bodyText, /exempelinnehåll som aktuella verifierade nyheter/i);
}

async function assertNoAuthenticatedSidebar(page) {
  const sidebar = page.getByRole("navigation", {
    name: /Applikationsnavigering|Huvudnavigering i appen|Kontoöversikt/i,
  });
  assert.equal(await sidebar.count(), 0);
  const bodyText = await page.locator("body").innerText();
  assert.doesNotMatch(bodyText, /Bevakningslista|Portföljöversikt|Min dashboard/i);
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
      await page.setViewportSize(VIEWPORTS[4]);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      await assert.ok(await page.getByRole("heading", { level: 1 }).count());
      const title = await page.title();
      assert.match(title, /DivLab/i);
      await assertHasPublicNav(page);
      assertNoObsoletePublicCopy(await page.locator("body").innerText());
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
      await page.setViewportSize(VIEWPORTS[4]);
      await page.goto(`${BASE}/news`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      await assertNoAuthenticatedSidebar(page);
      const bodyText = await page.locator("body").innerText();
      assertNoObsoletePublicCopy(bodyText);
      assert.match(bodyText, /\d+ artiklar|\d+ artikel(?!r)/);
      assert.match(bodyText, /Frihetsmaskinen/);
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
      await page.setViewportSize(VIEWPORTS[4]);
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
      await page.setViewportSize(VIEWPORTS[4]);
      await page.goto(`${BASE}/learning`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      await assertNoAuthenticatedSidebar(page);
      const title = await page.title();
      assert.match(title, /aktier/i);
      assert.match(title, /fonder/i);
      assert.match(title, /privatekonomi/i);
      const listingText = await page.locator("body").innerText();
      assertNoObsoletePublicCopy(listingText);
      assert.match(listingText, /Frihetsmaskinen/);
      const listingCanonical = await getCanonicalHref(page);
      assertCanonical(listingCanonical, "/learning");
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

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(
          `${BASE}/learning/ta-kontroll-over-premiepensionen`,
          { waitUntil: "domcontentloaded" },
        );
        await assertNoHorizontalOverflow(page);
        const bodyText = await page.locator("body").innerText();
        assertNoObsoletePublicCopy(bodyText);
        assert.match(bodyText, /ett lugnt perspektiv/i);
        assert.doesNotMatch(bodyText, /Supabase|Failed to fetch|error loading/i);
        const relatedHeadings = page.getByRole("heading", {
          name: "Relaterade ämnen",
        });
        const relatedCount = await relatedHeadings.count();
        let relatedVisible = 0;
        for (let index = 0; index < relatedCount; index += 1) {
          if (await relatedHeadings.nth(index).isVisible()) {
            relatedVisible += 1;
          }
        }
        assert.equal(
          relatedVisible,
          1,
          `expected one visible Relaterade ämnen @${viewport.name}, got ${relatedVisible}`,
        );
        if (viewport.name === "1280") {
          await page.screenshot({
            path: `${SHOT_DIR}/public-premiepension-desktop.png`,
            fullPage: true,
          });
        }
        if (viewport.name === "390") {
          await page.screenshot({
            path: `${SHOT_DIR}/public-premiepension-mobile.png`,
            fullPage: true,
          });
        }
      }

      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("Article"), `types=${types.join(",")}`);
    });

    await check("Forum overview and thread shell", async () => {
      await page.setViewportSize(VIEWPORTS[4]);
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
      await page.setViewportSize(VIEWPORTS[4]);
      const response = await page.goto(`${BASE}/frihetsmaskinen`, {
        waitUntil: "networkidle",
      });
      assert.equal(response?.status(), 200);
      assert.match(await page.title(), /Frihetsmaskinen|ekonomisk frihet/i);
      await assertHasPublicNav(page);
      const bodyText = await page.locator("body").innerText();
      assertNoObsoletePublicCopy(bodyText);
      assert.match(bodyText, /ekonomisk frihet|FIRE|kalkyl/i);
      assert.match(bodyText, /Vad verktyget gör|Begränsningar|Lär dig mer/i);
      assert.match(bodyText, /Skapa konto/);
      assert.doesNotMatch(await page.url(), /login/);
      const canonical = await getCanonicalHref(page);
      assertCanonical(canonical, "/frihetsmaskinen");
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("WebApplication"));

      const capitalInput = page.getByLabel("Nuvarande kapital");
      await capitalInput.waitFor();
      const before = await page.locator("body").innerText();
      await capitalInput.fill("900000 kr");
      await page.waitForTimeout(300);
      const after = await page.locator("body").innerText();
      assert.notEqual(
        before,
        after,
        "Frihetsmaskinen results did not update after input change",
      );

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

    await check("tools hub is public, canonical and links both calculators", async () => {
      await page.setViewportSize(VIEWPORTS[4]);
      const response = await page.goto(`${BASE}/verktyg`, {
        waitUntil: "networkidle",
      });
      assert.equal(response?.status(), 200);
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.match(await page.title(), /Verktyg för sparande och investeringar/);
      assertCanonical(await getCanonicalHref(page), "/verktyg");
      await assertHasPublicNav(page);
      assert.equal(
        await page.locator('a[href="/frihetsmaskinen"]').count() >= 1,
        true,
      );
      assert.equal(
        await page.locator('a[href="/verktyg/gav-kalkylator"]').count() >= 1,
        true,
      );
      await page.screenshot({
        path: `${SHOT_DIR}/public-tools-hub-desktop.png`,
        fullPage: true,
      });
    });

    await check("GAV calculator works, persists, exports and prints", async () => {
      await page.setViewportSize(VIEWPORTS[4]);
      const response = await page.goto(`${BASE}/verktyg/gav-kalkylator`, {
        waitUntil: "networkidle",
      });
      assert.equal(response?.status(), 200);
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.match(await page.title(), /GAV-kalkylator/);
      assertCanonical(
        await getCanonicalHref(page),
        "/verktyg/gav-kalkylator",
      );
      assert.doesNotMatch(await page.url(), /login/);
      const bodyText = await page.locator("body").innerText();
      assert.match(bodyText, /Vad är GAV\?/);
      assert.match(bodyText, /Så räknar du ut GAV/);
      assert.match(bodyText, /Fortsätt i din DivLab-miljö/);
      const types = await getJsonLdTypes(page);
      assert.ok(types.includes("WebApplication"));
      assert.ok(types.includes("BreadcrumbList"));
      const freeOffer = await page.evaluate(() => {
        const scripts = [
          ...document.querySelectorAll('script[type="application/ld+json"]'),
        ];
        return scripts.some((script) => {
          const data = JSON.parse(script.textContent || "null");
          const items = Array.isArray(data) ? data : [data];
          return items.some(
            (item) =>
              item?.["@type"] === "WebApplication" &&
              item?.offers?.price === "0" &&
              item?.offers?.priceCurrency === "SEK",
          );
        });
      });
      assert.equal(freeOffer, true);

      await page.getByRole("button", { name: "Ladda exempel" }).click();
      await page
        .getByText("2\u00a0028,00 kr", { exact: true })
        .first()
        .waitFor();
      await page.getByText("67,60 kr", { exact: true }).first().waitFor();

      await page.reload({ waitUntil: "networkidle" });
      await page
        .getByText("2\u00a0028,00 kr", { exact: true })
        .first()
        .waitFor();

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Exportera CSV" }).click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), "gav-berakning.csv");

      await page.emulateMedia({ media: "print" });
      const printState = await page.evaluate(() => ({
        editor: getComputedStyle(document.querySelector(".gav-editor")).display,
        printHeading: getComputedStyle(
          document.querySelector(".gav-print-root .print\\:block"),
        ).display,
      }));
      assert.equal(printState.editor, "none");
      assert.notEqual(printState.printHeading, "none");
      await page.emulateMedia({ media: "screen" });

      await page.getByRole("button", { name: "Rensa allt" }).click();
      await page.getByRole("button", { name: "Ja, rensa" }).click();
      await page.reload({ waitUntil: "networkidle" });
      assert.match(
        await page.locator("body").innerText(),
        /Lägg till minst ett innehav eller en händelse/,
      );

      await page.screenshot({
        path: `${SHOT_DIR}/public-gav-calculator-desktop.png`,
        fullPage: true,
      });
    });

    await check("GAV target mode and mobile layouts are usable", async () => {
      await page.setViewportSize(VIEWPORTS[0]);
      await page.goto(`${BASE}/verktyg/gav-kalkylator`, {
        waitUntil: "networkidle",
      });
      await page.getByRole("tab", { name: "Händelser" }).focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.getByRole("tab", { name: "Mål-GAV" }).getAttribute(
          "aria-selected",
        ),
        "true",
      );
      await page.getByLabel("Nuvarande antal").fill("100");
      await page.getByLabel("Nuvarande GAV").fill("120");
      await page.getByLabel("Köppris per aktie").fill("80");
      await page.getByLabel("Courtage för köpet").fill("19");
      await page.getByLabel("Önskat GAV").fill("100");
      await page.getByText("101", { exact: true }).waitFor();
      await page.getByText("100,00 kr", { exact: true }).waitFor();

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await assertNoHorizontalOverflow(page);
        await page.goto(`${BASE}/verktyg`, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page);
        await page.goto(`${BASE}/verktyg/gav-kalkylator`, {
          waitUntil: "networkidle",
        });
        await assertNoHorizontalOverflow(page);
      }

      await page.setViewportSize(VIEWPORTS[0]);
      await page.screenshot({
        path: `${SHOT_DIR}/public-gav-calculator-mobile.png`,
        fullPage: true,
      });
    });

    await check("GAV desktop result panels stay below the sticky header", async () => {
      const desktopViewports = VIEWPORTS.filter(
        (viewport) => viewport.width === 1280 || viewport.width === 1536,
      );
      const margins = [];

      for (const viewport of desktopViewports) {
        await page.setViewportSize(viewport);
        await page.goto(`${BASE}/verktyg/gav-kalkylator`, {
          waitUntil: "networkidle",
        });
        await page.getByRole("tab", { name: "Händelser" }).click();
        await page.getByRole("button", { name: "Ladda exempel" }).click();
        await page
          .locator('[data-gav-result-panel="events"]')
          .waitFor();
        await assertNoHorizontalOverflow(page);
        const eventMargin = await assertStickyPanelClearsHeader(
          page,
          '[data-gav-result-panel="events"]',
        );
        await assertNoHorizontalOverflow(page);
        await page.screenshot({
          path: `${SHOT_DIR}/public-gav-sticky-events-${viewport.width}.png`,
          fullPage: false,
        });

        await page.getByRole("tab", { name: "Mål-GAV" }).click();
        const targetValues = [
          ["Nuvarande antal", "100"],
          ["Nuvarande GAV", "120"],
          ["Köppris per aktie", "80"],
          ["Courtage för köpet", "19"],
          ["Önskat GAV", "100"],
        ];
        for (const [label, value] of targetValues) {
          const input = page.getByLabel(label);
          await input.fill("");
          await input.fill(value);
        }
        await page.getByText("101", { exact: true }).waitFor();
        await assertNoHorizontalOverflow(page);
        const targetMargin = await assertStickyPanelClearsHeader(
          page,
          '[data-gav-result-panel="target"]',
        );
        await assertNoHorizontalOverflow(page);
        await page.screenshot({
          path: `${SHOT_DIR}/public-gav-sticky-target-${viewport.width}.png`,
          fullPage: false,
        });

        margins.push(
          `${viewport.width}px: händelser ${eventMargin.toFixed(0)}px, mål-GAV ${targetMargin.toFixed(0)}px`,
        );
      }

      return margins.join("; ");
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
      await page.setViewportSize(VIEWPORTS[4]);
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

      await page.goto(`${BASE}/editorial`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      const editorialText = await page.locator("body").innerText();
      assert.match(editorialText, /Redaktionella riktlinjer/);
      assert.match(editorialText, /Frihetsmaskinen/);
      assertNoObsoletePublicCopy(editorialText);
      assertCanonical(await getCanonicalHref(page), "/editorial");
      await page.screenshot({
        path: `${SHOT_DIR}/public-editorial-desktop.png`,
        fullPage: true,
      });

      await page.goto(`${BASE}/disclaimer`, { waitUntil: "networkidle" });
      await assertHasPublicNav(page);
      const disclaimerText = await page.locator("body").innerText();
      assertNoObsoletePublicCopy(disclaimerText);
      assert.match(disclaimerText, /allmän information|informationellt/i);
      assert.match(disclaimerText, /personlig finansiell rådgivning/i);
      assert.match(disclaimerText, /Marknadsinformation kan förändras|kan förändras/i);
      assert.match(disclaimerText, /ansvarar själv|Du ansvarar/i);
      assertCanonical(await getCanonicalHref(page), "/disclaimer");
    });

    await check("public mobile navigation screenshot", async () => {
      await page.setViewportSize(VIEWPORTS[0]);
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      const menuButton = page.getByRole("button", {
        name: /Öppna meny|Stäng meny|Meny/i,
      });
      await menuButton.click();
      await page.getByRole("navigation", { name: /Mobil navigering/i }).waitFor();
      await page.screenshot({
        path: `${SHOT_DIR}/public-mobile-navigation.png`,
        fullPage: false,
      });
      await page.keyboard.press("Escape");
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
      assert.match(sitemap, /https:\/\/divlab\.se\/verktyg/);
      assert.match(
        sitemap,
        /https:\/\/divlab\.se\/verktyg\/gav-kalkylator/,
      );
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
