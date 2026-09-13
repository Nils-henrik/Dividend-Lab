import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_CONNECT_SOURCES,
  ADSENSE_FRAME_SOURCES,
  ADSENSE_SCRIPT_CROSS_ORIGIN,
  ADSENSE_SCRIPT_ID,
  ADSENSE_SCRIPT_SOURCES,
  ADSENSE_SCRIPT_SRC,
  ADS_TXT_BODY,
} from "../lib/adsense/constants";
import { classifyPath } from "../lib/cursor-bridge/sensitive-paths";
import {
  buildContentSecurityPolicy,
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
    .find((part) => part.startsWith(`${name} `));

  assert.ok(directive, `Missing CSP directive ${name}`);
  return directive;
}

function directiveTokens(directive: string): string[] {
  return directive.split(/\s+/).slice(1);
}

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

    assert.match(script, /<script/);
    assert.match(script, /id=\{ADSENSE_SCRIPT_ID\}/);
    assert.match(script, /src=\{ADSENSE_SCRIPT_SRC\}/);
    assert.match(script, /crossOrigin=\{ADSENSE_SCRIPT_CROSS_ORIGIN\}/);
    assert.match(script, /\basync\b/);
    assert.doesNotMatch(script, /from "next\/script"|beforeInteractive/);
    assert.doesNotMatch(script, /adsbygoogle\.js\?client=/);
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
  it("keeps existing security headers and the static allowlist model", () => {
    const nextConfig = read("next.config.ts");
    const proxy = read("proxy.ts");
    const policy = buildContentSecurityPolicy([]);

    for (const key of SECURITY_HEADER_KEYS) {
      assert.match(nextConfig, new RegExp(`key: "${key}"`));
    }

    assert.match(nextConfig, /buildContentSecurityPolicy/);
    assert.doesNotMatch(nextConfig, /strict-dynamic|nonce-/);
    assert.doesNotMatch(proxy, /Content-Security-Policy|nonce|strict-dynamic|adsbygoogle/);
    assert.match(proxy, /return updateSession\(request\)/);

    assert.doesNotMatch(policy, /strict-dynamic/);
    assert.doesNotMatch(policy, /nonce-/);
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.match(policy, /upgrade-insecure-requests/);
  });

  it("preserves Supabase, Vercel Analytics, TradingView and theme bootstrap", () => {
    const policy = buildContentSecurityPolicy(["http://127.0.0.1:54321"]);
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

  it("allows AdSense and Google CMP hosts without generic script wildcards", () => {
    const policy = buildContentSecurityPolicy([]);
    const scriptSrc = cspDirective(policy, "script-src");
    const connectSrc = cspDirective(policy, "connect-src");
    const frameSrc = cspDirective(policy, "frame-src");

    for (const origin of ADSENSE_SCRIPT_SOURCES) {
      assert.ok(
        directiveTokens(scriptSrc).includes(origin),
        `script-src missing AdSense origin ${origin}`,
      );
    }
    for (const origin of ADSENSE_CONNECT_SOURCES) {
      assert.ok(
        directiveTokens(connectSrc).includes(origin),
        `connect-src missing AdSense origin ${origin}`,
      );
    }
    for (const origin of ADSENSE_FRAME_SOURCES) {
      assert.ok(
        directiveTokens(frameSrc).includes(origin),
        `frame-src missing AdSense origin ${origin}`,
      );
    }

    const scriptTokens = directiveTokens(scriptSrc);
    assert.equal(scriptTokens.includes("https:"), false);
    assert.equal(scriptTokens.includes("http:"), false);
    assert.equal(scriptTokens.includes("*"), false);
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
