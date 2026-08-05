import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getResponsiveThumbnailPositionStyle,
  RESPONSIVE_THUMBNAIL_POSITION_CLASS,
} from "@/lib/news/thumbnail-position";

function getVar(
  style: ReturnType<typeof getResponsiveThumbnailPositionStyle>,
  name: "--thumb-pos-mobile" | "--thumb-pos-desktop",
): string {
  return String((style as Record<string, string>)[name]);
}

describe("getResponsiveThumbnailPositionStyle", () => {
  it("falls back to desktop position on mobile when mobile is omitted", () => {
    const style = getResponsiveThumbnailPositionStyle({
      desktop: "center 32%",
    });

    assert.equal(getVar(style, "--thumb-pos-mobile"), "center 32%");
    assert.equal(getVar(style, "--thumb-pos-desktop"), "center 32%");
  });

  it("uses separate mobile and desktop positions when both are set", () => {
    const style = getResponsiveThumbnailPositionStyle({
      desktop: "center 34%",
      mobile: "center 21%",
    });

    assert.equal(getVar(style, "--thumb-pos-mobile"), "center 21%");
    assert.equal(getVar(style, "--thumb-pos-desktop"), "center 34%");
  });

  it("uses fallback desktop when desktop is omitted", () => {
    const style = getResponsiveThumbnailPositionStyle({
      mobile: "center 18%",
      fallbackDesktop: "center 40%",
    });

    assert.equal(getVar(style, "--thumb-pos-mobile"), "center 18%");
    assert.equal(getVar(style, "--thumb-pos-desktop"), "center 40%");
  });
});

describe("RESPONSIVE_THUMBNAIL_POSITION_CLASS", () => {
  it("includes mobile-first and md desktop selectors", () => {
    assert.match(
      RESPONSIVE_THUMBNAIL_POSITION_CLASS,
      /\[object-position:var\(--thumb-pos-mobile\)\]/,
    );
    assert.match(
      RESPONSIVE_THUMBNAIL_POSITION_CLASS,
      /md:\[object-position:var\(--thumb-pos-desktop\)\]/,
    );
  });
});
