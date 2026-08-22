import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const analysisSource = readFileSync(
  new URL("../lib/analysis/nordic-primary-sources.ts", import.meta.url),
  "utf8",
);
const sharedSource = readFileSync(
  new URL("../lib/model-portfolios/engine/nordic-primary-sources.ts", import.meta.url),
  "utf8",
);

describe("Dedicated Nordic explicit report discovery contract", () => {
  it("keeps the existing hard 3-current + 2-annual dedicated request ceiling", () => {
    assert.match(analysisSource, /currentReport:\s*3/);
    assert.match(analysisSource, /annualReport:\s*2/);
    assert.match(analysisSource, /total:\s*5/);
    assert.match(analysisSource, /function exactFreeTextFetch/);
    assert.match(analysisSource, /if \(requestUsed\)/);
    assert.match(analysisSource, /status:\s*429/);
  });

  it("uses issuer/ticker report-intent terms without weakening shared issuer filtering", () => {
    assert.match(analysisSource, /function currentDiscoveryTerms/);
    assert.match(analysisSource, /function annualDiscoveryTerms/);
    assert.match(analysisSource, /preferredIssuerSearchName/);
    assert.match(analysisSource, /`\$\{issuer\} interim`/);
    assert.match(analysisSource, /`\$\{ticker\} results`/);
    assert.match(analysisSource, /`\$\{issuer\} annual`/);
    assert.match(analysisSource, /url\.searchParams\.set\("freeText", freeText\)/);
    assert.match(analysisSource, /companyName:\s*input\.companyName/);
    assert.match(analysisSource, /symbol:\s*input\.symbol/);
  });

  it("fails closed if the dedicated wrapper is asked to rewrite any endpoint except Nasdaq CNS", () => {
    assert.match(analysisSource, /url\.protocol !== "https:"/);
    assert.match(analysisSource, /url\.hostname !== "api\.news\.eu\.nasdaq\.com"/);
    assert.match(analysisSource, /url\.pathname !== "\/news\/query\.action"/);
    assert.match(analysisSource, /Unexpected Nordic research endpoint/);
  });

  it("does not widen the shared portfolio discovery scope or attachment trust boundary", () => {
    assert.match(sharedSource, /globalName["'],\s*["']NordicMainMarkets["']/);
    assert.match(sharedSource, /attachment\.news\.eu\.nasdaq\.com/);
    assert.match(sharedSource, /HARD_MAX_SEARCH_TERMS\s*=\s*5/);
  });
});
