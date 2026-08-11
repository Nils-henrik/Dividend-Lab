/**
 * DivBrain shared portfolio-research retrieval — activation + scoring.
 * Run via: npm run test:divbrain
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractReportPeriodHint,
  mapModelPortfolioResearchCategory,
  queryTerms,
  researchRowToDivBrainSource,
  scoreModelPortfolioResearchRow,
  selectModelPortfolioResearchRows,
  shouldQueryModelPortfolioResearch,
  type ModelPortfolioResearchRow,
} from "./model-portfolio-research";

function row(
  overrides: Partial<ModelPortfolioResearchRow> &
    Pick<ModelPortfolioResearchRow, "id" | "title" | "kind">,
): ModelPortfolioResearchRow {
  return {
    instrument_symbol: "INVE-B",
    exchange: "ST",
    instrument_name: "Investor AB ser. B",
    publisher: "Investor IR",
    source_url: "https://www.investorab.com/reports/q2-2026",
    published_at: "2026-07-17T07:00:00.000Z",
    verified_at: "2026-07-17T08:00:00.000Z",
    summary: "Sammanfattning av rapporten.",
    metadata: {},
    ...overrides,
  };
}

describe("model portfolio research — report-intent activation", () => {
  it("triggers shared research for Investor Q2 rapport", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Investor Q2 rapport"),
      true,
    );
  });

  it("triggers for Investors senaste kvartalsrapport", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Investors senaste kvartalsrapport"),
      true,
    );
  });

  it("triggers for Investor årsrapport 2025", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Investor årsrapport 2025"),
      true,
    );
  });

  it("triggers for common Swedish report variants and English earnings", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Kan du titta på Investors Q2-rapport?"),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch(
        "Vad stod det i Investors senaste delårsrapport?",
      ),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch(
        "Hur såg kassaflödet ut i Q2 för Investor?",
      ),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch("Investor bokslutskommuniké"),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch("Investor H1 halvårsrapport"),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch("Investor quarterly report"),
      true,
    );
  });

  it("does not query portfolio research for generic education", () => {
    assert.equal(shouldQueryModelPortfolioResearch("Vad är en aktie?"), false);
    assert.equal(
      shouldQueryModelPortfolioResearch("Vad är ett bolag?"),
      false,
    );
  });

  it("keeps existing ticker/valuation/portfolio queries working", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Hur ser värderingen ut för Investor?"),
      true,
    );
    assert.equal(
      shouldQueryModelPortfolioResearch("Vad händer i portföljen?"),
      true,
    );
    assert.equal(shouldQueryModelPortfolioResearch("INVE-B"), true);
    assert.equal(
      shouldQueryModelPortfolioResearch("Technical analysis AAPL"),
      true,
    );
  });
});

describe("model portfolio research — period hints + terms", () => {
  it("extracts Q2 / H1 / year without inventing missing periods", () => {
    assert.deepEqual(extractReportPeriodHint("Investor Q2 2026"), {
      quarters: [2],
      halves: [],
      years: [2026],
      wantsReport: true,
      wantsGuidance: false,
    });
    assert.deepEqual(extractReportPeriodHint("Investor H1 halvårsrapport"), {
      quarters: [],
      halves: [1],
      years: [],
      wantsReport: true,
      wantsGuidance: false,
    });
    assert.deepEqual(extractReportPeriodHint("Hur ser värderingen ut?"), {
      quarters: [],
      halves: [],
      years: [],
      wantsReport: false,
      wantsGuidance: false,
    });
  });

  it("normalizes possessive Investors into Investor-friendly terms", () => {
    const terms = queryTerms("Investors Q2-rapport");
    assert.ok(terms.includes("investors") || terms.includes("investor"));
    assert.ok(terms.includes("q2"));
    assert.ok(terms.includes("rapport"));
  });
});

describe("model portfolio research — company + period scoring", () => {
  const q2Report = row({
    id: "q2",
    kind: "company_report",
    title: "Investor AB – delårsrapport Q2 2026",
    summary: "Kassaflöde och resultat för andra kvartalet 2026.",
    published_at: "2026-07-17T07:00:00.000Z",
    verified_at: "2026-07-18T08:00:00.000Z",
    metadata: { verification_state: "verified", primary_source: "company" },
  });

  const q1Report = row({
    id: "q1",
    kind: "company_report",
    title: "Investor AB – delårsrapport Q1 2026",
    summary: "Första kvartalet 2026.",
    source_url: "https://www.investorab.com/reports/q1-2026",
    published_at: "2026-04-23T07:00:00.000Z",
    verified_at: "2026-04-24T08:00:00.000Z",
    metadata: { verification_state: "verified", primary_source: "company" },
  });

  const genericNews = row({
    id: "news",
    kind: "news",
    title: "Investor nämns i marknadskommentar",
    summary: "Generisk nyhet utan rapportinnehåll.",
    publisher: "Google Custom Search",
    source_url: "https://example.com/news/investor",
    published_at: "2026-07-20T07:00:00.000Z",
    verified_at: "2026-07-20T08:00:00.000Z",
    metadata: {
      research_kind: "google_discovery",
      verification_state: "unverified",
      primary_source: "google",
    },
  });

  const otherCompanyQ2 = row({
    id: "volvo-q2",
    instrument_symbol: "VOLV-B",
    instrument_name: "Volvo AB ser. B",
    kind: "company_report",
    title: "Volvo – kvartalsrapport Q2 2026",
    summary: "Volvo Q2.",
    source_url: "https://www.volvogroup.com/q2-2026",
    publisher: "Volvo IR",
    metadata: { verification_state: "verified", primary_source: "company" },
  });

  it("prefers company + Q2 report over generic same-company news", () => {
    const selected = selectModelPortfolioResearchRows(
      "Kan du titta på Investors Q2-rapport?",
      [genericNews, q2Report, q1Report],
    );
    assert.equal(selected[0]?.id, "q2");
    assert.ok(
      scoreModelPortfolioResearchRow(q2Report, "Investor Q2 rapport") >
        scoreModelPortfolioResearchRow(genericNews, "Investor Q2 rapport"),
    );
  });

  it("does not prefer Q1 when a matching Q2 snapshot exists", () => {
    const selected = selectModelPortfolioResearchRows("Investor Q2 2026", [
      q1Report,
      q2Report,
    ]);
    assert.equal(selected[0]?.id, "q2");
    assert.ok(
      scoreModelPortfolioResearchRow(q2Report, "Investor Q2 2026") >
        scoreModelPortfolioResearchRow(q1Report, "Investor Q2 2026"),
    );
  });

  it("returns no source when company/report does not match", () => {
    const selected = selectModelPortfolioResearchRows(
      "Kan du titta på Investors Q2-rapport?",
      [otherCompanyQ2],
    );
    assert.deepEqual(selected, []);
  });

  it("still ranks valuation queries against the matching company snapshot", () => {
    const market = row({
      id: "market",
      kind: "market_data",
      title: "Investor AB ser. B (INVE-B.ST) – DivLab research snapshot",
      summary: "Värdering och utdelningsdata för Investor.",
      source_url: "https://finance.yahoo.com/quote/INVE-B.ST",
      metadata: {
        research_kind: "candidate_bundle",
        primary_source: "mixed",
        verification_state: "verified",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });
    const selected = selectModelPortfolioResearchRows(
      "Hur ser värderingen ut för Investor?",
      [otherCompanyQ2, market],
    );
    assert.equal(selected[0]?.id, "market");
  });
});

describe("model portfolio research — source mapping quality", () => {
  it("maps trusted company_report snapshots to official_company_report", () => {
    const source = researchRowToDivBrainSource(
      row({
        id: "official",
        kind: "company_report",
        title: "Investor årsrapport 2025",
        metadata: {
          verification_state: "verified",
          primary_source: "company",
        },
      }),
      "2026-08-11T12:00:00.000Z",
    );
    assert.equal(source.category, "official_company_report");
    assert.equal(source.verificationState, "verified");
    assert.equal(
      source.canonicalUrl,
      "https://www.investorab.com/reports/q2-2026",
    );
  });

  it("does not overclaim official status for unverified news hits", () => {
    assert.equal(
      mapModelPortfolioResearchCategory(
        row({
          id: "news",
          kind: "news",
          title: "Investor Q2 omnämns i artikel",
          publisher: "Google Custom Search",
          metadata: {
            research_kind: "google_discovery",
            verification_state: "unverified",
            primary_source: "google",
          },
        }),
      ),
      "external_unverified",
    );
  });
});
