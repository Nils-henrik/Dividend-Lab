#!/usr/bin/env node
/**
 * Focused anonymous HTML checks for public AI portfolio SEO routes.
 * Expects a local Next server on PORT (default 3000).
 */

const base = `http://127.0.0.1:${process.env.PORT || "3000"}`;

const routes = [
  {
    path: "/portfolios",
    title: "AI-portföljer för börsen | DivLab",
    canonical: "https://divlab.se/portfolios",
    mustInclude: [
      "Fyra AI-portföljer",
      "10 augusti 2026",
      "/portfolios/sa-fungerar-ai-processen",
      "index, follow",
    ],
  },
  {
    path: "/portfolios/forsiktig",
    title: "Försiktig AI-portfölj | DivLab",
    canonical: "https://divlab.se/portfolios/forsiktig",
    mustInclude: ["Försiktig", "10 augusti 2026", "index, follow"],
  },
  {
    path: "/portfolios/medelrisk",
    title: "Medelrisk AI-portfölj | DivLab",
    canonical: "https://divlab.se/portfolios/medelrisk",
    mustInclude: ["Medelrisk", "index, follow"],
  },
  {
    path: "/portfolios/hog-risk",
    title: "Högrisk AI-portfölj | DivLab",
    canonical: "https://divlab.se/portfolios/hog-risk",
    mustInclude: ["Högrisk", "index, follow"],
  },
  {
    path: "/portfolios/utdelning",
    title: "Utdelning AI-portfölj | DivLab",
    canonical: "https://divlab.se/portfolios/utdelning",
    mustInclude: ["Utdelning", "index, follow"],
  },
  {
    path: "/portfolios/sa-fungerar-ai-processen",
    title: "Så arbetar DivLabs AI-portföljer | DivLab",
    canonical: "https://divlab.se/portfolios/sa-fungerar-ai-processen",
    mustInclude: [
      "Data &amp; nyheter",
      "AI-analys",
      "Verifiering",
      "Genomförande",
      "index, follow",
    ],
  },
  {
    path: "/login",
    title: null,
    canonical: null,
    mustInclude: ["noindex"],
    mustExclude: ['content="index, follow"'],
  },
];

function extract(html, pattern) {
  const match = html.match(pattern);
  return match?.[1] ?? null;
}

let failures = 0;

for (const route of routes) {
  const response = await fetch(`${base}${route.path}`, {
    headers: { "user-agent": "DivLabPortfolioSeoVerify/1.0" },
    redirect: "manual",
  });
  const html = await response.text();

  if (response.status < 200 || response.status >= 400) {
    console.error(`FAIL ${route.path}: HTTP ${response.status}`);
    failures += 1;
    continue;
  }

  const title = extract(html, /<title>([^<]*)<\/title>/i);
  const robots = extract(
    html,
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i,
  );
  const canonical = extract(
    html,
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  );

  if (route.title && title !== route.title) {
    console.error(`FAIL ${route.path}: title "${title}" !== "${route.title}"`);
    failures += 1;
  }
  if (route.canonical && canonical !== route.canonical) {
    console.error(
      `FAIL ${route.path}: canonical "${canonical}" !== "${route.canonical}"`,
    );
    failures += 1;
  }
  for (const snippet of route.mustInclude ?? []) {
    if (!html.includes(snippet) && !(robots && snippet === "index, follow" && /index/.test(robots) && /follow/.test(robots) && !/noindex/.test(robots))) {
      // robots meta may be "index, follow" or omitted when inheriting; require explicit or non-noindex
      if (snippet === "index, follow") {
        if (robots && /noindex/i.test(robots)) {
          console.error(`FAIL ${route.path}: robots is noindex (${robots})`);
          failures += 1;
        } else if (!robots && !html.includes("index, follow")) {
          // Root default may omit explicit robots; require either explicit index or no noindex
          console.error(`FAIL ${route.path}: missing indexable robots signal`);
          failures += 1;
        }
      } else {
        console.error(`FAIL ${route.path}: missing snippet ${snippet}`);
        failures += 1;
      }
    }
  }
  for (const snippet of route.mustExclude ?? []) {
    if (html.includes(snippet)) {
      console.error(`FAIL ${route.path}: unexpected snippet ${snippet}`);
      failures += 1;
    }
  }

  console.log(
    `OK ${route.path} status=${response.status} title=${JSON.stringify(title)} robots=${JSON.stringify(robots)} canonical=${JSON.stringify(canonical)}`,
  );
}

const sitemap = await fetch(`${base}/sitemap.xml`);
const sitemapXml = await sitemap.text();
for (const path of [
  "/portfolios",
  "/portfolios/sa-fungerar-ai-processen",
  "/portfolios/forsiktig",
  "/portfolios/medelrisk",
  "/portfolios/hog-risk",
  "/portfolios/utdelning",
]) {
  if (!sitemapXml.includes(`https://divlab.se${path}`)) {
    console.error(`FAIL sitemap missing ${path}`);
    failures += 1;
  }
}
if (sitemapXml.includes("www.divlab.se") || sitemapXml.includes("vercel.app")) {
  console.error("FAIL sitemap contains non-canonical host");
  failures += 1;
}
console.log(`OK sitemap.xml status=${sitemap.status}`);

const robotsTxt = await fetch(`${base}/robots.txt`);
const robotsBody = await robotsTxt.text();
if (!robotsBody.includes("Sitemap: https://divlab.se/sitemap.xml")) {
  console.error("FAIL robots.txt missing production sitemap");
  failures += 1;
}
console.log(`OK robots.txt status=${robotsTxt.status}`);

if (failures > 0) {
  console.error(`\n${failures} HTML SEO check(s) failed`);
  process.exit(1);
}

console.log("\nAll portfolio SEO HTML checks passed");
