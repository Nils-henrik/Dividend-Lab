/**
 * Server-only DivBrain provider configuration (Ticket 1B-1).
 *
 * Fail-closed: malformed or incomplete config resolves to `unconfigured`.
 * Model ids are never accepted from browser input.
 *
 * This module must never be imported by client components.
 * Do not mutate process.env from this module.
 */

import {
  DIVBRAIN_AI_GATEWAY_PROVIDER_ID,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP,
  DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN,
  getDivBrainBenchmarkCandidate,
  isDivBrainGatewayModelId,
} from "./candidates";
import { DIVBRAIN_PROVIDER_UNCONFIGURED_ID } from "./types";

export const DIVBRAIN_PROVIDER_KIND_UNCONFIGURED =
  DIVBRAIN_PROVIDER_UNCONFIGURED_ID;
export const DIVBRAIN_PROVIDER_KIND_AI_GATEWAY =
  DIVBRAIN_AI_GATEWAY_PROVIDER_ID;

export type DivBrainProviderKind =
  | typeof DIVBRAIN_PROVIDER_KIND_UNCONFIGURED
  | typeof DIVBRAIN_PROVIDER_KIND_AI_GATEWAY;

export type DivBrainProviderConfig =
  | {
      kind: typeof DIVBRAIN_PROVIDER_KIND_UNCONFIGURED;
      reason:
        | "default"
        | "missing_model"
        | "invalid_kind"
        | "invalid_model"
        | "invalid_max_output_tokens";
    }
  | {
      kind: typeof DIVBRAIN_PROVIDER_KIND_AI_GATEWAY;
      modelId: string;
      maxOutputTokens: number;
      /** True when model id is one of the Phase 1B benchmark candidates. */
      isBenchmarkCandidate: boolean;
    };

export type DivBrainProviderEnvSource = {
  readonly DIVBRAIN_PROVIDER?: string;
  readonly DIVBRAIN_PROVIDER_MODEL?: string;
  readonly DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS?: string;
  readonly AI_GATEWAY_API_KEY?: string;
  readonly VERCEL_OIDC_TOKEN?: string;
};

function readTrimmed(
  source: DivBrainProviderEnvSource,
  key: keyof DivBrainProviderEnvSource,
): string | undefined {
  const value = source[key];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseMaxOutputTokens(raw: string | undefined): number | null {
  if (raw === undefined) {
    return DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_DEFAULT;
  }

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  if (
    !Number.isInteger(parsed) ||
    parsed < DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_MIN ||
    parsed > DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS_HARD_CAP
  ) {
    return null;
  }

  return parsed;
}

/**
 * Parse provider selection from a server env-like object.
 * Unknown / incomplete configuration fails closed to `unconfigured`.
 */
export function parseDivBrainProviderConfig(
  source: DivBrainProviderEnvSource = {},
): DivBrainProviderConfig {
  const kindRaw = readTrimmed(source, "DIVBRAIN_PROVIDER");
  const kind = (kindRaw ?? DIVBRAIN_PROVIDER_KIND_UNCONFIGURED).toLowerCase();

  if (
    kind === DIVBRAIN_PROVIDER_KIND_UNCONFIGURED ||
    kind === "none" ||
    kind === "off"
  ) {
    return { kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED, reason: "default" };
  }

  if (kind !== DIVBRAIN_PROVIDER_KIND_AI_GATEWAY) {
    return {
      kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
      reason: "invalid_kind",
    };
  }

  const modelId = readTrimmed(source, "DIVBRAIN_PROVIDER_MODEL");
  if (!modelId) {
    return {
      kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
      reason: "missing_model",
    };
  }

  if (!isDivBrainGatewayModelId(modelId)) {
    return {
      kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
      reason: "invalid_model",
    };
  }

  const maxOutputTokens = parseMaxOutputTokens(
    readTrimmed(source, "DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS"),
  );
  if (maxOutputTokens === null) {
    return {
      kind: DIVBRAIN_PROVIDER_KIND_UNCONFIGURED,
      reason: "invalid_max_output_tokens",
    };
  }

  return {
    kind: DIVBRAIN_PROVIDER_KIND_AI_GATEWAY,
    modelId,
    maxOutputTokens,
    isBenchmarkCandidate: getDivBrainBenchmarkCandidate(modelId) !== null,
  };
}

/** Read config from `process.env` without mutating it. */
export function readDivBrainProviderConfigFromEnv(): DivBrainProviderConfig {
  return parseDivBrainProviderConfig({
    DIVBRAIN_PROVIDER: process.env.DIVBRAIN_PROVIDER,
    DIVBRAIN_PROVIDER_MODEL: process.env.DIVBRAIN_PROVIDER_MODEL,
    DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS:
      process.env.DIVBRAIN_PROVIDER_MAX_OUTPUT_TOKENS,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  });
}

/**
 * Whether server auth material appears present for a live gateway call.
 * Presence-only — never logs or returns secret values.
 */
export function hasDivBrainGatewayAuthMaterial(
  source: DivBrainProviderEnvSource = {
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  },
): boolean {
  return (
    readTrimmed(source, "AI_GATEWAY_API_KEY") !== undefined ||
    readTrimmed(source, "VERCEL_OIDC_TOKEN") !== undefined
  );
}
