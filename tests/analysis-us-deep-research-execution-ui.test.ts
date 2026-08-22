import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("US Preview Deep Research operator", () => {
  it("is exposed only inside the existing Preview testcenter page", async () => {
    const page = await source("app/analyses/internal-preview/sources/page.tsx");

    assert.match(page, /AnalysisUsDeepResearchExecutionOperator/);
    assert.match(page, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(page, /<AnalysisUsDeepResearchExecutionOperator \/>/);
  });

  it("uses the dedicated POST execution endpoint and communicates the no-persist boundary", async () => {
    const operator = await source("components/analysis/AnalysisUsDeepResearchExecutionOperator.tsx");

    assert.match(operator, /\/api\/internal\/analysis\/us-deep-research-execution/);
    assert.match(operator, /method:\s*"POST"/);
    assert.match(operator, /yahooSymbol:\s*"MSFT"/);
    assert.match(operator, /Ingen persistence eller publicering är tillåten/);
    assert.match(operator, /riktig Preview-körning av Analyst-modellen/);
  });
});
