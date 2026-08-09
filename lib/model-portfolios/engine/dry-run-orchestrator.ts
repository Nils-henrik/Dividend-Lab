import "server-only";

import { createModelPortfolioAdminClient } from "../admin";
import type { ModelPortfolioEvidence } from "./decision";
import { runPortfolioDryRun } from "./dry-run";
import { createDryRunEodhdBudget, type EodhdCallBudgetSnapshot } from "./eodhd-budget";
import { fetchDailyHistory, fetchDelayedQuotes } from "./eodhd";
import type { ModelPortfolioStrategyKey } from "./policy";
import { buildMarketResearchCandidate } from "./research-market";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

// Seven instruments keeps the free EODHD dry-run envelope at exactly eight
// possible calls: one batched delayed-quote request + seven history requests.
// The mix intentionally covers quality/compounders, cyclicals, financials,
// telecom/dividend and a higher-beta growth candidate so the four mandates do
// not all receive an identical style universe.
const BOOTSTRAP_RESEARCH_UNIVERSE = [
  { symbol: "INVE-B", name: "Investor AB ser. B", market: "SE" as const },
  { symbol: "VOLV-B", name: "Volvo AB ser. B", market: "SE" as const },
  { symbol: "ATCO-A", name: "Atlas Copco AB ser. A", market: "SE" as const },
  { symbol: "SEB-A", name: "SEB AB ser. A", market: "SE" as const },
  { symbol: "ERIC-B", name: "Ericsson AB ser. B", market: "SE" as const },
  { symbol: "EVO", name: "Evolution AB", market: "SE" as const },
  { symbol: "TEL2-B", name: "Tele2 AB ser. B", market: "SE" as const },
] as const;

type PortfolioRow = {
  id: string;
  slug: string;
  name: string;
  strategy_key: ModelPortfolioStrategyKey;
  objective: string;
  status: "draft" | "active" | "paused";
};

type HoldingRow = {
  portfolio_id: string;
  instrument_symbol: string;
  exchange: string;
  instrument_name: string;
  quantity: number | string;
  average_cost_minor: number;
  last_price_minor: number | null;
};

type CashRow = { portfolio_id: string; amount_minor: number };

