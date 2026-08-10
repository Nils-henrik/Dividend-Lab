import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ModelPortfolioStrategyKey } from "./engine/policy";

export const MODEL_PORTFOLIO_TRADES_PAGE_SIZE = 25;

export type PortfolioTransparencyTrade = {
  id: string;
  decisionId: string | null;
  transactionType: "buy" | "sell" | "dividend" | "fee";
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  quantity: number;
  priceMinor: number | null;
  grossAmountMinor: number;
  feeMinor: number;
  currency: string;
  nativeCurrency: string | null;
  nativePriceMinor: number | null;
  fxToSek: number | null;
  grossNativeMinor: number | null;
  executedAt: string;
  marketDataAsOf: string | null;
  rationale: string;
};

export type PortfolioTransparencyDetail = {
  id: string;
  slug: string;
  name: string;
  strategyKey: ModelPortfolioStrategyKey;
  riskLabel: string;
  description: string;
  objective: string;
  status: "draft" | "active" | "paused";
  strategyVersion: number;
  strategyRules: Record<string, unknown>;
  initialCapitalMinor: number;
  monthlyContributionMinor: number;
  contributionDay: number;
  launchedAt: string | null;
  latestDecision: {
    type: string;
    status: string;
    rationale: string;
    createdAt: string;
  } | null;
  trades: PortfolioTransparencyTrade[];
  tradeCount: number;
  page: number;
  pageCount: number;
};

export type PortfolioTradeDecision = {
  id: string;
  decisionType: string;
  status: string;
  rationale: string;
  modelProvider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  marketDataAsOf: string | null;
  evidence: unknown;
  inputSnapshot: unknown;
  createdAt: string;
  executedAt: string | null;
};

export type PortfolioTradeDetail = {
  portfolio: {
    id: string;
    slug: string;
    name: string;
    strategyKey: ModelPortfolioStrategyKey;
    riskLabel: string;
  };
  trade: PortfolioTransparencyTrade;
  decision: PortfolioTradeDecision | null;
};

function normalizePage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

function mapTrade(row: Record<string, unknown>): PortfolioTransparencyTrade {
  return {
    id: String(row.id),
    decisionId: row.decision_id ? String(row.decision_id) : null,
    transactionType: row.transaction_type as PortfolioTransparencyTrade["transactionType"],
    instrumentSymbol: String(row.instrument_symbol),
    exchange: String(row.exchange),
    instrumentName: String(row.instrument_name),
    quantity: Number(row.quantity),
    priceMinor: row.price_minor === null || row.price_minor === undefined ? null : Number(row.price_minor),
    grossAmountMinor: Number(row.gross_amount_minor),
    feeMinor: Number(row.fee_minor ?? 0),
    currency: String(row.currency),
    nativeCurrency: row.native_currency ? String(row.native_currency) : null,
    nativePriceMinor:
      row.native_price_minor === null || row.native_price_minor === undefined
        ? null
        : Number(row.native_price_minor),
    fxToSek: row.fx_to_sek === null || row.fx_to_sek === undefined ? null : Number(row.fx_to_sek),
    grossNativeMinor:
      row.gross_native_minor === null || row.gross_native_minor === undefined
        ? null
        : Number(row.gross_native_minor),
    executedAt: String(row.executed_at),
    marketDataAsOf: row.market_data_as_of ? String(row.market_data_as_of) : null,
    rationale: String(row.rationale),
  };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return supabase;
}

