export const MODEL_PORTFOLIO_AI_PROVIDER = "vercel-ai-gateway" as const;

export type ModelPortfolioAiUsage = {
  provider: typeof MODEL_PORTFOLIO_AI_PROVIDER;
  model: string;
  inputTokens: number;
  cachedInputTokens: number | null;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsdMicros: number;
  costSource: "catalog_estimate" | "gateway_actual";
  timestamp: string;
  runId: string | null;
};

export type ModelPortfolioBatchAiUsage = {
  provider: typeof MODEL_PORTFOLIO_AI_PROVIDER;
  portfolioCount: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsdMicros: number;
  estimatedCostUsd: number;
  timestamp: string;
  runId: string | null;
  perPortfolio: Array<{
    portfolioId: string;
    slug: string;
    model: string;
    inputTokens: number;
    cachedInputTokens: number | null;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsdMicros: number;
    costSource: ModelPortfolioAiUsage["costSource"];
  }>;
};

function nonNegativeInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

export function extractGatewayCostUsdMicros(providerMetadata: unknown): number | null {
  if (typeof providerMetadata !== "object" || providerMetadata === null) return null;
  const gateway = (providerMetadata as { gateway?: unknown }).gateway;
  if (typeof gateway !== "object" || gateway === null) return null;
  const record = gateway as Record<string, unknown>;

  let candidate: unknown;
  if (record.totalCost !== undefined) candidate = record.totalCost;
  else if (typeof record.cost === "number" || typeof record.cost === "string") candidate = record.cost;
  else if (typeof record.cost === "object" && record.cost !== null) {
    candidate = (record.cost as { total?: unknown }).total;
  } else return null;

  if (typeof candidate === "number") {
    if (!Number.isFinite(candidate) || candidate <= 0) return null;
    return Math.ceil(candidate * 1_000_000);
  }
  if (typeof candidate === "string") {
    if (!/^\d+(\.\d+)?$/.test(candidate.trim())) return null;
    const parsed = Number(candidate);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.ceil(parsed * 1_000_000);
  }
  return null;
}

export function extractModelPortfolioAiUsage(input: {
  model: string;
  usage: unknown;
  totalUsage?: unknown;
  providerMetadata?: unknown;
  catalogEstimatedCostUsdMicros: number;
  timestamp?: string;
  runId?: string | null;
}): ModelPortfolioAiUsage {
  const primary = (input.usage ?? input.totalUsage ?? {}) as Record<string, unknown>;
  const details =
    primary.inputTokenDetails && typeof primary.inputTokenDetails === "object"
      ? (primary.inputTokenDetails as Record<string, unknown>)
      : {};

  const inputTokens = nonNegativeInt(primary.inputTokens) ?? 0;
  const outputTokens = nonNegativeInt(primary.outputTokens) ?? 0;
  const cachedInputTokens = nonNegativeInt(details.cacheReadTokens);
  const totalTokens = nonNegativeInt(primary.totalTokens) ?? inputTokens + outputTokens;

  const gatewayCost = extractGatewayCostUsdMicros(input.providerMetadata);
  const estimatedCostUsdMicros = gatewayCost ?? input.catalogEstimatedCostUsdMicros;
  const costSource = gatewayCost !== null ? "gateway_actual" : "catalog_estimate";

  return {
    provider: MODEL_PORTFOLIO_AI_PROVIDER,
    model: input.model,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsdMicros,
    costSource,
    timestamp: input.timestamp ?? new Date().toISOString(),
    runId: input.runId ?? null,
  };
}

export function aggregatePortfolioAiUsage(input: {
  runId: string | null;
  timestamp?: string;
  portfolios: Array<{
    portfolioId: string;
    slug: string;
    usage: ModelPortfolioAiUsage | null | undefined;
  }>;
}): ModelPortfolioBatchAiUsage {
  const perPortfolio = input.portfolios
    .filter((item) => item.usage)
    .map((item) => ({
      portfolioId: item.portfolioId,
      slug: item.slug,
      model: item.usage!.model,
      inputTokens: item.usage!.inputTokens,
      cachedInputTokens: item.usage!.cachedInputTokens,
      outputTokens: item.usage!.outputTokens,
      totalTokens: item.usage!.totalTokens,
      estimatedCostUsdMicros: item.usage!.estimatedCostUsdMicros,
      costSource: item.usage!.costSource,
    }));

  const inputTokens = perPortfolio.reduce((sum, row) => sum + row.inputTokens, 0);
  const cachedInputTokens = perPortfolio.reduce((sum, row) => sum + (row.cachedInputTokens ?? 0), 0);
  const outputTokens = perPortfolio.reduce((sum, row) => sum + row.outputTokens, 0);
  const totalTokens = perPortfolio.reduce((sum, row) => sum + row.totalTokens, 0);
  const estimatedCostUsdMicros = perPortfolio.reduce((sum, row) => sum + row.estimatedCostUsdMicros, 0);

  return {
    provider: MODEL_PORTFOLIO_AI_PROVIDER,
    portfolioCount: perPortfolio.length,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsdMicros,
    estimatedCostUsd: estimatedCostUsdMicros / 1_000_000,
    timestamp: input.timestamp ?? new Date().toISOString(),
    runId: input.runId,
    perPortfolio,
  };
}
