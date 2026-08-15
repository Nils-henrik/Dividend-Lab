import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function source(): string {
  return readFileSync(
    fileURLToPath(new URL("../lib/model-portfolios/engine/nordic-primary-sources.ts", import.meta.url)),
    "utf8",
  );
}

describe("Nasdaq Nordic CNS discovery contract", () => {
  it("uses bounded freetext discovery instead of display names in company selector", () => {
    const value = source();
    assert.match(value, /searchParams\.set\("freeText", input\.searchTerm\)/);
    assert.match(value, /searchParams\.set\("company", ""\)/);
    assert.match(value, /searchParams\.set\("limit", String\(input\.count\)\)/);
    assert.doesNotMatch(value, /searchParams\.set\("count", String\(input\.count\)\)/);
    assert.match(value, /const HARD_MAX_QUERY_COUNT = 20/);
    assert.match(value, /const HARD_MAX_HITS = 12/);
    assert.match(value, /const HARD_MAX_SEARCH_TERMS = 5/);
  });

  it("keeps issuer-side filtering and the official attachment allowlist", () => {
    const value = source();
    assert.match(value, /companyNamesLikelyMatch\(issuer, companyName\)/);
    assert.match(value, /attachment\.news\.eu\.nasdaq\.com/);
    assert.match(value, /showAttachments", "true"/);
  });
});
