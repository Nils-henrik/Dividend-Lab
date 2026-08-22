import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("shared operating-company Analyst execution contract", () => {
  it("can execute from already verified Research inputs with additive provenance", async () => {
    const service = await source("lib/analysis/ai-analysis-service.ts");

    assert.match(service, /export async function createDivLabAiAnalysisFromResearchInputs/);
    assert.match(service, /research:\s*DivLabResearchInputs/);
    assert.match(service, /additionalSources\?: readonly AnalysisSource\[\]/);
    assert.match(service, /additionalEvidence\?: readonly AnalysisEvidence\[\]/);
    assert.match(service, /\.\.\.research\.sources/);
    assert.match(service, /\.\.\.\(input\.additionalSources \?\? \[\]\)/);
    assert.match(service, /\.\.\.research\.evidence/);
    assert.match(service, /\.\.\.\(input\.additionalEvidence \?\? \[\]\)/);
    assert.match(service, /sources,\s*\n\s*evidence,/);
  });

  it("keeps the existing public service as the ordinary Research-loader wrapper", async () => {
    const service = await source("lib/analysis/ai-analysis-service.ts");
    const wrapperStart = service.indexOf("export async function createDivLabAiAnalysis(input:");
    assert.ok(wrapperStart >= 0);
    const wrapper = service.slice(wrapperStart);

    assert.match(wrapper, /loadDivLabResearchInputs\(\{/);
    assert.match(wrapper, /if \(!loaded\.ok\)/);
    assert.match(wrapper, /createDivLabAiAnalysisFromResearchInputs\(\{/);
    assert.match(wrapper, /research:\s*loaded\.value/);
    assert.doesNotMatch(wrapper, /generateDivLabAnalystDraft\(/);
    assert.doesNotMatch(wrapper, /buildDivLabResearchPacket\(/);
  });

  it("preserves the existing Nordic run route on the ordinary service entrypoint", async () => {
    const route = await source("app/api/internal/analysis/run/route.ts");

    assert.match(route, /import \{ createDivLabAiAnalysis \} from "@\/lib\/analysis\/ai-analysis-service"/);
    assert.doesNotMatch(route, /createDivLabAiAnalysisFromResearchInputs/);
    assert.match(route, /resolveNordicEquityAnalysisTarget/);
    assert.match(route, /createDivLabAiAnalysis\(\{/);
  });
});
