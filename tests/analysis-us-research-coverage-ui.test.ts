import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("US Research Coverage Preview UI", () => {
  it("exposes the MSFT-only coverage action without persistence or publication flags", async () => {
    const operator = await source("components/analysis/AnalysisUsResearchCoverageOperator.tsx");
    const page = await source("app/analyses/internal-preview/sources/page.tsx");

    assert.match(operator, /us-research-coverage\?yahooSymbol=MSFT/);
    assert.match(operator, /Verifiera MSFT Research Coverage/);
    assert.match(operator, /Analyskörning:/);
    assert.doesNotMatch(operator, /persist:\s*true/);
    assert.doesNotMatch(operator, /publish:\s*true/);
    assert.match(page, /AnalysisUsResearchCoverageOperator/);
    assert.match(page, /Preview only/);
  });
});
