import "server-only";

import { createModelPortfolioAdminClient } from "../admin";
import type { ModelPortfolioEvidence } from "./decision";
import { buildDecisionAuditRow, persistDecisionAuditBatch, type DecisionAuditRow } from "./decision-audit";
import { runPortfolioDryRun } from "./dry-run";
import { createDryRunEodhdBudget, type EodhdCallBudgetSnapshot } from "./eodhd-budget";
import { fetchDailyHistory, fetchDelayedQuotes, type DelayedQuote } from "./eodhd";
import type { ModelPortfolioStrategyKey } from "./policy";
import { buildMarketResearchCandidate } from "./research-market";
import { settleModelPortfolioDecision } from "./settle-service";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

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
  strategy_rules: Record<string, unknown> | null;
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
type TransactionTimeRow = {
  portfolio_id: string;
  instrument_symbol: string;
  exchange: string;
  executed_at: string;
};

export type DryRunOrchestrationResult = {
  mode: "dry_run" | "live_simulation";
  executionAllowed: boolean;
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
    decisionId?: string;
    settlementStatus?: "executed" | "skipped" | "rejected" | "not_applicable";
    settlementReason?: string;
    transactionId?: string;
    reason?: string;
  }>;
  totalEstimatedAiCostUsdMicros: number;
  auditPersisted: boolean;
};

export type DryRunAuditOptions = {
  runId: string;
  executionAllowed?: boolean;
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
    "Courtage: varje köp kostar exakt 10,00 SEK och belastar både kassa och snittkostnad.",
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
      "Vid simulerad settlement används den fördröjda close-kursen explicit märkt SIMULATED – aldrig som verklig mäklarfill.",
    ].join(" "),
  };
}

function parseRiskRules(raw: Record<string, unknown> | null): {
  maxSinglePositionPct: number;
  minCashPct: number;
  maxEquityPct: number;
} {
  const maxSinglePositionPct = Number(raw?.max_single_position_pct ?? 15);
  const minCashPct = Number(raw?.min_cash_pct ?? 5);
  const maxEquityPct = Number(raw?.max_equity_pct ?? 95);
  return {
    maxSinglePositionPct: Number.isFinite(maxSinglePositionPct) ? maxSinglePositionPct : 15,
    minCashPct: Number.isFinite(minCashPct) ? minCashPct : 5,
    maxEquityPct: Number.isFinite(maxEquityPct) ? maxEquityPct : 95,
  };
}

function quoteToSimulatedFill(quote: DelayedQuote, instrumentName: string) {
  if (quote.close === null || !Number.isFinite(quote.close) || quote.close <= 0) return null;
  return {
    symbol: quote.symbol,
    exchange: quote.exchange,
    instrumentName,
    nativeCurrency: "SEK",
    nativePriceMinor: Math.round(quote.close * 100),
    asOf: quote.timestamp,
    sourcePublisher: "EODHD delayed quote",
    delayed: true as const,
  };
}

