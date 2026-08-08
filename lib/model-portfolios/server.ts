import "server-only";

import { createClient } from "@/lib/supabase/server";

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
  | { ok: true; portfolios: ModelPortfolioOverview[] }
  | { ok: false; portfolios: []; reason: "unauthenticated" | "unavailable" };

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

type CashRow = { portfolio_id: string; amount_minor: number };
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

export async function loadModelPortfoliosOverview(): Promise<ModelPortfoliosOverviewResult> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return { ok: false, portfolios: [], reason: "unauthenticated" };
  }

  const [portfolioResult, cashResult, holdingsResult, decisionsResult, followersResult] =
    await Promise.all([
      supabase
        .from("model_portfolios")
        .select(
          "id,slug,name,risk_label,description,objective,status,currency,initial_capital_minor,monthly_contribution_minor,contribution_day,strategy_version,sort_order",
        )
        .order("sort_order", { ascending: true }),
      supabase
        .from("model_portfolio_cash_ledger")
        .select("portfolio_id,amount_minor"),
      supabase
        .from("model_portfolio_holdings")
        .select("portfolio_id,quantity,last_price_minor")
        .gt("quantity", 0),
      supabase
        .from("model_portfolio_decisions")
        .select("portfolio_id,decision_type,rationale,status,created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("model_portfolio_followers")
        .select("portfolio_id,user_id"),
    ]);

  if (
    portfolioResult.error ||
    cashResult.error ||
    holdingsResult.error ||
    decisionsResult.error ||
    followersResult.error
  ) {
    return { ok: false, portfolios: [], reason: "unavailable" };
  }

  const cashByPortfolio = new Map<string, number>();
  for (const row of (cashResult.data ?? []) as CashRow[]) {
    cashByPortfolio.set(
      row.portfolio_id,
      (cashByPortfolio.get(row.portfolio_id) ?? 0) + Number(row.amount_minor),
    );
  }

  const investedByPortfolio = new Map<string, number>();
  const holdingsCountByPortfolio = new Map<string, number>();
  for (const row of (holdingsResult.data ?? []) as HoldingRow[]) {
    const quantity = Number(row.quantity);
    const price = Number(row.last_price_minor ?? 0);
    if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0) {
      continue;
    }
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
    if (row.user_id === user.id) {
      followedByUser.add(row.portfolio_id);
    }
  }

  const portfolios = ((portfolioResult.data ?? []) as PortfolioRow[]).map((row) => {
    const cashMinor = cashByPortfolio.get(row.id) ?? 0;
    const investedMinor = investedByPortfolio.get(row.id) ?? 0;
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
      totalValueMinor: cashMinor + investedMinor,
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

  return { ok: true, portfolios };
}
