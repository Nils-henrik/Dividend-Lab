import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ADS_TXT_BODY =
  "google.com, pub-1024192127032504, DIRECT, f08c47fec0942fa0\n";

const ADSENSE_ENABLEMENT = /adsbygoogle|ca-pub-|pagead2\.googlesyndication\.com|fundingchoicesmessages\.google\.com/;

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

function cspFromNextConfig(): string {
  const source = read("next.config.ts");
  const match = source.match(
    /const ContentSecurityPolicy = \[([\s\S]*?)\]\.join\("; "\);/,
  );
  assert.ok(match, "Could not find the static ContentSecurityPolicy array");
  return match[1];
}

describe("AdSense fail-closed contract", () => {
  it("keeps public/ads.txt byte-for-byte unchanged", () => {
    assert.deepEqual(readFileSync(join(root, "public/ads.txt")), Buffer.from(ADS_TXT_BODY, "utf8"));
  });

  it("does not load AdSense or CMP code from the app", () => {
    const layout = read("app/layout.tsx");
    assert.doesNotMatch(layout, ADSENSE_ENABLEMENT);
    assert.doesNotMatch(layout, /AdSenseScript/);
    assert.match(layout, /themeBootstrapScript/);
    assert.match(layout, /<ThemeSync \/>/);
    assert.match(layout, /<Analytics \/>/);

    const files = [
      ...collectFiles(join(root, "app"), (path) => /\.(ts|tsx)$/.test(path)),
      ...collectFiles(join(root, "components"), (path) => /\.(ts|tsx)$/.test(path)),
    ];
    const offenders = files.filter((file) => ADSENSE_ENABLEMENT.test(readFileSync(file, "utf8")));
    assert.deepEqual(offenders.map((file) => relative(root, file)), []);
  });

  it("does not ship an AdSense allowlist or nonce CSP workaround", () => {
    const nextConfig = read("next.config.ts");
    const proxy = read("proxy.ts");
    const policy = cspFromNextConfig();

    assert.doesNotMatch(nextConfig, ADSENSE_ENABLEMENT);
    assert.doesNotMatch(nextConfig, /strict-dynamic|nonce-/);
    assert.doesNotMatch(policy, /strict-dynamic|nonce-|https:\/\/pagead2|https:\/\/fundingchoices/);
    assert.match(nextConfig, /key: "Content-Security-Policy"/);
    assert.match(nextConfig, /key: "Referrer-Policy"/);
    assert.match(nextConfig, /key: "X-Content-Type-Options"/);
    assert.match(nextConfig, /key: "X-Frame-Options"/);
    assert.match(nextConfig, /key: "Permissions-Policy"/);
    assert.match(nextConfig, /key: "Strict-Transport-Security"/);

    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.match(policy, /https:\/\/va\.vercel-scripts\.com/);
    assert.match(policy, /https:\/\/\*\.supabase\.co/);
    assert.match(policy, /https:\/\/s3\.tradingview\.com/);

    assert.doesNotMatch(proxy, /Content-Security-Policy|nonce|strict-dynamic|adsbygoogle/);
    assert.match(proxy, /return updateSession\(request\)/);
  });

  it("records the blocker instead of accepting an unsupported allowlist", () => {
    const adr = read("docs/project/DECISIONS.md");
    assert.match(adr, /## ADR-007:/);
    assert.match(adr, /Status: Blocked/);
    assert.doesNotMatch(
      adr,
      /## ADR-007:[\s\S]*?Status: Accepted/,
    );
    assert.match(adr, /Do not enable AdSense in this change/);
  });
});
