import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseAddtechOwnership,
  parseAtlasOwnership,
  parseEvolutionOwnership,
  parseHmDividend,
  parseHmOwnership,
  parseNamedCeo,
  profileFromCeo,
} from "@/lib/companies/ingestion/adapters/official-profile";
import { companyFactRows, companyOwnershipRows } from "@/lib/companies/ingestion/facts";
import { collectCompanyProfileSource, COMPANY_PROFILE_SOURCES } from "@/lib/companies/ingestion/company-profile";

const FETCHED_AT = "2026-09-28T12:00:00.000Z";

describe("official company profile parsers", () => {
  it("reads verified CEOs and ignores pages without a named role", () => {
    assert.equal(parseNamedCeo("Addtech AB NIKLAS STENBERG President, Chief Executive Officer"), "Niklas Stenberg");
    assert.equal(parseNamedCeo("Executive Board Martin Lundstedt President and CEO"), "Martin Lundstedt");
    assert.equal(parseNamedCeo("Micael Johansson President and Chief Executive Officer (CEO)"), "Micael Johansson");
    assert.equal(parseNamedCeo("Stefan Widing President and CEO"), "Stefan Widing");
    assert.equal(
      parseNamedCeo("Subscribe CEO of H&M Group Daniel Erv&#233;r, born in 1981, has been President and Chief Executive Officer since 31 January 2024."),
      "Daniel Ervér",
    );
    assert.equal(parseNamedCeo("Group Management Martin Carlesund Group CEO"), "Martin Carlesund");
    assert.equal(parseNamedCeo("Home Investors Corporate governance Meet our President and CEO Vagner Rego took office as President and CEO of Atlas Copco Group on May 1, 2024."), "Vagner Rego");
    assert.equal(parseNamedCeo("Business Enablement Ulrika Kolsrud (1970) MSc Eng. President and CEO"), "Ulrika Kolsrud");
    assert.equal(parseNamedCeo("<p>No executive is named here.</p>"), null);
    assert.equal(parseNamedCeo("https://evil.example President and CEO"), null);
  });

  it("keeps CEO as-of only when the official page states it", () => {
    const atlas = profileFromCeo(
      "Vagner Rego took office as President and CEO on May 1, 2024.",
      "https://www.atlascopcogroup.com/en/investors/corporate-governance/management-and-remuneration/meet-our-president-and-ceo",
      "Atlas Copco Group",
    );
    assert.equal(atlas?.facts[0]?.valueText, "Vagner Rego");
    assert.equal(atlas?.facts[0]?.asOf, "2024-05-01");
    const volvo = profileFromCeo(
      "Martin Lundstedt President and CEO",
      "https://www.volvogroup.com/en/investors/corporate-governance/ceo-and-group-executive-board.html",
      "Volvo Group",
    );
    assert.equal(volvo?.facts[0]?.asOf, null);
  });

  it("parses dated ownership and does not treat an undated table as current", () => {
    const addtech = parseAddtechOwnership(
      `Addtech's largest shareholders 2026-08-31<table><tr><td>Owner</td><td>Shares (A)</td><td>Shares (B)</td><td>% capital</td><td>% votes</td></tr><tr><td>Anders B&#246;rjesson &amp; Tisenhult-Gruppen</td><td>1</td><td>2</td><td>2,4</td><td>16,4</td></tr></table>`,
      "https://www.addtech.com/investors-and-media/the-share/owners",
      "Addtech",
    );
    assert.equal(addtech?.ownership[0]?.ownerName, "Anders Börjesson & Tisenhult-Gruppen");
    assert.equal(addtech?.ownership[0]?.capitalPct, 2.4);
    assert.equal(addtech?.ownership[0]?.votesPct, 16.4);
    assert.equal(addtech?.ownership[0]?.asOf, "2026-08-31");
    assert.equal(parseAddtechOwnership(
      `<table><tr><td>Guessed Owner</td><td>1</td><td>2</td><td>10</td><td>10</td></tr></table>`,
      "https://www.addtech.com/investors-and-media/the-share/owners",
      "Addtech",
    ), null);

    const hm = parseHmOwnership(
      `largest shareholders as at 31 August 2026<table><tr><td>Name</td><td>Number of shares</td><td>% of total shares</td><td>% of voting rights</td></tr><tr><td>The Stefan Persson family and related companies***</td><td>1</td><td>68.27</td><td>84.91</td></tr></table>`,
      "https://hmgroup.com/investors/shareholders/",
      "H&M Group",
    );
    assert.equal(hm?.ownership[0]?.capitalPct, 68.27);
    assert.equal(hm?.ownership[0]?.votesPct, 84.91);
    assert.equal(hm?.ownership[0]?.asOf, "2026-08-31");

    const evolution = parseEvolutionOwnership(
      `<table><tr><td><strong>Candle Lake Ltd (Kenneth Dart)</strong></td><td>59,910,335</td><td>30.07%</td><td>30.07%</td><td>2026-09-15</td></tr></table>`,
      "https://www.evolution.com/investors/share-information/shareholder-structure",
      "Evolution",
    );
    assert.equal(evolution?.ownership[0]?.ownerName, "Candle Lake Ltd (Kenneth Dart)");
    assert.equal(evolution?.ownership[0]?.asOf, "2026-09-15");

    const atlas = parseAtlasOwnership(
      `<table><tr><th>December 31, 2025</th><th>% of votes</th><th>% of capital</th></tr><tr><td><p>Investor AB</p></td><td>1</td><td>2</td><td>3</td><td><p>22.4</p></td><td><p>17.1</p></td></tr></table>`,
      "https://www.atlascopcogroup.com/en/investors/atlas-copco-ab-share/shareholders",
      "Atlas Copco Group",
    );
    assert.equal(atlas?.ownership[0]?.ownerName, "Investor AB");
    assert.equal(atlas?.ownership[0]?.votesPct, 22.4);
    assert.equal(atlas?.ownership[0]?.capitalPct, 17.1);
    assert.equal(atlas?.ownership[0]?.asOf, "2025-12-31");
  });

  it("stores the stated H&M dividend and does not add the instalments", () => {
    const parsed = parseHmDividend(
      `<p>SEK 7.10 per share be distributed. The record date for the first dividend payment of SEK 3.55 per share is 7 May 2026. The second payment of SEK 3.55 per share is 5 November 2026.</p>`,
      "https://hmgroup.com/investors/dividend/",
      "H&M Group",
    );
    assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_per_share")?.valueNumeric, 7.1);
    assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_currency")?.valueText, "SEK");
    assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_year")?.valueNumeric, 2026);
    assert.equal(parsed?.facts[0]?.asOf, "2026-05-07");
    assert.equal(parseHmDividend(
      `<p>The Board is proposing a dividend of SEK 2.40 per share.</p>`,
      "https://hmgroup.com/investors/dividend/",
      "H&M Group",
    ), null);
  });

  it("attributes facts to the official source and upserts the same rows twice", () => {
    const sourceUrl = "https://hmgroup.com/investors/dividend/";
    const parsed = parseHmDividend(
      `<p>SEK 7.10 per share be distributed. The record date for the first dividend payment is 7 May 2026.</p>`,
      sourceUrl,
      "H&M Group",
    );
    assert.ok(parsed);
    const first = companyFactRows(parsed.facts, ["https://hmgroup.com"], FETCHED_AT);
    const second = companyFactRows(parsed.facts, ["https://hmgroup.com"], FETCHED_AT);
    assert.deepEqual(first, second);
    assert.equal(first?.[0]?.source_url, sourceUrl);
    assert.equal(first?.[0]?.source_publisher, "H&M Group");
    const owners = parseAddtechOwnership(
      `shareholders 2026-08-31<table><tr><td>Swedbank Robur Fonder</td><td></td><td>1</td><td>6.6</td><td>4.6</td></tr></table>`,
      "https://www.addtech.com/investors-and-media/the-share/owners",
      "Addtech",
    );
    assert.ok(owners);
    const ownerRows = companyOwnershipRows(owners.ownership, ["https://www.addtech.com"], FETCHED_AT);
    assert.equal(ownerRows?.[0]?.as_of, "2026-08-31");
    assert.deepEqual(ownerRows, companyOwnershipRows(owners.ownership, ["https://www.addtech.com"], FETCHED_AT));
  });

  it("keeps Investor on the existing profile collector and fails closed without a parser", async () => {
    assert.equal(COMPANY_PROFILE_SOURCES.investor, undefined);
    const blocked = await collectCompanyProfileSource("saab", "ownership", "https://www.saab.com/investors/the-share/ownership", {
      now: new Date(FETCHED_AT),
      fetchImpl: (async () => {
        throw new Error("should not fetch");
      }) as typeof fetch,
    });
    assert.deepEqual(blocked, { status: "error", reason: "source_not_automated" });
    const wrongHost = await collectCompanyProfileSource("addtech", "management", "https://evil.example/ceo", {
      now: new Date(FETCHED_AT),
      fetchImpl: (async () => {
        throw new Error("should not fetch");
      }) as typeof fetch,
    });
    assert.deepEqual(wrongHost, { status: "error", reason: "unexpected_source_url" });
  });
});
