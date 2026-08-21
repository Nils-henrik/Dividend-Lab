import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("DivLab analysis technical debug route", () => {
  it("stays Preview-only, deterministic and read-only", () => {
    const route = source("app/api/internal/analysis/technical-debug/route.ts");

    assert.match(route, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(route, /getCuratedPeerSet/);
    assert.match(route, /fetchYahooHistoryResearch/);
    assert.match(route, /analyzeSupportResistance/);
    assert.match(route, /technicalLevelCoverage/);
    assert.doesNotMatch(route, /createDivLabAiAnalysis/);
    assert.doesNotMatch(route, /\.from\(/);
    assert.doesNotMatch(route, /\.rpc\(/);
  });
});
