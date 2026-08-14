import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDailyCaseRunAudit } from "../lib/analysis/daily-case-audit";
import { buildCompanyProfilePreflightFromYahooPayload } from "../lib/analysis/company-profile-preflight";
import { runDailyCaseSelectionFunnel } from "../lib/analysis/daily-case-funnel";
import type { DailyCaseDeskInputCandidate } from "../lib/analysis/daily-case-desk";
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

function source(
  id: string,
  kind: AnalysisSource["kind"] = "other",
): AnalysisSource {
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

function externalSources(): AnalysisSource[] {
  return [
    source("market:test", "market_data"),
    source("fundamental:test", "fundamental_data"),
    source("revisions:test", "other"),
    source("catalyst:test", "news"),
    source("report:test", "quarterly_report"),
  ];
}

async function funnel() {
  return runDailyCaseSelectionFunnel({
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
}

describe("DivLab immutable Daily Case audit packet", () => {
  it("freezes the complete funnel with every referenced source resolved", async () => {
    const result = await funnel();
    const audit = buildDailyCaseRunAudit({
      funnel: result,
      externalSources: externalSources(),
      selectionDate: "2026-08-15",
      runKey: "nordic-open-2026-08-15-01",
      asOf: NOW,
    });

    assert.equal(audit.version, "daily-case-run-audit-v1");
    assert.equal(audit.stats.selectedForDeepResearch, 1);
    assert.equal(audit.funnel.marketCandidateAudit.length, 1);
    assert.equal(audit.funnel.desk.selectionCandidateAudit.length, 1);
    assert.equal(audit.funnel.desk.preflightAudit.length, 1);
    assert.equal(audit.sources.length, 6);
    assert.ok(
      audit.sources.some((item) => item.id.startsWith("fundamental:yahoo-profile:TEST.ST:")),
    );
  });

  it("fails closed when a referenced upstream source has no metadata", async () => {
    const result = await funnel();
    assert.throws(
      () =>
        buildDailyCaseRunAudit({
          funnel: result,
          externalSources: externalSources().filter((item) => item.id !== "catalyst:test"),
          selectionDate: "2026-08-15",
          runKey: "missing-source",
          asOf: NOW,
        }),
      /daily_case_audit_source_missing:catalyst:test/,
    );
  });

  it("rejects conflicting metadata for the same preflight-generated source id", async () => {
    const result = await funnel();
    const preflightSource = result.desk.preflightAudit[0]?.preflight?.source;
    assert.ok(preflightSource);

    assert.throws(
      () =>
        buildDailyCaseRunAudit({
          funnel: result,
          externalSources: [
            ...externalSources(),
            { ...preflightSource, url: "https://example.com/conflict" },
          ],
          selectionDate: "2026-08-15",
          runKey: "source-collision",
          asOf: NOW,
        }),
      /daily_case_audit_source_collision/,
    );
  });

  it("rejects malformed run identity before persistence", async () => {
    const result = await funnel();
    assert.throws(
      () =>
        buildDailyCaseRunAudit({
          funnel: result,
          externalSources: externalSources(),
          selectionDate: "2026-02-30",
          runKey: "bad key with spaces",
          asOf: NOW,
        }),
      /daily_case_audit_selection_date_invalid/,
    );
  });
});
