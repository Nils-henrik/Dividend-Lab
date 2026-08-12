import "server-only";

import { getModelPortfolioReadContext } from "@/lib/model-portfolios/read-client";

export type ModelPortfolioTransaction = {
  id: string;
  portfolioId: string;
  portfolioName: string;
  portfolioSlug: string;
  transactionType: "buy" | "sell" | "dividend" | "fee";
  instrumentSymbol: string;
  exchange: string;
  instrumentName: string;
  quantity: number;
  priceMinor: number | null;
  grossAmountMinor: number;
  currency: string;
  executedAt: string;
  rationale: string;
};

export type ModelPortfolioValuePoint = {
  snapshotAt: string;
  totalValueMinor: number;
  cashValueMinor: number;
  investedValueMinor: number;
  contributedCapitalMinor: number;
  marketDataAsOf: string | null;
};

export type ModelPortfolioOverview = {
  id: string;
  slug: string;
  name: string;
  riskLabel: string;
  description: string;
  objective: string;
  status: "draft" | "active" | "paused";
  currency: "SEK";
  initialCapitalMinor: number;
  monthlyContributionMinor: number;
  contributionDay: number;
  strategyVersion: number;
  sortOrder: number;
  cashMinor: number;
  investedMinor: number;
  totalValueMinor: number;
  contributedCapitalMinor: number;
  performancePct: number;
  holdingsCount: number;
  followerCount: number;
  isFollowing: boolean;
  launchedAt: string | null;
  valueHistory: ModelPortfolioValuePoint[];
  latestDecision: {
    type: string;
    rationale: string;
    status: string;
    createdAt: string;
  } | null;
};

export type ModelPortfoliosOverviewResult =
  | {
      ok: true;
      portfolios: ModelPortfolioOverview[];
      recentTransactions: ModelPortfolioTransaction[];
      isAuthenticated: boolean;
    }
  | {
      ok: false;
      portfolios: [];
      recentTransactions: [];
      isAuthenticated: boolean;
      reason: "unavailable";
    };

type PortfolioRow = {
  id: string;
  slug: string;
  name: string;
  risk_label: string;
  description: string;
  objective: string;
  status: "draft" | "active" | "paused";
  currency: "SEK";
  initial_capital_minor: number;
  monthly_contribution_minor: number;
  contribution_day: number;
  strategy_version: number;
  sort_order: number;
  launched_at: string | null;
};

type CashRow = {
  portfolio_id: string;
  event_type: string;
  amount_minor: number;
};
type HoldingRow = {
  portfolio_id: string;
  quantity: number | string;
  last_price_minor: number | null;
};
type DecisionRow = {
  portfolio_id: string;
  decision_type: string;
  rationale: string;
  status: string;
  created_at: string;
};
type FollowerRow = { portfolio_id: string; user_id: string };
type TransactionRow = {
  id: string;
  portfolio_id: string;
  transaction_type: "buy" | "sell" | "dividend" | "fee";
  instrument_symbol: string;
  exchange: string;
  instrument_name: string;
  quantity: number | string;
  price_minor: number | null;
  gross_amount_minor: number;
  currency: string;
  executed_at: string;
  rationale: string;
};
type SnapshotRow = {
  portfolio_id: string;
  snapshot_at: string;
  total_value_minor: number;
  cash_value_minor: number;
  invested_value_minor: number;
  contributed_capital_minor: number;
  market_data_as_of: string | null;
};

function mapSnapshot(row: SnapshotRow): ModelPortfolioValuePoint {
  return {
    snapshotAt: row.snapshot_at,
    totalValueMinor: Number(row.total_value_minor),
    cashValueMinor: Number(row.cash_value_minor),
    investedValueMinor: Number(row.invested_value_minor),
    contributedCapitalMinor: Number(row.contributed_capital_minor),
    marketDataAsOf: row.market_data_as_of ? String(row.market_data_as_of) : null,
  };
}

