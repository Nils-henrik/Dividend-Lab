import "server-only";

import { generateText, Output, stepCountIs, tool } from "ai";
import { z } from "zod";
import { extractModelPortfolioAiUsage, type ModelPortfolioAiUsage } from "./ai-usage";
import { modelPortfolioDecisionSchema, type ModelPortfolioDecision, type ModelPortfolioEvidence } from "./decision";
import { buildModelPortfolioSystemMandate } from "./mandates";
import type { ModelPortfolioStrategyKey } from "./policy";
import type { RankedResearchCandidate } from "./research";

export const MODEL_PORTFOLIO_AI_MODELS = {
  primary: "openai/gpt-5.6-luna",
  escalation: "openai/gpt-5.6-terra",
} as const;

export type ModelPortfolioAiModel =
  (typeof MODEL_PORTFOLIO_AI_MODELS)[keyof typeof MODEL_PORTFOLIO_AI_MODELS];

// Conservative internal cost estimates based on the selected AI Gateway models.
// The hard cap is expressed in USD micros so it is independent of floating point
// money math. 300_000 micros = USD 0.30, intentionally targeting roughly the
// middle of the 2-4 SEK/day operating budget rather than spending the ceiling.
export const MODEL_PORTFOLIO_AI_BUDGET = {
  targetDailyUsdMicros: 150_000,
  hardDailyUsdMicros: 300_000,
  maxCallsPerPortfolioRun: 3,
  maxOutputTokensPerCall: 1_800,
  reserveUsdMicrosForEventRuns: 80_000,
} as const;

const MODEL_PRICING_USD_PER_TOKEN: Record<
  ModelPortfolioAiModel,
  { input: number; output: number }
> = {
  "openai/gpt-5.6-luna": { input: 0.0000002, output: 0.0000012 },
  "openai/gpt-5.6-terra": { input: 0.000002, output: 0.000012 },
};

type EnvironmentMap = Readonly<Record<string, string | undefined>>;

export type ModelPortfolioAiConfig =
  | {
      configured: true;
      authMode: "vercel_oidc" | "api_key";
      primaryModel: ModelPortfolioAiModel;
      escalationModel: ModelPortfolioAiModel;
    }
  | {
      configured: false;
      reason: "gateway_auth_missing";
    };

export function resolveModelPortfolioAiConfig(
  env: EnvironmentMap = process.env,
): ModelPortfolioAiConfig {
  const hasApiKey = Boolean(env.AI_GATEWAY_API_KEY?.trim());
  const hasOidc = Boolean(env.VERCEL_OIDC_TOKEN?.trim());
  if (!hasApiKey && !hasOidc) {
    return { configured: false, reason: "gateway_auth_missing" };
  }

  return {
    configured: true,
    authMode: hasApiKey ? "api_key" : "vercel_oidc",
    primaryModel: MODEL_PORTFOLIO_AI_MODELS.primary,
    escalationModel: MODEL_PORTFOLIO_AI_MODELS.escalation,
  };
}

export function estimateAiCostUsdMicros(input: {
  model: ModelPortfolioAiModel;
  inputTokens: number;
  outputTokens: number;
}): number {
  const pricing = MODEL_PRICING_USD_PER_TOKEN[input.model];
  if (
    !Number.isFinite(input.inputTokens) ||
    !Number.isFinite(input.outputTokens) ||
    input.inputTokens < 0 ||
    input.outputTokens < 0
  ) {
    throw new Error("invalid_ai_usage");
  }
  const usd = input.inputTokens * pricing.input + input.outputTokens * pricing.output;
  return Math.ceil(usd * 1_000_000);
}

