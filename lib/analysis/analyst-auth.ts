import type {
  ModelPortfolioAiConfig,
  ModelPortfolioAiModel,
} from "@/lib/model-portfolios/engine/ai";

type EnvironmentMap = Readonly<Record<string, string | undefined>>;

type AnalystModelSet = Readonly<{
  primary: ModelPortfolioAiModel;
  escalation: ModelPortfolioAiModel;
}>;

function isVercelRuntime(env: EnvironmentMap): boolean {
  if (env.VERCEL?.trim() === "1") return true;
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }
  return Boolean(env.VERCEL_URL?.trim());
}

/**
 * AI Gateway can obtain Vercel OIDC from request context at runtime even when
 * VERCEL_OIDC_TOKEN is not materialized as a plain process.env value.
 *
 * The generic portfolio resolver remains strict. The analyst service first
 * resolves that normal config and then passes it here. Only a real Vercel
 * runtime may upgrade a missing explicit credential into a runtime-OIDC
 * attempt. A genuine 401 is still mapped back to gateway_auth_missing by the
 * analyst service.
 */
export function resolveDivLabAnalystAiConfig(input: {
  baseConfig: ModelPortfolioAiConfig;
  models: AnalystModelSet;
  env?: EnvironmentMap;
}): ModelPortfolioAiConfig {
  if (input.baseConfig.configured) return input.baseConfig;

  const env = input.env ?? process.env;
  if (!isVercelRuntime(env)) return input.baseConfig;

  return {
    configured: true,
    authMode: "vercel_oidc",
    primaryModel: input.models.primary,
    escalationModel: input.models.escalation,
  };
}
