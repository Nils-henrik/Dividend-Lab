import "server-only";

import { generateObject } from "ai";
import { modelPortfolioDecisionSchema, type ModelPortfolioDecision, type ModelPortfolioEvidence } from "./decision";
import { buildModelPortfolioSystemMandate } from "./mandates";
import type { ModelPortfolioStrategyKey } from "./policy";

export const MODEL_PORTFOLIO_AI_MODELS = {
  primary: "openai/gpt-5.6-luna",
  escalation: "openai/gpt-5.6-terra",
} as const;

export type ModelPortfolioAiModel =
  (typeof MODEL_PORTFOLIO_AI_MODELS)[keyof typeof MODEL_PORTFOLIO_AI_MODELS];

// Conservative internal cost estimates based on the selected AI Gateway models.
// The hard cap is expressed in USD micros so it is independent of floating point
// money math. 300_000 micros = USD 0.30, intentionally targeting roughly the
// middle of Henrik's 2-4 SEK/day operating budget rather than spending the ceiling.
export const MODEL_PORTFOLIO_AI_BUDGET = {
  targetDailyUsdMicros: 150_000,
  hardDailyUsdMicros: 300_000,
  maxCallsPerPortfolioRun: 2,
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
  evidence: readonly ModelPortfolioEvidence[];
  useEscalationModel: boolean;
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

export async function generatePortfolioAiDecision(
  request: PortfolioAiDecisionRequest,
): Promise<{
  decision: ModelPortfolioDecision;
  model: ModelPortfolioAiModel;
  estimatedCostUsdMicros: number;
  usage: { inputTokens: number; outputTokens: number };
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
    "Lämna exakt ett strukturerat beslut enligt schemat. Om underlaget inte tydligt motiverar en förändring: välj HOLD.",
  ].join("\n\n");

  const result = await generateObject({
    model,
    schema: modelPortfolioDecisionSchema,
    system,
    prompt,
    maxOutputTokens: MODEL_PORTFOLIO_AI_BUDGET.maxOutputTokensPerCall,
    temperature: 0.1,
    providerOptions: {
      gateway: {
        tags: ["divlab", "model-portfolios", request.strategyKey, request.runKind],
      },
    },
  });

  const inputTokens = Number(result.usage?.inputTokens ?? 0);
  const outputTokens = Number(result.usage?.outputTokens ?? 0);
  const estimatedCostUsdMicros = estimateAiCostUsdMicros({
    model,
    inputTokens,
    outputTokens,
  });

  return {
    decision: result.object,
    model,
    estimatedCostUsdMicros,
    usage: { inputTokens, outputTokens },
  };
}
