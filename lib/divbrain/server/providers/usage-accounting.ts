/**
 * Post-call DivBrain usage/cost normalization (Issue #105 / #103).
 *
 * Prefer validated AI Gateway actual-cost metadata when safely available
 * (including canonical decimal-string costs such as `"0.00849"`).
 * Otherwise use the conservative candidate-catalog estimate.
 * Never trust arbitrary `providerMetadata` JSON.
 * Never silently record zero cost for a paid call.
 * Never persist raw provider metadata.
 *
 * This module must never be imported by client components.
 */

import { getDivBrainBenchmarkCandidate } from "./candidates";
import {
  decimalUsdStringToMicroUsdCeil,
  estimateCostMicroUsd,
  isDivBrainMicroUsd,
  usdToMicroUsdCeil,
  type DivBrainMicroUsd,
} from "./cost-units";
import type { DivBrainProviderUsage } from "./types";
import type { DivBrainUsageCostSource } from "../repository/usage-ledger-persistence";

export type DivBrainAccountedUsage = {
  readonly costMicroUsd: DivBrainMicroUsd;
  readonly costSource: DivBrainUsageCostSource;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
};

function asNonNegativeInt(value: unknown): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }
  return null;
}

function parseTrustedGatewayUsdAmount(value: unknown): DivBrainMicroUsd | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return null;
    }
    return usdToMicroUsdCeil(value);
  }

  if (typeof value === "string") {
    return decimalUsdStringToMicroUsdCeil(value);
  }

  return null;
}

/**
 * Extract a validated Gateway actual cost (micro-USD) from narrow metadata.
 *
 * Accepted shapes only (all others rejected):
 * - `{ gateway: { cost: <finite positive USD number|decimal string> } }`
 * - `{ gateway: { totalCost: <finite positive USD number|decimal string> } }`
 * - `{ gateway: { cost: { total: <finite positive USD number|decimal string> } } }`
 *
 * Decimal strings must be canonical (no whitespace/exponent/junk).
 * Zero / negative / non-finite / malformed values are rejected.
 * Callers must still refuse to treat a rejected value as zero-cost accounting.
 */
export function extractValidatedGatewayCostMicroUsd(
  providerMetadata: unknown,
): DivBrainMicroUsd | null {
  if (typeof providerMetadata !== "object" || providerMetadata === null) {
    return null;
  }

  const gateway = (providerMetadata as { gateway?: unknown }).gateway;
  if (typeof gateway !== "object" || gateway === null) {
    return null;
  }

  const record = gateway as Record<string, unknown>;

  let candidate: unknown = undefined;

  if (record.totalCost !== undefined) {
    candidate = record.totalCost;
  } else if (typeof record.cost === "number" || typeof record.cost === "string") {
    candidate = record.cost;
  } else if (typeof record.cost === "object" && record.cost !== null) {
    candidate = (record.cost as { total?: unknown }).total;
  }

  if (candidate === undefined) {
    return null;
  }

  return parseTrustedGatewayUsdAmount(candidate);
}

function resolveTokenCounts(usage: DivBrainProviderUsage | undefined): {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
} {
  return {
    inputTokens: asNonNegativeInt(usage?.inputTokens),
    outputTokens: asNonNegativeInt(usage?.outputTokens),
    totalTokens: asNonNegativeInt(usage?.totalTokens),
  };
}

/**
 * Normalize accounted cost for a paid provider invocation.
 *
 * Strategy (fail closed for money; never silent zero):
 * 1. Validated gateway actual cost metadata when present and > 0
 * 2. Conservative catalog estimate from known token counts
 * 3. Conservative catalog estimate using projected input + max output when
 *    token counts are incomplete
 * 4. Fail-closed ceiling (projected reservation) when estimation fails
 *
 * Hard-limit accounting remains on the pre-call reserved amount; this value
 * is stored as accounted_cost_micro_usd for observability/reconciliation only
 * and must never weaken day/month hard limits.
 */
export function accountDivBrainProviderUsage(params: {
  modelId: string;
  usage?: DivBrainProviderUsage;
  /** Already-validated Gateway actual cost from the adapter, when present. */
  gatewayCostMicroUsd?: number;
  /** Raw metadata only when adapter did not pre-validate (tests). */
  providerMetadata?: unknown;
  /** Pre-flight projected reservation; used as fail-closed ceiling. */
  failClosedCeilingMicroUsd: DivBrainMicroUsd;
  estimatedInputTokens?: number;
  maxOutputTokens?: number;
}): DivBrainAccountedUsage {
  const tokens = resolveTokenCounts(params.usage);

  if (isDivBrainMicroUsd(params.gatewayCostMicroUsd)) {
    return {
      costMicroUsd: params.gatewayCostMicroUsd,
      costSource: "gateway_actual",
      ...tokens,
    };
  }

  const gatewayCost = extractValidatedGatewayCostMicroUsd(
    params.providerMetadata,
  );
  if (gatewayCost !== null && isDivBrainMicroUsd(gatewayCost)) {
    return {
      costMicroUsd: gatewayCost,
      costSource: "gateway_actual",
      ...tokens,
    };
  }

  const candidate = getDivBrainBenchmarkCandidate(params.modelId);

  if (
    candidate &&
    tokens.inputTokens !== null &&
    tokens.outputTokens !== null
  ) {
    const estimated = estimateCostMicroUsd({
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
      pricingUsdPerToken: candidate.pricingUsdPerToken,
    });
    if (estimated !== null) {
      return {
        costMicroUsd: estimated,
        costSource: "conservative_estimate",
        ...tokens,
      };
    }
  }

  if (
    candidate &&
    typeof params.estimatedInputTokens === "number" &&
    typeof params.maxOutputTokens === "number"
  ) {
    const input =
      tokens.inputTokens ??
      (Number.isFinite(params.estimatedInputTokens) &&
      params.estimatedInputTokens >= 0
        ? Math.floor(params.estimatedInputTokens)
        : null);
    const output =
      tokens.outputTokens ??
      (Number.isInteger(params.maxOutputTokens) && params.maxOutputTokens > 0
        ? params.maxOutputTokens
        : null);

    if (input !== null && output !== null) {
      const estimated = estimateCostMicroUsd({
        inputTokens: input,
        outputTokens: output,
        pricingUsdPerToken: candidate.pricingUsdPerToken,
      });
      if (estimated !== null) {
        return {
          costMicroUsd: estimated,
          costSource: "conservative_estimate",
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
          totalTokens: tokens.totalTokens,
        };
      }
    }
  }

  // Malformed/missing metadata must not become zero-cost accounting.
  return {
    costMicroUsd: params.failClosedCeilingMicroUsd,
    costSource: "fail_closed_ceiling",
    ...tokens,
  };
}
