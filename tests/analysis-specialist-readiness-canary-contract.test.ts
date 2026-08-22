import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const routeSource = readFileSync(
  new URL("../app/api/internal/analysis/specialist-research-canary/route.ts", import.meta.url),
  "utf8",
);
const componentSource = readFileSync(
  new URL("../components/analysis/AnalysisSpecialistResearchReadinessOperator.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../app/analyses/internal-preview/sources/page.tsx", import.meta.url),
  "utf8",
);

describe("Specialist Research Readiness v2 Preview canary contract", () => {
  it("is Preview-only, founder-authenticated and target-locked", () => {
    assert.match(routeSource, /VERCEL_ENV\?\.trim\(\)\.toLowerCase\(\) !== "preview"/);
    assert.match(routeSource, /CREATOR_ROLES = new Set\(\["founder", "ceo_divlab", "admin"\]\)/);
    assert.match(routeSource, /await supabase\.auth\.getUser\(\)/);
    assert.match(routeSource, /getStaffRolesForUser\(user\.id\)/);
    assert.match(routeSource, /"SEB-A\.ST"/);
    assert.match(routeSource, /"INVE-B\.ST"/);
    assert.match(routeSource, /"EQT\.ST"/);
    assert.match(routeSource, /Object\.prototype\.hasOwnProperty\.call\(TARGETS, requested\)/);
  });

  it("runs only deterministic Research builders and exposes no analysis write path", () => {
    assert.match(routeSource, /loadDivLabResearchInputs/);
    assert.match(routeSource, /buildDivLabResearchPacket/);
    assert.match(routeSource, /buildBankResearch/);
    assert.match(routeSource, /buildFinancialSpecialistResearch/);
    assert.doesNotMatch(routeSource, /createDivLabAiAnalysis|createDivLabBankAiAnalysis|createDivLabFinancialSpecialistAnalysis/);
    assert.doesNotMatch(routeSource, /createDivLabAnalysisDevAdminClient|founderPersistAndPublish|persistDivLab/);
    assert.doesNotMatch(routeSource, /body\.persist|body\.publish|useEscalationModel/);
    assert.match(routeSource, /persistence:\s*null/);
    assert.match(routeSource, /publication:\s*null/);
  });

  it("requires source-bound SEB core metrics and traceable P\/B for READY", () => {
    assert.match(routeSource, /"Net ECL level"/);
    assert.match(routeSource, /"Cost\/income"/);
    assert.match(routeSource, /"LCR"/);
    assert.match(routeSource, /"NSFR"/);
    assert.match(routeSource, /"Capital buffer"/);
    assert.match(routeSource, /bankResearch\.valuation\.status === "traceable"/);
    assert.match(routeSource, /metricConfirmedAndKnown/);
    assert.match(routeSource, /specialist_canary_provenance_incomplete/);
  });

  it("requires Investor NAV plus market provenance and keeps EQT on the same specialist Research engine", () => {
    assert.match(routeSource, /"NAV\/share"/);
    assert.match(routeSource, /"Discount\/premium to NAV"/);
    assert.match(routeSource, /sourceIdsKnown\(marketSourceIds, knownSourceIds\)/);
    assert.match(routeSource, /"Total AUM"/);
    assert.match(routeSource, /"Fee-generating AUM"/);
    assert.match(routeSource, /"Trailing P\/E"/);
  });

  it("surfaces the three locked buttons on the existing noindex Preview operator page", () => {
    assert.match(componentSource, /Kör SEB-canary/);
    assert.match(componentSource, /Kör Investor-canary/);
    assert.match(componentSource, /Kör EQT-canary/);
    assert.match(componentSource, /\/api\/internal\/analysis\/specialist-research-canary/);
    assert.match(componentSource, /result\.persistence === null \? "AV" : "OVÄNTAD"/);
    assert.match(componentSource, /result\.publication === null \? "AV" : "OVÄNTAD"/);
    assert.match(pageSource, /AnalysisSpecialistResearchReadinessOperator/);
    assert.match(pageSource, /robots:\s*\{ index: false, follow: false, noarchive: true \}/);
  });
});
