import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("US Preview Deep Research runtime repair contract", () => {
  it("proves SEC provenance even when Analyst quality remains fail-closed", async () => {
    const route = await source("app/api/internal/analysis/us-deep-research-execution/route.ts");
    const analystQualityBranch = route.slice(
      route.indexOf('if (result.stage === "analyst_quality")'),
      route.indexOf('return failed("research_failed"'),
    );

    assert.match(analystQualityBranch, /expectedSourceIds/);
    assert.match(analystQualityBranch, /expectedEvidenceIds/);
    assert.match(analystQualityBranch, /secSourceProvenancePreserved/);
    assert.match(analystQualityBranch, /secEvidenceProvenancePreserved/);
    assert.match(analystQualityBranch, /usResearchCoverage/);
    assert.match(analystQualityBranch, /evidenceQuality/);
  });

  it("keeps the one bounded repair evidence-grounded while auditing all quality factors", async () => {
    const repair = await source("lib/analysis/analyst-quality-repair.ts");

    assert.match(repair, /intern faktor-för-faktor-audit av samtliga 11 qualityFactors/);
    assert.match(repair, /Markera aldrig en faktor som känd bara för att nå kvalitetsgränsen/);
    assert.match(repair, /SEC-\/primärkälleevidens kan legitimt stödja/);
    assert.match(repair, /reasoningEffort: "medium"/);
    assert.doesNotMatch(repair, /knownQualityFactors\s*>?=\s*5/);
  });
});
