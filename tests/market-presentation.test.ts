import "./shims/register-server-only.mjs";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TradeDetailView from "../components/portfolios/TradeDetailView";
import {
  EXTERNAL_MARKET_DATA_LABEL,
  MARKET_DATA_LABEL,
  MARKET_DATA_REFRESH_NOTE,
  presentMarketEvidencePublisher,
} from "../lib/companies/source-labels";
import type { ModelPortfolioResearchRow } from "../lib/divbrain/server/research/model-portfolio-research";
import type { PortfolioTradeDetail } from "../lib/model-portfolios/transparency";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function researchRow(
  publisher: string,
  summary = "Historik och teknisk analys utan leverantörsnamn.",
): ModelPortfolioResearchRow {
  return {
    id: "market-yahoo",
    instrument_symbol: "INVE-B",
    exchange: "ST",
    instrument_name: "Investor",
    kind: "market_data",
    publisher,
    source_url: "https://finance.yahoo.com/quote/INVE-B.ST",
    published_at: "2026-09-30T08:00:00.000Z",
    verified_at: "2026-09-30T08:05:00.000Z",
    title: "Investor – marknadsdata, teknisk analys och fundamentals",
    summary,
    metadata: {
      primary_source: "mixed",
      verification_state: "verified",
    },
  };
}

function tradeDetail(publisher: string, summary: string): PortfolioTradeDetail {
  return {
    portfolio: {
      id: "portfolio-1",
      slug: "balanserad",
      name: "Balanserad",
      strategyKey: "balanced",
      riskLabel: "Balanserad",
    },
    trade: {
      id: "trade-1",
      decisionId: "decision-1",
      transactionType: "buy",
      instrumentSymbol: "INVE-B",
      exchange: "ST",
      instrumentName: "Investor",
      quantity: 10,
      priceMinor: 10000,
      grossAmountMinor: 100000,
      feeMinor: 0,
      currency: "SEK",
      executedAt: "2026-09-30T09:00:00.000Z",
      marketDataAsOf: "2026-09-30T08:00:00.000Z",
      rationale: "Ett begränsat förstaköp utifrån sparat underlag.",
      nativeCurrency: "USD",
      nativePriceMinor: 1000,
      nativeGrossAmountMinor: 10000,
      fxRateToSek: 10,
      fxAsOf: "2026-09-30T08:00:00.000Z",
      fxSourcePublisher: "Yahoo Finance market data",
      fillLabel: "SIMULATED",
    },
    decision: {
      id: "decision-1",
      decisionType: "buy",
      status: "executed",
      rationale: "Ett begränsat förstaköp utifrån sparat underlag.",
      modelProvider: "divlab",
      modelName: "test",
      promptVersion: "v1",
      marketDataAsOf: "2026-09-30T08:00:00.000Z",
      evidence: [
        {
          title: "Investor – marknadsdata, teknisk analys och fundamentals",
          publisher,
          summary,
          publishedAt: "2026-09-30T08:00:00.000Z",
        },
      ],
      inputSnapshot: null,
      createdAt: "2026-09-30T08:30:00.000Z",
      executedAt: "2026-09-30T09:00:00.000Z",
    },
  };
}

test("portfolio and DivBrain presentation hide Yahoo Finance branding", async () => {
  const { researchRowToDivBrainSource } = await import("../lib/divbrain/server/research/model-portfolio-research");
  assert.equal(
    presentMarketEvidencePublisher("Yahoo Finance + DivLab deterministic TA"),
    `${MARKET_DATA_LABEL} + DivLab-analys`,
  );
  assert.equal(
    presentMarketEvidencePublisher("yahoo finance + eodhd + divlab deterministic ta"),
    `${EXTERNAL_MARKET_DATA_LABEL} + DivLab-analys`,
  );
  assert.equal(presentMarketEvidencePublisher("Investor IR"), "Investor IR");
  assert.equal(presentMarketEvidencePublisher("European Central Bank via Frankfurter"), "European Central Bank via Frankfurter");

  const pipeline = read("lib/model-portfolios/engine/research-pipeline.ts");
  assert.match(pipeline, /Yahoo Finance \+ DivLab deterministic TA/);
  assert.match(pipeline, /Yahoo Finance \+ EODHD \+ DivLab deterministic TA/);
  const chain = read("lib/companies/source-chain.ts");
  assert.match(chain, /yahoo_chart/);
  assert.match(chain, /query1\.finance\.yahoo\.com/);

  const summary = "Historik och teknisk analys utan leverantörsnamn.";
  const source = researchRowToDivBrainSource(
    researchRow("Yahoo Finance + DivLab deterministic TA", summary),
  );
  assert.equal(source.publisher, "Marknadsdata + DivLab-analys");
  assert.equal(source.canonicalUrl, "https://finance.yahoo.com/quote/INVE-B.ST");
  assert.equal(source.excerpt, summary);
  assert.doesNotMatch(source.publisher, /yahoo finance/i);

  const html = renderToStaticMarkup(createElement(TradeDetailView, {
    detail: tradeDetail("Yahoo Finance + EODHD + DivLab deterministic TA", summary),
  }));
  assert.match(html, /Extern marknadsdata \+ DivLab-analys/);
  assert.match(html, /Marknadsdata/);
  assert.doesNotMatch(html, /yahoo finance/i);
  assert.match(html, new RegExp(summary));
});

test("company chart freshness note follows the 900-second refresh contract", () => {
  const transport = read("lib/model-portfolios/engine/yahoo-research.ts");
  assert.match(transport, /export const YAHOO_HISTORY_REVALIDATE_SECONDS = 15 \* 60;/);
  assert.match(transport, /fetchYahooHistoryResearch/);
  assert.match(transport, /next: \{ revalidate: YAHOO_HISTORY_REVALIDATE_SECONDS \}/);
  assert.equal(15 * 60, 900);
  assert.equal(
    MARKET_DATA_REFRESH_NOTE,
    "Fördröjd marknadsdata · uppdateras normalt var 15:e minut",
  );
  assert.doesNotMatch(MARKET_DATA_REFRESH_NOTE, /yahoo finance|realtid/i);

  const page = read("components/companies/CompanyPageContent.tsx");
  assert.match(page, /id="kursutveckling"[\s\S]*<CompanyPriceChart[\s\S]*\{MARKET_DATA_REFRESH_NOTE\}/);
  assert.match(page, /Graf: TradingView/);
  assert.doesNotMatch(page, /Yahoo Finance/);
});
