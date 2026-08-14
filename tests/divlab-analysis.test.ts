import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDivLabResearchPacket } from "../lib/analysis/deep-research";
import { analyzeSupportResistance } from "../lib/analysis/support-resistance";
import type { DailyBar } from "../lib/model-portfolios/engine/eodhd";
import { operatingCompanyClassification } from "./helpers/divlab-company-classification";

function oscillatingBars(count = 260): DailyBar[] {
  return Array.from({ length: count }, (_, index) => {
    const cycle = Math.sin((index / 18) * Math.PI * 2);
    const drift = index * 0.015;
    const close = 100 + cycle * 7 + drift;
    const turningBoost = Math.abs(cycle) > 0.92 ? 1.8 : 1;
    return {
      date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
      open: close - cycle * 0.4,
      high: close + 1.1,
      low: close - 1.1,
      close,
      adjustedClose: close,
      volume: Math.round(1_000_000 * turningBoost),
    };
  });
}

describe("DivLab support/resistance engine", () => {
  it("clusters repeated pivots into support and resistance zones", () => {
    const analysis = analyzeSupportResistance(oscillatingBars());
    assert.equal(analysis.sessions, 260);
    assert.ok(analysis.supports.length >= 1);
    assert.ok(analysis.resistances.length >= 1);
    assert.ok(analysis.supports[0]!.touches >= 2);
    assert.ok(analysis.resistances[0]!.touches >= 2);
    assert.ok(analysis.supports[0]!.center < (analysis.currentPrice ?? 0));
    assert.ok(analysis.resistances[0]!.center > (analysis.currentPrice ?? 0));
  });
});

