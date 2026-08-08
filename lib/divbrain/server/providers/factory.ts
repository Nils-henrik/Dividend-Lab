/**
 * Server-only DivBrain provider factory (Ticket 1B-1).
 *
 * Default remains UnconfiguredProvider. AI Gateway is constructed only when
 * server config explicitly selects it with a valid model id.
 *
 * When a dedicated AI_GATEWAY_API_KEY is present, pass it explicitly to the
 * Gateway provider so API-key spend quotas are the effective external hard stop.
 * Otherwise Vercel deployments may continue to use OIDC.
 *
 * This module must never be imported by client components.
 */

import {
  createAiGatewayProvider,
  type AiGatewayGenerateText,
  type AiGatewayProviderOptions,
} from "./ai-gateway-provider";
import {
  DIVBRAIN_PROVIDER_KIND_AI_GATEWAY,
  DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
  parseDivBrainProviderConfig,
  readDivBrainProviderConfigFromEnv,
  type DivBrainProviderConfig,
  type DivBrainProviderEnvSource,
} from "./config";
import type { DivBrainProvider } from "./provider";
import { createUnconfiguredProvider } from "./unconfigured-provider";

export type CreateDivBrainProviderOptions = {
  /** Explicit config. When omitted, reads from process.env (fail-closed). */
  config?: DivBrainProviderConfig;
  /** Env-like source used when `config` is omitted. */
  env?: DivBrainProviderEnvSource;
  /** Test seam for the gateway generateText call. */
  generateText?: AiGatewayGenerateText;
  /** Optional gateway constructor overrides (e.g. explicit API key). */
  gatewayOptions?: Omit<
    AiGatewayProviderOptions,
    "modelId" | "maxOutputTokens" | "generateText"
  >;
};

export type DivBrainProviderFactoryResult = {
  provider: DivBrainProvider;
  config: DivBrainProviderConfig;
};

function readTrimmedApiKey(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolve Gateway API-key auth without ever logging or returning it outside the
 * provider constructor. Explicit gatewayOptions win, then injected env, then
 * process.env. If no key exists, the provider intentionally falls back to OIDC.
 */
function resolveGatewayApiKey(
  options: CreateDivBrainProviderOptions,
): string | undefined {
  return (
    readTrimmedApiKey(options.gatewayOptions?.apiKey) ??
    readTrimmedApiKey(options.env?.AI_GATEWAY_API_KEY) ??
    readTrimmedApiKey(process.env.AI_GATEWAY_API_KEY)
  );
}

/**
 * Create the DivBrain provider selected by server configuration.
 * Malformed config always yields UnconfiguredProvider.
 */
export function createDivBrainProvider(
  options: CreateDivBrainProviderOptions = {},
): DivBrainProviderFactoryResult {
  const config =
    options.config ??
    (options.env
      ? parseDivBrainProviderConfig(options.env)
      : readDivBrainProviderConfigFromEnv());

  if (config.kind === DIVBRAIN_PROVIDER_KIND_UNCONFIGURED) {
    return {
      provider: createUnconfiguredProvider(),
      config,
    };
  }

  if (config.kind === DIVBRAIN_PROVIDER_KIND_AI_GATEWAY) {
    const apiKey = resolveGatewayApiKey(options);
    return {
      provider: createAiGatewayProvider({
        modelId: config.modelId,
        maxOutputTokens: config.maxOutputTokens,
        generateText: options.generateText,
        ...(apiKey ? { apiKey } : {}),
      }),
      config,
    };
  }

  return {
    provider: createUnconfiguredProvider(),
    config: {
      kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
      reason: "invalid_kind",
    },
  };
}
