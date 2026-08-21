import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function file(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("preview peer research safety boundary", () => {
  it("hard-locks the admin client to Preview, dividend-lab-dev and dedicated server-only credentials", () => {
    const value = file("lib/analysis/dev-admin.ts");
    assert.match(value, /VERCEL_ENV[^\n]*preview/i);
    assert.match(value, /faaxloafogpsywfkpbrm/);
    assert.match(value, /DIVLAB_ANALYSIS_DEV_SUPABASE_URL/);
    assert.match(value, /DIVLAB_ANALYSIS_DEV_SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(value, /hostname !== `\$\{DIVLAB_ANALYSIS_DEV_PROJECT_REF\}\.supabase\.co`/);
    assert.doesNotMatch(value, /process\.env\.NEXT_PUBLIC_SUPABASE_URL\b/);
    assert.doesNotMatch(value, /process\.env\.SUPABASE_SERVICE_ROLE_KEY\b/);
    assert.doesNotMatch(value, /nudnybicacgvhckfndim/);
  });

  it("makes the temporary route preview-only and curated-peer-only", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /VERCEL_ENV[^\n]*preview/i);
    assert.match(value, /status: 404/);
    assert.match(value, /DIVLAB_CURATED_PEER_SETS/);
    assert.match(value, /createDivLabAnalysisDevAdminClient/);
    assert.match(value, /createDivLabPeerResearchVersion/);
    assert.match(value, /createDivLabCuratedPeerResearchExportArtifact/);
    assert.match(value, /Cache-Control/);
  });

  it("keeps catalog-wide batch validation dry-run-only and bounded", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /const BATCH_CONCURRENCY = 3/);
    assert.match(value, /batch_persistence_forbidden/);
    assert.match(value, /batch_export_forbidden/);
    assert.match(value, /exportPacket \|\| operatorExport \|\| setExport/);
    assert.match(value, /runBatchDryResearch/);
    assert.match(value, /persist: false/);
  });

  it("keeps validation export explicit, single-peer and read-only", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /url\.searchParams\.get\("export"\) === "1"/);
    assert.match(value, /persist_export_conflict/);
    assert.match(value, /buildPeerResearchValidationExport/);
    assert.match(value, /const exportMode: ExportMode/);
    assert.match(value, /runPeerResearch\(member, supabase, exportMode\)/);
    assert.match(
      value,
      /const supabase = persist[\s\S]{0,160}createDivLabAnalysisDevAdminClient\(\)/,
    );
  });

  it("keeps single-peer operator transport explicit and free of diagnostic duplication", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /url\.searchParams\.get\("operator"\) === "1"/);
    assert.match(value, /operator_requires_export/);
    assert.match(value, /buildPeerResearchOperatorExport/);
    assert.match(value, /status: "operator_export_ready"/);
    assert.match(value, /operatorExport: buildPeerResearchOperatorExport/);

    const operatorBlock = value.match(
      /if \(exportMode === "operator"\) \{[\s\S]*?\n    \}/,
    )?.[0];
    assert.ok(operatorBlock);
    assert.doesNotMatch(operatorBlock, /primaryDiagnostics/);
    assert.doesNotMatch(operatorBlock, /persistence:/);
    assert.doesNotMatch(operatorBlock, /createDivLabAnalysisDevAdminClient/);
  });

  it("adds one all-or-nothing curated set operator path without persistence or generic export mixing", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /url\.searchParams\.get\("set"\) === "1"/);
    assert.match(value, /set_requires_operator/);
    assert.match(value, /set_export_conflict/);
    assert.match(value, /createDivLabCuratedPeerResearchExportArtifact\(\{/);
    assert.match(value, /target: \{ symbol, exchange \}/);
    assert.match(value, /status: "operator_set_export_ready"/);
    assert.match(value, /status: "operator_set_export_failed"/);

    const setBlock = value.match(/if \(setExport\) \{[\s\S]*?\n  \}\n\n  if \(operatorExport/)?.[0];
    assert.ok(setBlock);
    assert.doesNotMatch(setBlock, /createDivLabAnalysisDevAdminClient/);
    assert.doesNotMatch(setBlock, /persistDivLab/);
    assert.doesNotMatch(setBlock, /primaryDiagnostics/);
  });

  it("exposes only bounded primary-source metadata on the default diagnostic path", () => {
    const value = file("app/api/internal/analysis/peer-research/route.ts");
    assert.match(value, /primaryDiagnostics/);
    assert.match(value, /documentRetrieved/);
    assert.match(value, /reportPeriod/);
    assert.match(value, /documentType/);
    assert.doesNotMatch(value, /documentExcerpt/);
    assert.doesNotMatch(value, /item\.content/);
  });
});
