import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { appNavigation } from "@/lib/constants/navigation";
import {
  getNavigationItemKey,
  isNavigationChildActive,
  isNavigationItemActive,
  shouldNavigationGroupStartExpanded,
} from "@/lib/navigation/app-navigation-state";

const navigationSource = readFileSync(
  new URL("../components/layout/AppNavigationLinks.tsx", import.meta.url),
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
    assert.match(navigationSource, /aria-expanded=\{isExpanded\}/);
    assert.match(navigationSource, /aria-controls=\{panelId\}/);
    assert.match(navigationSource, /hidden=\{!showChildren\}/);
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
      /const showChildren = isExpanded && !isCollapsed/,
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
