import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { appNavigation } from "@/lib/constants/navigation";
import {
  areNavigationGroupChildrenVisible,
  getNavigationGroupAriaExpanded,
  getNavigationItemKey,
  isNavigationChildActive,
  isNavigationItemActive,
  resolveNavigationGroupActivation,
  shouldNavigationGroupStartExpanded,
} from "@/lib/navigation/app-navigation-state";

const navigationSource = readFileSync(
  new URL("../components/layout/AppNavigationLinks.tsx", import.meta.url),
  "utf8",
);
const appSidebarSource = readFileSync(
  new URL("../components/layout/AppSidebar.tsx", import.meta.url),
  "utf8",
);
const appShellSource = readFileSync(
  new URL("../components/layout/AppShellClient.tsx", import.meta.url),
  "utf8",
);
const mobileNavSource = readFileSync(
  new URL("../components/layout/MobileNavDrawer.tsx", import.meta.url),
  "utf8",
);
const navigationConstantsSource = readFileSync(
  new URL("../lib/constants/navigation.ts", import.meta.url),
  "utf8",
);
const toolsHubSource = readFileSync(
  new URL("../app/verktyg/page.tsx", import.meta.url),
  "utf8",
);

const verktygItem = appNavigation.find((item) => item.label === "Verktyg");

describe("expandable Verktyg navigation", () => {
  it("defines Verktyg as a disclosure group without a tools-hub href", () => {
    assert.ok(verktygItem);
    assert.equal(verktygItem?.href, undefined);
    assert.deepEqual(
      verktygItem?.children?.map((child) => [child.label, child.href]),
      [
        ["Frihetsmaskinen", "/frihetsmaskinen"],
        ["GAV-kalkylatorn", "/verktyg/gav-kalkylator"],
      ],
    );
    assert.doesNotMatch(
      navigationConstantsSource,
      /label:\s*"Verktyg",\s*href:\s*"\/verktyg"/,
    );
  });

  it("renders Verktyg as a button disclosure control in the shared nav component", () => {
    assert.match(navigationSource, /type="button"/);
    assert.match(navigationSource, /aria-expanded=\{ariaExpanded\}/);
    assert.match(navigationSource, /aria-controls=\{panelId\}/);
    assert.match(navigationSource, /hidden=\{!showChildren\}/);
    assert.match(navigationSource, /onExpandSidebar/);
    assert.match(navigationSource, /resolveNavigationGroupActivation/);
    assert.doesNotMatch(
      navigationSource,
      /href=\{item\.href\}[\s\S]*label:\s*"Verktyg"/,
    );
  });

  it("marks the matching child active for each tool route", () => {
    assert.ok(verktygItem?.children);
    const [frihetsmaskinen, gav] = verktygItem.children;

    assert.equal(
      isNavigationChildActive("/frihetsmaskinen", frihetsmaskinen),
      true,
    );
    assert.equal(
      isNavigationChildActive("/verktyg/gav-kalkylator", frihetsmaskinen),
      false,
    );
    assert.equal(
      isNavigationChildActive("/verktyg/gav-kalkylator", gav),
      true,
    );
    assert.equal(isNavigationChildActive("/frihetsmaskinen", gav), false);
  });

  it("treats either tool route as an active Verktyg section", () => {
    assert.ok(verktygItem);
    assert.equal(isNavigationItemActive("/frihetsmaskinen", verktygItem), true);
    assert.equal(
      isNavigationItemActive("/verktyg/gav-kalkylator", verktygItem),
      true,
    );
    assert.equal(isNavigationItemActive("/dashboard", verktygItem), false);
    assert.equal(isNavigationItemActive("/verktyg", verktygItem), false);
  });

  it("starts expanded on tool routes and collapsed elsewhere", () => {
    assert.ok(verktygItem);
    assert.equal(
      shouldNavigationGroupStartExpanded("/frihetsmaskinen", verktygItem),
      true,
    );
    assert.equal(
      shouldNavigationGroupStartExpanded(
        "/verktyg/gav-kalkylator",
        verktygItem,
      ),
      true,
    );
    assert.equal(
      shouldNavigationGroupStartExpanded("/dashboard", verktygItem),
      false,
    );
    assert.equal(
      shouldNavigationGroupStartExpanded("/verktyg", verktygItem),
      false,
    );
  });

  it("keeps desktop and mobile on the shared navigation component model", () => {
    assert.match(
      navigationSource,
      /navigationSurface\?:\s*"desktop"\s*\|\s*"mobile"/,
    );
    assert.match(navigationSource, /function NavigationGroup/);
    assert.match(
      navigationSource,
      /areNavigationGroupChildrenVisible\(\s*isExpanded,\s*isCollapsed,\s*\)/,
    );
  });

  it("retains the public tools landing page route", () => {
    assert.match(toolsHubSource, /export default function ToolsPage/);
    assert.match(toolsHubSource, /getCanonicalUrl\("\/verktyg"\)/);
    assert.match(toolsHubSource, /href: "\/frihetsmaskinen"/);
    assert.match(toolsHubSource, /href: "\/verktyg\/gav-kalkylator"/);
  });

  it("uses a stable key for disclosure groups without href", () => {
    assert.ok(verktygItem);
    assert.equal(getNavigationItemKey(verktygItem), "group:Verktyg");
  });
});

