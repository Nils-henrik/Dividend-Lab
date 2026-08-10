import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchGoogleCompanyResearch } from "./google-research";

describe("optional Google research enrichment", () => {
  it("returns zero hits when Google is not configured and does not throw", async () => {
    const previousKey = process.env.GOOGLE_CSE_API_KEY;
    const previousCx = process.env.GOOGLE_CSE_CX;
    delete process.env.GOOGLE_CSE_API_KEY;
    delete process.env.GOOGLE_CSE_CX;

    try {
      let called = false;
      const hits = await searchGoogleCompanyResearch({
        companyName: "Investor AB",
        symbol: "INVE-B",
        fetchImpl: async () => {
          called = true;
          return new Response("should not be called", { status: 500 });
        },
      });
      assert.deepEqual(hits, []);
      assert.equal(called, false);
    } finally {
      if (previousKey === undefined) delete process.env.GOOGLE_CSE_API_KEY;
      else process.env.GOOGLE_CSE_API_KEY = previousKey;
      if (previousCx === undefined) delete process.env.GOOGLE_CSE_CX;
      else process.env.GOOGLE_CSE_CX = previousCx;
    }
  });

  it("treats Google HTTP failures as empty enrichment rather than research failure", async () => {
    const previousKey = process.env.GOOGLE_CSE_API_KEY;
    const previousCx = process.env.GOOGLE_CSE_CX;
    process.env.GOOGLE_CSE_API_KEY = "test-key";
    process.env.GOOGLE_CSE_CX = "test-cx";

    try {
      const hits = await searchGoogleCompanyResearch({
        companyName: "Equinor",
        symbol: "EQNR",
        fetchImpl: async () => new Response("nope", { status: 503 }),
      });
      assert.deepEqual(hits, []);
    } finally {
      if (previousKey === undefined) delete process.env.GOOGLE_CSE_API_KEY;
      else process.env.GOOGLE_CSE_API_KEY = previousKey;
      if (previousCx === undefined) delete process.env.GOOGLE_CSE_CX;
      else process.env.GOOGLE_CSE_CX = previousCx;
    }
  });
});
