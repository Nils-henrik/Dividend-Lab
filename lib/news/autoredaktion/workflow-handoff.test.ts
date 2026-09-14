import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function workflow(pathFromRoot: string): string {
  return readFileSync(path.join(process.cwd(), pathFromRoot), "utf8");
}

function executableWorkflowText(source: string): string {
  return source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
}

describe("Autoredaktion workflow handoff contract", () => {
  it("calls production verification directly from the release state machine", () => {
    const release = workflow(".github/workflows/autoredaktion-release.yml");
    assert.match(
      release,
      /uses:\s*\.\/\.github\/workflows\/autoredaktion-production-verify\.yml/,
    );
    assert.match(
      release,
      /merge_sha:\s*\$\{\{\s*needs\.release\.outputs\.merge_sha\s*\}\}/,
    );
  });

  it("uses workflow_call instead of a push trigger for managed production verification", () => {
    const production = workflow(
      ".github/workflows/autoredaktion-production-verify.yml",
    );
    assert.match(production, /workflow_call:/);
    assert.doesNotMatch(production, /\n\s*push:\s*\n/);
    assert.match(
      production,
      /MERGE_SHA:\s*\$\{\{\s*inputs\.merge_sha\s*\}\}/,
    );
    assert.match(
      production,
      /ref:\s*\$\{\{\s*inputs\.merge_sha\s*\}\}/,
    );
  });

  it("keeps production verification observational and forbids executable redeploy commands", () => {
    const production = workflow(
      ".github/workflows/autoredaktion-production-verify.yml",
    );
    const executable = executableWorkflowText(production);

    assert.match(production, /No redeploy was triggered/);
    assert.doesNotMatch(executable, /\bvercel\s+(?:deploy|--prod)\b/i);
    assert.doesNotMatch(executable, /\bdeploy(?:ment)?[_-]?hook\b/i);
    assert.doesNotMatch(
      executable,
      /api\.vercel\.com\/v\d+\/deployments/i,
    );
  });
});
