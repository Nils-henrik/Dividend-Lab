import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { appNavigation, getPageTitle } from "@/lib/constants/navigation";
import { isNavigationItemActive } from "@/lib/navigation/app-navigation-state";

const sharedNavigationSource = readFileSync(
  new URL("../components/layout/AppNavigationLinks.tsx", import.meta.url),
  "utf8",
);

describe("Följda bolag i appnavigationen", () => {
  const watchlistItem = appNavigation.find(
    (item) => item.href === "/watchlist",
  );

  it("visar en direktlänk i den autentiserade vänstermenyn", () => {
    assert.ok(watchlistItem);
    assert.equal(watchlistItem.label, "Följda bolag");
    assert.equal(watchlistItem.icon, "watchlist");
    assert.equal(watchlistItem.statusLabel, "Ny");
  });

  it("markerar följlistan aktiv och använder samma titel på mobil", () => {
    assert.ok(watchlistItem);
    assert.equal(isNavigationItemActive("/watchlist", watchlistItem), true);
    assert.equal(getPageTitle("/watchlist"), "Följda bolag");
  });

  it("delar navigationsmodell mellan desktop och mobil", () => {
    assert.match(
      sharedNavigationSource,
      /navigationSurface\?:\s*"desktop"\s*\|\s*"mobile"/,
    );
    assert.match(sharedNavigationSource, /const navigationItems = getNavigationItems/);
  });
});
