import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { describe, it } from "node:test";
import { acceptBrokerUrl, resolveBrokerLinks } from "@/lib/companies/broker-links";
import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import { followFeedRecencyCue } from "@/lib/companies/follow-feed";
import {
  articleCompanyLinks,
  groupCompaniesByLetter,
  groupCompaniesBySector,
  recentlyMentionedCompanies,
  selectUpcomingReports,
} from "@/lib/companies/hub";
import { COMPANY_PAGE_INDEX_MINIMUM, companyIndexSignals } from "@/lib/companies/page-model";
import { companyPageMetadataCopy } from "@/lib/companies/page-seo";
import { companyPageNavigation } from "@/lib/companies/page-nav";
import { portfolioInstrumentKey } from "@/lib/companies/portfolio-presence";
import { reportFactChanges } from "@/lib/companies/report-facts";
import type { ReportSnapshotMetric } from "@/lib/companies/report-snapshot";
import { dividendYearSeries } from "@/lib/companies/series";
import {
  formatShortPercent,
  matchShortInterest,
  parseAggregatePositions,
  parseNamedPositions,
  parseOdsRows,
  readZipEntry,
  SHORT_INTEREST_MISSING_COPY,
} from "@/lib/companies/short-interest";
import type { NewsArticle } from "@/types/news";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function metric(partial: Partial<ReportSnapshotMetric> & Pick<ReportSnapshotMetric, "id" | "amount">): ReportSnapshotMetric {
  return {
    label: partial.label ?? partial.id,
    comparisonAmount: partial.comparisonAmount ?? null,
    comparisonLabel: partial.comparisonLabel ?? null,
    reportedChangePercent: null,
    scale: "million",
    ...partial,
  };
}

describe("mäklarlänkar", () => {
  it("visar bara verifierade adresser utan query", () => {
    const investor = getCompanyProfile("investor");
    assert.ok(investor);
    const links = resolveBrokerLinks(investor);
    assert.deepEqual(links.map((link) => link.label), [
      "Handla hos Avanza ↗",
      "Handla hos Nordnet ↗",
    ]);
    assert.equal(links.every((link) => !link.href.includes("?")), true);
    assert.equal(acceptBrokerUrl("avanza", `${investor.avanzaUrl}?utm_source=divlab`), null);
    assert.equal(acceptBrokerUrl("nordnet", "https://www.nordnet.se/aktier/kurser/investor-b-inve-b-xsto?ref=affiliate"), null);
    assert.equal(acceptBrokerUrl("avanza", "https://www.avanza.se/kop/nu"), null);
  });

  it("är stängd när katalogen saknar en träff", () => {
    assert.deepEqual(resolveBrokerLinks({}), []);
    assert.equal(getPilotCompanies().every((company) => resolveBrokerLinks(company).length === 2), true);
  });
});

describe("FI blankning", () => {
  const aggregateXml = `<?xml version="1.0"?><table:table xmlns:table="urn:table" xmlns:office="urn:office" xmlns:text="urn:text"><table:table-row><table:table-cell office:value-type="string"><text:p>Investor Aktiebolag</text:p></table:table-cell><table:table-cell><text:p>549300VEBQPHRZBKUX38</text:p></table:table-cell><table:table-cell office:value="0.44" office:value-type="float"><text:p>0,44</text:p></table:table-cell><table:table-cell><text:p>2026-06-23</text:p></table:table-cell></table:table-row></table:table>`;
  const namedXml = `<?xml version="1.0"?><table:table xmlns:table="urn:table" xmlns:office="urn:office" xmlns:text="urn:text"><table:table-row><table:table-cell><text:p>Exempel Capital</text:p></table:table-cell><table:table-cell><text:p>Investor Aktiebolag</text:p></table:table-cell><table:table-cell><text:p>SE0015811963</text:p></table:table-cell><table:table-cell office:value="0.7"><text:p>0,7</text:p></table:table-cell><table:table-cell><text:p>2026-09-18</text:p></table:table-cell></table:table-row></table:table>`;

  it("läser aggregerat värde och namngiven position från ODS-rader", () => {
    const aggregates = parseAggregatePositions(parseOdsRows(aggregateXml));
    const named = parseNamedPositions(parseOdsRows(namedXml));
    const view = matchShortInterest({
      lei: "549300VEBQPHRZBKUX38",
      issuerName: "Investor Aktiebolag",
      register: { aggregates, named, fetchedAt: "2026-09-30T12:00:00.000Z" },
    });
    assert.equal(view.status, "available");
    assert.equal(view.aggregate?.percent, 0.44);
    assert.equal(view.named[0]?.holder, "Exempel Capital");
    assert.equal(formatShortPercent(0.44).includes("0"), true);
  });

  it("tolkar en saknad rad som uppgift saknas och inte som noll", () => {
    const view = matchShortInterest({
      lei: "549300VEBQPHRZBKUX38",
      issuerName: "Investor Aktiebolag",
      register: { aggregates: [], named: [], fetchedAt: "2026-09-30T12:00:00.000Z" },
    });
    assert.equal(view.status, "missing");
    assert.equal(view.aggregate, null);
    assert.equal(SHORT_INTEREST_MISSING_COPY.includes("0%"), false);
    assert.equal(formatShortPercent(0), "0,00 %");
    const panel = read("components/companies/ShortInterestPanel.tsx");
    assert.match(panel, /SHORT_INTEREST_MISSING_COPY/);
    assert.doesNotMatch(panel, /0 %|0%/);
  });

  it("gömmer sektionen utan verifierad LEI och läser en lagrad zip-post", () => {
    assert.equal(matchShortInterest({ lei: null, issuerName: null, register: null }).status, "unmatched");
    const payload = new TextEncoder().encode("content");
    const compressed = deflateRawSync(payload);
    const name = "content.xml";
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(payload.length, 22);
    header.writeUInt16LE(name.length, 26);
    const zip = Buffer.concat([header, Buffer.from(name), compressed]);
    assert.equal(new TextDecoder().decode(readZipEntry(zip, name) ?? new Uint8Array()), "content");
  });
});

