import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function migration(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../supabase/migrations/${name}`, import.meta.url)),
    "utf8",
  );
}

const EXTEND_BANK_CONTENT_RPC =
  "20260815094849_extend_analysis_content_rpc_for_bank_v3.sql";
const FIX_SOURCE_QUALIFICATION =
  "20260815095239_fix_bank_content_rpc_source_qualification.sql";

describe("DivLab analysis migration contracts", () => {
  it("keeps the bank content RPC service-role-only without deprecated auth.role checks", () => {
    const sql = migration(EXTEND_BANK_CONTENT_RPC);

    assert.match(sql, /security invoker/i);
    assert.doesNotMatch(sql, /auth\.role\s*\(/i);
    assert.match(
      sql,
      /revoke all on function public\.persist_divlab_analysis_content[\s\S]*from public, anon, authenticated;/i,
    );
    assert.match(
      sql,
      /grant execute on function public\.persist_divlab_analysis_content[\s\S]*to service_role;/i,
    );
  });

  it("qualifies source/version identifiers in the table-returning RPC to avoid PL/pgSQL OUT-column ambiguity", () => {
    const sql = migration(FIX_SOURCE_QUALIFICATION);

    assert.match(
      sql,
      /from public\.divlab_analysis_versions as version_row\s+where version_row\.id = p_analysis_version_id;/i,
    );
    assert.match(
      sql,
      /from public\.divlab_analysis_sources as source\s+where source\.analysis_version_id = p_analysis_version_id\s+and source\.source_key = v_source_id/i,
    );
    assert.doesNotMatch(
      sql,
      /from public\.divlab_analysis_sources\s+where analysis_version_id = p_analysis_version_id/i,
    );
  });
});
