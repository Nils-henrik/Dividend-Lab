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
const enrichmentSource = readFileSync(
  new URL("../lib/model-portfolios/engine/primary-source-enrichment.ts", import.meta.url),
  "utf8",
);
const documentSource = readFileSync(
  new URL("../lib/model-portfolios/engine/official-document.ts", import.meta.url),
  "utf8",
);

describe("Dedicated Nordic period-aware report discovery contract", () => {
  it("keeps the existing hard 3-current + 2-annual dedicated request ceiling", () => {
    assert.match(analysisSource, /currentReport:\s*3/);
    assert.match(analysisSource, /annualReport:\s*2/);
    assert.match(analysisSource, /total:\s*5/);
    assert.match(analysisSource, /function exactFreeTextFetch/);
    assert.match(analysisSource, /if \(requestUsed\)/);
    assert.match(analysisSource, /status:\s*429/);
  });

  it("uses period-aware ticker and issuer terms while retaining shared issuer filtering", () => {
    assert.match(analysisSource, /export function nordicCurrentReportIntentTerms/);
    assert.match(analysisSource, /export function nordicAnnualReportIntentTerms/);
    assert.match(analysisSource, /quarter:\s*"Q2"/);
    assert.match(analysisSource, /phrase:\s*"half-year"/);
    assert.match(analysisSource, /secondaryPhrase:\s*"interim report"/);
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

  it("widens only dedicated Deep Research text extraction while preserving portfolio defaults", () => {
    assert.match(enrichmentSource, /maxDocumentTextChars:\s*12_000/);
    assert.match(enrichmentSource, /value === undefined\) return OFFICIAL_DOCUMENT_BOUNDS\.maxTextChars/);
    assert.match(analysisSource, /maxDocumentTextChars:\s*PRIMARY_SOURCE_ENRICHMENT_BOUNDS\.maxDocumentTextChars/);
    assert.match(documentSource, /maxTextChars:\s*4_500/);
    assert.match(documentSource, /maxPagesExtracted:\s*6/);
  });

  it("does not widen shared portfolio scope or attachment trust", () => {
    assert.match(sharedSource, /globalName["'],\s*["']NordicMainMarkets["']/);
    assert.match(sharedSource, /attachment\.news\.eu\.nasdaq\.com/);
    assert.match(sharedSource, /HARD_MAX_SEARCH_TERMS\s*=\s*5/);
  });
});