describe("collapsed sidebar Verktyg disclosure accessibility", () => {
  it("requests sidebar expansion and forces the group open when activated while collapsed", () => {
    assert.deepEqual(
      resolveNavigationGroupActivation({
        isSidebarCollapsed: true,
        isGroupExpanded: false,
      }),
      {
        shouldRequestSidebarExpand: true,
        nextGroupExpanded: true,
      },
    );

    assert.deepEqual(
      resolveNavigationGroupActivation({
        isSidebarCollapsed: true,
        isGroupExpanded: true,
      }),
      {
        shouldRequestSidebarExpand: true,
        nextGroupExpanded: true,
      },
    );
  });

  it("toggles only the group when the desktop sidebar is already expanded", () => {
    assert.deepEqual(
      resolveNavigationGroupActivation({
        isSidebarCollapsed: false,
        isGroupExpanded: false,
      }),
      {
        shouldRequestSidebarExpand: false,
        nextGroupExpanded: true,
      },
    );

    assert.deepEqual(
      resolveNavigationGroupActivation({
        isSidebarCollapsed: false,
        isGroupExpanded: true,
      }),
      {
        shouldRequestSidebarExpand: false,
        nextGroupExpanded: false,
      },
    );
  });

  it("reveals children only after both the group and sidebar are expanded", () => {
    assert.equal(areNavigationGroupChildrenVisible(true, true), false);
    assert.equal(areNavigationGroupChildrenVisible(false, false), false);
    assert.equal(areNavigationGroupChildrenVisible(true, false), true);
  });

  it("keeps aria-expanded false while the controlled panel is hidden by a collapsed sidebar", () => {
    assert.equal(getNavigationGroupAriaExpanded(true, true), false);
    assert.equal(getNavigationGroupAriaExpanded(false, true), false);
    assert.equal(getNavigationGroupAriaExpanded(true, false), true);
    assert.equal(getNavigationGroupAriaExpanded(false, false), false);

    const collapsedButGroupOpen = resolveNavigationGroupActivation({
      isSidebarCollapsed: true,
      isGroupExpanded: true,
    });
    assert.equal(collapsedButGroupOpen.shouldRequestSidebarExpand, true);
    assert.equal(
      getNavigationGroupAriaExpanded(
        collapsedButGroupOpen.nextGroupExpanded,
        true,
      ),
      false,
    );
    assert.equal(
      areNavigationGroupChildrenVisible(
        collapsedButGroupOpen.nextGroupExpanded,
        false,
      ),
      true,
    );
    assert.equal(
      getNavigationGroupAriaExpanded(
        collapsedButGroupOpen.nextGroupExpanded,
        false,
      ),
      true,
    );
  });

  it("wires openSidebar through AppShellClient and AppSidebar", () => {
    assert.match(appShellSource, /onExpandSidebar=\{openSidebar\}/);
    assert.match(appSidebarSource, /onExpandSidebar: \(\) => void/);
    assert.match(appSidebarSource, /onExpandSidebar=\{onExpandSidebar\}/);
  });

  it("leaves mobile navigation on the shared nested flow without sidebar expand wiring", () => {
    assert.match(mobileNavSource, /navigationSurface="mobile"/);
    assert.match(mobileNavSource, /onNavigate=\{onClose\}/);
    assert.doesNotMatch(mobileNavSource, /onExpandSidebar/);
    assert.match(
      navigationSource,
      /onExpandSidebar\?: \(\) => void/,
    );
  });
});
