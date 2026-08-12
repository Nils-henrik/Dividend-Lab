import "server-only";

import { getModelPortfolioReadContext } from "@/lib/model-portfolios/read-client";
import type { ModelPortfolioStrategyKey } from "./engine/policy";

export const MODEL_PORTFOLIO_TRADES_PAGE_SIZE = 25;
const MODEL_PORTFOLIO_SNAPSHOT_PAGE_SIZE = 1000;
const MODEL_PORTFOLIO_SNAPSHOT_MAX_POINTS = 20_000;

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
  executedAt: string;
  marketDataAsOf: string | null;
  rationale: string;
  nativeCurrency: string | null;
  nativePriceMinor: number | null;
  nativeGrossAmountMinor: number | null;
  fxRateToSek: number | null;
  fxAsOf: string | null;
  fxSourcePublisher: string | null;
  fillLabel: string | null;
};

export type PortfolioValuePoint = {
  snapshotAt: string;
  totalValueMinor: number;
  cashValueMinor: number;
  investedValueMinor: number;
  contributedCapitalMinor: number;
  marketDataAsOf: string | null;
};

export type PortfolioTransparencyHolding = {
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  quantity: number;
  averageCostMinor: number;
  purchaseValueMinor: number;
  lastPriceMinor: number | null;
  currentValueMinor: number | null;
  dividendsMinor: number;
  lastPriceAsOf: string | null;
  loggedAt: string;
  accountType: "ISK" | "KF" | null;
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
  valueHistory: PortfolioValuePoint[];
  holdings: PortfolioTransparencyHolding[];
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
    executedAt: String(row.executed_at),
    marketDataAsOf: row.market_data_as_of ? String(row.market_data_as_of) : null,
    rationale: String(row.rationale),
    nativeCurrency: row.native_currency == null ? null : String(row.native_currency),
    nativePriceMinor: row.native_price_minor == null ? null : Number(row.native_price_minor),
    nativeGrossAmountMinor: row.native_gross_amount_minor == null ? null : Number(row.native_gross_amount_minor),
    fxRateToSek: row.fx_rate_to_sek == null ? null : Number(row.fx_rate_to_sek),
    fxAsOf: row.fx_as_of == null ? null : String(row.fx_as_of),
    fxSourcePublisher: row.fx_source_publisher == null ? null : String(row.fx_source_publisher),
    fillLabel: row.fill_label == null ? null : String(row.fill_label),
  };
}

function mapValuePoint(row: Record<string, unknown>): PortfolioValuePoint {
  return {
    snapshotAt: String(row.snapshot_at),
    totalValueMinor: Number(row.total_value_minor),
    cashValueMinor: Number(row.cash_value_minor),
    investedValueMinor: Number(row.invested_value_minor),
    contributedCapitalMinor: Number(row.contributed_capital_minor),
    marketDataAsOf: row.market_data_as_of ? String(row.market_data_as_of) : null,
  };
}

export async function loadPortfolioTransparencyDetail(
  slug: string,
  requestedPage: number,
): Promise<PortfolioTransparencyDetail | null> {
  const { client: supabase } = await getModelPortfolioReadContext();
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

  const [tradeResult, decisionResult, holdingResult, dividendResult] = await Promise.all([
    supabase
      .from("model_portfolio_transactions")
      .select("id,decision_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,fee_minor,currency,executed_at,market_data_as_of,rationale,native_currency,native_price_minor,native_gross_amount_minor,fx_rate_to_sek,fx_as_of,fx_source_publisher,fill_label", { count: "exact" })
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
    supabase
      .from("model_portfolio_holdings")
      .select("instrument_symbol,exchange,instrument_name,quantity,average_cost_minor,last_price_minor,last_price_as_of,updated_at,account_type")
      .eq("portfolio_id", portfolio.id)
      .gt("quantity", 0)
      .order("instrument_symbol", { ascending: true }),
    supabase
      .from("model_portfolio_transactions")
      .select("instrument_symbol,exchange,gross_amount_minor")
      .eq("portfolio_id", portfolio.id)
      .eq("transaction_type", "dividend"),
  ]);

  if (tradeResult.error || decisionResult.error || holdingResult.error || dividendResult.error) return null;

  const snapshotRows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < MODEL_PORTFOLIO_SNAPSHOT_MAX_POINTS; offset += MODEL_PORTFOLIO_SNAPSHOT_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("model_portfolio_snapshots")
      .select("snapshot_at,total_value_minor,cash_value_minor,invested_value_minor,contributed_capital_minor,market_data_as_of")
      .eq("portfolio_id", portfolio.id)
      .order("snapshot_at", { ascending: true })
      .range(offset, offset + MODEL_PORTFOLIO_SNAPSHOT_PAGE_SIZE - 1);
    if (error) return null;
    const rows = (data ?? []) as Record<string, unknown>[];
    snapshotRows.push(...rows);
    if (rows.length < MODEL_PORTFOLIO_SNAPSHOT_PAGE_SIZE) break;
  }

  const dividendsByHolding = new Map<string, number>();
  for (const row of (dividendResult.data ?? []) as Record<string, unknown>[]) {
    const key = `${String(row.instrument_symbol).toUpperCase()}.${String(row.exchange).toUpperCase()}`;
    dividendsByHolding.set(key, (dividendsByHolding.get(key) ?? 0) + Number(row.gross_amount_minor ?? 0));
  }

  const holdings: PortfolioTransparencyHolding[] = ((holdingResult.data ?? []) as Record<string, unknown>[]).map((row) => {
    const quantity = Number(row.quantity);
    const averageCostMinor = Number(row.average_cost_minor ?? 0);
    const lastPriceMinor = row.last_price_minor == null ? null : Number(row.last_price_minor);
    const key = `${String(row.instrument_symbol).toUpperCase()}.${String(row.exchange).toUpperCase()}`;
    const accountType = row.account_type === "ISK" || row.account_type === "KF" ? row.account_type : null;
    return {
      instrumentSymbol: String(row.instrument_symbol),
      exchange: String(row.exchange),
      instrumentName: String(row.instrument_name),
      quantity,
      averageCostMinor,
      purchaseValueMinor: Math.round(quantity * averageCostMinor),
      lastPriceMinor,
      currentValueMinor: lastPriceMinor === null ? null : Math.round(quantity * lastPriceMinor),
      dividendsMinor: dividendsByHolding.get(key) ?? 0,
      lastPriceAsOf: row.last_price_as_of ? String(row.last_price_as_of) : null,
      loggedAt: String(row.updated_at),
      accountType,
    };
  });

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
    valueHistory: snapshotRows.map(mapValuePoint),
    holdings,
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
  const { client: supabase } = await getModelPortfolioReadContext();
  if (!supabase) return null;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("model_portfolios")
    .select("id,slug,name,strategy_key,risk_label")
    .eq("slug", slug)
    .maybeSingle();

  if (portfolioError || !portfolio) return null;

  const { data: tradeRow, error: tradeError } = await supabase
    .from("model_portfolio_transactions")
    .select("id,decision_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,fee_minor,currency,executed_at,market_data_as_of,rationale,native_currency,native_price_minor,native_gross_amount_minor,fx_rate_to_sek,fx_as_of,fx_source_publisher,fill_label")
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
