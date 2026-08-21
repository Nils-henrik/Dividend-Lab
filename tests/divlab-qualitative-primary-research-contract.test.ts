import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("DivLab qualitative primary-research expansion", () => {
  it("keeps dedicated Nasdaq discovery globally bounded while reserving annual-report capacity", () => {
    const analysis = file("lib/analysis/nordic-primary-sources.ts");
    const shared = file("lib/model-portfolios/engine/nordic-primary-sources.ts");

    assert.match(analysis, /currentReport:\s*3/);
    assert.match(analysis, /annualReport:\s*2/);
    assert.match(analysis, /total:\s*5/);
    assert.match(analysis, /annualDiscoverySymbol/);
    assert.match(analysis, /symbol:\s*annualDiscoverySymbol\(input\.symbol\)/);
    assert.match(shared, /const HARD_MAX_SEARCH_TERMS = 5/);
  });

  it("gives the two product-analysis document attempts distinct current and annual-report jobs", () => {
    const analysis = file("lib/analysis/nordic-primary-sources.ts");
    const enrichment = file("lib/model-portfolios/engine/primary-source-enrichment.ts");
    const document = file("lib/model-portfolios/engine/official-document.ts");

    assert.match(analysis, /export function rankNordicDeepResearchHits/);
    assert.match(analysis, /value === "annual_report" \|\| value === "year_end_report"/);
    assert.match(analysis, /maxDocuments:\s*2/);
    assert.match(analysis, /maxDocumentBytes:\s*PRIMARY_SOURCE_ENRICHMENT_BOUNDS\.maxDocumentBytes/);
    assert.match(enrichment, /const maxDocuments = input\.maxDocuments \?\? OFFICIAL_DOCUMENT_BOUNDS\.maxDocumentsPerCompanyPass/);
    assert.match(document, /maxDocumentsPerCompanyPass:\s*1/);
  });

  it("does not lower Analyst quality thresholds and exposes independent Research blockers in Preview", () => {
    const quality = file("lib/analysis/analyst-quality-gate.ts");
    const route = file("app/api/internal/analysis/run/route.ts");
    const operator = file("components/analysis/AnalysisPreviewOperator.tsx");

    assert.match(quality, /knownQualityFactors >= 6/);
    assert.match(route, /researchBlockers:\s*result\.finalPacket\.qualityGate\.blockers/);
    assert.match(route, /status:\s*"research_quality_failed"/);
    assert.match(route, /if \(!result\.finalPacket\.qualityGate\.publishable\)/);
    assert.match(operator, /Research blockers/);
    assert.match(operator, /Failed research checks/);
  });
});
