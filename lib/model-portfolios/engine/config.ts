export type ModelPortfolioMarketDataConfig =
  | {
      configured: true;
      provider: "eodhd";
      apiKey: string;
    }
  | {
      configured: false;
      reason: "provider_missing" | "provider_unsupported" | "api_key_missing";
    };

type EnvironmentMap = Readonly<Record<string, string | undefined>>;

export function resolveModelPortfolioMarketDataConfig(
  env: EnvironmentMap = process.env,
): ModelPortfolioMarketDataConfig {
  const rawProvider = env.MODEL_PORTFOLIO_MARKET_DATA_PROVIDER?.trim();
  if (!rawProvider) {
    return { configured: false, reason: "provider_missing" };
  }

  if (rawProvider !== "eodhd") {
    return { configured: false, reason: "provider_unsupported" };
  }

  const apiKey = env.EODHD_API_KEY?.trim();
  if (!apiKey) {
    return { configured: false, reason: "api_key_missing" };
  }

  return {
    configured: true,
    provider: "eodhd",
    apiKey,
  };
}
