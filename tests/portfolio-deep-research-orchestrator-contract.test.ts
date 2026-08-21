import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("model portfolio -> Deep Research trigger boundary", () => {
  it("plans from the strategy-specific snapshot only after whole-share/risk filtering", () => {
    const value = file("lib/model-portfolios/engine/dry-run-orchestrator.ts");
    const attentionIndex = value.indexOf("selectDryRunAttentionSnapshot");
    const filterIndex = value.indexOf("const decisionInputs = await filterPortfolioDecisionInputs");
    const summaryIndex = value.indexOf("const summarySnapshot = assembled.snapshot.filter");
    const dispatchSelectionIndex = value.indexOf("deepResearchManagerSelections.push");

    assert.ok(attentionIndex >= 0);
    assert.ok(filterIndex > attentionIndex);
    assert.ok(summaryIndex > filterIndex);
    assert.ok(dispatchSelectionIndex > summaryIndex);
    assert.match(
      value.slice(summaryIndex, dispatchSelectionIndex + 300),
      /snapshotKeys\.has\(instrumentKey\(candidate\.symbol, candidate\.exchange\)\)[\s\S]*candidates: summarySnapshot/,
    );
  });

  it("persists the plan in the normal orchestration result without executing Deep Research", () => {
    const value = file("lib/model-portfolios/engine/dry-run-orchestrator.ts");
    assert.match(value, /buildPortfolioDeepResearchDispatchPlan/);
    assert.match(value, /deepResearchDispatch:\s*PortfolioDeepResearchDispatchPlan/);
    assert.match(value, /deepResearchDispatch,/);
    assert.doesNotMatch(value, /executePortfolioDeepResearchDispatchPlan/);
    assert.doesNotMatch(value, /createDivLabAiAnalysis/);
  });

  it("keeps holdings out of the new-entry Deep Research budget through the dispatch contract", () => {
    const dispatch = file("lib/analysis/portfolio-deep-research-dispatch.ts");
    assert.match(dispatch, /item\.attentionEligibility === "new_entry"/);
    assert.match(dispatch, /Existing holdings stay[\s\S]*HOLD\/SELL\/TRIM monitoring path/);
  });
});