export function evaluateAiBudget(input: {
  spentTodayUsdMicros: number;
  expectedCallUsdMicros: number;
  runKind: "primary" | "event";
}): { allowed: true } | { allowed: false; reason: "daily_ai_budget_exhausted" | "event_reserve_protected" } {
  if (
    !Number.isFinite(input.spentTodayUsdMicros) ||
    !Number.isFinite(input.expectedCallUsdMicros) ||
    input.spentTodayUsdMicros < 0 ||
    input.expectedCallUsdMicros < 0
  ) {
    return { allowed: false, reason: "daily_ai_budget_exhausted" };
  }

  const projected = input.spentTodayUsdMicros + input.expectedCallUsdMicros;
  if (projected > MODEL_PORTFOLIO_AI_BUDGET.hardDailyUsdMicros) {
    return { allowed: false, reason: "daily_ai_budget_exhausted" };
  }

  if (
    input.runKind === "primary" &&
    projected >
      MODEL_PORTFOLIO_AI_BUDGET.hardDailyUsdMicros -
        MODEL_PORTFOLIO_AI_BUDGET.reserveUsdMicrosForEventRuns
  ) {
    return { allowed: false, reason: "event_reserve_protected" };
  }

  return { allowed: true };
}

export function shouldEscalateAiModel(input: {
  topCandidateScore: number;
  evidenceConflictCount: number;
  materialEvent: boolean;
  currentHoldingAffected: boolean;
}): boolean {
  return Boolean(
    input.materialEvent &&
      input.currentHoldingAffected &&
      Number.isFinite(input.topCandidateScore) &&
      input.topCandidateScore >= 0.78 &&
      input.evidenceConflictCount >= 1,
  );
}

export type PortfolioAiDecisionRequest = {
  strategyKey: ModelPortfolioStrategyKey;
  runKind: "primary" | "event";
  portfolioSnapshot: string;
  candidateSnapshot: string;
  candidates: readonly RankedResearchCandidate[];
  evidence: readonly ModelPortfolioEvidence[];
  useEscalationModel: boolean;
  runId?: string | null;
};

function compactEvidence(evidence: readonly ModelPortfolioEvidence[]): string {
  return evidence
    .slice(0, 12)
    .map(
      (item) =>
        `[${item.id}] ${item.kind} | ${item.publisher} | ${item.publishedAt} | ${item.title}\n${item.summary}`,
    )
    .join("\n\n");
}

function candidateKey(candidate: Pick<RankedResearchCandidate, "symbol" | "exchange">): string {
  return `${candidate.symbol}.${candidate.exchange}`.toUpperCase();
}

function findCandidate(
  candidates: readonly RankedResearchCandidate[],
  symbol: string,
): RankedResearchCandidate | null {
  const normalized = symbol.trim().toUpperCase();
  return candidates.find((candidate) =>
    candidate.symbol.toUpperCase() === normalized || candidateKey(candidate) === normalized,
  ) ?? null;
}

function compactCandidateResearch(candidate: RankedResearchCandidate) {
  return {
    symbol: candidate.symbol,
    exchange: candidate.exchange,
    deterministicScore: candidate.deterministicScore,
    reasons: candidate.reasons,
    marketCapSek: candidate.marketCapSek ?? null,
    avgDailyTurnoverSek: candidate.avgDailyTurnoverSek ?? null,
    priceMomentum20d: candidate.priceMomentum20d ?? null,
    priceMomentum60d: candidate.priceMomentum60d ?? null,
    volatility20d: candidate.volatility20d ?? null,
    earningsRevisionScore: candidate.earningsRevisionScore ?? null,
    qualityScore: candidate.qualityScore ?? null,
    valuationScore: candidate.valuationScore ?? null,
    dividendQualityScore: candidate.dividendQualityScore ?? null,
    catalystScore: candidate.catalystScore ?? null,
    balanceSheetScore: candidate.balanceSheetScore ?? null,
  };
}