export async function loadPortfolioTransparencyDetail(
  slug: string,
  requestedPage: number,
): Promise<PortfolioTransparencyDetail | null> {
  const supabase = await authenticatedClient();
  if (!supabase) return null;

  const page = normalizePage(requestedPage);
  const from = (page - 1) * MODEL_PORTFOLIO_TRADES_PAGE_SIZE;
  const to = from + MODEL_PORTFOLIO_TRADES_PAGE_SIZE - 1;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("model_portfolios")
    .select("id,slug,name,strategy_key,risk_label,description,objective,status,initial_capital_minor,monthly_contribution_minor,contribution_day,strategy_version,strategy_rules,launched_at")
    .eq("slug", slug)
    .maybeSingle();

  if (portfolioError || !portfolio) return null;

  const [tradeResult, decisionResult] = await Promise.all([
    supabase
      .from("model_portfolio_transactions")
      .select("id,decision_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,fee_minor,currency,native_currency,native_price_minor,fx_to_sek,gross_native_minor,executed_at,market_data_as_of,rationale", { count: "exact" })
      .eq("portfolio_id", portfolio.id)
      .order("executed_at", { ascending: false })
      .range(from, to),
    supabase
      .from("model_portfolio_decisions")
      .select("decision_type,status,rationale,created_at")
      .eq("portfolio_id", portfolio.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (tradeResult.error || decisionResult.error) return null;

  const tradeCount = tradeResult.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(tradeCount / MODEL_PORTFOLIO_TRADES_PAGE_SIZE));

  return {
    id: String(portfolio.id),
    slug: String(portfolio.slug),
    name: String(portfolio.name),
    strategyKey: portfolio.strategy_key as ModelPortfolioStrategyKey,
    riskLabel: String(portfolio.risk_label),
    description: String(portfolio.description),
    objective: String(portfolio.objective),
    status: portfolio.status as PortfolioTransparencyDetail["status"],
    strategyVersion: Number(portfolio.strategy_version),
    strategyRules: (portfolio.strategy_rules ?? {}) as Record<string, unknown>,
    initialCapitalMinor: Number(portfolio.initial_capital_minor),
    monthlyContributionMinor: Number(portfolio.monthly_contribution_minor),
    contributionDay: Number(portfolio.contribution_day),
    launchedAt: portfolio.launched_at ? String(portfolio.launched_at) : null,
    latestDecision: decisionResult.data
      ? {
          type: String(decisionResult.data.decision_type),
          status: String(decisionResult.data.status),
          rationale: String(decisionResult.data.rationale),
          createdAt: String(decisionResult.data.created_at),
        }
      : null,
    trades: ((tradeResult.data ?? []) as Record<string, unknown>[]).map(mapTrade),
    tradeCount,
    page,
    pageCount,
  };
}

export async function loadPortfolioTradeDetail(
  slug: string,
  transactionId: string,
): Promise<PortfolioTradeDetail | null> {
  const supabase = await authenticatedClient();
  if (!supabase) return null;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("model_portfolios")
    .select("id,slug,name,strategy_key,risk_label")
    .eq("slug", slug)
    .maybeSingle();

  if (portfolioError || !portfolio) return null;

  const { data: tradeRow, error: tradeError } = await supabase
    .from("model_portfolio_transactions")
    .select("id,decision_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,fee_minor,currency,native_currency,native_price_minor,fx_to_sek,gross_native_minor,executed_at,market_data_as_of,rationale")
    .eq("id", transactionId)
    .eq("portfolio_id", portfolio.id)
    .maybeSingle();

  if (tradeError || !tradeRow) return null;

  const trade = mapTrade(tradeRow as Record<string, unknown>);
  let decision: PortfolioTradeDecision | null = null;

  if (trade.decisionId) {
    const { data: decisionRow, error: decisionError } = await supabase
      .from("model_portfolio_decisions")
      .select("id,decision_type,status,rationale,model_provider,model_name,prompt_version,market_data_as_of,evidence,input_snapshot,created_at,executed_at")
      .eq("id", trade.decisionId)
      .eq("portfolio_id", portfolio.id)
      .maybeSingle();

    if (decisionError) return null;
    if (decisionRow) {
      decision = {
        id: String(decisionRow.id),
        decisionType: String(decisionRow.decision_type),
        status: String(decisionRow.status),
        rationale: String(decisionRow.rationale),
        modelProvider: decisionRow.model_provider ? String(decisionRow.model_provider) : null,
        modelName: decisionRow.model_name ? String(decisionRow.model_name) : null,
        promptVersion: decisionRow.prompt_version ? String(decisionRow.prompt_version) : null,
        marketDataAsOf: decisionRow.market_data_as_of ? String(decisionRow.market_data_as_of) : null,
        evidence: decisionRow.evidence,
        inputSnapshot: decisionRow.input_snapshot,
        createdAt: String(decisionRow.created_at),
        executedAt: decisionRow.executed_at ? String(decisionRow.executed_at) : null,
      };
    }
  }

  return {
    portfolio: {
      id: String(portfolio.id),
      slug: String(portfolio.slug),
      name: String(portfolio.name),
      strategyKey: portfolio.strategy_key as ModelPortfolioStrategyKey,
      riskLabel: String(portfolio.risk_label),
    },
    trade,
    decision,
  };
}
