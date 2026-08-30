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

  it("requires Investor discount lineage to include NAV and market provenance and keeps EQT on the same specialist Research engine", () => {
    assert.match(routeSource, /"NAV\/share"/);
    assert.match(routeSource, /"Discount\/premium to NAV"/);
    assert.match(routeSource, /investmentCompanyDiscountProvenanceReady/);
    assert.match(routeSource, /navPerShare:\s*specialistResearch\.metrics\.navPerShare/);
    assert.match(routeSource, /discountToNavPct:\s*specialistResearch\.metrics\.discountToNavPct/);
    assert.match(routeSource, /marketSourceIds/);
    assert.match(routeSource, /knownSourceIds/);
    assert.match(routeSource, /"Total AUM"/);
    assert.match(routeSource, /"Fee-generating AUM"/);
    assert.match(routeSource, /"Trailing P\/E"/);
  });

  it("surfaces exactly the three locked targets on the existing noindex Preview operator page", () => {
    assert.match(componentSource, /key: "SEB-A\.ST", label: "SEB"/);
    assert.match(componentSource, /key: "INVE-B\.ST", label: "Investor"/);
    assert.match(componentSource, /key: "EQT\.ST", label: "EQT"/);
    assert.match(componentSource, /`Kör \$\{target\.label\}-canary`/);
    assert.match(componentSource, /\/api\/internal\/analysis\/specialist-research-canary/);
    assert.match(componentSource, /result\.persistence === null \? "AV" : "OVÄNTAD"/);
    assert.match(componentSource, /result\.publication === null \? "AV" : "OVÄNTAD"/);
    assert.match(pageSource, /AnalysisSpecialistResearchReadinessOperator/);
    assert.match(pageSource, /robots:\s*\{ index: false, follow: false, noarchive: true \}/);
  });
});
