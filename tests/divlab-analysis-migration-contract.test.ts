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
const CREATE_PEER_AUDIT =
  "20260815095948_create_divlab_peer_comparison_audit_persistence.sql";
const HARDEN_PEER_AUDIT =
  "20260815100432_harden_divlab_peer_comparison_audit_persistence.sql";
const PREVENT_PEER_AUDIT_LOOKAHEAD =
  "20260815100840_prevent_divlab_peer_comparison_audit_lookahead.sql";

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

  it("keeps version-bound peer audit history immutable and service-role-only", () => {
    const sql = migration(CREATE_PEER_AUDIT);

    assert.match(sql, /create table public\.divlab_peer_comparison_audits/i);
    assert.match(sql, /create table public\.divlab_peer_comparison_audit_members/i);
    assert.match(
      sql,
      /target_analysis_version_id uuid not null references public\.divlab_analysis_versions\(id\) on delete restrict/i,
    );
    assert.match(
      sql,
      /peer_analysis_version_id uuid not null references public\.divlab_analysis_versions\(id\) on delete restrict/i,
    );
    assert.match(sql, /enable row level security/i);
    assert.match(
      sql,
      /revoke all on table public\.divlab_peer_comparison_audits from public, anon, authenticated, service_role;/i,
    );
    assert.match(
      sql,
      /grant select, insert on table public\.divlab_peer_comparison_audits to service_role;/i,
    );
    assert.doesNotMatch(
      sql,
      /grant[^;]*(update|delete)[^;]*divlab_peer_comparison_audits/i,
    );
    assert.match(sql, /security invoker/i);
    assert.match(
      sql,
      /grant execute on function public\.persist_divlab_peer_comparison_audit\(jsonb\)[\s\S]*to service_role;/i,
    );
  });

  it("requires publishable provenance-bound research and serializes peer audit retries", () => {
    const sql = migration(HARDEN_PEER_AUDIT);

    assert.match(sql, /pg_advisory_xact_lock/i);
    assert.match(sql, /v\.publishable = true/i);
    assert.match(
      sql,
      /research_packet #>> '\{qualityGate,publishable\}'\)::boolean, false\) = true/i,
    );
    assert.match(sql, /v_target_provenance_version <> 'valuation-provenance-v1'/i);
    assert.match(sql, /p_audit #>> '\{comparison,status\}' <> 'ready'/i);
  });

  it("prevents registry/source/peer lookahead beyond the target data boundary", () => {
    const sql = migration(PREVENT_PEER_AUDIT_LOOKAHEAD);

    assert.match(sql, /v_registry_data_as_of > v_target_data_as_of/i);
    assert.match(
      sql,
      /registry_source\.verified_at > v_target_data_as_of/i,
    );
    assert.match(sql, /v_peer_data_as_of > v_target_data_as_of/i);
  });
});
