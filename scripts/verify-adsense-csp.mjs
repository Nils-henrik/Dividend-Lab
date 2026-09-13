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
const adNetwork = [];

await page.addInitScript(() => {
  window.__cspViolations = [];
  document.addEventListener("securitypolicyviolation", (event) => {
    window.__cspViolations.push({
      blockedURI: event.blockedURI,
      effectiveDirective: event.effectiveDirective,
      violatedDirective: event.violatedDirective,
    });
  });
});

page.on("console", (message) => {
  if (message.type() === "error" && /content security policy|csp/i.test(message.text())) {
    cspViolations.push(message.text());
  }
});

page.on("request", (request) => {
  const url = request.url();
  if (url.includes("adsbygoogle.js")) {
    scriptRequests.push(url);
  }
  if (
    /googlesyndication|doubleclick|fundingchoices|adtrafficquality|googleadservices|adservice\.google/i.test(
      url,
    )
  ) {
    adNetwork.push({ type: "request", url, resourceType: request.resourceType() });
  }
});

page.on("response", (response) => {
  const url = response.url();
  if (
    /googlesyndication|doubleclick|fundingchoices|adtrafficquality|googleadservices|adservice\.google/i.test(
      url,
    )
  ) {
    adNetwork.push({ type: "response", url, status: response.status() });
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
  const official = [...document.querySelectorAll("script#google-adsense")];
  const adsbygoogle = [...document.querySelectorAll("script")].filter((node) =>
    (node.getAttribute("src") ?? "").includes("adsbygoogle.js"),
  );
  return {
    officialCount: official.length,
    officialSources: official.map((node) => node.getAttribute("src")),
    officialCrossOrigin: official.map((node) => node.getAttribute("crossorigin")),
    adsbygoogleCount: adsbygoogle.length,
    adsbygoogleSources: adsbygoogle.map((node) => node.getAttribute("src")),
    expectedPresent: official.some((node) => (node.getAttribute("src") ?? "") === expectedSrc),
    cspViolations: window.__cspViolations ?? [],
  };
}, ADSENSE_SRC);

await check("official AdSense bootstrap is present exactly once", () => {
  assert.equal(scriptState.officialCount, 1, `found ${scriptState.officialCount} #google-adsense tags`);
  assert.ok(
    scriptState.adsbygoogleCount >= 1,
    `missing adsbygoogle.js tags: ${JSON.stringify(scriptState.adsbygoogleSources)}`,
  );
  assert.equal(scriptState.expectedPresent, true, `sources=${JSON.stringify(scriptState.officialSources)}`);
  assert.deepEqual(scriptState.officialCrossOrigin, ["anonymous"]);
  return JSON.stringify(scriptState);
});

await check("AdSense/CMP resources are not CSP-blocked", () => {
  const consoleBlocked = cspViolations.filter((message) =>
    /adsbygoogle|googlesyndication|fundingchoices|doubleclick|adtrafficquality/i.test(message),
  );
  const eventBlocked = scriptState.cspViolations.filter((event) =>
    /adsbygoogle|googlesyndication|fundingchoices|doubleclick|adtrafficquality|googleadservices|adservice\.google/i.test(
      `${event.blockedURI} ${event.effectiveDirective}`,
    ),
  );
  assert.equal(consoleBlocked.length, 0, consoleBlocked.join(" | "));
  assert.equal(eventBlocked.length, 0, JSON.stringify(eventBlocked));
  assert.ok(scriptRequests.length >= 1, "official AdSense script was not requested");
  return `bootstrapRequests=${scriptRequests.length}; adNetwork=${adNetwork.length}; cspEvents=${scriptState.cspViolations.length}`;
});

await browser.close();

report.adNetworkHosts = [...new Set(adNetwork.map((entry) => {
  try {
    return new URL(entry.url).origin;
  } catch {
    return entry.url;
  }
}))].sort();
report.cspViolations = scriptState.cspViolations;

const failed = report.checks.filter((item) => !item.ok);
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
console.log(`Wrote ${REPORT_PATH}`);

if (failed.length > 0) {
  process.exit(1);
}
