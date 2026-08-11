/**
 * DivBrain shared portfolio-research retrieval — activation, scoring,
 * targeted retrieval planning, and #171 producer metadata integration.
 * Run via: npm run test:divbrain
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RESEARCH_RETRIEVAL_BOUNDS,
  buildSafeCompanyResearchOrFilter,
  executeModelPortfolioResearchRetrievalPlan,
  extractCompanyTargetTerms,
  extractReportPeriodHint,
  freshnessState,
  mapModelPortfolioResearchCategory,
  planModelPortfolioResearchRetrieval,
  queryTerms,
  researchRowToDivBrainSource,
  resolveResearchCanonicalUrl,
  sanitizeResearchDbTerm,
  scoreModelPortfolioResearchRow,
  selectModelPortfolioResearchRows,
  shouldQueryModelPortfolioResearch,
  type ModelPortfolioResearchRow,
  type ResearchCompanyTargetedQuery,
  type ResearchSnapshotQueryPort,
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

/** Fixture shaped like an actual #171 producer row (H1 / official PDF read). */
function producerOfficialInvestorH1Report(): ModelPortfolioResearchRow {
  return row({
    id: "producer-investor-h1-2026",
    kind: "company_report",
    publisher: "view.news.eu.nasdaq.com",
    source_url:
      "https://view.news.eu.nasdaq.com/view?id=bC9aW2investorH1&lang=en&src=listed",
    published_at: "2026-07-16T06:15:37.000Z",
    verified_at: "2026-07-16T07:00:00.000Z",
    title: "Interim report January-June 2026",
    summary:
      "Officiell bolagsrapport (H1 2026) från Investor AB. Rubrik: Interim report January-June 2026. Dokumenttyp: half_year_report. PDF-utdrag: 6 av 42 sidor (avkortat). Utdrag: Adjusted NAV amounted to SEK 812 billion at June 30, 2026.",
    metadata: {
      research_kind: "primary_source_disclosure",
      primary_source: "company",
      verification_state: "verified",
      source_type: "official_company_report",
      document_retrieved: true,
      official_source: "nasdaq_nordic_cns",
      report_period: "H1",
      report_year: 2026,
      document_type: "half_year_report",
      document_url:
        "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
      cns_category: "Half Year financial report",
      expires_at: "2026-07-23T07:00:00.000Z",
      source_urls: [
        "https://view.news.eu.nasdaq.com/view?id=bC9aW2investorH1&lang=en&src=listed",
        "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
      ],
    },
  });
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

  it("keeps unverified company_report with Nasdaq/IR-looking publisher as external_unverified", () => {
    assert.equal(
      mapModelPortfolioResearchCategory(
        row({
          id: "unverified-looks-official",
          kind: "company_report",
          title: "Investor Q2 2026",
          publisher: "Nasdaq Investor IR official",
          metadata: {
            verification_state: "unverified",
            primary_source: "google",
            source_type: "news",
          },
        }),
      ),
      "external_unverified",
    );
    assert.equal(
      mapModelPortfolioResearchCategory(
        row({
          id: "unverified-ir-only",
          kind: "company_report",
          title: "Investor årsrapport",
          publisher: "Investor IR",
          metadata: {
            verification_state: "unverified",
          },
        }),
      ),
      "external_unverified",
    );
  });

  it("maps verified + trusted-provenance producer row to official_company_report", () => {
    assert.equal(
      mapModelPortfolioResearchCategory(producerOfficialInvestorH1Report()),
      "official_company_report",
    );
  });
});

