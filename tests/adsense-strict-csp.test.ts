import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ADSENSE_OFFICIAL_SCRIPT_URL,
  ADSENSE_PRODUCTION_ENABLED,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_PUBLISHER_NUMERIC_ID,
} from "../lib/adsense/constants";
import {
  assertAdSenseNotEnabledInProduction,
  createOfficialAdSenseScriptProps,
} from "../lib/adsense/script";
import { classifyPath } from "../lib/cursor-bridge/sensitive-paths";
import {
  applyContentSecurityPolicyHeader,
  applyNonceToScriptProps,
  buildProductionContentSecurityPolicy,
  buildSupportedStrictContentSecurityPolicy,
  buildSupportedStrictScriptSrc,
  createRequestWithCspHeaders,
  cspNonceSource,
  generateCspNonce,
  getProductionSecurityHeaders,
  isCspNonce,
  supabaseConnectSources,
} from "../lib/security/content-security-policy";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ADS_TXT_BODY = Buffer.from(
  "google.com, pub-1024192127032504, DIRECT, f08c47fec0942fa0\n",
  "utf8",
);

const ADSENSE_RUNTIME = /adsbygoogle|pagead2\.googlesyndication\.com|fundingchoicesmessages\.google\.com/;

const REJECTED_SCRIPT_HOST_ALLOWLIST = [
  "ADSENSE_SCRIPT_SOURCES",
  "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com",
  "fundingchoicesmessages.google.com",
  "www.googletagservices.com",
  "www.googleadservices.com",
];

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
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

function scriptSrc(policy: string): string {
  const match = policy.match(/script-src[^;]*/);
  assert.ok(match, "policy must contain script-src");
  return match[0];
}

describe("ads.txt byte invariance", () => {
  it("keeps public/ads.txt exact and unchanged", () => {
    assert.deepEqual(readFileSync(join(root, "public/ads.txt")), ADS_TXT_BODY);
    assert.match(ADS_TXT_BODY.toString("utf8"), new RegExp(`pub-${ADSENSE_PUBLISHER_NUMERIC_ID}`));
  });
});

describe("nonce generation", () => {
  it("creates a 16-byte base64 nonce", () => {
    const nonce = generateCspNonce();
    assert.equal(isCspNonce(nonce), true);
    assert.equal(Buffer.from(nonce, "base64").length, 16);
    assert.equal(cspNonceSource(nonce), `'nonce-${nonce}'`);
  });

  it("returns a different nonce on every call", () => {
    const values = new Set(Array.from({ length: 32 }, () => generateCspNonce()));
    assert.equal(values.size, 32);
  });

  it("rejects a weak nonce before it can be placed on a script", () => {
    assert.throws(() => cspNonceSource("abc"), /16-byte base64/);
    assert.throws(() => applyNonceToScriptProps("not-a-nonce"), /16-byte base64/);
  });
});

