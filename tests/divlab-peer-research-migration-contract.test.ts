import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const MIGRATION =
  "20260815112542_allow_peer_ready_facts_research_in_peer_audits.sql";

function sql(): string {
  return readFileSync(
    fileURLToPath(new URL(`../supabase/migrations/${MIGRATION}`, import.meta.url)),
    "utf8",
  );
}

describe("peer-ready research database contract", () => {
  it("keeps peer readiness narrow, deterministic and service-role-only", () => {
    const value = sql();
    assert.match(value, /create or replace function public\.divlab_peer_research_ready\(p_packet jsonb\)/i);
    assert.match(value, /immutable/i);
    assert.match(value, /security invoker/i);
    assert.match(value, /companyClassificationCoverage/i);
    assert.match(value, /fundamentalMethodologyCoverage/i);
    assert.match(value, /multiYearFundamentalCoverage/i);
    assert.match(value, /freshPrimarySource/i);
    assert.match(value, /primaryEvidenceCoverage/i);
    assert.match(value, /valuationTraceability/i);
    assert.match(value, /valuation-provenance-v1/i);
    assert.match(value, /\) >= 2;/i);
    assert.match(
      value,
      /revoke all on function public\.divlab_peer_research_ready\(jsonb\) from public, anon, authenticated;/i,
    );
    assert.match(
      value,
      /grant execute on function public\.divlab_peer_research_ready\(jsonb\) to service_role;/i,
    );
  });

  it("widens only peer bindings while retaining the existing target publishability predicate", () => {
    const value = sql();
    assert.match(
      value,
      /where version_row\.id = v_peer_version_id[\s\S]*or public\.divlab_peer_research_ready\(version_row\.research_packet\)/i,
    );
    assert.match(
      value,
      /pg_get_functiondef\('public\.persist_divlab_peer_comparison_audit\(jsonb\)'::regprocedure\)/i,
    );
    assert.match(
      value,
      /pg_get_functiondef\('public\.assert_divlab_peer_comparison_audit_integrity\(uuid\)'::regprocedure\)/i,
    );
    assert.match(value, /peer_audit_persist_predicate_patch_not_applied/i);
    assert.match(value, /peer_audit_integrity_predicate_patch_not_applied/i);
    assert.doesNotMatch(
      value,
      /v_target_version_id[\s\S]{0,250}divlab_peer_research_ready/i,
    );
  });
});
