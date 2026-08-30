import type { ModelPortfolioResearchPass } from "@/lib/model-portfolios/engine/eodhd-budget";
import type { ModelPortfolioStrategyKey } from "@/lib/model-portfolios/engine/policy";
import type { AttentionCandidate } from "@/lib/model-portfolios/engine/strategy-attention";

export const DIVLAB_PORTFOLIO_DEEP_RESEARCH_DISPATCH_VERSION =
  "portfolio-deep-research-dispatch-v1" as const;

export const PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET = {
  /** One strategy-specific, whole-share-eligible new-entry candidate per manager. */
  maxCandidatesPerManager: 1,
  /** Four managers may therefore create at most four unique Deep Research jobs. */
  maxJobs: 4,
} as const;

export const PORTFOLIO_DEEP_RESEARCH_MANAGER_ORDER: readonly ModelPortfolioStrategyKey[] = [
  "conservative",
  "balanced",
  "high_risk",
  "dividend",
] as const;

export type PortfolioDeepResearchManagerSelection = {
  strategyKey: ModelPortfolioStrategyKey;
  candidates: readonly AttentionCandidate[];
};

export type PortfolioDeepResearchJob = {
  ordinal: number;
  jobKey: string;
  runKey: string;
  asOf: string;
  researchPass: ModelPortfolioResearchPass;
  symbol: string;
  exchange: string;
  name: string;
  triggerStrategies: ModelPortfolioStrategyKey[];
  deterministicScore: number;
  attentionReasonsByStrategy: Partial<
    Record<ModelPortfolioStrategyKey, readonly string[]>
  >;
};

export type PortfolioDeepResearchDispatchPlan = {
  version: typeof DIVLAB_PORTFOLIO_DEEP_RESEARCH_DISPATCH_VERSION;
  runKey: string;
  asOf: string;
  researchPass: ModelPortfolioResearchPass;
  jobs: PortfolioDeepResearchJob[];
  stats: {
    managersConsidered: number;
    managerSelections: number;
    uniqueJobs: number;
    deduplicatedSelections: number;
  };
};

function canonicalText(value: string, reason: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(reason);
  return normalized;
}

function identity(symbol: string, exchange: string): string {
  return `${symbol.trim().toUpperCase()}@${exchange.trim().toUpperCase()}`;
}

function validIso(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("portfolio_deep_research_dispatch_as_of_invalid");
  }
  return parsed.toISOString();
}

function managerOrder(strategyKey: ModelPortfolioStrategyKey): number {
  return PORTFOLIO_DEEP_RESEARCH_MANAGER_ORDER.indexOf(strategyKey);
}

/**
 * Deterministic boundary between each portfolio manager's strategy-specific
 * attention set and expensive DivLab Deep Research.
 *
 * Input candidates are expected to have already passed the portfolio's normal
 * whole-share/cash/risk eligibility filter. The planner itself performs no I/O,
 * no persistence and no model call.
 *
 * Only new-entry candidates may trigger Deep Research. Existing holdings stay
 * on the separate HOLD/SELL/TRIM monitoring path and can never consume this
 * new-entry research budget merely because they are already owned.
 */
export function buildPortfolioDeepResearchDispatchPlan(input: {
  runKey: string;
  asOf: string;
  researchPass: ModelPortfolioResearchPass;
  managerSelections: readonly PortfolioDeepResearchManagerSelection[];
  names: ReadonlyMap<string, string>;
}): PortfolioDeepResearchDispatchPlan {
  const runKey = canonicalText(
    input.runKey,
    "portfolio_deep_research_dispatch_run_key_required",
  );
  const asOf = validIso(input.asOf);
  const seenStrategies = new Set<ModelPortfolioStrategyKey>();

  type MutableJob = Omit<PortfolioDeepResearchJob, "ordinal"> & {
    ordinal?: number;
  };
  const jobsByIdentity = new Map<string, MutableJob>();
  let managerSelections = 0;

  const orderedSelections = [...input.managerSelections].sort(
    (left, right) => managerOrder(left.strategyKey) - managerOrder(right.strategyKey),
  );

  for (const selection of orderedSelections) {
    if (seenStrategies.has(selection.strategyKey)) {
      throw new Error(
        `portfolio_deep_research_dispatch_duplicate_manager:${selection.strategyKey}`,
      );
    }
    seenStrategies.add(selection.strategyKey);

    const candidate = selection.candidates.find(
      (item) => item.attentionEligibility === "new_entry",
    );
    if (!candidate) continue;

    managerSelections += 1;
    const key = identity(candidate.symbol, candidate.exchange);
    const symbol = canonicalText(
      candidate.symbol,
      "portfolio_deep_research_dispatch_symbol_required",
    ).toUpperCase();
    const exchange = canonicalText(
      candidate.exchange,
      "portfolio_deep_research_dispatch_exchange_required",
    ).toUpperCase();
    const name = input.names.get(`${symbol}.${exchange}`) ?? symbol;
    const deterministicScore = Number.isFinite(candidate.deterministicScore)
      ? candidate.deterministicScore
      : 0;
    const reasons = [...candidate.attentionReasons];

    const existing = jobsByIdentity.get(key);
    if (existing) {
      if (!existing.triggerStrategies.includes(selection.strategyKey)) {
        existing.triggerStrategies.push(selection.strategyKey);
        existing.triggerStrategies.sort((a, b) => managerOrder(a) - managerOrder(b));
      }
      existing.deterministicScore = Math.max(
        existing.deterministicScore,
        deterministicScore,
      );
      existing.attentionReasonsByStrategy[selection.strategyKey] = reasons;
      continue;
    }

    jobsByIdentity.set(key, {
      jobKey: `${runKey}:${key}`,
      runKey,
      asOf,
      researchPass: input.researchPass,
      symbol,
      exchange,
      name,
      triggerStrategies: [selection.strategyKey],
      deterministicScore,
      attentionReasonsByStrategy: {
        [selection.strategyKey]: reasons,
      },
    });
  }

  if (managerSelections > PORTFOLIO_DEEP_RESEARCH_MANAGER_ORDER.length) {
    throw new Error("portfolio_deep_research_dispatch_manager_budget_exceeded");
  }
  if (jobsByIdentity.size > PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET.maxJobs) {
    throw new Error("portfolio_deep_research_dispatch_job_budget_exceeded");
  }

  const jobs = [...jobsByIdentity.values()]
    .sort((left, right) => {
      const scoreDelta = right.deterministicScore - left.deterministicScore;
      if (scoreDelta !== 0) return scoreDelta;
      return identity(left.symbol, left.exchange).localeCompare(
        identity(right.symbol, right.exchange),
      );
    })
    .map((job, index) => ({ ...job, ordinal: index + 1 }));

  return {
    version: DIVLAB_PORTFOLIO_DEEP_RESEARCH_DISPATCH_VERSION,
    runKey,
    asOf,
    researchPass: input.researchPass,
    jobs,
    stats: {
      managersConsidered: seenStrategies.size,
      managerSelections,
      uniqueJobs: jobs.length,
      deduplicatedSelections: managerSelections - jobs.length,
    },
  };
}
