import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("model portfolio evidence output contract", () => {
  it("constrains structured AI evidence ids and instrument identity to supplied inputs", () => {
    const ai = source("lib/model-portfolios/engine/ai.ts");
    assert.match(ai, /buildDecisionSchemaForEvidence/);
    assert.match(ai, /evidenceIds: z\.array\(z\.enum\(\[first, \.\.\.rest\]/);
    assert.match(ai, /symbol: z\.enum\(\[firstSymbol, \.\.\.restSymbols\]/);
    assert.match(ai, /exchange: z\.enum\(\[firstExchange, \.\.\.restExchanges\]/);
    assert.match(ai, /schema: buildDecisionSchemaForEvidence\(request\.evidence, request\.candidates\)/);
    assert.match(ai, /symbol och exchange exakt kopieras från kandidatlistans separata fält/i);
    assert.doesNotMatch(ai, /Om underlaget inte tydligt motiverar en förändring: välj HOLD/);
  });

  it("persists both the raw AI proposal and evidence validation diagnostics", () => {
    const audit = source("lib/model-portfolios/engine/decision-audit.ts");
    const orchestrator = source("lib/model-portfolios/engine/dry-run-orchestrator.ts");
    assert.match(audit, /audit_version: 4/);
    assert.match(audit, /ai_generated_decision/);
    assert.match(audit, /evidence_validation/);
    assert.match(audit, /unknown_evidence_ids/);
    assert.match(orchestrator, /generatedDecision: result\.generatedDecision/);
    assert.match(orchestrator, /evidenceValidation: result\.evidenceValidation/);
  });
});
