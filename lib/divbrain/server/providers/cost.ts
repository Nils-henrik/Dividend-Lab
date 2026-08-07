/**
 * Deterministic DivBrain provider cost estimation helpers (Ticket 1B-1).
 *
 * Estimates USD cost from optional token usage + known candidate pricing.
 * Never claims live billed cost; never logs prompts or secrets.
 *
 * This module must never be imported by client components.
 */

import {
  getDivBrainBenchmarkCandidate,
  type DivBrainCandidatePricingUsdPerToken,
} from "./candidates";
import type { DivBrainProviderUsage } from "./types";

export type DivBrainEstimatedCostUsd = {
  readonly currency: "USD";
  readonly inputUsd: number;
  readonly outputUsd: number;
  readonly totalUsd: number;
  readonly pricingSource: "candidate_catalog" | "explicit";
};

function roundUsd(value: number): number {
  // Micro-dollar precision is enough for Founder scorecards.
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Estimate USD cost from token hooks and an explicit price table.
 * Returns null when usage or pricing is incomplete.
 */
export function estimateDivBrainProviderCostUsd(params: {
  usage: DivBrainProviderUsage;
  pricing: DivBrainCandidatePricingUsdPerToken;
  pricingSource?: DivBrainEstimatedCostUsd["pricingSource"];
}): DivBrainEstimatedCostUsd | null {
  const inputTokens = params.usage.inputTokens;
  const outputTokens = params.usage.outputTokens;

  if (
    typeof inputTokens !== "number" ||
    typeof outputTokens !== "number" ||
    !Number.isFinite(inputTokens) ||
    !Number.isFinite(outputTokens) ||
    inputTokens < 0 ||
    outputTokens < 0
  ) {
    return null;
  }

  const inputUsd = inputTokens * params.pricing.input;
  const outputUsd = outputTokens * params.pricing.output;

  return {
    currency: "USD",
    inputUsd: roundUsd(inputUsd),
    outputUsd: roundUsd(outputUsd),
    totalUsd: roundUsd(inputUsd + outputUsd),
    pricingSource: params.pricingSource ?? "explicit",
  };
}

/** Estimate using the Phase 1B candidate catalog when the model id is known. */
export function estimateDivBrainCandidateCostUsd(params: {
  modelId: string;
  usage: DivBrainProviderUsage;
}): DivBrainEstimatedCostUsd | null {
  const candidate = getDivBrainBenchmarkCandidate(params.modelId);
  if (!candidate) {
    return null;
  }

  return estimateDivBrainProviderCostUsd({
    usage: params.usage,
    pricing: candidate.pricingUsdPerToken,
    pricingSource: "candidate_catalog",
  });
}
