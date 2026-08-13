import "server-only";

import { createModelPortfolioAdminClient } from "../admin";
import { aggregatePortfolioAiUsage, type ModelPortfolioAiUsage, type ModelPortfolioBatchAiUsage } from "./ai-usage";
import { buildDecisionAuditRow, persistDecisionAuditBatch, type DecisionAuditRow } from "./decision-audit";
import {
  buildInvestorFacingDecisionRationale,
  buildInvestorFacingResearchSummary,
  toNarrativeCandidate,
} from "./decision-narrative";
import type { ModelPortfolioDecision, ModelPortfolioEvidence } from "./decision";
import { runPortfolioDryRun } from "./dry-run";
import type { EodhdCallBudgetSnapshot, ModelPortfolioResearchPass } from "./eodhd-budget";
import type { DelayedQuote } from "./eodhd";
import { fetchFxRateToSek } from "./fx-adapter";
import { convertNativeMinorToSek, currencyForExchange, type FxRateQuote, type SupportedFxCurrency } from "./fx";
import type { ModelPortfolioStrategyKey } from "./policy";
import { buildFollowerTradePayload } from "./pricing";
import { MODEL_PORTFOLIO_MANDATES } from "./mandates";
import { rankResearchUniverse, type ResearchCandidate } from "./research";
import { runModelPortfolioResearchPipeline, type ResearchCandidateDiagnostic } from "./research-pipeline";
import {
  attentionCandidatesAsResearch,
  selectPortfolioAttentionCandidates,
} from "./strategy-attention";
import { settleModelPortfolioDecision } from "./settle-service";
import { planSimulatedSettlement } from "./settlement";
import {
  persistModelPortfolioValuationSnapshots,
  refreshModelPortfolioHoldingPrices,
} from "./valuation-snapshots";
import { evaluateWholeShareBuyEligibility } from "./whole-share-eligibility";

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
    "Handelsregel: simuleringen köper och säljer endast hela aktier; fraktionerade aktier är inte tillåtna.",
    "Nya köpkandidater har förfiltrerats så att minst en hel aktie kan köpas utan att bryta mot kassa-, positions- eller equity-regler.",
    "Courtage: 10,00 SEK per genomfört köp och 0,00 SEK vid sälj i DivLabs modellportföljer.",
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
  const nativeCurrency = currencyForExchange(quote.exchange);
  if (!nativeCurrency) return null;
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

function investedValueMinor(holdings: readonly HoldingRow[]): number {
  return holdings.reduce((sum, holding) => {
    const quantity = Number(holding.quantity);
    const price = Number(holding.last_price_minor ?? 0);
    if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0) return sum;
    return sum + Math.round(quantity * price);
  }, 0);
}

function evidenceMatchesCandidate(evidence: ModelPortfolioEvidence, candidate: ResearchCandidate): boolean {
  const id = evidence.id.toUpperCase();
  const title = evidence.title.toUpperCase();
  const symbol = candidate.symbol.toUpperCase();
  const exchange = candidate.exchange.toUpperCase();
  const instrumentToken = `(${symbol}.${exchange})`;
  return id.startsWith(`RESEARCH:${symbol}:${exchange}:`)
    || id.startsWith(`GOOGLE:${symbol}:`)
    || id.startsWith(`PRIMARY:${symbol}:`)
    || (id.startsWith("RESEARCH-CACHE:") && title.includes(instrumentToken));
}

async function filterPortfolioDecisionInputs(input: {
  portfolio: PortfolioRow;
  holdings: HoldingRow[];
  cashMinor: number;
  now: Date;
  candidates: ResearchCandidate[];
  evidence: ModelPortfolioEvidence[];
  quotes: Map<string, DelayedQuote>;
}): Promise<{ candidates: ResearchCandidate[]; evidence: ModelPortfolioEvidence[] }> {
  const heldKeys = new Set(
    input.holdings.map((holding) => instrumentKey(holding.instrument_symbol, holding.exchange)),
  );
  const investedMinor = investedValueMinor(input.holdings);
  const portfolioValueMinor = input.cashMinor + investedMinor;
  const rules = parseRiskRules(input.portfolio.strategy_rules);
  const fxCache = new Map<SupportedFxCurrency, FxRateQuote | null>();
  const selected: ResearchCandidate[] = [];

  for (const candidate of input.candidates) {
    const candidateKey = instrumentKey(candidate.symbol, candidate.exchange);
    if (heldKeys.has(candidateKey)) {
      selected.push(candidate);
      continue;
    }

    const quote = input.quotes.get(candidateKey);
    const fill = quote ? quoteToSimulatedFill(quote, candidate.symbol) : null;
    if (!fill) continue;

    const nativeCurrency = currencyForExchange(candidate.exchange);
    if (!nativeCurrency) continue;

    let fxRate: FxRateQuote | null = null;
    if (nativeCurrency !== "SEK") {
      if (fxCache.has(nativeCurrency)) {
        fxRate = fxCache.get(nativeCurrency) ?? null;
      } else {
        const fetched = await fetchFxRateToSek(nativeCurrency, input.now);
        fxRate = fetched.ok ? fetched.quote : null;
        fxCache.set(nativeCurrency, fxRate);
      }
      if (!fxRate) continue;
    }

    const conversion = convertNativeMinorToSek({
      nativeCurrency,
      nativeAmountMinor: fill.nativePriceMinor,
      fxRateToSek: fxRate,
    });
    if (!conversion.ok || conversion.sekAmountMinor <= 0) continue;

    const eligibility = evaluateWholeShareBuyEligibility({
      strategyKey: input.portfolio.strategy_key,
      rules,
      cashMinor: input.cashMinor,
      portfolioValueMinor,
      investedMinor,
      currentPositionValueMinor: 0,
      priceSekMinor: conversion.sekAmountMinor,
    });
    if (eligibility.eligible) selected.push(candidate);
  }

  const evidence = input.evidence.filter((item) =>
    selected.some((candidate) => evidenceMatchesCandidate(item, candidate)),
  );
  return { candidates: selected, evidence };
}

