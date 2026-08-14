import {
  MODEL_PORTFOLIO_AI_MODELS,
  resolveModelPortfolioAiConfig,
  type ModelPortfolioAiConfig,
} from "@/lib/model-portfolios/engine/ai";

type EnvironmentMap = Readonly<Record<string, string | undefined>>;

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
 * Keep the generic portfolio resolver strict for local/CI callers, but allow
 * the analyst service running inside a real Vercel Function to let the Gateway
 * attempt runtime-context OIDC. A genuine 401 is still mapped back to
 * gateway_auth_missing by the analyst service.
 */
export function resolveDivLabAnalystAiConfig(
  env: EnvironmentMap = process.env,
): ModelPortfolioAiConfig {
  const explicit = resolveModelPortfolioAiConfig(env);
  if (explicit.configured || !isVercelRuntime(env)) return explicit;

  return {
    configured: true,
    authMode: "vercel_oidc",
    primaryModel: MODEL_PORTFOLIO_AI_MODELS.primary,
    escalationModel: MODEL_PORTFOLIO_AI_MODELS.escalation,
  };
}
