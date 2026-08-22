import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const entitlementSource = readFileSync(
  new URL("../lib/analysis/analysis-entitlement.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL("../supabase/migrations/20260822172000_add_divlab_analysis_entitlement_contract.sql", import.meta.url),
  "utf8",
);

function sourceHas(value: string) {
  assert.ok(entitlementSource.includes(value), `missing entitlement contract: ${value}`);
}

function migrationHas(value: string) {
  assert.ok(migration.includes(value), `missing entitlement migration contract: ${value}`);
}

describe("DivLab Analysis Entitlement Interface v1", () => {
  it("is server-only and product-depth aware", () => {
    sourceHas('import "server-only"');
    sourceHas('export type DivLabAnalysisDepth = "light" | "deep"');
    sourceHas("interface DivLabAnalysisEntitlementProvider");
    sourceHas("analysisDepth: DivLabAnalysisDepth");
  });

  it("defines reservation and release without selecting a commercial provider", () => {
    sourceHas("reserve(");
    sourceHas("release(");
    sourceHas("providerId: string");
    sourceHas("expiresAt: string");
    sourceHas("reservationId: string");
    assert.equal(entitlementSource.includes("Stripe"), false);
    assert.equal(entitlementSource.includes("@stripe"), false);
  });

  it("validates provider identity binding and expiry before persistence", () => {
    sourceHas("validateDivLabAnalysisEntitlementReservation");
    sourceHas("reservation.requestId === expected.requestId");
    sourceHas("reservation.userId === expected.userId");
    sourceHas("reservation.analysisDepth === expected.analysisDepth");
    sourceHas("expiresAt > nowMs");
    sourceHas("expiresAt > reservedAt");
  });

  it("fails closed when no entitlement adapter is configured", () => {
    sourceHas("createFailClosedAnalysisEntitlementProvider");
    sourceHas('id: "unconfigured"');
    sourceHas('reason: "provider_not_configured"');
    sourceHas('reason: "provider_unavailable"');
  });

  it("persists provider provenance and expiry as paired request metadata", () => {
    migrationHas("entitlement_provider_id text null");
    migrationHas("entitlement_expires_at timestamptz null");
    migrationHas("divlab_analysis_requests_entitlement_metadata_shape");
    migrationHas("entitlement_reservation_id is not null");
    migrationHas("entitlement_provider_id is not null");
    migrationHas("entitlement_expires_at is not null");
  });

  it("makes entitlement provenance immutable once set", () => {
    migrationHas("divlab_analysis_entitlement_provider_immutable");
    migrationHas("divlab_analysis_entitlement_expiry_immutable");
    migrationHas("before update of");
    migrationHas("entitlement_provider_id");
    migrationHas("entitlement_expires_at");
  });

  it("fails closed if entitlement is stale at queue or running admission", () => {
    migrationHas("old.status = 'pending_entitlement' and new.status = 'queued'");
    migrationHas("new.entitlement_expires_at <= new.queued_at");
    migrationHas("divlab_analysis_entitlement_not_live_at_queue");
    migrationHas("old.status = 'queued' and new.status = 'running'");
    migrationHas("new.entitlement_expires_at <= new.started_at");
    migrationHas("divlab_analysis_entitlement_expired_before_running");
  });

  it("does not expose an entitlement mutation function to browser roles", () => {
    migrationHas("revoke all on function public.divlab_analysis_requests_enforce_entitlement()");
    migrationHas("from public, anon, authenticated");
    migrationHas("to service_role");
    assert.equal(migration.includes("create policy"), false);
  });
});