describe("bolagshubb och navigering", () => {
  it("grupperar katalogen och kommande rapporter utan rankning", () => {
    const companies = getPilotCompanies();
    const sectors = groupCompaniesBySector(companies);
    assert.ok(sectors.every((group, index) => index === 0 || group.sector.localeCompare(sectors[index - 1]!.sector, "sv") >= 0));
    const letters = groupCompaniesByLetter(companies);
    assert.equal(letters[0]?.companies[0]?.displayName.localeCompare(letters[0].companies.at(-1)!.displayName, "sv") <= 0, true);
    assert.deepEqual(selectUpcomingReports([
      { slug: "investor", name: "Investor B", ticker: "INVE B", title: "Q3", date: "2026-10-20" },
      { slug: "abb", name: "ABB", ticker: "ABB", title: "Gammal", date: "2026-01-01" },
    ], "2026-09-30"), [
      { slug: "investor", name: "Investor B", ticker: "INVE B", title: "Q3", date: "2026-10-20" },
    ]);
  });

  it("visar inte döda avsnitt och behåller indexgrinden", () => {
    const tabs = companyPageNavigation({
      hasReports: false,
      hasOwnership: false,
      hasShortInterest: false,
      hasInsiders: true,
      hasNews: false,
      hasCurrentEvents: false,
    });
    assert.deepEqual(tabs.map((tab) => tab.label), ["Översikt", "Kurs", "Nyckeltal", "Finansiellt", "Utdelning", "Insyn", "Diskussion"]);
    const thin = companyIndexSignals({
      dividendKind: "unspecified",
      dividendAmount: false,
      reports: 0,
      press: 0,
      events: 0,
      management: 0,
      ownership: 0,
      articles: 0,
    });
    assert.equal(thin.length >= COMPANY_PAGE_INDEX_MINIMUM, false);
    assert.equal(companyPageMetadataCopy(getCompanyProfile("investor")!, { indexable: false }).robots.index, false);
  });
});

describe("artikellänkar och fas 3", () => {
  it("lägger bolagschips utanför brödtexten", () => {
    const article = {
      id: "a",
      title: "Investor höjer utdelningen",
      summary: "",
      category: "company",
      source: "DivLab",
      publishedAt: "2026-09-30T08:00:00.000Z",
      url: null,
      featured: false,
      internalLinking: { companies: ["Investor"] },
    } as NewsArticle;
    const links = articleCompanyLinks(article, getPilotCompanies());
    assert.equal(links.some((link) => link.slug === "investor"), true);
    assert.equal(links.every((link) => link.href.startsWith("/bolag/")), true);
    const view = read("components/news/NewsArticleView.tsx");
    const chips = read("components/companies/CompanyArticleLinks.tsx");
    assert.match(view, /<CompanyArticleLinks/);
    assert.doesNotMatch(chips, /<Link[\s\S]*<Link/);
    assert.doesNotMatch(chips, /<a[\s\S]*<a/);
    assert.match(chips, /Bolag i artikeln/);
    const mentions = recentlyMentionedCompanies([article], getPilotCompanies(), 4);
    assert.equal(mentions[0]?.slug, "investor");
  });

  it("märker senaste händelser utan oläst-status och kopplar portföljsymbolen stängt", () => {
    assert.equal(followFeedRecencyCue("2026-09-28", "2026-09-30"), "Nyligen");
    assert.equal(followFeedRecencyCue("2026-08-01", "2026-09-30"), null);
    assert.equal(read("components/companies/FollowFeedList.tsx").includes("oläst"), false);
    assert.deepEqual(portfolioInstrumentKey("INVE-B.ST"), { symbol: "INVE-B", exchange: "ST" });
    assert.equal(portfolioInstrumentKey("Investor"), null);
    const changes = reportFactChanges([
      metric({ id: "revenue", label: "Omsättning", amount: 12, comparisonAmount: 10, comparisonLabel: "Q2 2025" }),
      metric({ id: "ebit", label: "Rörelseresultat", amount: 1, comparisonAmount: 2, comparisonLabel: "Q2 2025" }),
    ]);
    assert.deepEqual(changes.map((change) => change.direction), ["up", "down"]);
    assert.equal(dividendYearSeries([
      { exDate: "2024-04-01", amount: 1, currency: "SEK" },
      { exDate: "2025-04-01", amount: 2, currency: "SEK" },
    ]).length, 2);
  });
});
