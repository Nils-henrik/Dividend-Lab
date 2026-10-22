import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAuthorizedModelPortfolioScheduler } from "../lib/model-portfolios/cron-auth";

const secret = "local-test-secret-with-no-production-value";
const marker = { "x-divlab-scheduler": "supabase-cron-v1" };

describe("model portfolio scheduler authentication", () => {
  it("rejects the publicly known marker without a secret", () => {
    assert.equal(isAuthorizedModelPortfolioScheduler(new Headers(marker), secret), false);
  });

  it("fails closed for missing configuration, forged tokens and other callers", () => {
    for (const [headers, configured] of [
      [new Headers(marker), undefined],
      [new Headers({ ...marker, authorization: `Bearer ${secret}` }), " "],
      [new Headers({ ...marker, authorization: "Bearer wrong" }), secret],
      [new Headers({ ...marker, authorization: secret }), secret],
      [new Headers({ ...marker, authorization: `Bearer ${secret}x` }), secret],
      [new Headers({ authorization: `Bearer ${secret}` }), secret],
    ] as const) {
      assert.equal(isAuthorizedModelPortfolioScheduler(headers, configured), false);
    }
  });

  it("accepts only the intended scheduler with its exact bearer credential", () => {
    assert.equal(isAuthorizedModelPortfolioScheduler(
      new Headers({ ...marker, authorization: `Bearer ${secret}` }), secret,
    ), true);
  });
});
