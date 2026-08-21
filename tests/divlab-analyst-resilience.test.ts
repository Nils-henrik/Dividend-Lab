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

describe("DivLab Analyst structured-output resilience", () => {
  it("uses a bounded Luna-to-Terra repair path with low reasoning effort", () => {
    const analyst = source("lib/analysis/analyst.ts");

    assert.match(analyst, /NoObjectGeneratedError/);
    assert.match(analyst, /divLabAnalystGenerationSchema/);
    assert.match(analyst, /retryMaxOutputTokens:\s*12_000/);
    assert.match(analyst, /reasoningEffort:\s*"low"/);
    assert.match(analyst, /retryModel:\s*config\.escalationModel/);
    assert.match(analyst, /attempt:\s*"repair"/);
    assert.match(analyst, /structured output generation failed/);
  });

  it("never logs the generated model text when structured output fails", () => {
    const analyst = source("lib/analysis/analyst.ts");

    assert.doesNotMatch(analyst, /error\.text/);
    assert.match(analyst, /finishReason/);
    assert.match(analyst, /causeName\(error\.cause\)/);
  });
});