describe("DivLab deep research packet", () => {
  it("builds a publishable deterministic packet when coverage is sufficient", () => {
    const bars = oscillatingBars();
    const currentPrice = bars.at(-1)!.close;
    const packet = buildDivLabResearchPacket({
      symbol: "TEST",
      exchange: "ST",
      name: "Testbolaget AB",
      currency: "SEK",
      currentPrice,
      history: bars,
      fundamentals: {
        asOf: "2026-08-14T12:00:00.000Z",
        currency: "SEK",
        revenueTtm: 12_000_000_000,
        revenueGrowthYoy: 0.09,
        operatingMarginTtm: 0.17,
        profitMarginTtm: 0.12,
        ebitTtm: 2_040_000_000,
        ebitdaTtm: 2_300_000_000,
        netIncomeTtm: 1_440_000_000,
        epsTtm: 8.2,
        operatingCashFlowTtm: 2_050_000_000,
        freeCashFlowTtm: 1_650_000_000,
        capexTtm: 400_000_000,
        cash: 1_000_000_000,
        totalDebt: 2_000_000_000,
        netDebt: 1_000_000_000,
        equity: 7_000_000_000,
        sharesOutstanding: 175_000_000,
        sharesOutstandingGrowthYoy: 0.002,
        returnOnEquity: 0.2,
        returnOnAssets: 0.11,
        returnOnInvestedCapital: 0.15,
        payoutRatio: 0.55,
        dividendPerShareTtm: 4.5,
        historicalPeriods: [
          {
            period: "2023-12-31",
            revenue: 9_200_000_000,
            operatingIncome: 1_380_000_000,
            netIncome: 980_000_000,
            freeCashFlow: 1_100_000_000,
            eps: 5.7,
            sharesOutstanding: 172_000_000,
          },
          {
            period: "2024-12-31",
            revenue: 10_200_000_000,
            operatingIncome: 1_600_000_000,
            netIncome: 1_130_000_000,
            freeCashFlow: 1_300_000_000,
            eps: 6.5,
            sharesOutstanding: 173_000_000,
          },
          {
            period: "2025-12-31",
            revenue: 11_100_000_000,
            operatingIncome: 1_830_000_000,
            netIncome: 1_300_000_000,
            freeCashFlow: 1_500_000_000,
            eps: 7.5,
            sharesOutstanding: 174_000_000,
          },
        ],
      },
      companyClassification: operatingCompanyClassification(
        "fundamental:test-20260814",
      ),
      valuationScenarios: [
        {
          name: "bear",
          label: "Negativt scenario",
          currency: "SEK",
          eps: 7.2,
          peMultiple: 12,
          freeCashFlowPerShare: 7.5,
          pFcfMultiple: 11,
          assumptions: ["Svagare efterfrågan", "Pressad marginal"],
        },
        {
          name: "base",
          label: "Basscenario",
          currency: "SEK",
          eps: 8.8,
          peMultiple: 16,
          freeCashFlowPerShare: 9.6,
          pFcfMultiple: 15,
          assumptions: ["Normaliserad tillväxt", "Stabil marginal"],
        },
        {
          name: "bull",
          label: "Positivt scenario",
          currency: "SEK",
          eps: 10.2,
          peMultiple: 19,
          freeCashFlowPerShare: 11.2,
          pFcfMultiple: 18,
          assumptions: ["Starkare tillväxt", "Marginalexpansion"],
        },
      ],
      sources: [
        {
          id: "report:q2-2026",
          kind: "quarterly_report",
          publisher: "Testbolaget AB",
          url: "https://example.com/q2",
          publishedAt: "2026-07-20T06:00:00.000Z",
          verifiedAt: "2026-08-14T12:00:00.000Z",
          primary: true,
        },
        {
          id: "market:test-20260814",
          kind: "market_data",
          publisher: "Market data provider",
          url: "https://example.com/market",
          publishedAt: "2026-08-14T12:00:00.000Z",
          verifiedAt: "2026-08-14T12:00:00.000Z",
          primary: false,
        },
        {
          id: "fundamental:test-20260814",
          kind: "fundamental_data",
          publisher: "Fundamental data provider",
          url: "https://example.com/fundamentals",
          publishedAt: "2026-08-14T12:00:00.000Z",
          verifiedAt: "2026-08-14T12:00:00.000Z",
          primary: false,
        },
      ],
      evidence: [
        {
          id: "evidence:report:q2-2026",
          sourceId: "report:q2-2026",
          kind: "official_report_excerpt",
          title: "Testbolaget Q2 2026",
          content:
            "Verifierat rapportutdrag med tillräckligt innehåll för att analysmotorn ska kunna tolka senaste rapporten utan att gissa. Omsättning, marginal, kassaflöde, balansräkning och ledningens kommentar finns i det kontrollerade underlaget. Detta är testtext som representerar ett bounded officiellt rapportutdrag och är längre än kvalitetsgrindens miniminivå.",
          publishedAt: "2026-07-20T06:00:00.000Z",
          primary: true,
          documentRetrieved: true,
          reportPeriod: "Q2",
          reportYear: 2026,
          documentType: "quarterly_report",
        },
      ],
      now: new Date("2026-08-14T16:00:00.000Z"),
    });

    assert.equal(packet.version, "deep-research-v1");
    assert.equal(packet.companyClassification.type, "operating_company");
    assert.equal(packet.fundamental.methodology.status, "supported");
    assert.ok((packet.fundamental.scorecard.overall ?? 0) > 0);
    assert.ok((packet.fundamental.trends.revenueCagr ?? 0) > 0);
    assert.equal(packet.valuation.scenarios.length, 3);
    assert.ok(packet.valuation.scenarios.every((scenario) => !scenario.currencyAssumed));
    assert.ok(packet.technical.levels.supports.length >= 1);
    assert.ok(packet.technical.levels.resistances.length >= 1);
    assert.equal(packet.qualityGate.checks.companyClassificationCoverage, true);
    assert.equal(packet.qualityGate.checks.fundamentalMethodologyCoverage, true);
    assert.equal(packet.qualityGate.checks.multiYearFundamentalCoverage, true);
    assert.equal(packet.qualityGate.checks.primaryEvidenceCoverage, true);
    assert.equal(packet.qualityGate.checks.valuationTraceability, true);
    assert.equal(packet.qualityGate.publishable, true);
    assert.equal(packet.qualityGate.blockers.length, 0);
  });

  it("fails closed when fundamental and source coverage is incomplete", () => {
    const bars = oscillatingBars();
    const packet = buildDivLabResearchPacket({
      symbol: "TEST",
      exchange: "ST",
      name: "Testbolaget AB",
      currency: "SEK",
      currentPrice: bars.at(-1)!.close,
      history: bars,
      fundamentals: {
        asOf: "2026-08-14T12:00:00.000Z",
        currency: "SEK",
        epsTtm: 8.2,
      },
      valuationScenarios: [
        {
          name: "base",
          label: "Basscenario",
          currency: "SEK",
          eps: 8.2,
          peMultiple: 15,
          assumptions: ["Ofullständigt underlag"],
        },
      ],
      sources: [],
      evidence: [],
      now: new Date("2026-08-14T16:00:00.000Z"),
    });

    assert.equal(packet.companyClassification.type, "unknown");
    assert.equal(packet.fundamental.methodology.status, "classification_required");
    assert.equal(packet.qualityGate.publishable, false);
    assert.equal(packet.qualityGate.checks.companyClassificationCoverage, false);
    assert.equal(packet.qualityGate.checks.fundamentalMethodologyCoverage, false);
    assert.equal(packet.qualityGate.checks.multiYearFundamentalCoverage, false);
    assert.equal(packet.qualityGate.checks.primaryEvidenceCoverage, false);
    assert.equal(packet.qualityGate.checks.valuationTraceability, false);
    assert.ok(packet.qualityGate.blockers.length >= 4);
  });
});
