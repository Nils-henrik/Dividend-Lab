import assert from "node:assert/strict";
import { it } from "node:test";
import { POST } from "../../app/api/internal/model-portfolios/run/route";

it("rejects unauthenticated manual runs before parsing the body or starting work", async () => {
  const previous = process.env.MODEL_PORTFOLIO_CRON_SECRET;
  process.env.MODEL_PORTFOLIO_CRON_SECRET = "local-test-secret-with-no-production-value";
  try {
    for (const authorization of [undefined, "Bearer wrong", "supabase-cron-v1"]) {
      let bodyRead = false;
      const headers = new Headers({ "x-divlab-scheduler": "supabase-cron-v1" });
      if (authorization) headers.set("authorization", authorization);
      const request = {
        headers,
        json: async () => { bodyRead = true; return { manualTest: true }; },
      } as unknown as Request;
      const response = await POST(request);
      assert.equal(response.status, 404);
      assert.equal(bodyRead, false);
    }
  } finally {
    if (previous === undefined) delete process.env.MODEL_PORTFOLIO_CRON_SECRET;
    else process.env.MODEL_PORTFOLIO_CRON_SECRET = previous;
  }
});