export async function runAllModelPortfoliosDryRun(
  now = new Date(),
  audit?: DryRunAuditOptions,
): Promise<DryRunOrchestrationResult> {
  const supabase = createModelPortfolioAdminClient();
  if (!supabase) throw new Error("model_portfolio_admin_unavailable");
  if (audit && !audit.runId.trim()) throw new Error("invalid_dry_run_audit_run_id");

  const executionAllowed = Boolean(audit?.executionAllowed);

  const [portfolioResult, holdingResult, cashResult, recentTxResult] = await Promise.all([
    supabase
      .from("model_portfolios")
      .select("id,slug,name,strategy_key,objective,status,strategy_rules")
      .order("sort_order", { ascending: true }),
    supabase
      .from("model_portfolio_holdings")
      .select("portfolio_id,instrument_symbol,exchange,instrument_name,quantity,average_cost_minor,last_price_minor")
      .gt("quantity", 0),
    supabase.from("model_portfolio_cash_ledger").select("portfolio_id,amount_minor"),
    supabase
      .from("model_portfolio_transactions")
      .select("portfolio_id,instrument_symbol,exchange,executed_at")
      .order("executed_at", { ascending: false })
      .limit(200),
  ]);
  if (portfolioResult.error || holdingResult.error || cashResult.error || recentTxResult.error) {
    throw new Error("model_portfolio_state_unavailable");
  }

  const portfolios = (portfolioResult.data ?? []) as PortfolioRow[];
  const holdings = (holdingResult.data ?? []) as HoldingRow[];
  const cashRows = (cashResult.data ?? []) as CashRow[];
  const recentTx = (recentTxResult.data ?? []) as TransactionTimeRow[];

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
  const auditRows: DecisionAuditRow[] = [];
  let spentTodayUsdMicros = 0;

  for (const portfolio of portfolios) {
    const portfolioHoldings = holdings.filter((holding) => holding.portfolio_id === portfolio.id);
    const cashMinor = cashByPortfolio.get(portfolio.id) ?? 0;
    const portfolioSnapshot = buildPortfolioSnapshot({
      portfolio,
      cashMinor,
      holdings: portfolioHoldings,
    });

    const result = await runPortfolioDryRun({
      strategyKey: portfolio.strategy_key,
      runKind: "primary",
      portfolioSnapshot,
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
      settlementStatus: "not_applicable",
    });

    if (audit) {
      auditRows.push(
        buildDecisionAuditRow({
          runId: audit.runId,
          portfolioId: portfolio.id,
          strategyKey: portfolio.strategy_key,
          decision: result.decision,
          evidence,
          rankedCandidates: result.rankedCandidates,
          modelName: result.model,
          estimatedCostUsdMicros: result.estimatedCostUsdMicros,
          usage: result.usage,
          portfolioSnapshot,
          executionAllowed,
        }),
      );
    }
  }

  let auditPersisted = false;
  if (audit) {
    const allPortfoliosSucceeded = portfolios.length > 0 && portfolioResults.length === portfolios.length && portfolioResults.every((item) => item.ok);
    if (!allPortfoliosSucceeded || auditRows.length !== portfolios.length) {
      throw new Error("decision_audit_requires_complete_portfolio_run");
    }
    const decisionIds = await persistDecisionAuditBatch({ supabase, rows: auditRows });
    portfolioResults.forEach((result) => {
      result.decisionId = decisionIds.get(result.id);
    });
    auditPersisted = true;

    if (executionAllowed) {
      for (const portfolioResult of portfolioResults) {
        if (!portfolioResult.ok || !portfolioResult.decisionId) continue;
        const action = portfolioResult.action;
        if (action !== "buy" && action !== "sell" && action !== "trim" && action !== "rebalance") {
          portfolioResult.settlementStatus = "skipped";
          portfolioResult.settlementReason = "non_tradable_action";
          continue;
        }

        const portfolio = portfolios.find((item) => item.id === portfolioResult.id);
        const auditRow = auditRows.find((row) => row.portfolio_id === portfolioResult.id);
        if (!portfolio || !auditRow || !auditRow.instrument_symbol || !auditRow.exchange) {
          portfolioResult.settlementStatus = "rejected";
          portfolioResult.settlementReason = "missing_decision_instrument";
          continue;
        }

        const quote = quoteBySymbol.get(auditRow.instrument_symbol);
        const fill = quote
          ? quoteToSimulatedFill(quote, auditRow.instrument_name ?? auditRow.instrument_symbol)
          : null;
        if (!fill) {
          portfolioResult.settlementStatus = "rejected";
          portfolioResult.settlementReason = "missing_simulated_quote";
          continue;
        }

        const portfolioHoldings = holdings.filter((holding) => holding.portfolio_id === portfolio.id);
        const cashMinor = cashByPortfolio.get(portfolio.id) ?? 0;
        const investedMinor = portfolioHoldings.reduce((sum, holding) => {
          const quantity = Number(holding.quantity);
          const price = Number(holding.last_price_minor ?? 0);
          if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0) return sum;
          return sum + Math.round(quantity * price);
        }, 0);
        const currentHoldingRow = portfolioHoldings.find(
          (holding) =>
            holding.instrument_symbol === auditRow.instrument_symbol &&
            holding.exchange === auditRow.exchange,
        );
        const lastTrade = recentTx.find(
          (row) =>
            row.portfolio_id === portfolio.id &&
            row.instrument_symbol === auditRow.instrument_symbol &&
            row.exchange === auditRow.exchange,
        );
        const hoursSince = lastTrade
          ? (now.getTime() - Date.parse(lastTrade.executed_at)) / (60 * 60 * 1_000)
          : null;

        const side = action === "buy" ? "buy" : "sell";
        const targetWeightPct = Number(auditRow.input_snapshot.proposed_portfolio_pct ?? 0);
        const settlement = await settleModelPortfolioDecision(supabase, {
          decisionId: portfolioResult.decisionId,
          portfolioStatus: portfolio.status,
          executionAllowedAtDecisionTime: true,
          strategyKey: portfolio.strategy_key,
          rules: parseRiskRules(portfolio.strategy_rules),
          cashMinor,
          portfolioValueMinor: cashMinor + investedMinor,
          investedMinor,
          currentHolding: currentHoldingRow
            ? {
                quantity: Number(currentHoldingRow.quantity),
                averageCostMinor: Number(currentHoldingRow.average_cost_minor),
                lastPriceMinor: currentHoldingRow.last_price_minor,
              }
            : null,
          targetWeightPct,
          side,
          quote: fill,
          convictionScore: Number(auditRow.input_snapshot.conviction_score ?? 0),
          materialThesisBreak: Boolean(auditRow.input_snapshot.material_thesis_break),
          hoursSinceLastTradeInInstrument: hoursSince,
          instrumentName: auditRow.instrument_name ?? fill.instrumentName,
          now,
        });

        if (!settlement.ok) {
          portfolioResult.settlementStatus = "rejected";
          portfolioResult.settlementReason = settlement.planReason ?? settlement.reason;
          continue;
        }

        portfolioResult.settlementStatus = "executed";
        portfolioResult.transactionId = settlement.transactionId;
        cashByPortfolio.set(
          portfolio.id,
          (cashByPortfolio.get(portfolio.id) ?? 0) + settlement.plan.cashDeltaMinor,
        );
      }
    }
  }

  return {
    mode: executionAllowed ? "live_simulation" : "dry_run",
    executionAllowed,
    marketDataProvider: "eodhd",
    eodhdBudget: budget.snapshot(),
    candidates: candidateDiagnostics,
    portfolios: portfolioResults,
    totalEstimatedAiCostUsdMicros: spentTodayUsdMicros,
    auditPersisted,
  };
}
