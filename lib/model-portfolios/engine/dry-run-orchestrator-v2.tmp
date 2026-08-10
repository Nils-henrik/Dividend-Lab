import "server-only";

import { createModelPortfolioAdminClient } from "../admin";
import { aggregatePortfolioAiUsage, type ModelPortfolioAiUsage, type ModelPortfolioBatchAiUsage } from "./ai-usage";
import { buildDecisionAuditRow, persistDecisionAuditBatch, type DecisionAuditRow } from "./decision-audit";
import { runPortfolioDryRun } from "./dry-run";
import type { EodhdCallBudgetSnapshot, ModelPortfolioResearchPass } from "./eodhd-budget";
import type { DelayedQuote } from "./eodhd";
import type { ModelPortfolioStrategyKey } from "./policy";
import { buildFollowerTradePayload } from "./pricing";
import { runModelPortfolioResearchPipeline, type ResearchCandidateDiagnostic } from "./research-pipeline";
import { settleModelPortfolioDecision } from "./settle-service";

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
  researchPass: ModelPortfolioResearchPass;
  marketDataProvider: "yahoo_eodhd";
  researchSummary: string;
  eodhdBudget: EodhdCallBudgetSnapshot;
  candidates: ResearchCandidateDiagnostic[];
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
    usage?: ModelPortfolioAiUsage;
    decisionId?: string;
    settlementStatus?: "executed" | "skipped" | "rejected" | "not_applicable";
    settlementReason?: string;
    transactionId?: string;
    followerEvent?: ReturnType<typeof buildFollowerTradePayload>;
    reason?: string;
  }>;
  totalEstimatedAiCostUsdMicros: number;
  aiUsage: ModelPortfolioBatchAiUsage;
  auditPersisted: boolean;
};

export type DryRunAuditOptions = {
  runId: string;
  executionAllowed?: boolean;
  researchPass?: ModelPortfolioResearchPass;
};

function instrumentKey(symbol: string, exchange: string): string {
  return `${symbol}.${exchange}`.toUpperCase();
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
  const exchange = quote.exchange.toUpperCase();
  const nativeCurrency = exchange === "US" || exchange === "NASDAQ" || exchange === "NYSE" ? "USD" : "SEK";
  return {
    symbol: quote.symbol,
    exchange: quote.exchange,
    instrumentName,
    nativeCurrency,
    nativePriceMinor: Math.round(quote.close * 100),
    asOf: quote.timestamp,
    sourcePublisher: "Yahoo Finance market data",
    delayed: true as const,
  };
}

async function markDecisionSettlementRejected(
  supabase: NonNullable<ReturnType<typeof createModelPortfolioAdminClient>>,
  decisionId: string,
  reason: string,
): Promise<void> {
  const status = reason.startsWith("rpc_failed") ? "failed" : "rejected";
  const { data } = await supabase
    .from("model_portfolio_decisions")
    .select("input_snapshot")
    .eq("id", decisionId)
    .maybeSingle();
  const previousSnapshot =
    data?.input_snapshot && typeof data.input_snapshot === "object"
      ? (data.input_snapshot as Record<string, unknown>)
      : {};
  await supabase
    .from("model_portfolio_decisions")
    .update({
      status,
      input_snapshot: {
        ...previousSnapshot,
        settlement_outcome: { status, reason, at: new Date().toISOString() },
      },
    })
    .eq("id", decisionId)
    .eq("status", "proposed");
}

