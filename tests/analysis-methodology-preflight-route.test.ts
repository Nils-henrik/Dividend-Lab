import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync("app/api/internal/analysis/preflight/route.ts", "utf8");

describe("analysis methodology preflight route contract", () => {
  it("is preview-only and founder-role protected", () => {
    assert.match(source, /VERCEL_ENV/);
    assert.match(source, /founder_auth_required/);
    assert.match(source, /founder_role_required/);
  });

  it("verifies an exact Nordic equity before checking company methodology", () => {
    assert.match(source, /resolveNordicEquityAnalysisTarget/);
    assert.match(source, /fetchYahooCompanyProfilePreflight/);
    assert.match(source, /methodology\.status === "supported"/);
  });

  it("fails closed when methodology verification is unavailable", () => {
    assert.match(source, /methodology_verification_unavailable/);
    assert.match(source, /Ingen analys startas förrän verifieringen fungerar igen/);
  });
});
