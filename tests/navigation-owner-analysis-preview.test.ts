import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ANALYSIS_PREVIEW_TESTCENTER_URL } from "@/lib/analysis/preview-links";
import { appNavigation } from "@/lib/constants/navigation";

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const navigationSource = source("components/layout/AppNavigationLinks.tsx");
const sidebarSource = source("components/layout/AppSidebar.tsx");
const mobileNavSource = source("components/layout/MobileNavDrawer.tsx");
const shellClientSource = source("components/layout/AppShellClient.tsx");
const shellSource = source("components/layout/AppShell.tsx");

describe("owner-only Analysis testcenter navigation", () => {
  it("routes through Preview login and returns to the internal testcenter", () => {
    const url = new URL(ANALYSIS_PREVIEW_TESTCENTER_URL);

    assert.equal(
      url.origin,
      "https://dividend-lab-git-agent-us-research-coverage-v1-dividend-lab.vercel.app",
    );
    assert.equal(url.pathname, "/login");
    assert.equal(
      url.searchParams.get("redirect"),
      "/analyses/internal-preview/sources",
    );
  });

  it("keeps the Preview link out of ordinary appNavigation", () => {
    assert.equal(
      appNavigation.some((item) => item.label === "Analys-testcenter"),
      false,
    );
  });

  it("renders the testcenter link only behind the explicit owner flag", () => {
    assert.match(navigationSource, /isOwner\?: boolean/);
    assert.match(navigationSource, /isOwner = false/);
    assert.match(navigationSource, /\{isOwner \? \(/);
    assert.match(navigationSource, /OwnerAnalysisPreviewLink/);
    assert.match(navigationSource, /Analys-testcenter/);
    assert.match(navigationSource, /ANALYSIS_PREVIEW_TESTCENTER_URL/);
    assert.doesNotMatch(
      navigationSource,
      /isModerator[\s\S]{0,120}OwnerAnalysisPreviewLink/,
    );
  });

  it("derives owner access server-side and wires it through desktop and mobile navigation", () => {
    assert.match(shellSource, /isDivLabOwnerUser/);
    assert.match(shellSource, /isOwner=\{isOwner\}/);
    assert.match(shellClientSource, /isOwner\?: boolean/);
    assert.match(shellClientSource, /<AppSidebar[\s\S]*isOwner=\{isOwner\}/);
    assert.match(shellClientSource, /<MobileNavDrawer[\s\S]*isOwner=\{isOwner\}/);
    assert.match(sidebarSource, /isOwner=\{isOwner\}/);
    assert.match(mobileNavSource, /isOwner=\{isOwner\}/);
  });
});
