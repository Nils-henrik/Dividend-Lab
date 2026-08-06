import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PUBLIC_NAV_LINKS } from "@/lib/constants/public-navigation";
import {
  breadcrumbJsonLd,
  webApplicationJsonLd,
} from "@/lib/seo/json-ld";
import { STATIC_PUBLIC_PATHS } from "@/lib/seo/sitemap-entries";
import { absoluteUrl } from "@/lib/seo/site";

const hubSource = readFileSync(
  new URL("../../app/verktyg/page.tsx", import.meta.url),
  "utf8",
);
const gavSource = readFileSync(
  new URL(
    "../../app/verktyg/gav-kalkylator/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("public tools routes", () => {
  it("keeps both tools and Frihetsmaskinen in the canonical sitemap source", () => {
    assert.ok(STATIC_PUBLIC_PATHS.includes("/verktyg"));
    assert.ok(STATIC_PUBLIC_PATHS.includes("/verktyg/gav-kalkylator"));
    assert.ok(STATIC_PUBLIC_PATHS.includes("/frihetsmaskinen"));
  });

  it("uses the tools hub in shared public navigation", () => {
    assert.ok(
      PUBLIC_NAV_LINKS.some(
        (link) => link.href === "/verktyg" && link.label === "Verktyg",
      ),
    );
    assert.equal(
      PUBLIC_NAV_LINKS.some((link) => link.href === "/frihetsmaskinen"),
      false,
    );
  });

  it("links the hub to both public calculators", () => {
    assert.match(hubSource, /href: "\/frihetsmaskinen"/);
    assert.match(hubSource, /href: "\/verktyg\/gav-kalkylator"/);
  });

  it("declares unique Swedish metadata and canonical paths", () => {
    assert.match(
      hubSource,
      /Verktyg för sparande och investeringar \| DivLab/,
    );
    assert.match(
      gavSource,
      /GAV-kalkylator – räkna ut GAV på aktier \| DivLab/,
    );
    assert.match(hubSource, /getCanonicalUrl\("\/verktyg"\)/);
    assert.match(
      gavSource,
      /getCanonicalUrl\("\/verktyg\/gav-kalkylator"\)/,
    );
    assert.doesNotMatch(hubSource, /noindex/i);
    assert.doesNotMatch(gavSource, /noindex/i);
  });

  it("renders exactly one H1 in each server page source", () => {
    assert.equal(hubSource.match(/<h1\b/g)?.length, 1);
    assert.equal(gavSource.match(/<h1\b/g)?.length, 1);
    assert.match(gavSource, /Vad är GAV\?/);
    assert.match(gavSource, /Så räknar du ut GAV/);
  });
});

describe("tools structured data", () => {
  it("describes a free Swedish finance web application", () => {
    const data = webApplicationJsonLd({
      name: "GAV-kalkylator",
      description: "Räkna ut GAV.",
      path: "/verktyg/gav-kalkylator",
    });

    assert.equal(data["@type"], "WebApplication");
    assert.equal(data.name, "GAV-kalkylator");
    assert.equal(data.url, absoluteUrl("/verktyg/gav-kalkylator"));
    assert.equal(data.inLanguage, "sv-SE");
    assert.equal(data.applicationCategory, "FinanceApplication");
    assert.deepEqual(data.offers, {
      "@type": "Offer",
      price: "0",
      priceCurrency: "SEK",
    });
  });

  it("builds canonical breadcrumbs for the calculator", () => {
    const data = breadcrumbJsonLd([
      { name: "Hem", path: "/" },
      { name: "Verktyg", path: "/verktyg" },
      { name: "GAV-kalkylator", path: "/verktyg/gav-kalkylator" },
    ]);
    const items = data.itemListElement as Array<Record<string, unknown>>;

    assert.deepEqual(
      items.map((item) => [item.name, item.item]),
      [
        ["Hem", absoluteUrl("/")],
        ["Verktyg", absoluteUrl("/verktyg")],
        [
          "GAV-kalkylator",
          absoluteUrl("/verktyg/gav-kalkylator"),
        ],
      ],
    );
  });
});
