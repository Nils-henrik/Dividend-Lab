import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  new URL("../lib/analysis/global-primary-sources.ts", import.meta.url),
  "utf8",
);

describe("US SEC successor continuity source contract", () => {
  it("requires the exact curated successor registry before one predecessor submissions fetch", () => {
    assert.match(source, /resolveSecDomesticSuccessorContinuity/);
    assert.match(source, /ticker:\s*directory\.ticker/);
    assert.match(source, /currentCik:\s*directory\.cik/);
    assert.match(source, /cik:\s*continuity\.predecessorCik/);
  });

  it("keeps the final primary filing set bounded to one latest annual and one latest interim", () => {
    assert.match(source, /function boundedRegulatoryPair/);
    assert.match(source, /regulatory_interim_filing/);
    assert.match(source, /regulatory_annual_filing/);
    assert.match(source, /const regulatory = boundedRegulatoryPair/);
  });

  it("never imports predecessor issuer website candidates", () => {
    const continuityBlock = source.match(/if \(needsContinuity\)[\s\S]*?const regulatory = boundedRegulatoryPair/)?.[0] ?? "";
    assert.doesNotMatch(continuityBlock, /issuerCandidatesFromSec/);
    assert.match(source, /const issuerCandidates = issuerCandidatesFromSec\(\{\s*payload: submissions/s);
  });
});
