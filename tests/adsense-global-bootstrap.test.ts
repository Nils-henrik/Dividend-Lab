import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_SCRIPT_CROSS_ORIGIN,
  ADSENSE_SCRIPT_ID,
  ADSENSE_SCRIPT_SRC,
  ADS_TXT_BODY,
} from "../lib/adsense/constants";
import { classifyPath } from "../lib/cursor-bridge/sensitive-paths";
import {
  ADSENSE_HTTPS_SCHEME,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  SECURITY_HEADER_KEYS,
} from "../lib/security/content-security-policy";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function readBytes(path: string) {
  return readFileSync(join(root, path));
}

function collectFiles(directory: string, predicate: (path: string) => boolean): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === ".git") {
        return [];
      }
      return collectFiles(path, predicate);
    }

    return predicate(path) ? [path] : [];
  });
}

function cspDirective(policy: string, name: string): string {
  const directive = policy
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `) || part === name);

  assert.ok(directive, `Missing CSP directive ${name}`);
  return directive;
}

function directiveTokens(directive: string): string[] {
  return directive.split(/\s+/).slice(1);
}

const ROLLING_ADSENSE_HOST_PATTERN =
  /googlesyndication|doubleclick|googleadservices|adservice\.google|fundingchoices|adtrafficquality|googletagservices|pagead2/i;

describe("Google AdSense publisher contract", () => {
  it("uses the exact production publisher id and official script URL", () => {
    assert.equal(ADSENSE_CLIENT_ID, "ca-pub-1024192127032504");
    assert.equal(
      ADSENSE_SCRIPT_SRC,
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1024192127032504",
    );
    assert.equal(ADSENSE_SCRIPT_ID, "google-adsense");
    assert.equal(ADSENSE_SCRIPT_CROSS_ORIGIN, "anonymous");
  });

  it("keeps public/ads.txt byte-for-byte unchanged", () => {
    assert.deepEqual(readBytes("public/ads.txt"), Buffer.from(ADS_TXT_BODY, "utf8"));
  });

  it("loads the official script exactly once from the root layout", () => {
    const layout = read("app/layout.tsx");
    const script = read("components/adsense/AdSenseScript.tsx");

    assert.match(layout, /import AdSenseScript from "@\/components\/adsense\/AdSenseScript"/);
    assert.equal(layout.split("<AdSenseScript").length - 1, 1);
    assert.doesNotMatch(layout, /adsbygoogle|ca-pub-/);
    assert.doesNotMatch(layout, /from ["']next\/headers["']/);
    assert.doesNotMatch(layout, /\bheaders\s*\(/);
    assert.doesNotMatch(layout, /\bcookies\s*\(/);
    assert.doesNotMatch(layout, /nonce/);

    assert.match(script, /<script/);
    assert.match(script, /id=\{ADSENSE_SCRIPT_ID\}/);
    assert.match(script, /src=\{ADSENSE_SCRIPT_SRC\}/);
    assert.match(script, /crossOrigin=\{ADSENSE_SCRIPT_CROSS_ORIGIN\}/);
    assert.match(script, /\basync\b/);
    assert.doesNotMatch(script, /from "next\/script"|beforeInteractive/);
    assert.doesNotMatch(script, /nonce/);
  });

  it("does not add a second AdSense bootstrap anywhere in app or components", () => {
    const files = collectFiles(join(root, "app"), (path) => path.endsWith(".tsx")).concat(
      collectFiles(join(root, "components"), (path) => path.endsWith(".tsx")),
    );

    const offenders = files.filter((file) => {
      const relativePath = relative(root, file);
      if (relativePath === "components/adsense/AdSenseScript.tsx") {
        return false;
      }
      const source = readFileSync(file, "utf8");
      return /adsbygoogle|ca-pub-|pagead2\.googlesyndication\.com/.test(source);
    });

    assert.deepEqual(offenders.map((file) => relative(root, file)), []);
  });
});

describe("AdSense CSP security model", () => {
  it("keeps existing security headers and does not add nonces or a host list", () => {
    const nextConfig = read("next.config.ts");
    const proxy = read("proxy.ts");
    const cspModule = read("lib/security/content-security-policy.ts");
    const adsenseConstants = read("lib/adsense/constants.ts");
    const policy = buildContentSecurityPolicy([]);

    for (const key of SECURITY_HEADER_KEYS) {
      assert.match(nextConfig, /buildSecurityHeaders/);
      assert.ok(
        buildSecurityHeaders([]).some((header) => header.key === key),
        `missing security header ${key}`,
      );
    }

    assert.doesNotMatch(nextConfig, /strict-dynamic|nonce-/);
    assert.doesNotMatch(proxy, /Content-Security-Policy|nonce|strict-dynamic|adsbygoogle|headers\(/);
    assert.match(proxy, /return updateSession\(request\)/);

    assert.doesNotMatch(policy, /strict-dynamic/);
    assert.doesNotMatch(policy, /nonce-/);
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.match(policy, /form-action 'self'/);
    assert.match(policy, /base-uri 'self'/);
    assert.match(policy, /upgrade-insecure-requests/);
    assert.match(policy, /worker-src 'self' blob:/);

    assert.doesNotMatch(cspModule, ROLLING_ADSENSE_HOST_PATTERN);
    assert.doesNotMatch(adsenseConstants, /ADSENSE_SCRIPT_SOURCES|ADSENSE_CONNECT_SOURCES|ADSENSE_FRAME_SOURCES/);
  });

  it("preserves Supabase, Vercel Analytics, TradingView and theme bootstrap", () => {
    const policy = buildContentSecurityPolicy(["http://127.0.0.1:54321", "ws://127.0.0.1:54321"]);
    const scriptSrc = cspDirective(policy, "script-src");
    const connectSrc = cspDirective(policy, "connect-src");
    const frameSrc = cspDirective(policy, "frame-src");
    const layout = read("app/layout.tsx");

    for (const token of [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://va.vercel-scripts.com",
      "https://s3.tradingview.com",
      "https://www.tradingview.com",
    ]) {
      assert.ok(directiveTokens(scriptSrc).includes(token), `script-src missing ${token}`);
    }

    for (const token of [
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "http://127.0.0.1:54321",
      "ws://127.0.0.1:54321",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      "https://*.tradingview.com",
    ]) {
      assert.ok(directiveTokens(connectSrc).includes(token), `connect-src missing ${token}`);
    }

    for (const token of [
      "https://s.tradingview.com",
      "https://www.tradingview.com",
      "https://*.tradingview.com",
    ]) {
      assert.ok(directiveTokens(frameSrc).includes(token), `frame-src missing ${token}`);
    }

    assert.match(layout, /themeBootstrapScript/);
    assert.match(layout, /<ThemeSync \/>/);
    assert.match(layout, /<Analytics \/>/);
  });

  it("uses scheme-level https: for AdSense/CMP instead of a rolling host list", () => {
    const policy = buildContentSecurityPolicy([]);
    const scriptSrc = cspDirective(policy, "script-src");
    const connectSrc = cspDirective(policy, "connect-src");
    const frameSrc = cspDirective(policy, "frame-src");
    const fontSrc = cspDirective(policy, "font-src");
    const styleSrc = cspDirective(policy, "style-src");
    const mediaSrc = cspDirective(policy, "media-src");

    assert.equal(ADSENSE_HTTPS_SCHEME, "https:");
    assert.ok(directiveTokens(scriptSrc).includes("https:"), "script-src missing https:");
    assert.ok(directiveTokens(connectSrc).includes("https:"), "connect-src missing https:");
    assert.ok(directiveTokens(frameSrc).includes("https:"), "frame-src missing https:");
    assert.ok(directiveTokens(fontSrc).includes("https:"), "font-src missing https:");
    assert.ok(directiveTokens(styleSrc).includes("https:"), "style-src missing https:");
    assert.ok(directiveTokens(mediaSrc).includes("https:"), "media-src missing https:");

    assert.equal(directiveTokens(scriptSrc).includes("http:"), false);
    assert.equal(directiveTokens(connectSrc).includes("http:"), false);
    assert.equal(directiveTokens(frameSrc).includes("http:"), false);
    assert.equal(directiveTokens(fontSrc).includes("http:"), false);
    assert.equal(directiveTokens(styleSrc).includes("http:"), false);
    assert.equal(directiveTokens(mediaSrc).includes("http:"), false);

    assert.doesNotMatch(scriptSrc, ROLLING_ADSENSE_HOST_PATTERN);
    assert.doesNotMatch(connectSrc, ROLLING_ADSENSE_HOST_PATTERN);
    assert.doesNotMatch(frameSrc, ROLLING_ADSENSE_HOST_PATTERN);
    assert.doesNotMatch(policy, ROLLING_ADSENSE_HOST_PATTERN);
  });

  it("does not silently drop worker, object, or framing protections", () => {
    const policy = buildContentSecurityPolicy([]);
    const headers = buildSecurityHeaders([]);

    assert.match(cspDirective(policy, "worker-src"), /worker-src 'self' blob:/);
    assert.match(cspDirective(policy, "object-src"), /object-src 'none'/);
    assert.match(cspDirective(policy, "frame-ancestors"), /frame-ancestors 'none'/);

    const byKey = Object.fromEntries(headers.map((header) => [header.key, header.value]));
    assert.equal(byKey["X-Frame-Options"], "DENY");
    assert.equal(byKey["X-Content-Type-Options"], "nosniff");
    assert.equal(byKey["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.equal(byKey["Permissions-Policy"], "camera=(), microphone=(), geolocation=(), payment=()");
    assert.equal(byKey["Strict-Transport-Security"], "max-age=63072000; includeSubDomains; preload");
  });

  it("marks the CSP module as a sensitive security-headers path", () => {
    assert.equal(classifyPath("next.config.ts")?.category, "next-config");
    assert.equal(
      classifyPath("lib/security/content-security-policy.ts")?.category,
      "security-headers",
    );
    assert.equal(classifyPath("proxy.ts")?.category, "proxy");
  });
});

describe("AdSense rendering-mode safety", () => {
  it("does not force public SSG routes off generateStaticParams", () => {
    const home = read("app/page.tsx");
    const news = read("app/news/[slug]/page.tsx");
    const learning = read("app/learning/[slug]/page.tsx");
    const layout = read("app/layout.tsx");

    assert.doesNotMatch(home, /export const dynamic/);
    assert.doesNotMatch(news, /export const dynamic/);
    assert.doesNotMatch(learning, /export const dynamic/);
    assert.doesNotMatch(layout, /export const dynamic/);

    assert.match(news, /export function generateStaticParams/);
    assert.match(learning, /export function generateStaticParams/);
  });
});
