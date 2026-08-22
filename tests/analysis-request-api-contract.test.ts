import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  new URL("../app/api/analysis/requests/route.ts", import.meta.url),
  "utf8",
);
const serviceSource = readFileSync(
  new URL("../lib/analysis/analysis-request-service.ts", import.meta.url),
  "utf8",
);

function routeHas(value: string) {
  assert.ok(routeSource.includes(value), `missing Request API contract: ${value}`);
}

function serviceHas(value: string) {
  assert.ok(serviceSource.includes(value), `missing request-service contract: ${value}`);
}

describe("DivLab Analysis Request API v1", () => {
  it("is Preview-only and feature-flagged before any request-table write", () => {
    const envGuard = routeSource.indexOf("process.env.VERCEL_ENV");
    const featureFlag = routeSource.indexOf("DIVLAB_ANALYSIS_REQUEST_API_ENABLED");
    const adminClient = routeSource.indexOf("createDivLabAnalysisDevAdminClient()");

    assert.ok(envGuard >= 0);
    assert.ok(featureFlag >= 0);
    assert.ok(adminClient > featureFlag);
    routeHas("return new NextResponse(null, { status: 404 })");
  });

  it("requires a real authenticated user and explicit Light/Deep + idempotency UUID", () => {
    routeHas("await supabase.auth.getUser()");
    routeHas('status: "auth_required"');
    routeHas('value === "light" || value === "deep"');
    routeHas("UUID_PATTERN.test(idempotencyKey)");
  });

  it("canonicalizes the target before entitlement and refuses discovery-only equities", () => {
    const resolve = routeSource.indexOf("await resolveGlobalEquityAnalysisTarget");
    const entitlement = routeSource.indexOf("createFailClosedAnalysisEntitlementProvider()", resolve);

    assert.ok(resolve >= 0);
    assert.ok(entitlement > resolve);
    routeHas("!resolved.canRunAnalysis");
    routeHas('status: "analysis_target_not_ready"');
  });

  it("stays inert while no entitlement provider is explicitly configured", () => {
    const provider = routeSource.indexOf("createFailClosedAnalysisEntitlementProvider()");
    const providerGuard = routeSource.indexOf('entitlementProvider.id === "unconfigured"', provider);
    const adminClient = routeSource.indexOf("createDivLabAnalysisDevAdminClient()", providerGuard);

    assert.ok(provider >= 0);
    assert.ok(providerGuard > provider);
    assert.ok(adminClient > providerGuard);
    routeHas('status: "entitlement_provider_not_configured"');
  });

  it("creates/reuses an idempotent pending request before entitlement reservation", () => {
    const upsert = serviceSource.indexOf('.from("divlab_analysis_requests")');
    const reserve = serviceSource.indexOf("entitlementProvider.reserve", upsert);

    assert.ok(upsert >= 0);
    assert.ok(reserve > upsert);
    serviceHas('status: "pending_entitlement"');
    serviceHas('onConflict: "user_id,idempotency_key"');
    serviceHas("ignoreDuplicates: true");
    serviceHas("idempotency_conflict");
  });

  it("validates entitlement identity before queueing and releases on failed queue transition", () => {
    const validate = serviceSource.indexOf("validateDivLabAnalysisEntitlementReservation");
    const queued = serviceSource.indexOf('status: "queued"', validate);
    const release = serviceSource.lastIndexOf("entitlementProvider.release", queued);

    assert.ok(validate >= 0);
    assert.ok(queued > validate);
    assert.ok(release > validate);
    serviceHas("entitlement.reservation.providerId !== input.entitlementProvider.id");
    serviceHas("entitlement_reservation_id: entitlement.reservation.reservationId");
    serviceHas("entitlement_provider_id: entitlement.reservation.providerId");
    serviceHas("entitlement_expires_at: entitlement.reservation.expiresAt");
  });

  it("stops at queued and never imports an AI execution engine", () => {
    routeHas("executionStarted: false");
    assert.equal(routeSource.includes("createDivLabAiAnalysis"), false);
    assert.equal(routeSource.includes("createDivLabBankAiAnalysis"), false);
    assert.equal(routeSource.includes("createDivLabFinancialSpecialistAnalysis"), false);
    assert.equal(serviceSource.includes("createDivLabAiAnalysis"), false);
    assert.equal(serviceSource.includes("generateDivLabAnalystDraft"), false);
  });

  it("does not add payment-provider coupling", () => {
    assert.equal(routeSource.includes("Stripe"), false);
    assert.equal(serviceSource.includes("Stripe"), false);
    assert.equal(routeSource.includes("checkout"), false);
    assert.equal(serviceSource.includes("checkout"), false);
  });
});
