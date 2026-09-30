import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  companyAiPortfolioLinksBySlug,
  companyAiPortfolioLinksForSymbol,
  type PublicModelPortfolioHolding,
} from "../lib/companies/ai-portfolio-crosslinks";
import { COMPANY_DISCUSSION_SECTION_ID, companyDiscussionHref } from "../lib/companies/cross-navigation";

function holding(
  overrides: Partial<PublicModelPortfolioHolding> = {},
): PublicModelPortfolioHolding {
  return {
    portfolioSlug: "forsiktig",
    instrumentSymbol: "INVE-B",
    exchange: "ST",
    quantity: 10,
    status: "active",
    ...overrides,
  };
}

test("korslänkar kräver faktiskt innehav i en publik AI-portfölj", () => {
  const links = companyAiPortfolioLinksForSymbol("INVE-B.ST", [
    holding(),
    holding({ portfolioSlug: "utdelning", quantity: 4 }),
    holding({ portfolioSlug: "medelrisk", instrumentSymbol: "VOLV-B" }),
    holding({ portfolioSlug: "hog-risk", quantity: 0 }),
    holding({ portfolioSlug: "hog-risk", status: "draft", quantity: 8 }),
    holding({ portfolioSlug: "intern", instrumentSymbol: "INVE-B", quantity: 8 }),
    holding({ instrumentSymbol: "INVE B", portfolioSlug: "medelrisk" }),
    holding({ instrumentSymbol: "XACT-HDIV", exchange: "ST", portfolioSlug: "utdelning" }),
  ]);

  assert.deepEqual(links.map((link) => link.slug), ["forsiktig", "utdelning"]);
  assert.deepEqual(links.map((link) => link.href), ["/portfolios/forsiktig", "/portfolios/utdelning"]);
  assert.deepEqual(links.map((link) => link.name), ["Försiktig", "Utdelning"]);
});

test("symbolmatchning är exakt och tål börssuffix", () => {
  const links = companyAiPortfolioLinksForSymbol("INVE-B.ST", [
    holding({ instrumentSymbol: "inve-b", exchange: "st" }),
    holding({ instrumentSymbol: "INVE-B.ST", exchange: "ST", portfolioSlug: "medelrisk" }),
  ]);

  assert.deepEqual(links.map((link) => link.slug), ["forsiktig", "medelrisk"]);
  assert.deepEqual(companyAiPortfolioLinksForSymbol("VOLV-B.ST", [holding()]), []);
  assert.deepEqual(companyAiPortfolioLinksForSymbol("", [holding()]), []);
});

test("pausad portfölj räknas, otillgänglig läsning utelämnas", () => {
  const paused = companyAiPortfolioLinksForSymbol("INVE-B.ST", [
    holding({ status: "paused" }),
  ]);
  assert.deepEqual(paused.map((link) => link.slug), ["forsiktig"]);

  const companies = [
    { slug: "investor", marketDataSymbol: "INVE-B.ST" },
    { slug: "volvo", marketDataSymbol: "VOLV-B.ST" },
  ];
  assert.deepEqual(companyAiPortfolioLinksBySlug(companies, null), {});
  assert.deepEqual(
    companyAiPortfolioLinksBySlug(companies, [holding({ instrumentSymbol: "VOLV-B" })]),
    {
      volvo: [{ slug: "forsiktig", name: "Försiktig", href: "/portfolios/forsiktig" }],
    },
  );
});

test("delad marknadssymbol kopplas inte till fel bolag", () => {
  const catalog = [
    { slug: "investor", marketDataSymbol: "INVE-B.ST" },
    { slug: "investor-duplikat", marketDataSymbol: "INVE-B.ST" },
  ];
  assert.deepEqual(
    companyAiPortfolioLinksBySlug(catalog, [holding()], catalog),
    {},
  );
});

test("diskussionsankaret och innehavsläsaren är stabila och skrivfria", () => {
  const loader = readFileSync(
    new URL("../lib/model-portfolios/public-holdings.server.ts", import.meta.url),
    "utf8",
  );

  assert.equal(COMPANY_DISCUSSION_SECTION_ID, "diskussion");
  assert.equal(companyDiscussionHref("atlas-copco"), "/bolag/atlas-copco#diskussion");
  assert.match(loader, /getModelPortfolioReadContext/);
  assert.match(loader, /\.from\("model_portfolio_holdings"\)/);
  assert.match(loader, /\.gt\("quantity", 0\)/);
  assert.match(loader, /loadCompanyAiPortfolioLinks/);
  assert.doesNotMatch(loader, /\.insert\(|\.update\(|\.delete\(|\.upsert\(|migration|create table/i);
  assert.doesNotMatch(loader, /SUPABASE_SERVICE_ROLE_KEY/);
});
