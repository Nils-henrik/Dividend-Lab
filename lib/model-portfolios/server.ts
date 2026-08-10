import "server-only";

import { createClient } from "@/lib/supabase/server";

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
  feeMinor: number;
  currency: string;
  nativeCurrency: string | null;
  fxToSek: number | null;
  executedAt: string;
  rationale: string;
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
    }
  | {
      ok: false;
      portfolios: [];
      recentTransactions: [];
      reason: "unauthenticated" | "unavailable";
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
  fee_minor?: number | null;
  currency: string;
  native_currency?: string | null;
  fx_to_sek?: number | string | null;
  executed_at: string;
  rationale: string;
};

export async function loadModelPortfoliosOverview(): Promise<ModelPortfoliosOverviewResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { ok: false, portfolios: [], recentTransactions: [], reason: "unauthenticated" };
  }

  const [
    portfolioResult,
    cashResult,
    holdingsResult,
    decisionsResult,
    followersResult,
    transactionsResult,
  ] = await Promise.all([
    supabase
      .from("model_portfolios")
      .select(
        "id,slug,name,risk_label,description,objective,status,currency,initial_capital_minor,monthly_contribution_minor,contribution_day,strategy_version,sort_order",
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
        "id,portfolio_id,transaction_type,instrument_symbol,exchange,instrument_name,quantity,price_minor,gross_amount_minor,fee_minor,currency,executed_at,rationale",
      )
      .order("executed_at", { ascending: false })
      .limit(50),
  ]);

  if (
    portfolioResult.error ||
    cashResult.error ||
    holdingsResult.error ||
    decisionsResult.error ||
    followersResult.error ||
    transactionsResult.error
  ) {
    return { ok: false, portfolios: [], recentTransactions: [], reason: "unavailable" };
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
    if (row.user_id === user.id) followedByUser.add(row.portfolio_id);
  }

  const portfolioMeta = new Map<string, { name: string; slug: string }>();
  const portfolios = ((portfolioResult.data ?? []) as PortfolioRow[]).map((row) => {
    portfolioMeta.set(row.id, { name: row.name, slug: row.slug });
    const cashMinor = cashByPortfolio.get(row.id) ?? 0;
    const investedMinor = investedByPortfolio.get(row.id) ?? 0;
    const totalValueMinor = cashMinor + investedMinor;
    const contributedCapitalMinor = contributedByPortfolio.get(row.id) ?? Number(row.initial_capital_minor);
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
      feeMinor: Number(row.fee_minor ?? 0),
      currency: row.currency,
      nativeCurrency: null,
      fxToSek: null,
      executedAt: row.executed_at,
      rationale: row.rationale,
    } satisfies ModelPortfolioTransaction;
  });

  return { ok: true, portfolios, recentTransactions };
}
