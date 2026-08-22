import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const projection = source("lib/analysis/analysis-cost-projection.ts");
const analyst = source("lib/analysis/analyst.ts");
const qualityRepair = source("lib/analysis/analyst-quality-repair.ts");
const bankAnalyst = source("lib/analysis/bank-analyst.ts");
const bankPrompt = source("lib/analysis/bank-analyst-prompt.ts");
const specialist = source("lib/analysis/financial-specialist-analyst.ts");

function has(text: string, value: string) {
  assert.ok(text.includes(value), `missing contract: ${value}`);
}

describe("DivLab Analysis cost projection contract v1", () => {
  it("keeps Light fail-closed until a real Light engine exists", () => {
    has(projection, 'reason: "light_engine_not_implemented"');
    has(projection, 'if (input.depth === "light")');
  });

  it("uses the existing model pricing helper and primary-first model policy", () => {
    has(projection, "estimateAiCostUsdMicros");
    has(projection, "MODEL_PORTFOLIO_AI_MODELS.primary");
    has(projection, "MODEL_PORTFOLIO_AI_MODELS.escalation");
    has(projection, "primaryFirstRequired: true");
    assert.equal(projection.includes("USD_PER_TOKEN"), false);
  });

  it("pins the current bounded whole-job call counts", () => {
    has(projection, 'purpose: "quality_repair"');
    has(projection, "DIVLAB_BANK_ANALYST_AI_BUDGET.maxOutputTokens");
    has(projection, "DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET.maxOutputTokens");
    has(projection, "DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET.retryMaxOutputTokens");
    has(projection, "DIVLAB_ANALYST_AI_BUDGET.maxOutputTokens");
    has(projection, "DIVLAB_ANALYST_AI_BUDGET.retryMaxOutputTokens");

    has(analyst, "maxOutputTokens: 8_000");
    has(analyst, "retryMaxOutputTokens: 12_000");
    has(analyst, "usage: mergeUsage(first.usage, repair.usage)");
    has(qualityRepair, "maxOutputTokens: 12_000");
    has(bankPrompt, "maxOutputTokens: 4_400");
    has(specialist, "maxOutputTokens: 9_000");
    has(specialist, "retryMaxOutputTokens: 12_000");
  });

  it("closes the previously unbounded financial-specialist prompt", () => {
    has(specialist, "maxPromptChars: 64_000");
    has(specialist, "financial_specialist_analyst_prompt_too_large");
    has(specialist, "value.length > DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET.maxPromptChars");
  });

  it("keeps current local prompt construction inside the 100k-character envelope", () => {
    const maxLocalTextCharsPerCall = 100_000;
    const operatingDynamicChars = 50_000 + 1_800;
    const qualityRepairDynamicChars = 64_000;
    const bankDynamicChars = 55_000;
    const specialistDynamicChars = 64_000;

    assert.ok(
      analyst.length + operatingDynamicChars < maxLocalTextCharsPerCall,
      "operating analyst source + bounded dynamic prompt exceeds projection envelope",
    );
    assert.ok(
      qualityRepair.length + qualityRepairDynamicChars < maxLocalTextCharsPerCall,
      "quality-repair source + bounded context exceeds projection envelope",
    );
    assert.ok(
      bankAnalyst.length + bankPrompt.length + bankDynamicChars < maxLocalTextCharsPerCall,
      "bank analyst sources + bounded facts exceed projection envelope",
    );
    assert.ok(
      specialist.length + specialistDynamicChars < maxLocalTextCharsPerCall,
      "financial-specialist source + bounded prompt exceeds projection envelope",
    );
  });

  it("reserves a separate protocol/schema allowance and fail-closed accounting", () => {
    has(projection, "maxLocalTextCharsPerCall: 100_000");
    has(projection, "utf8BytesPerUtf16CodeUnitCeiling: 4");
    has(projection, "providerProtocolInputTokenAllowance: 32_000");
    has(projection, 'accountingMode: "fail_closed_ceiling"');
  });
});