export type DryRunOrchestrationResult = {
  mode: "dry_run";
  executionAllowed: false;
  marketDataProvider: "eodhd";
  eodhdBudget: EodhdCallBudgetSnapshot;
  candidates: Array<{
    symbol: string;
    exchange: string;
    quoteAsOf: string | null;
    historyBars: number;
    historyError?: string;
  }>;
  portfolios: Array<{
    id: string;
    slug: string;
    name: string;
    ok: boolean;
    action?: string;
    symbol?: string | null;
    convictionScore?: number;
    rationale?: string;
    model?: string;
    estimatedCostUsdMicros?: number;
    reason?: string;
  }>;
  totalEstimatedAiCostUsdMicros: number;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildPortfolioSnapshot(input: {
  portfolio: PortfolioRow;
  cashMinor: number;
  holdings: HoldingRow[];
}): string {
  const holdingLines = input.holdings.length
    ? input.holdings.map((holding) => {
        const quantity = Number(holding.quantity);
        return `${holding.instrument_symbol}.${holding.exchange}: qty=${quantity}, avgCostMinor=${holding.average_cost_minor}, lastPriceMinor=${holding.last_price_minor ?? "n/a"}`;
      })
    : ["inga befintliga innehav"];

  return [
    `Portfölj: ${input.portfolio.name}`,
    `Strategi: ${input.portfolio.strategy_key}`,
    `Status: ${input.portfolio.status}`,
    `Mål: ${input.portfolio.objective}`,
    `Tillgänglig modellkassa (minor SEK): ${input.cashMinor}`,
    "Befintliga innehav:",
    ...holdingLines,
  ].join("\n");
}

function technicalEvidenceSummary(technical: TechnicalAnalysisSnapshot | undefined): string[] {
  if (!technical || technical.sessions === 0) return ["Teknisk analys: otillräcklig historik."];
  const values = [
    `Teknisk regim ${technical.trend.regime}.`,
    `Teknisk komposit ${technical.scores.composite.toFixed(3)}.`,
    `Trend ${technical.scores.trend.toFixed(3)}, momentum ${technical.scores.momentum.toFixed(3)}, volym ${technical.scores.volume.toFixed(3)}, breakout ${technical.scores.breakout.toFixed(3)}, stabilitet ${technical.scores.stability.toFixed(3)}.`,
  ];
  if (Number.isFinite(technical.momentum.rsi14)) {
    values.push(`RSI14 ${(technical.momentum.rsi14 as number).toFixed(1)}.`);
  }
  if (Number.isFinite(technical.trend.adx14)) {
    values.push(`ADX14 ${(technical.trend.adx14 as number).toFixed(1)}.`);
  }
  if (technical.signals.length) values.push(`Sammanfattade signaler: ${technical.signals.slice(0, 3).join(" ")}`);
  return values;
}

function marketEvidence(input: {
  symbol: string;
  name: string;
  quoteAsOf: string | null;
  close: number | null;
  volume: number | null;
  changePct: number | null;
  historyBars: number;
  technical?: TechnicalAnalysisSnapshot;
}): ModelPortfolioEvidence {
  const publishedAt = input.quoteAsOf ?? new Date().toISOString();
  return {
    id: `market:${input.symbol}:ST:${publishedAt}`,
    kind: "market_data",
    publisher: "EODHD + DivLab deterministic TA",
    publishedAt,
    verifiedAt: new Date().toISOString(),
    title: `${input.name} (${input.symbol}.ST) – fördröjd marknadsdata och tekniska signaler`,
    summary: [
      `Symbol ${input.symbol}.ST.`,
      `Senaste fördröjda close ${input.close ?? "saknas"}.`,
      `Volym ${input.volume ?? "saknas"}.`,
      `Dagsförändring ${input.changePct ?? "saknas"}%.`,
      `Historik ${input.historyBars} dagsstaplar.`,
      ...technicalEvidenceSummary(input.technical),
      "Tekniska signaler är deterministiskt härledda från samma historiska OHLCV-serie och är endast beslutsunderlag, aldrig en fristående köpsignal.",
      "Datan är research-only och får inte användas som exakt exekveringskurs.",
    ].join(" "),
  };
}

export async function runAllModelPortfoliosDryRun(now = new Date()): Promise<DryRunOrchestrationResult> {
  const supabase = createModelPortfolioAdminClient();
  if (!supabase) throw new Error("model_portfolio_admin_unavailable");

  const [portfolioResult, holdingResult, cashResult] = await Promise.all([
    supabase
      .from("model_portfolios")
      .select("id,slug,name,strategy_key,objective,status")
      .order("sort_order", { ascending: true }),
    supabase
      .from("model_portfolio_holdings")
      .select("portfolio_id,instrument_symbol,exchange,instrument_name,quantity,average_cost_minor,last_price_minor")
      .gt("quantity", 0),
    supabase.from("model_portfolio_cash_ledger").select("portfolio_id,amount_minor"),
  ]);
  if (portfolioResult.error || holdingResult.error || cashResult.error) {
    throw new Error("model_portfolio_state_unavailable");
  }

  const portfolios = (portfolioResult.data ?? []) as PortfolioRow[];
  const holdings = (holdingResult.data ?? []) as HoldingRow[];
  const cashRows = (cashResult.data ?? []) as CashRow[];

  const cashByPortfolio = new Map<string, number>();
  for (const row of cashRows) {
    cashByPortfolio.set(row.portfolio_id, (cashByPortfolio.get(row.portfolio_id) ?? 0) + Number(row.amount_minor));
  }

  const budget = createDryRunEodhdBudget();
  const quotes = await fetchDelayedQuotes(
    BOOTSTRAP_RESEARCH_UNIVERSE.map((instrument) => ({ symbol: instrument.symbol, market: instrument.market })),
    budget,
  );
  const quoteBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  // ~420 calendar days typically supplies enough sessions for SMA200 and
  // 52-week context while still costing one history request per instrument.
  const from = new Date(now.getTime() - 420 * 24 * 60 * 60 * 1_000);
  const candidates = [];
  const evidence: ModelPortfolioEvidence[] = [];
  const candidateDiagnostics: DryRunOrchestrationResult["candidates"] = [];

  for (const instrument of BOOTSTRAP_RESEARCH_UNIVERSE) {
    const quote = quoteBySymbol.get(instrument.symbol) ?? null;
    let history = [] as Awaited<ReturnType<typeof fetchDailyHistory>>;
    let historyError: string | undefined;
    try {
      history = await fetchDailyHistory(instrument.symbol, instrument.market, isoDate(from), isoDate(now), budget);
    } catch (error) {
      historyError = error instanceof Error ? error.message : "history_fetch_failed";
    }

    if (quote || history.length) {
      const candidate = buildMarketResearchCandidate({
        symbol: instrument.symbol,
        exchange: "ST",
        history,
        quote,
        fxToSek: 1,
      });
      candidates.push(candidate);
      evidence.push(
        marketEvidence({
          symbol: instrument.symbol,
          name: instrument.name,
          quoteAsOf: quote?.timestamp ?? null,
          close: quote?.close ?? history.at(-1)?.close ?? null,
          volume: quote?.volume ?? history.at(-1)?.volume ?? null,
          changePct: quote?.changePct ?? null,
          historyBars: history.length,
          technical: candidate.technicalAnalysis,
        }),
      );
    }

    candidateDiagnostics.push({
      symbol: instrument.symbol,
      exchange: "ST",
      quoteAsOf: quote?.timestamp ?? null,
      historyBars: history.length,
      ...(historyError ? { historyError } : {}),
    });
  }

  if (!candidates.length) throw new Error("dry_run_no_market_candidates");

  const portfolioResults: DryRunOrchestrationResult["portfolios"] = [];
  let spentTodayUsdMicros = 0;

  for (const portfolio of portfolios) {
    const result = await runPortfolioDryRun({
      strategyKey: portfolio.strategy_key,
      runKind: "primary",
      portfolioSnapshot: buildPortfolioSnapshot({
        portfolio,
        cashMinor: cashByPortfolio.get(portfolio.id) ?? 0,
        holdings: holdings.filter((holding) => holding.portfolio_id === portfolio.id),
      }),
      candidates,
      evidence,
      spentTodayUsdMicros,
    });

    if (!result.ok) {
      portfolioResults.push({
        id: portfolio.id,
        slug: portfolio.slug,
        name: portfolio.name,
        ok: false,
        reason: result.reason,
      });
      continue;
    }

    spentTodayUsdMicros += result.estimatedCostUsdMicros;
    portfolioResults.push({
      id: portfolio.id,
      slug: portfolio.slug,
      name: portfolio.name,
      ok: true,
      action: result.decision.action,
      symbol: result.decision.symbol,
      convictionScore: result.decision.convictionScore,
      rationale: result.decision.rationale,
      model: result.model,
      estimatedCostUsdMicros: result.estimatedCostUsdMicros,
    });
  }

  return {
    mode: "dry_run",
    executionAllowed: false,
    marketDataProvider: "eodhd",
    eodhdBudget: budget.snapshot(),
    candidates: candidateDiagnostics,
    portfolios: portfolioResults,
    totalEstimatedAiCostUsdMicros: spentTodayUsdMicros,
  };
}