function buildPortfolioResearchSummary(input: {
  pass: ModelPortfolioResearchPass;
  strategyKey: ModelPortfolioStrategyKey;
  candidates: readonly ResearchCandidate[];
  holdings: readonly HoldingRow[];
  names: ReadonlyMap<string, string>;
  quotes: ReadonlyMap<string, DelayedQuote>;
}): string {
  const heldKeys = new Set(
    input.holdings.map((holding) => instrumentKey(holding.instrument_symbol, holding.exchange)),
  );
  const ranked = rankResearchUniverse(input.candidates, input.strategyKey);
  const rankedKeys = new Set(ranked.map((candidate) => instrumentKey(candidate.symbol, candidate.exchange)));
  const monitoredHoldings = input.candidates.filter((candidate) => {
    const candidateKey = instrumentKey(candidate.symbol, candidate.exchange);
    return heldKeys.has(candidateKey) && !rankedKeys.has(candidateKey);
  });
  const investigated = [...ranked, ...monitoredHoldings];
  const narrative = investigated.map((candidate) => {
    const candidateKey = instrumentKey(candidate.symbol, candidate.exchange);
    const quote = input.quotes.get(candidateKey);
    return {
      ...toNarrativeCandidate(candidate, input.names, {
        held: heldKeys.has(candidateKey),
        changePct: quote?.changePct ?? null,
      }),
      reasons: "reasons" in candidate ? candidate.reasons : undefined,
    };
  });
  return buildInvestorFacingResearchSummary({
    pass: input.pass,
    strategyName: MODEL_PORTFOLIO_MANDATES[input.strategyKey].name,
    investigated: narrative,
    topCandidates: narrative.slice(0, 4),
  });
}

function failClosedExecutionHold(
  decision: ModelPortfolioDecision,
  reason: string,
): ModelPortfolioDecision {
  return {
    action: "hold",
    symbol: null,
    exchange: null,
    instrumentName: null,
    proposedPortfolioPct: 0,
    convictionScore: Math.min(decision.convictionScore, 0.49),
    materialThesisBreak: false,
    thesis: "Det föreslagna portföljbeslutet klarade inte den deterministiska exekveringskontrollen för hela aktier.",
    bearCase: decision.bearCase,
    catalyst: decision.catalyst,
    valuationView: decision.valuationView,
    keyRisks: [...decision.keyRisks, `Exekveringsspärr: ${reason}.`],
    evidenceIds: decision.evidenceIds,
    disconfirmingEvidenceIds: decision.disconfirmingEvidenceIds,
    rationale: `Ingen affär genomförs. AI-förslaget var inte exekverbart med hela aktier inom portföljens kassa och riskregler (${reason}), därför används HOLD som säkerhetsbeslut.`,
  };
}

