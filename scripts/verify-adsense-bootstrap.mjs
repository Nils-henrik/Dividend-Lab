#!/usr/bin/env node
/**
 * Runtime checks for the single global AdSense publisher bootstrap.
 *
 * Usage:
 *   APP_URL=http://localhost:3000 node scripts/verify-adsense-bootstrap.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.APP_URL ?? "http://localhost:3000";
const EXPECTED_CLIENT = "ca-pub-1024192127032504";
const EXPECTED_SRC =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${EXPECTED_CLIENT}`;
const EXPECTED_ADS_TXT = readFileSync(join(root, "public/ads.txt"));

function header(headers, name) {
  const value = headers.get(name);
  assert.ok(value, `missing response header ${name}`);
  return value;
}

function cspDirective(policy, name) {
  const directive = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `) || part === name);
  assert.ok(directive, `missing CSP directive ${name}`);
  return directive;
}

const home = await fetch(BASE, { redirect: "follow" });
assert.equal(home.ok, true, `GET ${BASE} failed: ${home.status}`);
const html = await home.text();
const csp = header(home.headers, "content-security-policy");

const officialScripts = [
  ...html.matchAll(/<script\b[^>]*src="([^"]*adsbygoogle\.js[^"]*)"[^>]*>/gi),
];
const officialSrcMatches = officialScripts.filter((match) => match[1] === EXPECTED_SRC);

assert.equal(
  officialSrcMatches.length,
  1,
  `expected exactly one official AdSense src, found ${officialScripts.map((match) => match[1]).join(", ")}`,
);
assert.match(html, new RegExp(`id="google-adsense"[^>]*src="${EXPECTED_SRC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
assert.match(html, /id="google-adsense"[^>]*crossorigin="anonymous"/i);
assert.match(html, /<script[^>]*dangerouslySetInnerHTML|dataset\.theme|divlab-theme/);

for (const name of [
  "referrer-policy",
  "x-content-type-options",
  "x-frame-options",
  "permissions-policy",
  "strict-transport-security",
]) {
  header(home.headers, name);
}

assert.match(csp, /object-src 'none'/);
assert.match(csp, /frame-ancestors 'none'/);
assert.match(csp, /upgrade-insecure-requests/);
assert.doesNotMatch(csp, /nonce-|strict-dynamic/);
assert.doesNotMatch(
  csp,
  /googlesyndication|doubleclick|googleadservices|fundingchoices|adtrafficquality/,
);

for (const name of ["script-src", "connect-src", "frame-src"]) {
  const tokens = cspDirective(csp, name).split(/\s+/).slice(1);
  assert.ok(tokens.includes("https:"), `${name} missing https:`);
  assert.equal(tokens.includes("http:"), false, `${name} unexpectedly allows http:`);
}

const adsTxt = await fetch(new URL("/ads.txt", BASE), { redirect: "follow" });
assert.equal(adsTxt.status, 200, `GET /ads.txt failed: ${adsTxt.status}`);
const adsTxtBody = Buffer.from(await adsTxt.arrayBuffer());
assert.deepEqual(adsTxtBody, EXPECTED_ADS_TXT);

console.log(
  JSON.stringify(
    {
      ok: true,
      url: BASE,
      officialScriptCount: officialSrcMatches.length,
      publisherId: EXPECTED_CLIENT,
      adsTxtBytes: adsTxtBody.length,
    },
    null,
    2,
  ),
);
