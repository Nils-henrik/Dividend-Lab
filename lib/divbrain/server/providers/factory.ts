/**
 * Server-only DivBrain provider factory (Ticket 1B-1).
 *
 * Default remains UnconfiguredProvider. AI Gateway is constructed only when
 * server config explicitly selects it with a valid model id.
 *
 * Do not wire this into live `/brain` server actions in this ticket.
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
  /** Optional gateway constructor overrides (e.g. custom fetch). */
  gatewayOptions?: Omit<
    AiGatewayProviderOptions,
    "modelId" | "maxOutputTokens" | "generateText"
  >;
};

export type DivBrainProviderFactoryResult = {
  provider: DivBrainProvider;
  config: DivBrainProviderConfig;
};

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
    return {
      provider: createAiGatewayProvider({
        modelId: config.modelId,
        maxOutputTokens: config.maxOutputTokens,
        generateText: options.generateText,
        ...options.gatewayOptions,
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
