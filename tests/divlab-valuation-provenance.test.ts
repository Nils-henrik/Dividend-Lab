import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NormalizedValuationAmount, NormalizedValuationInput } from "../lib/analysis/fx";
import type { PrimaryReportReconciliation } from "../lib/analysis/primary-report-reconciliation";
import type { AnalysisSource } from "../lib/analysis/quality-gate";
import { buildValuationAnalysis } from "../lib/analysis/valuation";
import { buildValuationProvenance } from "../lib/analysis/valuation-provenance";

function normalized(value: number, fxSourceIds: string[] = []): NormalizedValuationInput {
  return {
    value,
    currency: "SEK",
    sourceCurrency: fxSourceIds.length ? "EUR" : "SEK",
    converted: fxSourceIds.length > 0,
    fxRate: fxSourceIds.length ? 11 : null,
    fxAsOf: fxSourceIds.length ? "2026-08-14T16:00:00.000Z" : null,
    fxSourceIds,
  };
}

const amount = normalized as (value: number, fxSourceIds?: string[]) => NormalizedValuationAmount;

function reconciliation(): PrimaryReportReconciliation {
  return {
    version: "primary-report-reconciliation-v1",
    status: "partial",
    sourceId: "report:q2",
    reportPeriod: "Q2",
    reportYear: 2026,
    reportingCurrency: "EUR",
    providerBasis: "ytd_2q",
    providerPeriods: ["2026-06-30", "2026-03-31"],
    amountScale: 1_000_000,
    confirmedMetrics: 2,
    eligibleMetrics: 4,
    metrics: [
      {
        metric: "revenue",
        providerValue: 1_000,
        reportValue: null,
        relativeDifference: null,
        status: "not_confirmed",
        rawToken: null,
        context: null,
      },
      {
        metric: "operatingIncome",
        providerValue: 200,
        reportValue: 200,
        relativeDifference: 0,
        status: "confirmed",
        rawToken: "200",
        context: "Operating profit 200",
      },
      {
        metric: "netIncome",
        providerValue: 150,
        reportValue: null,
        relativeDifference: null,
        status: "not_confirmed",
        rawToken: null,
        context: null,
      },
      {
        metric: "eps",
        providerValue: 10,
        reportValue: 10,
        relativeDifference: 0,
        status: "confirmed",
        rawToken: "10.00",
        context: "Earnings per share, EUR 10.00",
      },
    ],
    notes: [],
  };
}

function sources(): AnalysisSource[] {
  return [
    {
      id: "market:yahoo",
      kind: "market_data",
      publisher: "Yahoo Finance",
      url: "https://example.com/market",
      publishedAt: "2026-08-14T16:00:00.000Z",
      verifiedAt: "2026-08-14T16:00:00.000Z",
      primary: false,
    },
    {
      id: "fundamental:yahoo",
      kind: "fundamental_data",
      publisher: "Yahoo Finance",
      url: "https://example.com/fundamental",
      publishedAt: "2026-06-30T00:00:00.000Z",
      verifiedAt: "2026-08-14T16:00:00.000Z",
      primary: false,
    },
    {
      id: "fx:eur",
      kind: "fx_data",
      publisher: "European Central Bank via Frankfurter",
      url: "https://example.com/fx",
      publishedAt: "2026-08-14T16:00:00.000Z",
      verifiedAt: "2026-08-14T16:00:00.000Z",
      primary: false,
    },
    {
      id: "report:q2",
      kind: "quarterly_report",
      publisher: "Test AB",
      url: "https://example.com/report",
      publishedAt: "2026-07-20T06:00:00.000Z",
      verifiedAt: "2026-08-14T16:00:00.000Z",
      primary: true,
    },
  ];
}

describe("DivLab valuation provenance", () => {
  it("maps provider, market and FX sources to each available trailing measure", () => {
    const valuation = buildValuationAnalysis({
      currentPrice: 100,
      currency: "SEK",
      epsTtm: 10,
      epsCurrency: "SEK",
      freeCashFlowPerShareTtm: 5,
      freeCashFlowPerShareCurrency: "SEK",
      marketCap: 20_000,
      cash: 2_200,
      totalDebt: 1_100,
      ebitTtm: 2_200,
      ebitdaTtm: 2_750,
      scenarios: [],
    });

    const provenance = buildValuationProvenance({
      sources: sources(),
      valuation,
      valuationInputs: {
        epsTtm: normalized(10),
        freeCashFlowPerShareTtm: normalized(5, ["fx:eur"]),
      },
      enterpriseInputs: {
        marketCap: amount(20_000),
        cash: amount(2_200, ["fx:eur"]),
        totalDebt: amount(1_100, ["fx:eur"]),
        ebitTtm: amount(2_200, ["fx:eur"]),
        ebitdaTtm: amount(2_750, ["fx:eur"]),
      },
      reconciliation: reconciliation(),
    });

    assert.equal(provenance.version, "valuation-provenance-v1");
    assert.deepEqual(provenance.measures.pe.sourceIds, ["market:yahoo", "fundamental:yahoo"]);
    assert.equal(provenance.measures.pe.traceable, true);
    assert.deepEqual(provenance.measures.pe.primaryConfirmedMetrics, ["eps"]);

    assert.deepEqual(provenance.measures.priceToFcf.sourceIds, [
      "market:yahoo",
      "fundamental:yahoo",
      "fx:eur",
    ]);
    assert.equal(provenance.measures.priceToFcf.traceable, true);

    assert.deepEqual(provenance.measures.evToEbitda.sourceIds, [
      "market:yahoo",
      "fundamental:yahoo",
      "fx:eur",
    ]);
    assert.equal(provenance.measures.evToEbitda.traceable, true);
    assert.deepEqual(provenance.measures.evToEbit.primaryConfirmedMetrics, ["operatingIncome"]);
  });

  it("marks an available valuation untraceable when a required provider or FX source is missing", () => {
    const valuation = buildValuationAnalysis({
      currentPrice: 100,
      currency: "SEK",
      freeCashFlowPerShareTtm: 5,
      freeCashFlowPerShareCurrency: "SEK",
      marketCap: 20_000,
      cash: 2_200,
      totalDebt: 1_100,
      ebitdaTtm: 2_750,
      scenarios: [],
    });

    const incompleteSources = sources().filter(
      (source) => source.kind !== "fundamental_data" && source.kind !== "fx_data",
    );
    const provenance = buildValuationProvenance({
      sources: incompleteSources,
      valuation,
      valuationInputs: {
        epsTtm: normalized(10),
        freeCashFlowPerShareTtm: normalized(5, ["fx:missing"]),
      },
      enterpriseInputs: {
        marketCap: amount(20_000),
        cash: amount(2_200, ["fx:missing"]),
        totalDebt: amount(1_100, ["fx:missing"]),
        ebitTtm: amount(2_200, ["fx:missing"]),
        ebitdaTtm: amount(2_750, ["fx:missing"]),
      },
      reconciliation: reconciliation(),
    });

    assert.equal(provenance.measures.priceToFcf.available, true);
    assert.equal(provenance.measures.priceToFcf.traceable, false);
    assert.ok(provenance.measures.priceToFcf.sourceIds.includes("fx:missing"));
    assert.equal(provenance.measures.evToEbitda.available, true);
    assert.equal(provenance.measures.evToEbitda.traceable, false);
  });
});