async function preflightGeneratedDecision(input: {
  decision: ModelPortfolioDecision;
  portfolio: PortfolioRow;
  holdings: HoldingRow[];
  cashMinor: number;
  quotes: Map<string, DelayedQuote>;
  recentTx: TransactionTimeRow[];
  now: Date;
}): Promise<ModelPortfolioDecision> {
  const action = input.decision.action;
  if (action !== "buy" && action !== "sell" && action !== "trim" && action !== "rebalance") {
    return input.decision;
  }
  if (!input.decision.symbol || !input.decision.exchange) {
    return failClosedExecutionHold(input.decision, "missing_decision_instrument");
  }

  const quote = input.quotes.get(instrumentKey(input.decision.symbol, input.decision.exchange));
  const fill = quote ? quoteToSimulatedFill(quote, input.decision.instrumentName ?? input.decision.symbol) : null;
  if (!fill) return failClosedExecutionHold(input.decision, "missing_simulated_quote");

  const investedMinor = investedValueMinor(input.holdings);
  const currentHolding = input.holdings.find((holding) =>
    holding.instrument_symbol === input.decision.symbol && holding.exchange === input.decision.exchange,
  );
  const lastTrade = input.recentTx.find((row) =>
    row.portfolio_id === input.portfolio.id &&
    row.instrument_symbol === input.decision.symbol &&
    row.exchange === input.decision.exchange,
  );
  const hoursSince = lastTrade
    ? (input.now.getTime() - Date.parse(lastTrade.executed_at)) / (60 * 60 * 1_000)
    : null;

  const nativeCurrency = currencyForExchange(fill.exchange);
  if (!nativeCurrency) return failClosedExecutionHold(input.decision, "unsupported_currency");
  let fxRate: FxRateQuote | null = null;
  if (nativeCurrency !== "SEK") {
    const fetched = await fetchFxRateToSek(nativeCurrency, input.now);
    if (!fetched.ok) return failClosedExecutionHold(input.decision, "fx_unavailable");
    fxRate = fetched.quote;
  }

  const plan = planSimulatedSettlement({
    side: action === "buy" ? "buy" : "sell",
    portfolioStatus: input.portfolio.status,
    executionAllowedAtDecisionTime: true,
    strategyKey: input.portfolio.strategy_key,
    rules: parseRiskRules(input.portfolio.strategy_rules),
    now: input.now,
    cashMinor: input.cashMinor,
    portfolioValueMinor: input.cashMinor + investedMinor,
    investedMinor,
    currentHolding: currentHolding
      ? {
          quantity: Number(currentHolding.quantity),
          averageCostMinor: Number(currentHolding.average_cost_minor),
          lastPriceMinor: currentHolding.last_price_minor,
        }
      : null,
    targetWeightPct: input.decision.proposedPortfolioPct,
    quote: fill,
    fxRateToSek: fxRate,
    convictionScore: input.decision.convictionScore,
    materialThesisBreak: input.decision.materialThesisBreak,
    hoursSinceLastTradeInInstrument: hoursSince,
  });

  return plan.ok ? input.decision : failClosedExecutionHold(input.decision, plan.reason);
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

  await refreshModelPortfolioHoldingPrices({
    supabase,
    holdings,
    quotes: research.quotes,
    now,
  });
  await persistModelPortfolioValuationSnapshots({
    supabase,
    portfolioIds: portfolios.map((portfolio) => portfolio.id),
    now,
  });

  const portfolioResults: DryRunOrchestrationResult["portfolios"] = [];
  const auditRows: DecisionAuditRow[] = [];
  let spentTodayUsdMicros = 0;

  for (const portfolio of portfolios) {
    const portfolioHoldings = holdings.filter((holding) => holding.portfolio_id === portfolio.id);
    const cashMinor = cashByPortfolio.get(portfolio.id) ?? 0;
    const portfolioSnapshot = buildPortfolioSnapshot({ portfolio, cashMinor, holdings: portfolioHoldings });
    const attention = selectPortfolioAttentionCandidates({
      universe: research.candidates,
      strategyKey: portfolio.strategy_key,
      heldInstruments: portfolioHoldings.map((holding) => ({
        symbol: holding.instrument_symbol,
        exchange: holding.exchange,
      })),
    });
    const attentionCandidates = attentionCandidatesAsResearch(attention);
    const decisionInputs = await filterPortfolioDecisionInputs({
      portfolio,
      holdings: portfolioHoldings,
      cashMinor,
      now,
      candidates: attentionCandidates,
      evidence: research.evidence,
      quotes: research.quotes,
    });
    const portfolioResearchSummary = buildPortfolioResearchSummary({
      pass: researchPass,
      strategyKey: portfolio.strategy_key,
      candidates: attentionCandidates,
      holdings: portfolioHoldings,
      names: research.names,
      quotes: research.quotes,
    });

    const result = await runPortfolioDryRun({
      strategyKey: portfolio.strategy_key,
      runKind: "primary",
      portfolioSnapshot,
      candidates: decisionInputs.candidates,
      evidence: decisionInputs.evidence,
      spentTodayUsdMicros,
      runId: audit?.runId ?? null,
    });

    if (!result.ok) {
      portfolioResults.push({ id: portfolio.id, slug: portfolio.slug, name: portfolio.name, ok: false, reason: result.reason });
      continue;
    }

    spentTodayUsdMicros += result.estimatedCostUsdMicros;
    const decision = await preflightGeneratedDecision({
      decision: result.decision,
      portfolio,
      holdings: portfolioHoldings,
      cashMinor,
      quotes: research.quotes,
      recentTx,
      now,
    });
    const rationale = buildInvestorFacingDecisionRationale({
      researchSummary: portfolioResearchSummary,
      decision,
    });
    portfolioResults.push({
      id: portfolio.id,
      slug: portfolio.slug,
      name: portfolio.name,
      ok: true,
      action: decision.action,
      symbol: decision.symbol,
      convictionScore: decision.convictionScore,
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
        decision,
        evidence: decisionInputs.evidence,
        rankedCandidates: result.rankedCandidates,
        modelName: result.model,
        estimatedCostUsdMicros: result.estimatedCostUsdMicros,
        usage: result.usage,
        portfolioSnapshot,
        executionAllowed,
        researchSummary: portfolioResearchSummary,
        operationalSummary: research.operationalSummary,
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
        const investedMinor = investedValueMinor(portfolioHoldings);
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
          currency: "SEK",
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