describe("model portfolio research — cache TTL vs durable source freshness", () => {
  it("marks primary-source disclosure past expires_at as dated, not stale", () => {
    const durable = producerOfficialInvestorH1Report();
    // expires_at is 2026-07-23; published_at is 2026-07-16 — both older than "today".
    assert.equal(freshnessState(durable), "dated");
    assert.equal(
      researchRowToDivBrainSource(durable, "2026-08-11T12:00:00.000Z")
        .freshnessState,
      "dated",
    );
  });

  it("marks expired candidate_bundle as stale", () => {
    const expiredBundle = row({
      id: "expired-bundle",
      kind: "market_data",
      title: "Investor market snapshot",
      published_at: "2026-08-10T10:00:00.000Z",
      metadata: {
        research_kind: "candidate_bundle",
        primary_source: "mixed",
        verification_state: "verified",
        expires_at: "2026-08-10T12:00:00.000Z",
      },
    });
    assert.equal(freshnessState(expiredBundle), "stale");
  });

  it("marks newly published primary report as current under the 24h source rule", () => {
    const now = Date.now();
    const freshPrimary = row({
      id: "fresh-primary",
      kind: "company_report",
      title: "Investor Q2 2026",
      published_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      verified_at: new Date(now - 60 * 60 * 1000).toISOString(),
      metadata: {
        research_kind: "primary_source_disclosure",
        primary_source: "company",
        verification_state: "verified",
        source_type: "official_company_report",
        // Cache TTL already expired — must not force stale for durable sources.
        expires_at: new Date(now - 60 * 60 * 1000).toISOString(),
      },
    });
    assert.equal(freshnessState(freshPrimary), "current");
  });

  it("does not upgrade google discovery via cache-expiry semantics", () => {
    const googleHit = row({
      id: "google-hit",
      kind: "news",
      title: "Investor omnämns",
      publisher: "Google Custom Search",
      published_at: "2026-07-01T08:00:00.000Z",
      metadata: {
        research_kind: "google_discovery",
        verification_state: "unverified",
        primary_source: "google",
        // Even if a TTL field is present, discovery stays publication-dated.
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });
    const source = researchRowToDivBrainSource(
      googleHit,
      "2026-08-11T12:00:00.000Z",
    );
    assert.equal(source.verificationState, "unverified");
    assert.equal(source.category, "external_unverified");
    assert.equal(source.freshnessState, "dated");
  });
});

describe("model portfolio research — #171 producer metadata integration", () => {
  const official = producerOfficialInvestorH1Report();
  const sameCompanyNews = row({
    id: "investor-news",
    kind: "news",
    title: "Investor omnämns i blogg",
    summary: "Generisk discovery-träff utan rapporttext.",
    publisher: "Google Custom Search",
    source_url: "https://example.com/blog/investor",
    published_at: "2026-07-20T07:00:00.000Z",
    verified_at: "2026-07-20T08:00:00.000Z",
    metadata: {
      research_kind: "google_discovery",
      verification_state: "unverified",
      primary_source: "google",
    },
  });

  it("activates for Investor report/Q2 questions and not for education", () => {
    assert.equal(
      shouldQueryModelPortfolioResearch("Kan du titta på Investors Q2-rapport?"),
      true,
    );
    assert.equal(shouldQueryModelPortfolioResearch("Vad är en aktie?"), false);
  });

  it("selects verified official H1 report over same-company generic news for Q2", () => {
    const selected = selectModelPortfolioResearchRows(
      "Kan du titta på Investors Q2-rapport?",
      [sameCompanyNews, official],
    );
    assert.equal(selected[0]?.id, "producer-investor-h1-2026");
    assert.ok(
      scoreModelPortfolioResearchRow(official, "Investor Q2 rapport") >
        scoreModelPortfolioResearchRow(sameCompanyNews, "Investor Q2 rapport"),
    );
  });

  it("maps producer row to official_company_report + verified", () => {
    const source = researchRowToDivBrainSource(
      official,
      "2026-08-11T12:00:00.000Z",
    );
    assert.equal(source.category, "official_company_report");
    assert.equal(source.verificationState, "verified");
    assert.ok((source.excerpt?.length ?? 0) <= 1500);
    assert.match(source.excerpt ?? "", /Adjusted NAV/);
  });

  it("prefers official document_url when verified read-report contract is met", () => {
    assert.equal(
      resolveResearchCanonicalUrl(official),
      "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
    );
    const source = researchRowToDivBrainSource(official);
    assert.equal(
      source.canonicalUrl,
      "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
    );
  });

  it("falls back to source_url when document contract is incomplete or unsafe", () => {
    const missingDoc = row({
      id: "no-doc",
      kind: "company_report",
      title: "Interim report January-June 2026",
      source_url:
        "https://view.news.eu.nasdaq.com/view?id=fallback&lang=en&src=listed",
      metadata: {
        verification_state: "verified",
        primary_source: "company",
        source_type: "official_company_report",
        document_retrieved: true,
        // missing document_url
      },
    });
    assert.equal(
      resolveResearchCanonicalUrl(missingDoc),
      "https://view.news.eu.nasdaq.com/view?id=fallback&lang=en&src=listed",
    );

    const unsafeDoc = row({
      id: "unsafe-doc",
      kind: "company_report",
      title: "Interim report January-June 2026",
      source_url:
        "https://view.news.eu.nasdaq.com/view?id=fallback2&lang=en&src=listed",
      metadata: {
        verification_state: "verified",
        primary_source: "company",
        source_type: "official_company_report",
        document_retrieved: true,
        document_url: "http://attachment.news.eu.nasdaq.com/not-https.pdf",
      },
    });
    assert.equal(
      resolveResearchCanonicalUrl(unsafeDoc),
      "https://view.news.eu.nasdaq.com/view?id=fallback2&lang=en&src=listed",
    );

    const headlineOnly = row({
      id: "headline-only",
      kind: "company_release",
      title: "Interim report January-June 2026",
      source_url:
        "https://view.news.eu.nasdaq.com/view?id=headline&lang=en&src=listed",
      metadata: {
        verification_state: "verified",
        primary_source: "company",
        source_type: "company_release",
        document_retrieved: false,
        document_url:
          "https://attachment.news.eu.nasdaq.com/should-not-be-used.pdf",
      },
    });
    assert.equal(
      resolveResearchCanonicalUrl(headlineOnly),
      "https://view.news.eu.nasdaq.com/view?id=headline&lang=en&src=listed",
    );
  });

  it("keeps exact Q2 metadata stronger than compatible H1 when both exist", () => {
    const explicitQ2 = row({
      id: "explicit-q2",
      kind: "company_report",
      title: "Investor Q2 2026",
      summary: "Explicit Q2 metadata row.",
      metadata: {
        verification_state: "verified",
        primary_source: "company",
        source_type: "official_company_report",
        document_retrieved: true,
        report_period: "Q2",
        report_year: 2026,
        document_type: "quarterly_report",
        document_url:
          "https://attachment.news.eu.nasdaq.com/investor-q2.pdf",
      },
    });
    assert.ok(
      scoreModelPortfolioResearchRow(explicitQ2, "Investor Q2 2026") >
        scoreModelPortfolioResearchRow(official, "Investor Q2 2026"),
    );
  });
});

describe("model portfolio research — targeted retrieval planning + scalability", () => {
  it("plans company-targeted retrieval for Investor report questions", () => {
    const plan = planModelPortfolioResearchRetrieval(
      "Kan du titta på Investors Q2-rapport?",
    );
    assert.equal(plan.mode, "company_targeted");
    assert.ok(plan.companyTerms.length > 0);
    assert.ok(plan.companyTerms.length <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyTerms);
    assert.ok(plan.orFilter);
    assert.match(plan.orFilter ?? "", /instrument_symbol\.ilike\.%investor%/i);
    assert.match(plan.orFilter ?? "", /instrument_name\.ilike\.%investor%/i);
    assert.equal(plan.kindEq, "company_report");
    assert.equal(
      plan.companyLimit,
      RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
    );
    assert.equal(plan.maxDbCalls, RESEARCH_RETRIEVAL_BOUNDS.maxDbCallsPerQuery);
    assert.ok(plan.maxDbCalls <= 2);
  });

  it("keeps general valuation queries broader without report-kind constraint", () => {
    const plan = planModelPortfolioResearchRetrieval(
      "Hur ser värderingen ut för Investor?",
    );
    assert.equal(plan.mode, "company_targeted");
    assert.equal(plan.kindEq, null);
    assert.ok(plan.orFilter);
    assert.equal(
      plan.companyLimit,
      RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
    );
  });

  it("uses bounded recent fallback for non-company finance intents", () => {
    const plan = planModelPortfolioResearchRetrieval("Vad händer i portföljen?");
    assert.equal(plan.mode, "recent_fallback");
    assert.deepEqual(plan.companyTerms, []);
    assert.equal(plan.orFilter, null);
    assert.equal(plan.kindEq, null);
    assert.equal(
      plan.recentLimit,
      RESEARCH_RETRIEVAL_BOUNDS.maxRecentFallbackRows,
    );
  });

  it("plans none for generic education", () => {
    const plan = planModelPortfolioResearchRetrieval("Vad är en aktie?");
    assert.equal(plan.mode, "none");
    assert.equal(plan.maxDbCalls, 0);
    assert.equal(plan.kindEq, null);
  });

  it("rejects malicious/special-character terms from safe filter construction", () => {
    assert.equal(sanitizeResearchDbTerm("investor),id.eq.1"), null);
    assert.equal(sanitizeResearchDbTerm("foo%bar"), null);
    assert.equal(sanitizeResearchDbTerm("a,b"), null);
    assert.equal(sanitizeResearchDbTerm("evil.or"), null);
    assert.equal(sanitizeResearchDbTerm("ok-term"), "ok-term");
    assert.equal(sanitizeResearchDbTerm("INVE-B"), "INVE-B");

    const maliciousFilter = buildSafeCompanyResearchOrFilter([
      "investor);drop table",
      "x%y",
      "a,b",
      "normal",
    ]);
    assert.equal(
      maliciousFilter,
      "instrument_symbol.ilike.%normal%,instrument_name.ilike.%normal%",
    );
    assert.ok(!maliciousFilter?.includes("drop"));
    assert.ok(!maliciousFilter?.includes("%y"));
    assert.ok(!maliciousFilter?.includes(",b"));
  });

  it("bounds company term and or-clause counts", () => {
    const terms = extractCompanyTargetTerms(
      "Alpha Beta Gamma Delta Epsilon Zeta Investor Volvo Atlas Copco",
    );
    assert.ok(terms.length <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyTerms);
    const filter = buildSafeCompanyResearchOrFilter([
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
    ]);
    const clauseCount = (filter?.split(",") ?? []).length;
    assert.ok(clauseCount <= RESEARCH_RETRIEVAL_BOUNDS.maxOrClauses);
  });

  it("discovers an older company report via company-targeted plan even when >100 newer unrelated rows exist", async () => {
    const olderReport = producerOfficialInvestorH1Report();
    const recentUnrelated: ModelPortfolioResearchRow[] = Array.from(
      { length: 120 },
      (_, index) =>
        row({
          id: `unrelated-${index}`,
          instrument_symbol: `OTH${index}`,
          instrument_name: `Other Co ${index}`,
          kind: "news",
          title: `Unrelated headline ${index}`,
          summary: "Nyare orelaterad snapshot.",
          publisher: "Google Custom Search",
          source_url: `https://example.com/news/${index}`,
          published_at: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T08:00:00.000Z`,
          verified_at: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T09:00:00.000Z`,
          metadata: {
            research_kind: "google_discovery",
            verification_state: "unverified",
            primary_source: "google",
          },
        }),
    );

    let companyCalls = 0;
    let recentCalls = 0;
    const seenQueries: ResearchCompanyTargetedQuery[] = [];

    const port: ResearchSnapshotQueryPort = {
      async fetchRecent(limit) {
        recentCalls += 1;
        // Global-latest-only would never see the older Investor report.
        return recentUnrelated.slice(0, limit);
      },
      async fetchCompanyTargeted(query) {
        companyCalls += 1;
        seenQueries.push(query);
        assert.ok(query.limit <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows);
        assert.match(query.orFilter, /investor/i);
        assert.equal(query.kindEq, "company_report");
        // Simulate DB filtering: company filter + kind before limit.
        const tokens = [...query.orFilter.matchAll(/ilike\.%([^%]+)%/gi)].map(
          (m) => m[1]!.toLowerCase(),
        );
        const matches = [olderReport, ...recentUnrelated]
          .filter((candidate) => {
            const text =
              `${candidate.instrument_symbol} ${candidate.instrument_name}`.toLowerCase();
            return tokens.some((token) => text.includes(token));
          })
          .filter((candidate) =>
            query.kindEq ? candidate.kind === query.kindEq : true,
          );
        return matches.slice(0, query.limit);
      },
    };

    const queryText = "Kan du titta på Investors Q2-rapport?";
    const plan = planModelPortfolioResearchRetrieval(queryText);
    assert.equal(plan.mode, "company_targeted");
    assert.equal(plan.kindEq, "company_report");

    const candidates = await executeModelPortfolioResearchRetrievalPlan(
      plan,
      port,
    );

    assert.equal(companyCalls, 1);
    assert.equal(recentCalls, 0);
    assert.equal(seenQueries.length, 1);
    assert.equal(seenQueries[0]!.kindEq, "company_report");
    assert.ok(
      seenQueries[0]!.limit <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
    );
    assert.ok(candidates.length <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows);
    assert.ok(candidates.some((candidate) => candidate.id === olderReport.id));

    // Contrast: a naive global-latest window of 100 would miss the older report.
    const naiveWindow = recentUnrelated.slice(0, 100);
    assert.equal(
      naiveWindow.some((candidate) => candidate.id === olderReport.id),
      false,
    );

    const selected = selectModelPortfolioResearchRows(queryText, candidates);
    assert.equal(selected[0]?.id, olderReport.id);
    const source = researchRowToDivBrainSource(selected[0]!);
    assert.equal(source.category, "official_company_report");
    assert.equal(source.verificationState, "verified");
    assert.equal(
      source.canonicalUrl,
      "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
    );
  });

  it("keeps older Investor report discoverable behind >48 newer same-company market_data rows", async () => {
    const olderReport = producerOfficialInvestorH1Report();
    const sameCompanyMarket: ModelPortfolioResearchRow[] = Array.from(
      { length: 55 },
      (_, index) =>
        row({
          id: `investor-market-${index}`,
          kind: "market_data",
          title: `Investor market snapshot ${index}`,
          summary: "Dynamisk kandidat-bundle för Investor.",
          publisher: "Dividend Lab research",
          source_url: `https://example.com/market/${index}`,
          published_at: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T10:00:00.000Z`,
          verified_at: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T11:00:00.000Z`,
          metadata: {
            research_kind: "candidate_bundle",
            primary_source: "mixed",
            verification_state: "verified",
            expires_at: "2099-01-01T00:00:00.000Z",
          },
        }),
    );
    const sameCompanyNews = row({
      id: "investor-news-new",
      kind: "news",
      title: "Investor omnämns i nyhetsflöde",
      summary: "Nyare unverified discovery utan rapporttext.",
      publisher: "Google Custom Search",
      source_url: "https://example.com/news/investor-new",
      published_at: "2026-08-10T12:00:00.000Z",
      verified_at: "2026-08-10T13:00:00.000Z",
      metadata: {
        research_kind: "google_discovery",
        verification_state: "unverified",
        primary_source: "google",
      },
    });

    // Without kind filter, company-targeted latest-48 would drop the older report.
    const companyHaystackNewestFirst = [
      ...sameCompanyMarket,
      sameCompanyNews,
      olderReport,
    ].sort(
      (a, b) => Date.parse(b.verified_at) - Date.parse(a.verified_at),
    );
    assert.ok(
      companyHaystackNewestFirst.length >
        RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
    );
    const naiveCompanyWindow = companyHaystackNewestFirst.slice(
      0,
      RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
    );
    assert.equal(
      naiveCompanyWindow.some((candidate) => candidate.id === olderReport.id),
      false,
    );

    const seenQueries: ResearchCompanyTargetedQuery[] = [];
    let companyCalls = 0;

    const port: ResearchSnapshotQueryPort = {
      async fetchRecent() {
        throw new Error("recent fallback must not run for company-targeted plan");
      },
      async fetchCompanyTargeted(query) {
        companyCalls += 1;
        seenQueries.push(query);
        assert.equal(query.kindEq, "company_report");
        assert.ok(
          query.limit <= RESEARCH_RETRIEVAL_BOUNDS.maxCompanyCandidateRows,
        );
        const tokens = [...query.orFilter.matchAll(/ilike\.%([^%]+)%/gi)].map(
          (m) => m[1]!.toLowerCase(),
        );
        // Production contract: filter kind at DB boundary BEFORE limit.
        const matches = companyHaystackNewestFirst.filter((candidate) => {
          const text =
            `${candidate.instrument_symbol} ${candidate.instrument_name}`.toLowerCase();
          if (!tokens.some((token) => text.includes(token))) return false;
          if (query.kindEq && candidate.kind !== query.kindEq) return false;
          return true;
        });
        return matches.slice(0, query.limit);
      },
    };

    const queryText = "Vad sa Investor i Q2-rapporten 2026?";
    const plan = planModelPortfolioResearchRetrieval(queryText);
    assert.equal(plan.mode, "company_targeted");
    assert.equal(plan.kindEq, "company_report");
    assert.ok(plan.orFilter);

    const candidates = await executeModelPortfolioResearchRetrievalPlan(
      plan,
      port,
    );

    assert.equal(companyCalls, 1);
    assert.equal(seenQueries.length, 1);
    assert.equal(seenQueries[0]!.kindEq, "company_report");
    assert.ok(candidates.every((candidate) => candidate.kind === "company_report"));
    assert.ok(candidates.some((candidate) => candidate.id === olderReport.id));
    assert.equal(
      candidates.some((candidate) => candidate.kind === "market_data"),
      false,
    );

    const selected = selectModelPortfolioResearchRows(queryText, candidates);
    assert.equal(selected[0]?.id, olderReport.id);
    const source = researchRowToDivBrainSource(selected[0]!);
    assert.equal(source.category, "official_company_report");
    assert.equal(source.verificationState, "verified");
    assert.equal(source.freshnessState, "dated");
    assert.equal(
      source.canonicalUrl,
      "https://attachment.news.eu.nasdaq.com/realistic-investor-h1-2026.pdf",
    );
  });

  it("returns no shared report source when no company_report exists for report intent", async () => {
    const onlyMarket = row({
      id: "only-market",
      kind: "market_data",
      title: "Investor market snapshot",
      metadata: {
        research_kind: "candidate_bundle",
        primary_source: "mixed",
        verification_state: "verified",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    });
    const plan = planModelPortfolioResearchRetrieval(
      "Vad sa Investor i Q2-rapporten 2026?",
    );
    assert.equal(plan.kindEq, "company_report");

    const port: ResearchSnapshotQueryPort = {
      async fetchRecent() {
        return [onlyMarket];
      },
      async fetchCompanyTargeted(query) {
        assert.equal(query.kindEq, "company_report");
        // DB returns nothing because kind filter excluded market_data.
        return [];
      },
    };

    const candidates = await executeModelPortfolioResearchRetrievalPlan(
      plan,
      port,
    );
    assert.deepEqual(candidates, []);
    assert.deepEqual(
      selectModelPortfolioResearchRows(
        "Vad sa Investor i Q2-rapporten 2026?",
        candidates,
      ),
      [],
    );
  });

  it("does not fabricate sources when company-targeted retrieval returns no match", async () => {
    const plan = planModelPortfolioResearchRetrieval("Investor Q2 rapport");
    const port: ResearchSnapshotQueryPort = {
      async fetchRecent() {
        return [
          row({
            id: "volvo-only",
            instrument_symbol: "VOLV-B",
            instrument_name: "Volvo AB ser. B",
            kind: "company_report",
            title: "Volvo Q2",
          }),
        ];
      },
      async fetchCompanyTargeted() {
        return [];
      },
    };
    const candidates = await executeModelPortfolioResearchRetrievalPlan(
      plan,
      port,
    );
    assert.deepEqual(candidates, []);
    assert.deepEqual(
      selectModelPortfolioResearchRows("Investor Q2 rapport", candidates),
      [],
    );
  });
});
