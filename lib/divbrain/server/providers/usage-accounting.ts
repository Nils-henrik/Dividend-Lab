/**
 * Post-call DivBrain usage/cost normalization (Issue #103).
 *
 * Prefer validated AI Gateway actual-cost metadata when safely available.
 * Otherwise use the conservative candidate-catalog estimate.
 * Never trust arbitrary `providerMetadata` JSON.
 * Never silently record zero cost for a paid call.
 *
 * This module must never be imported by client components.
 */

import { getDivBrainBenchmarkCandidate } from "./candidates";
import {
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

/**
 * Extract a validated Gateway actual cost (micro-USD) from narrow metadata.
 *
 * Accepted shapes only (all others rejected):
 * - `{ gateway: { cost: <finite USD number> } }`
 * - `{ gateway: { totalCost: <finite USD number> } }`
 * - `{ gateway: { cost: { total: <finite USD number> } } }`
 *
 * Zero / negative / non-finite / non-number values are rejected.
 * Callers must still refuse to treat a rejected zero as paid-call accounting.
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

  let usd: number | null = null;

  if (typeof record.totalCost === "number") {
    usd = record.totalCost;
  } else if (typeof record.cost === "number") {
    usd = record.cost;
  } else if (
    typeof record.cost === "object" &&
    record.cost !== null &&
    typeof (record.cost as { total?: unknown }).total === "number"
  ) {
    usd = (record.cost as { total: number }).total;
  }

  if (usd === null || !Number.isFinite(usd) || usd <= 0) {
    return null;
  }

  return usdToMicroUsdCeil(usd);
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
 * 4. Fail-closed ceiling (projected pre-flight cost) when estimation fails
 */
export function accountDivBrainProviderUsage(params: {
  modelId: string;
  usage?: DivBrainProviderUsage;
  /** Already-validated Gateway actual cost from the adapter, when present. */
  gatewayCostMicroUsd?: number;
  /** Raw metadata only when adapter did not pre-validate (tests). */
  providerMetadata?: unknown;
  /** Pre-flight projected cost; used as fail-closed ceiling. */
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
