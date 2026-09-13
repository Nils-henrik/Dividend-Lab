#!/usr/bin/env node
/**
 * Runtime verification for the global AdSense bootstrap and CSP.
 *
 * Requires a running Next.js server on APP_URL (default http://127.0.0.1:3000).
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://127.0.0.1:3000";
const ADSENSE_SRC =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1024192127032504";
const ADS_TXT = "google.com, pub-1024192127032504, DIRECT, f08c47fec0942fa0\n";
const REPORT_PATH =
  process.env.ADSENSE_VERIFY_REPORT ?? "/tmp/adsense-csp-runtime-report.json";

const report = {
  base: BASE,
  checks: [],
};

function record(name, ok, detail = "") {
  report.checks.push({ name, ok, detail });
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

const adsTxtResponse = await fetch(new URL("/ads.txt", BASE));
const adsTxtBody = await adsTxtResponse.text();
await check("ads.txt returns HTTP 200 with the exact existing line", () => {
  assert.equal(adsTxtResponse.status, 200);
  assert.equal(adsTxtBody, ADS_TXT);
  return `${adsTxtResponse.status} ${JSON.stringify(adsTxtBody)}`;
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const cspViolations = [];
const scriptRequests = [];

page.on("console", (message) => {
  if (message.type() === "error" && /content security policy|csp/i.test(message.text())) {
    cspViolations.push(message.text());
  }
});

page.on("request", (request) => {
  if (request.url().includes("adsbygoogle.js") || request.url().includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")) {
    scriptRequests.push(request.url());
  }
});

const response = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });
assert.ok(response, "homepage did not navigate");

const homepageCsp = response.headers()["content-security-policy"] ?? "";
await check("homepage sends a Content-Security-Policy header", () => {
  assert.ok(homepageCsp.length > 0, "missing CSP header");
  return homepageCsp;
});

await check("CSP allows the official AdSense script origin without https: script wildcard", () => {
  const scriptSrc = homepageCsp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("script-src "));
  assert.ok(scriptSrc, "missing script-src");
  assert.match(scriptSrc, /https:\/\/pagead2\.googlesyndication\.com/);
  assert.match(scriptSrc, /https:\/\/fundingchoicesmessages\.google\.com/);
  assert.doesNotMatch(scriptSrc, /strict-dynamic/);
  assert.doesNotMatch(scriptSrc, /nonce-/);
  const tokens = scriptSrc.split(/\s+/).slice(1);
  assert.equal(tokens.includes("https:"), false);
  assert.equal(tokens.includes("http:"), false);
});

await check("existing security headers remain", () => {
  const headers = response.headers();
  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.match(headers["referrer-policy"] ?? "", /strict-origin-when-cross-origin/);
  assert.match(headers["permissions-policy"] ?? "", /camera=\(\)/);
});

await page.waitForTimeout(2500);

const scriptState = await page.evaluate((expectedSrc) => {
  const nodes = [...document.querySelectorAll("script")].filter((node) => {
    const src = node.getAttribute("src") ?? "";
    return src.includes("adsbygoogle.js") || src.includes("pagead2.googlesyndication.com");
  });
  return {
    count: nodes.length,
    sources: nodes.map((node) => node.getAttribute("src")),
    ids: nodes.map((node) => node.id),
    crossOrigin: nodes.map((node) => node.getAttribute("crossorigin")),
    expectedPresent: nodes.some((node) => (node.getAttribute("src") ?? "") === expectedSrc),
  };
}, ADSENSE_SRC);

await check("AdSense script is present exactly once", () => {
  assert.equal(scriptState.count, 1, `found ${scriptState.count} AdSense script tags`);
  assert.equal(scriptState.expectedPresent, true, `sources=${JSON.stringify(scriptState.sources)}`);
  assert.deepEqual(scriptState.ids, ["google-adsense"]);
  assert.deepEqual(scriptState.crossOrigin, ["anonymous"]);
  return JSON.stringify(scriptState);
});

await check("AdSense script request is not CSP-blocked", () => {
  const blocked = cspViolations.filter((message) =>
    /adsbygoogle|googlesyndication|fundingchoices/i.test(message),
  );
  assert.equal(blocked.length, 0, blocked.join(" | "));
  assert.ok(
    scriptRequests.length >= 1 || scriptState.expectedPresent,
    "AdSense script was not observed on the network",
  );
  return `requests=${scriptRequests.length}; violations=${cspViolations.length}`;
});

await browser.close();

const failed = report.checks.filter((item) => !item.ok);
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`Wrote ${REPORT_PATH}`);

if (failed.length > 0) {
  process.exit(1);
}
