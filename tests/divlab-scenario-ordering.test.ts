import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import { operatingCompanyClassification } from "./helpers/divlab-company-classification";

const FUNDAMENTAL_ID = "fundamental:test";

function bars(): DailyBar[] {
  return Array.from({ length: 260 }, (_, index) => {
    const close = 100 + Math.sin((index / 18) * Math.PI * 2) * 7 + index * 0.015;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - 0.4,
      high: close + 1.1,
      low: close - 1.1,
      close,
      adjustedClose: close,
      volume: 1_000_000,
    };
  });
}

test("DivLab quality gate rejects an inverted Bear Base Bull valuation", () => {
  const history = bars();
  const packet = buildDivLabResearchPacket({
    symbol: "TEST",
    exchange: "ST",
    name: "Test AB",
    currency: "SEK",
    currentPrice: history.at(-1)!.close,
    history,
    fundamentals: {
      asOf: "2026-06-30",
      currency: "SEK",
      revenueTtm: 1_200,
      revenueGrowthYoy: 0.08,
      operatingMarginTtm: 0.18,
      profitMarginTtm: 0.12,
      netIncomeTtm: 120,
      epsTtm: 8,
      operatingCashFlowTtm: 180,
      freeCashFlowTtm: 150,
      cash: 100,
      totalDebt: 150,
      sharesOutstanding: 100,
      returnOnEquity: 0.18,
      historicalPeriods: [
        { period: "2023-12-31", revenue: 900 },
        { period: "2024-12-31", revenue: 1_000 },
        { period: "2025-12-31", revenue: 1_100 },
      ],
    },
    companyClassification: operatingCompanyClassification(FUNDAMENTAL_ID),
    valuationScenarios: [
      {
        name: "bear",
        label: "Bear",
        currency: "SEK",
        explicitValuePerShare: 150,
        assumptions: ["Negativt scenario"],
      },
      {
        name: "base",
        label: "Base",
        currency: "SEK",
        explicitValuePerShare: 120,
        assumptions: ["Basscenario"],
      },
      {
        name: "bull",
        label: "Bull",
        currency: "SEK",
        explicitValuePerShare: 180,
        assumptions: ["Positivt scenario"],
      },
    ],
    sources: [
      {
        id: "report:q2",
        kind: "quarterly_report",
        publisher: "Test AB",
        url: "https://example.com/q2.pdf",
        publishedAt: "2026-07-20T06:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: true,
      },
      {
        id: "market:test",
        kind: "market_data",
        publisher: "Market provider",
        url: "https://example.com/market",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
      {
        id: FUNDAMENTAL_ID,
        kind: "fundamental_data",
        publisher: "Fundamental provider",
        url: "https://example.com/fundamental",
        publishedAt: "2026-08-14T16:00:00.000Z",
        verifiedAt: "2026-08-14T16:00:00.000Z",
        primary: false,
      },
    ],
    evidence: [
      {
        id: "evidence:report:q2",
        sourceId: "report:q2",
        kind: "official_report_excerpt",
        title: "Q2 2026",
        content: "Verifierat officiellt rapportutdrag med tillräckligt mycket innehåll för att kvalitetsgrinden ska kunna behandla källan som läst primärevidens. Texten innehåller ett kontrollerat testunderlag om omsättning, lönsamhet, kassaflöde, balansräkning och ledningens kommentar och är avsiktligt längre än miniminivån.",
        publishedAt: "2026-07-20T06:00:00.000Z",
        primary: true,
        documentRetrieved: true,
        reportPeriod: "Q2",
        reportYear: 2026,
        documentType: "quarterly_report",
      },
    ],
    now: new Date("2026-08-14T17:00:00.000Z"),
  });

  assert.equal(packet.qualityGate.checks.companyClassificationCoverage, true);
  assert.equal(packet.qualityGate.checks.fundamentalMethodologyCoverage, true);
  assert.equal(packet.qualityGate.checks.valuationScenarioCoverage, false);
  assert.ok(
    packet.qualityGate.blockers.some((blocker) =>
      blocker.includes("logiskt inverterad"),
    ),
  );
  assert.equal(packet.qualityGate.publishable, false);
});