export async function loadModelPortfoliosOverview(): Promise<ModelPortfoliosOverviewResult> {
  const { client: supabase, user } = await getModelPortfolioReadContext();
  if (!supabase) {
    return {
      ok: false,
      portfolios: [],
      recentTransactions: [],
      isAuthenticated: false,
      reason: "unavailable",
    };
  }

  const [
    portfolioResult,
    cashResult,
    holdingsResult,
    decisionsResult,
    followersResult,
    transactionsResult,
    snapshotsResult,
  ] = await Promise.all([
    supabase
      .from("model_portfolios")
      .select(
        "id,slug,name,risk_label,description,objective,status,currency,initial_capital_minor,monthly_contribution_minor,contribution_day,strategy_version,sort_order,launched_at",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("model_portfolio_cash_ledger")
      .select("portfolio_id,event_type,amount_minor"),
    supabase
      .from("model_portfolio_holdings")
      .select("portfolio_id,quantity,last_price_minor")
      .gt("quantity", 0),
    supabase
      .from("model_portfolio_decisions")
      .select("portfolio_id,decision_type,rationale,status,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("model_portfolio_followers").select("portfolio_id,user_id"),
    supabase
      .from("model_portfolio_transactions")
      .select(
        "id,portfolio_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,currency,executed_at,rationale",
      )
      .order("executed_at", { ascending: false })
      .limit(50),
    // The overview cards must use the same persisted valuation history as the
    // detail chart. Keep a bounded recent window for the tiny card sparkline;
    // the detail loader owns the full paginated ALL history.
    supabase
      .from("model_portfolio_snapshots")
      .select("portfolio_id,snapshot_at,total_value_minor,cash_value_minor,invested_value_minor,contributed_capital_minor,market_data_as_of")
      .order("snapshot_at", { ascending: false })
      .limit(4000),
  ]);

  if (
    portfolioResult.error ||
    cashResult.error ||
    holdingsResult.error ||
    decisionsResult.error ||
    followersResult.error ||
    transactionsResult.error ||
    snapshotsResult.error
  ) {
    return {
      ok: false,
      portfolios: [],
      recentTransactions: [],
      isAuthenticated: Boolean(user),
      reason: "unavailable",
    };
  }

  const cashByPortfolio = new Map<string, number>();
  const contributedByPortfolio = new Map<string, number>();
  for (const row of (cashResult.data ?? []) as CashRow[]) {
    cashByPortfolio.set(
      row.portfolio_id,
      (cashByPortfolio.get(row.portfolio_id) ?? 0) + Number(row.amount_minor),
    );
    if (row.event_type === "initial_capital" || row.event_type === "monthly_contribution") {
      contributedByPortfolio.set(
        row.portfolio_id,
        (contributedByPortfolio.get(row.portfolio_id) ?? 0) + Number(row.amount_minor),
      );
    }
  }

  const investedByPortfolio = new Map<string, number>();
  const holdingsCountByPortfolio = new Map<string, number>();
  for (const row of (holdingsResult.data ?? []) as HoldingRow[]) {
    const quantity = Number(row.quantity);
    const price = Number(row.last_price_minor ?? 0);
    if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0) continue;
    holdingsCountByPortfolio.set(
      row.portfolio_id,
      (holdingsCountByPortfolio.get(row.portfolio_id) ?? 0) + 1,
    );
    investedByPortfolio.set(
      row.portfolio_id,
      (investedByPortfolio.get(row.portfolio_id) ?? 0) + Math.round(quantity * price),
    );
  }

  const valueHistoryByPortfolio = new Map<string, ModelPortfolioValuePoint[]>();
  for (const row of (snapshotsResult.data ?? []) as SnapshotRow[]) {
    const points = valueHistoryByPortfolio.get(row.portfolio_id) ?? [];
    points.push(mapSnapshot(row));
    valueHistoryByPortfolio.set(row.portfolio_id, points);
  }
  for (const points of valueHistoryByPortfolio.values()) {
    points.sort((a, b) => Date.parse(a.snapshotAt) - Date.parse(b.snapshotAt));
  }

  const latestDecisionByPortfolio = new Map<string, DecisionRow>();
  for (const row of (decisionsResult.data ?? []) as DecisionRow[]) {
    if (!latestDecisionByPortfolio.has(row.portfolio_id)) {
      latestDecisionByPortfolio.set(row.portfolio_id, row);
    }
  }

  const followerCountByPortfolio = new Map<string, number>();
  const followedByUser = new Set<string>();
  for (const row of (followersResult.data ?? []) as FollowerRow[]) {
    followerCountByPortfolio.set(
      row.portfolio_id,
      (followerCountByPortfolio.get(row.portfolio_id) ?? 0) + 1,
    );
    if (user && row.user_id === user.id) followedByUser.add(row.portfolio_id);
  }

  const portfolioMeta = new Map<string, { name: string; slug: string }>();
  const portfolios = ((portfolioResult.data ?? []) as PortfolioRow[]).map((row) => {
    portfolioMeta.set(row.id, { name: row.name, slug: row.slug });
    const valueHistory = valueHistoryByPortfolio.get(row.id) ?? [];
    const latestSnapshot = valueHistory.at(-1) ?? null;
    const fallbackCashMinor = cashByPortfolio.get(row.id) ?? 0;
    const fallbackInvestedMinor = investedByPortfolio.get(row.id) ?? 0;
    const fallbackContributedMinor = contributedByPortfolio.get(row.id) ?? Number(row.initial_capital_minor);
    const cashMinor = latestSnapshot?.cashValueMinor ?? fallbackCashMinor;
    const investedMinor = latestSnapshot?.investedValueMinor ?? fallbackInvestedMinor;
    const totalValueMinor = latestSnapshot?.totalValueMinor ?? (fallbackCashMinor + fallbackInvestedMinor);
    const contributedCapitalMinor = latestSnapshot?.contributedCapitalMinor ?? fallbackContributedMinor;
    const performancePct = contributedCapitalMinor > 0
      ? ((totalValueMinor - contributedCapitalMinor) / contributedCapitalMinor) * 100
      : 0;
    const latest = latestDecisionByPortfolio.get(row.id);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      riskLabel: row.risk_label,
      description: row.description,
      objective: row.objective,
      status: row.status,
      currency: row.currency,
      initialCapitalMinor: Number(row.initial_capital_minor),
      monthlyContributionMinor: Number(row.monthly_contribution_minor),
      contributionDay: Number(row.contribution_day),
      strategyVersion: Number(row.strategy_version),
      sortOrder: Number(row.sort_order),
      cashMinor,
      investedMinor,
      totalValueMinor,
      contributedCapitalMinor,
      performancePct,
      holdingsCount: holdingsCountByPortfolio.get(row.id) ?? 0,
      followerCount: followerCountByPortfolio.get(row.id) ?? 0,
      isFollowing: followedByUser.has(row.id),
      launchedAt: row.launched_at ? String(row.launched_at) : null,
      valueHistory,
      latestDecision: latest
        ? {
            type: latest.decision_type,
            rationale: latest.rationale,
            status: latest.status,
            createdAt: latest.created_at,
          }
        : null,
    } satisfies ModelPortfolioOverview;
  });

  const recentTransactions = ((transactionsResult.data ?? []) as TransactionRow[]).map((row) => {
    const meta = portfolioMeta.get(row.portfolio_id) ?? { name: "Okänd", slug: "unknown" };
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      portfolioName: meta.name,
      portfolioSlug: meta.slug,
      transactionType: row.transaction_type,
      instrumentSymbol: row.instrument_symbol,
      exchange: row.exchange,
      instrumentName: row.instrument_name,
      quantity: Number(row.quantity),
      priceMinor: row.price_minor === null ? null : Number(row.price_minor),
      grossAmountMinor: Number(row.gross_amount_minor),
      currency: row.currency,
      executedAt: row.executed_at,
      rationale: row.rationale,
    } satisfies ModelPortfolioTransaction;
  });

  return {
    ok: true,
    portfolios,
    recentTransactions,
    isAuthenticated: Boolean(user),
  };
}
