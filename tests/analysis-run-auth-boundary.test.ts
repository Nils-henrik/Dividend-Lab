import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  new URL("../app/api/internal/analysis/run/route.ts", import.meta.url),
  "utf8",
);

describe("internal analysis execution auth boundary", () => {
  it("requires authenticated DivLab staff before any heavy execution path", () => {
    const authClient = routeSource.indexOf(
      "const authSupabase = await createAuthenticatedSupabaseClient()",
    );
    const session = routeSource.indexOf("await authSupabase.auth.getUser()", authClient);
    const roles = routeSource.indexOf("await getStaffRolesForUser(user.id)", session);
    const targetResolution = routeSource.indexOf("const curated = getCuratedPeerSet", roles);
    const providerPreflight = routeSource.indexOf(
      "await fetchYahooCompanyProfilePreflight",
      targetResolution,
    );
    const operatingExecution = routeSource.indexOf("await createDivLabAiAnalysis", providerPreflight);
    const bankExecution = routeSource.indexOf("await createDivLabBankAiAnalysis", providerPreflight);
    const specialistExecution = routeSource.indexOf(
      "await createDivLabFinancialSpecialistAnalysis",
      providerPreflight,
    );

    for (const index of [
      authClient,
      session,
      roles,
      targetResolution,
      providerPreflight,
      operatingExecution,
      bankExecution,
      specialistExecution,
    ]) {
      assert.ok(index >= 0);
    }

    assert.ok(authClient < session);
    assert.ok(session < roles);
    assert.ok(roles < targetResolution);
    assert.ok(roles < providerPreflight);
    assert.ok(roles < operatingExecution);
    assert.ok(roles < bankExecution);
    assert.ok(roles < specialistExecution);
  });

  it("keeps execution Preview-only and restricted to the existing staff roles", () => {
    assert.match(
      routeSource,
      /process\.env\.VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/,
    );
    assert.match(
      routeSource,
      /const CREATOR_ROLES = new Set\(\["founder", "ceo_divlab", "admin"\]\)/,
    );
    assert.match(routeSource, /status: "founder_auth_required"/);
    assert.match(routeSource, /status: "founder_role_required"/);
  });

  it("does not condition authentication on publish or persistence", () => {
    const authClient = routeSource.indexOf(
      "const authSupabase = await createAuthenticatedSupabaseClient()",
    );
    const bodyRead = routeSource.indexOf("const body = (await request.json()", authClient);
    const publishRead = routeSource.indexOf("const publish = body.publish === true", bodyRead);

    assert.ok(authClient >= 0);
    assert.ok(bodyRead > authClient);
    assert.ok(publishRead > authClient);
    assert.doesNotMatch(
      routeSource.slice(0, bodyRead),
      /if \(publish\)[\s\S]*createAuthenticatedSupabaseClient/,
    );
  });

  it("preserves the existing publish-persist invariant and founder publication path", () => {
    assert.match(routeSource, /if \(publish && !persist\)/);
    assert.match(routeSource, /founderPersistAndPublishDivLabAnalysis/);
    assert.match(routeSource, /founderPersistAndPublishSpecialistAnalysis/);
  });
});
