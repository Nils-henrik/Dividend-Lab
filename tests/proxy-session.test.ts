import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { NextRequest, NextResponse } from "next/server";
import { RECOVERY_PENDING_COOKIE } from "../lib/auth/recovery";
import { applyContentSecurityPolicyHeader } from "../lib/security/content-security-policy";
import { updateSession } from "../lib/supabase/middleware";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function request(path: string, cookies: Record<string, string> = {}) {
  const headers = new Headers();
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

describe("Proxy session preservation", () => {
  it("keeps proxy.ts as a pure updateSession pass-through", () => {
    const source = readFileSync(join(root, "proxy.ts"), "utf8");
    assert.match(source, /return updateSession\(request\);/);
    assert.doesNotMatch(source, /generateCspNonce|Content-Security-Policy|x-nonce/);
    assert.doesNotMatch(source, /ADSENSE_SCRIPT_SOURCES/);
  });

  it("does not redirect when no recovery cookie is present", async () => {
    const response = await updateSession(request("/news"));
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.status, 200);
  });

  it("redirects recovery-pending traffic to /reset-password except allowlisted auth paths", async () => {
    const cookies = { [RECOVERY_PENDING_COOKIE]: "1" };

    const blocked = await updateSession(request("/news", cookies));
    assert.equal(blocked.status, 307);
    assert.equal(new URL(blocked.headers.get("location") ?? "", "http://localhost:3000").pathname, "/reset-password");

    const allowed = await Promise.all([
      updateSession(request("/reset-password", cookies)),
      updateSession(request("/login", cookies)),
      updateSession(request("/auth/callback", cookies)),
      updateSession(request("/auth/callback/recovery", cookies)),
    ]);

    for (const response of allowed) {
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("location"), null);
    }
  });

  it("clears the search string on recovery redirects", async () => {
    const response = await updateSession(
      request("/news?utm=1", { [RECOVERY_PENDING_COOKIE]: "1" }),
    );
    const location = new URL(response.headers.get("location") ?? "", "http://localhost:3000");
    assert.equal(location.pathname, "/reset-password");
    assert.equal(location.search, "");
  });

  it("leaves an existing Set-Cookie intact when CSP is applied after updateSession", async () => {
    const response = await updateSession(request("/privacy"));
    response.cookies.set("sb-example", "session-value", { path: "/" });
    applyContentSecurityPolicyHeader(response.headers, "default-src 'self'");

    assert.match(response.headers.get("set-cookie") ?? "", /sb-example=session-value/);
    assert.equal(response.headers.get("content-security-policy"), "default-src 'self'");
  });

  it("can clone a NextResponse.next() result without dropping later cookie writes", () => {
    const response = NextResponse.next();
    response.cookies.set("sb-refresh", "1", { path: "/", sameSite: "lax" });
    applyContentSecurityPolicyHeader(response.headers, "default-src 'self'");

    assert.match(response.headers.get("set-cookie") ?? "", /sb-refresh=1/);
    assert.equal(response.headers.get("content-security-policy"), "default-src 'self'");
  });
});