function buildManagerTools(
  candidates: readonly RankedResearchCandidate[],
  evidence: readonly ModelPortfolioEvidence[],
) {
  const symbolSchema = z.object({
    symbol: z.string().trim().min(1).max(40).describe("Ticker, optionally with exchange suffix, e.g. INVE-B.ST"),
  });

  return {
    inspectTechnicalAnalysis: tool({
      description:
        "Inspect the full deterministic technical-analysis snapshot for one shortlisted stock. Use this before relying on trend, momentum, breakout, volume, support/resistance or mean-reversion claims.",
      inputSchema: symbolSchema,
      execute: async ({ symbol }) => {
        const candidate = findCandidate(candidates, symbol);
        if (!candidate) return { found: false, symbol };
        return {
          found: true,
          symbol: candidateKey(candidate),
          technicalAnalysis: candidate.technicalAnalysis ?? null,
        };
      },
    }),
    inspectCandidateResearch: tool({
      description:
        "Inspect all currently available deterministic research scores for one shortlisted candidate. Missing values are returned as null and must never be invented.",
      inputSchema: symbolSchema,
      execute: async ({ symbol }) => {
        const candidate = findCandidate(candidates, symbol);
        return candidate
          ? { found: true, candidate: compactCandidateResearch(candidate) }
          : { found: false, symbol };
      },
    }),
    inspectRiskAndLiquidity: tool({
      description:
        "Inspect volatility, drawdown, ATR, liquidity, support distance and technical stability for one candidate. Use this to challenge a proposed BUY or assess whether a technically attractive stock carries unacceptable risk.",
      inputSchema: symbolSchema,
      execute: async ({ symbol }) => {
        const candidate = findCandidate(candidates, symbol);
        if (!candidate) return { found: false, symbol };
        const technical = candidate.technicalAnalysis;
        return {
          found: true,
          symbol: candidateKey(candidate),
          avgDailyTurnoverSek: candidate.avgDailyTurnoverSek ?? null,
          volatility20d: candidate.volatility20d ?? null,
          atrPct14: technical?.volatility.atrPct14 ?? null,
          maxDrawdown252: technical?.volatility.maxDrawdown252 ?? null,
          supportDistancePct: technical?.levels.supportDistancePct ?? null,
          resistanceDistancePct: technical?.levels.resistanceDistancePct ?? null,
          stabilityScore: technical?.scores.stability ?? null,
          regime: technical?.trend.regime ?? "insufficient_data",
        };
      },
    }),
    compareShortlistedCandidates: tool({
      description:
        "Compare two to six shortlisted candidates side by side using deterministic research and technical scores. Useful when several stocks look plausible and capital must be allocated to the strongest mandate fit.",
      inputSchema: z.object({
        symbols: z.array(z.string().trim().min(1).max(40)).min(2).max(6),
      }),
      execute: async ({ symbols }) => ({
        candidates: symbols.map((symbol) => {
          const candidate = findCandidate(candidates, symbol);
          if (!candidate) return { found: false, symbol };
          return {
            found: true,
            ...compactCandidateResearch(candidate),
            technical: candidate.technicalAnalysis
              ? {
                  regime: candidate.technicalAnalysis.trend.regime,
                  composite: candidate.technicalAnalysis.scores.composite,
                  trend: candidate.technicalAnalysis.scores.trend,
                  momentum: candidate.technicalAnalysis.scores.momentum,
                  volume: candidate.technicalAnalysis.scores.volume,
                  breakout: candidate.technicalAnalysis.scores.breakout,
                  stability: candidate.technicalAnalysis.scores.stability,
                  rsi14: candidate.technicalAnalysis.momentum.rsi14 ?? null,
                  adx14: candidate.technicalAnalysis.trend.adx14 ?? null,
                }
              : null,
          };
        }),
      }),
    }),
    inspectEvidenceForCandidate: tool({
      description:
        "Return stored verified evidence whose title or summary mentions a candidate. This tool never searches the open web and never creates new facts.",
      inputSchema: symbolSchema,
      execute: async ({ symbol }) => {
        const candidate = findCandidate(candidates, symbol);
        const terms = new Set(
          [symbol, candidate?.symbol, candidate ? candidateKey(candidate) : null]
            .filter((value): value is string => Boolean(value))
            .map((value) => value.toLowerCase()),
        );
        const matches = evidence.filter((item) => {
          const haystack = `${item.title} ${item.summary}`.toLowerCase();
          return [...terms].some((term) => haystack.includes(term));
        });
        return {
          symbol: candidate ? candidateKey(candidate) : symbol,
          evidence: matches.slice(0, 8),
        };
      },
    }),
    inspectContradictions: tool({
      description:
        "Search the supplied verified evidence for negative or cautionary language connected to a candidate. Use this as a disconfirming check before BUY. It is a deterministic text filter, not sentiment AI.",
      inputSchema: symbolSchema,
      execute: async ({ symbol }) => {
        const candidate = findCandidate(candidates, symbol);
        const terms = [symbol, candidate?.symbol]
          .filter((value): value is string => Boolean(value))
          .map((value) => value.toLowerCase());
        const cautionTerms = [
          "risk",
          "warning",
          "sänkt",
          "sänker",
          "svag",
          "decline",
          "down",
          "cut",
          "miss",
          "debt",
          "regulatory",
          "investigation",
        ];
        const matches = evidence.filter((item) => {
          const haystack = `${item.title} ${item.summary}`.toLowerCase();
          return terms.some((term) => haystack.includes(term)) && cautionTerms.some((term) => haystack.includes(term));
        });
        return {
          symbol: candidate ? candidateKey(candidate) : symbol,
          cautionaryEvidence: matches.slice(0, 8),
          note: "No matches does not prove that no risks exist; it only means the supplied evidence contained no matching caution terms.",
        };
      },
    }),
  };
}

