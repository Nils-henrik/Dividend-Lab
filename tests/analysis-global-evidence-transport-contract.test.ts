import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Global Evidence transport contract", () => {
  it("keeps SEC retries bounded and transient-only", async () => {
    const extraction = await source("lib/analysis/global-evidence-extraction.ts");

    assert.match(extraction, /MAX_FETCH_ATTEMPTS_PER_DOCUMENT = 2/);
    assert.match(extraction, /TRANSIENT_RETRY_DELAY_MS = 750/);
    assert.doesNotMatch(extraction, /status === 403/);
    assert.match(extraction, /status === 408/);
    assert.match(extraction, /status === 425/);
    assert.match(extraction, /status === 429/);
    assert.match(extraction, /status >= 500/);
    assert.match(extraction, /retryable: false/);
    assert.match(extraction, /retryable: true/);
    assert.match(extraction, /if \(!result\.retryable \|\| attempt >= MAX_FETCH_ATTEMPTS_PER_DOCUMENT\)/);
    assert.match(extraction, /\.slice\(0, GLOBAL_EVIDENCE_BOUNDS\.maxDocuments\)/);
  });

  it("declares DivLab according to SEC Fair Access guidance across discovery and extraction", async () => {
    const extraction = await source("lib/analysis/global-evidence-extraction.ts");
    const discovery = await source("lib/analysis/global-primary-sources.ts");

    assert.match(extraction, /const USER_AGENT = "DivLab kontakt@divlab\.se"/);
    assert.match(extraction, /"Accept-Encoding": "gzip, deflate"/);
    assert.match(extraction, /"User-Agent": USER_AGENT/);
    assert.doesNotMatch(extraction, /\+https:\/\/divlab\.se\/contact/);

    assert.match(discovery, /const SEC_USER_AGENT = "DivLab kontakt@divlab\.se"/);
    assert.match(discovery, /"Accept-Encoding": "gzip, deflate"/);
    assert.match(discovery, /"User-Agent": SEC_USER_AGENT/);
    assert.doesNotMatch(discovery, /SEC_USER_AGENT = "DivLab\/1\.0 \(\+https:\/\/divlab\.se\/contact\)"/);
  });

  it("keeps the Research Coverage endpoint fail-closed while exposing transport diagnostics", async () => {
    const route = await source("app/api/internal/analysis/us-research-coverage/route.ts");

    assert.match(route, /if \(!extraction\.bundle\.qualityGate\.ready\)/);
    assert.match(route, /evidenceFailures: extraction\.failures/);
    assert.match(route, /Transportfel:/);
    assert.match(route, /analysisExecutionEnabled:\s*false/);
    assert.doesNotMatch(route, /createDivLabAiAnalysis/);
    assert.doesNotMatch(route, /persistDivLabAnalysis/);
  });
});
