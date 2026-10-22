import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_AUTHENTICATED_PATH, getSafeRedirectPath } from "../lib/auth/redirects";

const origin = "https://divlab.se";

describe("authentication redirect boundaries", () => {
  it("never turns untrusted return paths into a different origin", () => {
    for (const input of [
      undefined, null, "", "https://example.invalid", "//example.invalid",
      "/\\example.invalid", "/\t/example.invalid", "/\n/example.invalid",
      "/\r/example.invalid", "/safe\\path", "/\u0000path", "/\u007fpath",
    ]) {
      const result = getSafeRedirectPath(input);
      assert.equal(result, DEFAULT_AUTHENTICATED_PATH, JSON.stringify(input));
      assert.equal(new URL(result, origin).origin, origin);
    }
  });

  it("blocks login loops after URL path normalization", () => {
    for (const input of ["/login", "/register?next=/login", "/safe/../login", "/%2e/register"]) {
      assert.equal(getSafeRedirectPath(input), DEFAULT_AUTHENTICATED_PATH, input);
    }
  });

  it("preserves local paths, queries and fragments", () => {
    for (const input of ["/dashboard", "/bolag/investor?tab=rapporter#q2", "/messages/123", "/reset-password", "/news/%C3%A5rsrapport"]) {
      assert.equal(getSafeRedirectPath(input), input);
      assert.equal(new URL(getSafeRedirectPath(input), origin).origin, origin);
    }
  });
});