export async function generatePortfolioAiDecision(
  request: PortfolioAiDecisionRequest,
): Promise<{
  decision: ModelPortfolioDecision;
  model: ModelPortfolioAiModel;
  estimatedCostUsdMicros: number;
  usage: ModelPortfolioAiUsage;
}> {
  const config = resolveModelPortfolioAiConfig();
  if (!config.configured) throw new Error(config.reason);

  const model = request.useEscalationModel ? config.escalationModel : config.primaryModel;
  const system = buildModelPortfolioSystemMandate(request.strategyKey);
  const prompt = [
    `KÖRNING: ${request.runKind}`,
    "PORTFÖLJENS AKTUELLA TILLSTÅND:",
    request.portfolioSnapshot.slice(0, 12_000),
    "KANDIDATER EFTER DETERMINISTISK SCREENING:",
    request.candidateSnapshot.slice(0, 16_000),
    "VERIFIERAD EVIDENS:",
    compactEvidence(request.evidence),
    "VERKTYGSDISCIPLIN:",
    "Du har lokala, kostnadsfria analysverktyg för kandidatdata, teknisk analys, risk/likviditet, jämförelser, evidens och motsägande evidens.",
    "Om du överväger BUY/SELL/TRIM/REBALANCE ska du använda relevanta verktyg för att kontrollera teknisk bild och nedsiderisk innan slutbeslutet. En enskild indikator får aldrig ensam avgöra affären.",
    "Använd högst två verktygssteg och lämna därefter alltid slutbeslutet; fastna aldrig i upprepade verktygsanrop.",
    "Verktygen kan bara läsa redan hämtad verifierad data; null betyder okänt och får inte fyllas i med antaganden.",
    "Lämna exakt ett strukturerat beslut enligt schemat. Om underlaget inte tydligt motiverar en förändring: välj HOLD.",
  ].join("\n\n");

  const result = await generateText({
    model,
    output: Output.object({
      schema: modelPortfolioDecisionSchema,
      name: "model_portfolio_decision",
      description: "One auditable DivLab model-portfolio decision after optional bounded tool inspection.",
    }),
    system,
    prompt,
    tools: buildManagerTools(request.candidates, request.evidence),
    toolChoice: "auto",
    stopWhen: stepCountIs(MODEL_PORTFOLIO_AI_BUDGET.maxCallsPerPortfolioRun),
    maxOutputTokens: MODEL_PORTFOLIO_AI_BUDGET.maxOutputTokensPerCall,
    temperature: 0.1,
    providerOptions: {
      gateway: {
        tags: ["divlab", "model-portfolios", request.strategyKey, request.runKind, "tool-enabled"],
      },
    },
  });

  if (!result.output) throw new Error("model_portfolio_decision_output_missing");

  const catalogEstimatedCostUsdMicros = estimateAiCostUsdMicros({
    model,
    inputTokens: Number((result.usage ?? result.totalUsage)?.inputTokens ?? 0),
    outputTokens: Number((result.usage ?? result.totalUsage)?.outputTokens ?? 0),
  });

  const usage = extractModelPortfolioAiUsage({
    model,
    usage: result.usage,
    totalUsage: result.totalUsage,
    providerMetadata: result.providerMetadata,
    catalogEstimatedCostUsdMicros,
    runId: request.runId ?? null,
  });

  return {
    decision: result.output,
    model,
    estimatedCostUsdMicros: usage.estimatedCostUsdMicros,
    usage,
  };
}