describe("production CSP contract", () => {
  it("preserves current DivLab security headers", () => {
    const headers = getProductionSecurityHeaders();
    const keys = headers.map((header) => header.key);

    assert.deepEqual(keys, [
      "Content-Security-Policy",
      "Referrer-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]);

    const policy = buildProductionContentSecurityPolicy();
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'self'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.match(policy, /form-action 'self'/);
    assert.match(policy, /img-src 'self' data: blob: https:/);
    assert.match(policy, /font-src 'self' data:/);
    assert.match(policy, /style-src 'self' 'unsafe-inline'/);
    assert.match(policy, /https:\/\/va\.vercel-scripts\.com/);
    assert.match(policy, /https:\/\/s3\.tradingview\.com/);
    assert.match(policy, /https:\/\/\*\.supabase\.co/);
    assert.match(policy, /wss:\/\/\*\.supabase\.co/);
    assert.match(policy, /worker-src 'self' blob:/);
    assert.match(policy, /upgrade-insecure-requests/);
  });

  it("does not encode a rolling AdSense script-host allowlist", () => {
    const policy = buildProductionContentSecurityPolicy();
    const source = [
      read("lib/security/content-security-policy.ts"),
      read("next.config.ts"),
      read("lib/adsense/constants.ts"),
    ].join("\n");

    assert.doesNotMatch(source, /ADSENSE_SCRIPT_SOURCES/);
    for (const host of REJECTED_SCRIPT_HOST_ALLOWLIST) {
      if (host === "ADSENSE_SCRIPT_SOURCES") {
        continue;
      }
      assert.equal(scriptSrc(policy).includes(host), false, host);
    }
  });

  it("includes a local Supabase origin in connect-src when configured", () => {
    const sources = supabaseConnectSources("http://127.0.0.1:54321");
    assert.deepEqual(sources, ["http://127.0.0.1:54321", "ws://127.0.0.1:54321"]);
    assert.match(
      buildProductionContentSecurityPolicy("http://127.0.0.1:54321"),
      /connect-src[^;]*http:\/\/127\.0\.0\.1:54321 ws:\/\/127\.0\.0\.1:54321/,
    );
  });

  it("is the policy next.config.ts actually emits", () => {
    const nextConfig = read("next.config.ts");
    assert.match(nextConfig, /getProductionSecurityHeaders/);
    assert.doesNotMatch(nextConfig, /ADSENSE_SCRIPT_SOURCES/);
    assert.doesNotMatch(nextConfig, /buildSupportedStrictContentSecurityPolicy/);
  });
});

describe("supported strict CSP model", () => {
  it("uses nonce + strict-dynamic and not a hardcoded AdSense script-host allowlist", () => {
    const nonce = generateCspNonce();
    const script = buildSupportedStrictScriptSrc(nonce);
    const policy = buildSupportedStrictContentSecurityPolicy(nonce);

    assert.equal(
      script,
      `script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:`,
    );
    assert.match(policy, /'strict-dynamic'/);
    assert.match(policy, new RegExp(`'nonce-${nonce.replace(/[+/=]/g, "\\$&")}'`));
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /base-uri 'self'/);
    assert.match(policy, /frame-ancestors 'none'/);
    assert.match(policy, /https:\/\/va\.vercel-scripts\.com/);
    assert.match(policy, /https:\/\/s3\.tradingview\.com/);

    for (const host of REJECTED_SCRIPT_HOST_ALLOWLIST) {
      if (host === "ADSENSE_SCRIPT_SOURCES") {
        continue;
      }
      assert.equal(script.includes(host), false, host);
    }
  });

  it("applies the same nonce to theme bootstrap and the official AdSense script", () => {
    const nonce = generateCspNonce();
    const theme = applyNonceToScriptProps(nonce);
    const adsense = createOfficialAdSenseScriptProps(nonce);

    assert.equal(theme.nonce, nonce);
    assert.equal(adsense.nonce, nonce);
    assert.equal(adsense.src, ADSENSE_OFFICIAL_SCRIPT_URL);
    assert.equal(adsense.async, true);
    assert.equal(adsense.crossOrigin, "anonymous");
    assert.equal(
      adsense.src,
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1024192127032504",
    );
  });
});

describe("AdSense fail-closed enablement", () => {
  it("keeps the official publisher ID but does not enable AdSense in production", () => {
    assert.equal(ADSENSE_PUBLISHER_ID, "ca-pub-1024192127032504");
    assert.equal(ADSENSE_PRODUCTION_ENABLED, false);
    assert.doesNotThrow(() => assertAdSenseNotEnabledInProduction());
  });

  it("does not mount AdSense from the app tree", () => {
    const layout = read("app/layout.tsx");
    assert.doesNotMatch(layout, ADSENSE_RUNTIME);
    assert.doesNotMatch(layout, /createOfficialAdSenseScriptProps|AdSenseScript|headers\(/);
    assert.match(layout, /themeBootstrapScript/);
    assert.match(layout, /<ThemeSync \/>/);
    assert.match(layout, /<Analytics \/>/);

    const files = [
      ...collectFiles(join(root, "app"), (path) => /\.(ts|tsx)$/.test(path)),
      ...collectFiles(join(root, "components"), (path) => /\.(ts|tsx)$/.test(path)),
    ];
    const offenders = files.filter((file) => ADSENSE_RUNTIME.test(readFileSync(file, "utf8")));
    assert.deepEqual(
      offenders.map((file) => relative(root, file)),
      [],
    );
  });

  it("does not add per-page AdSense snippets", () => {
    const officialMentions = collectFiles(root, (path) => /\.(ts|tsx|mjs|js)$/.test(path)).filter(
      (file) =>
        readFileSync(file, "utf8").includes(
          "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
        ),
    );

    assert.deepEqual(
      officialMentions.map((file) => relative(root, file)).sort(),
      ["lib/adsense/constants.ts", "tests/adsense-strict-csp.test.ts"],
    );
  });
});

describe("CSP header composition preserves request cookies", () => {
  it("copies Cookie plus nonce/CSP onto a new header set without dropping session cookies", () => {
    const nonce = generateCspNonce();
    const policy = buildSupportedStrictContentSecurityPolicy(nonce);
    const request = new Request("http://localhost:3000/news", {
      headers: {
        cookie: "sb-access-token=secret-session; theme=light",
      },
    });

    const headers = createRequestWithCspHeaders(request, nonce, policy);
    applyContentSecurityPolicyHeader(headers, policy);

    assert.equal(headers.get("cookie"), "sb-access-token=secret-session; theme=light");
    assert.equal(headers.get("x-nonce"), nonce);
    assert.equal(headers.get("content-security-policy"), policy);
  });

  it("can set CSP on a response header bag that already has Set-Cookie", () => {
    const headers = new Headers();
    headers.append("set-cookie", "sb-access-token=rotated; Path=/");
    applyContentSecurityPolicyHeader(headers, "default-src 'self'");

    assert.equal(headers.get("set-cookie"), "sb-access-token=rotated; Path=/");
    assert.equal(headers.get("content-security-policy"), "default-src 'self'");
  });
});

describe("sensitive-path classification", () => {
  it("keeps CSP, Proxy and next.config in the fail-closed sensitive buckets", () => {
    assert.equal(
      classifyPath("lib/security/content-security-policy.ts")?.category,
      "security-headers",
    );
    assert.equal(classifyPath("proxy.ts")?.category, "proxy");
    assert.equal(classifyPath("next.config.ts")?.category, "next-config");
  });
});
