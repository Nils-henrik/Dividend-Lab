import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("DivLab Analyst post-valuation quality repair contract", () => {
  it("allows exactly one bounded repair and re-runs the unchanged quality gate", async () => {
    const service = await source("lib/analysis/ai-analysis-service.ts");

    assert.match(service, /repairDivLabAnalystDraftForQuality/);
    assert.equal(
      (service.match(/await repairDivLabAnalystDraftForQuality\(/g) ?? []).length,
      1,
    );
    assert.ok(
      (service.match(/evaluateAnalystContentQuality\(/g) ?? []).length >= 2,
      "quality gate must run before and after the bounded repair",
    );
    assert.match(service, /if \(!analystQualityGate\.publishable\)[\s\S]*stage: "analyst_quality"/);
    assert.doesNotMatch(service, /score\s*>?=\s*(?:8\d|9\d)/);
  });

  it("feeds concrete blockers and deterministic scenario output to Terra without relaxing provenance", async () => {
    const repair = await source("lib/analysis/analyst-quality-repair.ts");

    assert.match(repair, /config\.escalationModel/);
    assert.match(repair, /failedQualityGate/);
    assert.match(repair, /deterministicScenarioResult/);
    assert.match(repair, /validateAnalystDraftAgainstPacket/);
    assert.match(repair, /Bear < Base < Bull/);
    assert.match(repair, /Uppfinn aldrig en källa/);
    assert.match(repair, /qualityFactor saknar tillräckligt stöd/);
    assert.match(repair, /maxOutputTokens: 12_000/);
  });

  it("returns and renders the exact failed gate diagnostics in Preview", async () => {
    const route = await source("app/api/internal/analysis/run/route.ts");
    const operator = await source("components/analysis/AnalysisPreviewOperator.tsx");

    assert.match(route, /researchQuality: result\.finalPacket\.qualityGate\.score/);
    assert.match(route, /analystQuality: result\.analystQualityGate\.score/);
    assert.match(route, /blockers: result\.analystQualityGate\.blockers/);
    assert.match(route, /failedChecks:/);
    assert.match(operator, /result\.blockers\?\.length/);
    assert.match(operator, /Failed checks:/);
  });
});
