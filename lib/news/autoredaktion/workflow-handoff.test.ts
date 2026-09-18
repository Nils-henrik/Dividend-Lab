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
  it("keeps empty branch-create events neutral and never marks current main failed", () => {
    const preflight = workflow(
      ".github/workflows/autoredaktion-branch-preflight.yml",
    );
    assert.match(preflight, /echo "mode=empty"/);
    assert.match(preflight, /echo "mode=frozen"/);
    assert.match(
      preflight,
      /if:\s*failure\(\) && steps\.candidate\.outputs\.mode == 'candidate'/,
    );
    assert.match(preflight, /"\$sha" == "\$main_sha"/);
    assert.match(preflight, /Refusing to write Autoredaktion failure status on current main SHA/);
  });

  it("runs path, P0 and history validation before deterministic preparation", () => {
    const preflight = workflow(
      ".github/workflows/autoredaktion-branch-preflight.yml",
    );
    const candidate = preflight.indexOf("npm run autoredaktion:validate-candidate");
    const preparation = preflight.indexOf("npm run autoredaktion:prepare-branch");
    assert.ok(candidate >= 0);
    assert.ok(preparation > candidate);
    assert.match(preflight, /npm run autoredaktion:validate-history/);
  });

  it("creates the one managed draft PR and explicitly dispatches Quality Gate after preflight success", () => {
    const preflight = workflow(
      ".github/workflows/autoredaktion-branch-preflight.yml",
    );
    const successStatus = preflight.indexOf(
      "Mark prepared head safe to open PR",
    );
    const handoff = preflight.indexOf(
      "Ensure one managed draft PR and Quality Gate handoff",
    );

    assert.ok(successStatus >= 0);
    assert.ok(handoff > successStatus);
    assert.match(preflight, /actions:\s*write/);
    assert.match(preflight, /pull-requests:\s*write/);
    assert.match(preflight, /gh pr create/);
    assert.match(preflight, /AUTOREDAKTION_MANAGED_V2/);
    assert.match(preflight, /--draft/);
    assert.match(preflight, /--label autoredaktion/);
    assert.match(preflight, /gh workflow run quality-gate\.yml/);
    assert.match(preflight, /select\(\.head_sha ==/);
    assert.match(preflight, /no duplicate dispatch/i);
  });

  it("hands an explicitly dispatched Quality Gate result to release without relying on a suppressed token event", () => {
    const quality = workflow(".github/workflows/quality-gate.yml");
    const release = workflow(".github/workflows/autoredaktion-release.yml");

    assert.match(quality, /handoff_managed_release:/);
    assert.match(quality, /needs:\s*quality/);
    assert.match(quality, /always\(\)/);
    assert.match(quality, /actions:\s*write/);
    assert.match(quality, /gh workflow run autoredaktion-release\.yml/);
    assert.match(quality, /-f head_branch="\$HEAD_BRANCH"/);
    assert.match(quality, /-f head_sha="\$HEAD_SHA"/);
    assert.match(quality, /-f run_conclusion="\$GATE_CONCLUSION"/);
    assert.match(release, /workflow_dispatch:/);
    assert.match(
      release,
      /HEAD_BRANCH:\s*\$\{\{ inputs\.head_branch \|\| github\.event\.workflow_run\.head_branch \}\}/,
    );
    assert.match(
      release,
      /RUN_HEAD_SHA:\s*\$\{\{ inputs\.head_sha \|\| github\.event\.workflow_run\.head_sha \}\}/,
    );
  });

  it("freezes post-handoff pushes and revalidates exact managed history before release", () => {
    const preflight = workflow(
      ".github/workflows/autoredaktion-branch-preflight.yml",
    );
    const release = workflow(".github/workflows/autoredaktion-release.yml");
    assert.match(preflight, /Managed PR already exists; branch is frozen/);
    assert.match(release, /Enforce immutable managed branch history/);
    assert.match(release, /AUTOREDAKTION_HEAD_SHA="\$head"/);
    assert.match(release, /Missing successful autoredaktion\/preflight status on \$pr_head/);
    assert.match(release, /autoredaktion-repair-used/);
  });

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
