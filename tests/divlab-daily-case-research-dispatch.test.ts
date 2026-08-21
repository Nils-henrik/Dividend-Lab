import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDailyCaseRunAudit } from "../lib/analysis/daily-case-audit";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import { runDailyCaseSelectionFunnel } from "../lib/analysis/daily-case-funnel";
import type { DailyCaseDeskInputCandidate } from "../lib/analysis/daily-case-desk";
import {
  buildDailyCaseDeepResearchDispatchPlan,
  resolveDailyCaseResearchConcurrency,
} from "../lib/analysis/daily-case-research-dispatch";
import type { AnalysisSource } from "../lib/analysis/quality-gate";
import type { ResearchCandidate } from "../lib/model-portfolios/engine/research";
import type { TechnicalAnalysisSnapshot } from "../lib/model-portfolios/engine/technical-analysis";

const AS_OF = "2026-08-15T00:00:00.000Z";
const NOW = new Date("2026-08-15T01:00:00.000Z");

function technical(): TechnicalAnalysisSnapshot {
  return {
    version: "ta-v1",
    asOf: AS_OF,
    sessions: 220,
    toolsUsed: [],
    trend: { regime: "uptrend" },
    momentum: {},
    volatility: {},
    volume: { volumeRatio20: 2.5 },
    levels: {},
    meanReversion: {},
    patterns: {
      doji: false,
      hammer: false,
      bullishEngulfing: false,
      bearishEngulfing: false,
    },
    scores: {
      trend: 0.9,
      momentum: 0.7,
      volume: 0.8,
      breakout: 0.8,
      meanReversion: 0.5,
      stability: 0.7,
      composite: 0.8,
    },
    signals: [],
  };
}

function researchCandidate(): ResearchCandidate {
  return {
    symbol: "TEST",
    exchange: "ST",
    marketCapSek: 20_000_000_000,
    avgDailyTurnoverSek: 100_000_000,
    earningsRevisionScore: 0.9,
    qualityScore: 0.85,
    valuationScore: 0.85,
    catalystScore: 0.8,
    balanceSheetScore: 0.85,
    technicalAnalysis: technical(),
  };
}

function deskInput(): DailyCaseDeskInputCandidate {
  return {
    candidate: researchCandidate(),
    yahooSymbol: "TEST.ST",
    name: "Test AB",
    sources: {
      market: { id: "market:test", asOf: AS_OF },
      fundamentals: { id: "fundamental:test", asOf: AS_OF },
      revisions: { id: "revisions:test", asOf: AS_OF },
      catalyst: { id: "catalyst:test", asOf: AS_OF },
      report: { id: "report:test", asOf: AS_OF },
    },
    dayChangePct: 5,
  };
}

function source(id: string, kind: AnalysisSource["kind"]): AnalysisSource {
  return {
    id,
    kind,
    publisher: `Publisher ${id}`,
    url: `https://example.com/${encodeURIComponent(id)}`,
    publishedAt: AS_OF,
    verifiedAt: AS_OF,
    primary: kind === "quarterly_report",
  };
}

async function auditFixture() {
  const funnel = await runDailyCaseSelectionFunnel({
    candidates: [deskInput()],
    preflightLoader: async (yahooSymbol) =>
      buildCompanyProfilePreflightFromYahooPayload({
        yahooSymbol,
        fetchedAt: new Date(AS_OF),
        payload: {
          quoteSummary: {
            result: [
              {
                assetProfile: {
                  sector: "Industrials",
                  industry: "Specialty Industrial Machinery",
                },
                price: { quoteType: "EQUITY" },
              },
            ],
          },
        },
      }),
    config: {
      marketShortlist: { now: NOW },
      desk: { selection: { now: NOW } },
    },
  });

  return buildDailyCaseRunAudit({
    funnel,
    externalSources: [
      source("market:test", "market_data"),
      source("fundamental:test", "fundamental_data"),
      source("revisions:test", "other"),
      source("catalyst:test", "news"),
      source("report:test", "quarterly_report"),
    ],
    selectionDate: "2026-08-15",
    runKey: "daily-case-test-01",
    asOf: NOW,
  });
}

describe("DivLab Daily Case Deep Research dispatch", () => {
  it("creates one immutable job only for the exact selected final candidate", async () => {
    const audit = await auditFixture();
    const plan = buildDailyCaseDeepResearchDispatchPlan(audit);

    assert.equal(plan.version, "daily-case-research-dispatch-v1");
    assert.equal(plan.stats.selected, 1);
    assert.equal(plan.stats.jobs, 1);
    assert.equal(plan.jobs[0]?.symbol, "TEST");
    assert.equal(plan.jobs[0]?.exchange, "ST");
    assert.equal(plan.jobs[0]?.name, "Test AB");
    assert.equal(plan.jobs[0]?.jobKey, "daily-case-test-01:1:TEST@ST");
    assert.ok((plan.jobs[0]?.sourceIds.length ?? 0) > 0);
  });

  it("fails closed if the selected identity is absent from the final candidate audit", async () => {
    const audit = await auditFixture();
    audit.funnel.desk.selectionCandidateAudit = [];
    assert.throws(
      () => buildDailyCaseDeepResearchDispatchPlan(audit),
      /daily_case_dispatch_final_candidate_missing:TEST@ST/,
    );
  });

  it("refuses to dispatch a company whose methodology is no longer supported", async () => {
    const audit = await auditFixture();
    audit.funnel.desk.selectionCandidateAudit[0]!.methodologyStatus = "specialized_required";
    assert.throws(
      () => buildDailyCaseDeepResearchDispatchPlan(audit),
      /daily_case_dispatch_methodology_not_supported:TEST@ST/,
    );
  });

  it("requires every selected source id to exist in the final candidate audit", async () => {
    const audit = await auditFixture();
    audit.funnel.desk.selectionCandidateAudit[0]!.knownSourceIds = [];
    assert.throws(
      () => buildDailyCaseDeepResearchDispatchPlan(audit),
      /daily_case_dispatch_source_not_in_final_candidate:TEST@ST/,
    );
  });

  it("keeps heavy-research concurrency at one by default and two at most", () => {
    assert.equal(resolveDailyCaseResearchConcurrency(), 1);
    assert.equal(resolveDailyCaseResearchConcurrency(2), 2);
    assert.throws(
      () => resolveDailyCaseResearchConcurrency(3),
      /daily_case_dispatch_concurrency_invalid/,
    );
  });
});
