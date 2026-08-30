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
const releaseSource = readFileSync(
  new URL("../lib/analysis/nasdaq-release-evidence.ts", import.meta.url),
  "utf8",
);

describe("Dedicated Nordic period-aware report discovery contract", () => {
  it("keeps the existing hard 3-current + 2-annual dedicated CNS request ceiling", () => {
    assert.match(analysisSource, /currentReport:\s*3/);
    assert.match(analysisSource, /annualReport:\s*2/);
    assert.match(analysisSource, /total:\s*5/);
    assert.match(analysisSource, /function exactFreeTextFetch/);
    assert.match(analysisSource, /if \(requestUsed\)/);
    assert.match(analysisSource, /status:\s*429/);
  });

  it("uses the existing bounded period-only window while preserving strict issuer filtering", () => {
    assert.match(analysisSource, /export function nordicCurrentReportIntentTerms/);
    assert.match(analysisSource, /quarter:\s*"Q2"/);
    assert.match(analysisSource, /phrase:\s*"half-year"/);
    assert.match(analysisSource, /periodOnlyPhrase:\s*`interim report January-June \$\{year\}`/);
    assert.match(analysisSource, /\n\s*intent\.periodOnlyPhrase,\n/);
    assert.match(analysisSource, /queryCount:\s*isPeriodOnlyReportTerm\(term\)/);
    assert.match(analysisSource, /periodOnlyTerm:\s*100/);
    assert.match(analysisSource, /url\.searchParams\.set\("freeText", freeText\)/);
    assert.match(analysisSource, /companyName:\s*input\.companyName/);
    assert.match(analysisSource, /symbol:\s*input\.symbol/);
    assert.match(sharedSource, /companyNamesLikelyMatch\(issuer, companyName\)/);
  });

  it("fails closed if the dedicated CNS wrapper is asked to rewrite another endpoint", () => {
    assert.match(analysisSource, /url\.protocol !== "https:"/);
    assert.match(analysisSource, /url\.hostname !== "api\.news\.eu\.nasdaq\.com"/);
    assert.match(analysisSource, /url\.pathname !== "\/news\/query\.action"/);
    assert.match(analysisSource, /Unexpected Nordic research endpoint/);
  });

  it("adds at most one current-report Nasdaq release-body fetch with a strict host and body budget", () => {
    assert.match(analysisSource, /const releaseCandidate = currentReportCandidate\(reportFirst\)/);
    assert.match(analysisSource, /await fetchNasdaqReleaseEvidence/);
    assert.match(releaseSource, /maxBytes:\s*750_000/);
    assert.match(releaseSource, /maxTextChars:\s*NASDAQ_RELEASE_TEXT_MAX_CHARS/);
    assert.match(releaseSource, /maxRedirects:\s*1/);
    assert.match(releaseSource, /timeoutMs:\s*8_000/);
    assert.match(releaseSource, /const ALLOWED_HOST = "view\.news\.eu\.nasdaq\.com"/);
    assert.match(releaseSource, /const ALLOWED_PATH = "\/view"/);
    assert.match(releaseSource, /redirect:\s*"manual"/);
  });

  it("keeps release and PDF provenance separate", () => {
    assert.match(analysisSource, /`nordic-release:\$\{input\.symbol\}:\$\{publishedAt\}`/);
    assert.match(analysisSource, /url:\s*release\.finalUrl/);
    assert.match(analysisSource, /documentExcerpt:\s*release\.text/);
    assert.match(analysisSource, /`nordic-primary:\$\{input\.symbol\}:\$\{publishedAt\}:\$\{index\}`/);
    assert.match(analysisSource, /url:\s*item\.documentUrl \?\? item\.hit\.url/);
  });

  it("widens only dedicated Deep Research PDF text extraction while preserving portfolio defaults", () => {
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