export async function runAllModelPortfoliosDryRun(
  now = new Date(),
  audit?: DryRunAuditOptions,
): Promise<DryRunOrchestrationResult> {
  const supabase = createModelPortfolioAdminClient();
  if (!supabase) throw new Error("model_portfolio_admin_unavailable");
  if (audit && !audit.runId.trim()) throw new Error("invalid_dry_run_audit_run_id");

  const executionAllowed = Boolean(audit?.executionAllowed);
  const researchPass = audit?.researchPass ?? "us_1550";

  const [portfolioResult, holdingResult, cashResult, recentTxResult] = await Promise.all([
    supabase.from("model_portfolios").select("id,slug,name,strategy_key,objective,status,strategy_rules").order("sort_order", { ascending: true }),
    supabase.from("model_portfolio_holdings").select("portfolio_id,instrument_symbol,exchange,instrument_name,quantity,average_cost_minor,last_price_minor").gt("quantity", 0),
    supabase.from("model_portfolio_cash_ledger").select("portfolio_id,amount_minor"),
    supabase.from("model_portfolio_transactions").select("portfolio_id,instrument_symbol,exchange,executed_at").order("executed_at", { ascending: false }).limit(200),
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

  const research = await runModelPortfolioResearchPipeline({
    supabase,
    pass: researchPass,
    holdings,
    now,
  });

  const portfolioResults: DryRunOrchestrationResult["portfolios"] = [];
  const auditRows: DecisionAuditRow[] = [];
  let spentTodayUsdMicros = 0;

  for (const portfolio of portfolios) {
    const portfolioHoldings = holdings.filter((holding) => holding.portfolio_id === portfolio.id);
    const cashMinor = cashByPortfolio.get(portfolio.id) ?? 0;
    const portfolioSnapshot = buildPortfolioSnapshot({ portfolio, cashMinor, holdings: portfolioHoldings });

    const result = await runPortfolioDryRun({
      strategyKey: portfolio.strategy_key,
      runKind: "primary",
      portfolioSnapshot,
      candidates: research.candidates,
      evidence: research.evidence,
      spentTodayUsdMicros,
      runId: audit?.runId ?? null,
    });

    if (!result.ok) {
      portfolioResults.push({ id: portfolio.id, slug: portfolio.slug, name: portfolio.name, ok: false, reason: result.reason });
      continue;
    }

    spentTodayUsdMicros += result.estimatedCostUsdMicros;
    const rationale = `${research.summary} Beslut: ${result.decision.rationale}`;
    portfolioResults.push({
      id: portfolio.id,
      slug: portfolio.slug,
      name: portfolio.name,
      ok: true,
      action: result.decision.action,
      symbol: result.decision.symbol,
      convictionScore: result.decision.convictionScore,
      rationale,
      model: result.model,
      estimatedCostUsdMicros: result.estimatedCostUsdMicros,
      usage: result.usage,
      settlementStatus: "not_applicable",
    });

    if (audit) {
      auditRows.push(buildDecisionAuditRow({
        runId: audit.runId,
        portfolioId: portfolio.id,
        strategyKey: portfolio.strategy_key,
        decision: result.decision,
        evidence: research.evidence,
        rankedCandidates: result.rankedCandidates,
        modelName: result.model,
        estimatedCostUsdMicros: result.estimatedCostUsdMicros,
        usage: result.usage,
        portfolioSnapshot,
        executionAllowed,
        researchSummary: research.summary,
      }));
    }
  }

  let auditPersisted = false;
  if (audit) {
    const allPortfoliosSucceeded = portfolios.length > 0 && portfolioResults.length === portfolios.length && portfolioResults.every((item) => item.ok);
    if (!allPortfoliosSucceeded || auditRows.length !== portfolios.length) {
      throw new Error("decision_audit_requires_complete_portfolio_run");
    }
    const decisionIds = await persistDecisionAuditBatch({ supabase, rows: auditRows });
    portfolioResults.forEach((result) => { result.decisionId = decisionIds.get(result.id); });
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
          await markDecisionSettlementRejected(supabase, portfolioResult.decisionId, "missing_decision_instrument");
          continue;
        }

        const quote = research.quotes.get(instrumentKey(auditRow.instrument_symbol, auditRow.exchange));
        const fill = quote ? quoteToSimulatedFill(quote, auditRow.instrument_name ?? auditRow.instrument_symbol) : null;
        if (!fill) {
          portfolioResult.settlementStatus = "rejected";
          portfolioResult.settlementReason = "missing_simulated_quote";
          await markDecisionSettlementRejected(supabase, portfolioResult.decisionId, "missing_simulated_quote");
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
        const currentHoldingRow = portfolioHoldings.find((holding) =>
          holding.instrument_symbol === auditRow.instrument_symbol && holding.exchange === auditRow.exchange,
        );
        const lastTrade = recentTx.find((row) =>
          row.portfolio_id === portfolio.id && row.instrument_symbol === auditRow.instrument_symbol && row.exchange === auditRow.exchange,
        );
        const hoursSince = lastTrade ? (now.getTime() - Date.parse(lastTrade.executed_at)) / (60 * 60 * 1_000) : null;
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
          const reason = settlement.planReason ?? settlement.reason;
          portfolioResult.settlementStatus = "rejected";
          portfolioResult.settlementReason = reason;
          await markDecisionSettlementRejected(supabase, portfolioResult.decisionId, reason);
          continue;
        }

        portfolioResult.settlementStatus = "executed";
        portfolioResult.transactionId = settlement.transactionId;
        portfolioResult.followerEvent = buildFollowerTradePayload({
          symbol: fill.symbol,
          exchange: fill.exchange,
          currency: settlement.plan.nativeCurrency,
          side,
          executionPriceMinor: settlement.plan.priceSekMinor,
          priceBasis: "last_trade",
          marketTimestamp: fill.asOf,
          receivedAt: now.toISOString(),
          provider: "yahoo_finance",
          transactionId: settlement.transactionId,
          portfolioId: portfolio.id,
          quantity: settlement.plan.quantity,
          executedAt: now.toISOString(),
          rationale: auditRow.rationale,
        });
        cashByPortfolio.set(portfolio.id, (cashByPortfolio.get(portfolio.id) ?? 0) + settlement.plan.cashDeltaMinor);
      }
    }
  }

  const aiUsage = aggregatePortfolioAiUsage({
    runId: audit?.runId ?? null,
    timestamp: now.toISOString(),
    portfolios: portfolioResults.map((portfolio) => ({ portfolioId: portfolio.id, slug: portfolio.slug, usage: portfolio.usage })),
  });

  return {
    mode: executionAllowed ? "live_simulation" : "dry_run",
    executionAllowed,
    researchPass,
    marketDataProvider: "yahoo_eodhd",
    researchSummary: research.summary,
    eodhdBudget: research.eodhdBudget,
    candidates: research.diagnostics,
    portfolios: portfolioResults,
    totalEstimatedAiCostUsdMicros: spentTodayUsdMicros,
    aiUsage,
    auditPersisted,
  };
}
