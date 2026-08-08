/**
 * DivBrain Cost Guard pre-flight enforcement (Issue #103).
 *
 * Must run before `provider.generate()` for real (AI Gateway) providers.
 * Fail closed on missing/malformed config, unpriceable models, or budget caps.
 *
 * This module must never be imported by client components.
 */

import { estimateDivBrainContextTokens } from "../context/estimate-size";
import type { DivBrainUsageLedgerRepository } from "../repository/usage-ledger";
import {
  DIVBRAIN_AI_GATEWAY_PROVIDER_ID,
  getDivBrainBenchmarkCandidate,
} from "./candidates";
import {
  isValidDivBrainCostGuardConfig,
  type DivBrainCostGuardConfig,
} from "./cost-guard-config";
import { estimateCostMicroUsd, type DivBrainMicroUsd } from "./cost-units";
import type { DivBrainProviderRequest } from "./types";

export type DivBrainCostGuardDenialReason =
  | "config_invalid"
  | "model_unpriceable"
  | "request_projected_over_limit"
  | "daily_hard_limit"
  | "monthly_hard_limit"
  | "aggregate_unavailable";

export type DivBrainCostGuardDecision =
  | {
      readonly allow: true;
      readonly projectedCostMicroUsd: DivBrainMicroUsd;
      readonly estimatedInputTokens: number;
      readonly maxOutputTokens: number;
      readonly monthlyLevel: "under_target" | "warning" | "above_warning";
    }
  | {
      readonly allow: false;
      readonly reason: DivBrainCostGuardDenialReason;
    };

export type DivBrainCostGuard = {
  /**
   * Pre-flight budget check. Must be awaited before any paid generate call.
   * Never performs provider/network generation itself.
   */
  preflight(params: {
    request: DivBrainProviderRequest;
    modelId: string;
    maxOutputTokens: number;
  }): Promise<DivBrainCostGuardDecision>;
};

export function providerRequiresDivBrainCostGuard(providerId: string): boolean {
  return providerId === DIVBRAIN_AI_GATEWAY_PROVIDER_ID;
}

/** Deterministic input-token estimate for conservative projection. */
export function estimateDivBrainProviderRequestInputTokens(
  request: DivBrainProviderRequest,
): number {
  let total = 0;
  for (const block of request.contextBlocks) {
    total += estimateDivBrainContextTokens(block.content);
  }
  for (const message of request.messages) {
    total += estimateDivBrainContextTokens(message.content);
  }
  return total;
}

export function projectDivBrainRequestCostMicroUsd(params: {
  request: DivBrainProviderRequest;
  modelId: string;
  maxOutputTokens: number;
}): {
  projectedCostMicroUsd: DivBrainMicroUsd | null;
  estimatedInputTokens: number;
} {
  const estimatedInputTokens = estimateDivBrainProviderRequestInputTokens(
    params.request,
  );
  const candidate = getDivBrainBenchmarkCandidate(params.modelId);
  if (!candidate) {
    return { projectedCostMicroUsd: null, estimatedInputTokens };
  }

  const projectedCostMicroUsd = estimateCostMicroUsd({
    inputTokens: estimatedInputTokens,
    outputTokens: params.maxOutputTokens,
    pricingUsdPerToken: candidate.pricingUsdPerToken,
  });

  return { projectedCostMicroUsd, estimatedInputTokens };
}

export function createDivBrainCostGuard(params: {
  config: DivBrainCostGuardConfig;
  usageLedger: DivBrainUsageLedgerRepository;
  now?: () => Date;
}): DivBrainCostGuard {
  const now = params.now ?? (() => new Date());

  return {
    async preflight({ request, modelId, maxOutputTokens }) {
      if (!isValidDivBrainCostGuardConfig(params.config)) {
        return { allow: false, reason: "config_invalid" };
      }

      const config = params.config;
      const { projectedCostMicroUsd, estimatedInputTokens } =
        projectDivBrainRequestCostMicroUsd({
          request,
          modelId,
          maxOutputTokens,
        });

      if (projectedCostMicroUsd === null) {
        return { allow: false, reason: "model_unpriceable" };
      }

      if (projectedCostMicroUsd > config.maxRequestMicroUsd) {
        return { allow: false, reason: "request_projected_over_limit" };
      }

      const at = now();
      const daySum = await params.usageLedger.sumCostMicroUsdForUtcDay(at);
      if (!daySum.ok) {
        return { allow: false, reason: "aggregate_unavailable" };
      }

      if (daySum.data + projectedCostMicroUsd > config.dailyHardLimitMicroUsd) {
        return { allow: false, reason: "daily_hard_limit" };
      }

      const monthSum = await params.usageLedger.sumCostMicroUsdForUtcMonth(at);
      if (!monthSum.ok) {
        return { allow: false, reason: "aggregate_unavailable" };
      }

      if (
        monthSum.data + projectedCostMicroUsd >
        config.monthlyHardLimitMicroUsd
      ) {
        return { allow: false, reason: "monthly_hard_limit" };
      }

      let monthlyLevel: "under_target" | "warning" | "above_warning" =
        "under_target";
      if (monthSum.data >= config.monthlyWarningMicroUsd) {
        monthlyLevel = "above_warning";
      } else if (monthSum.data >= config.monthlyTargetMicroUsd) {
        monthlyLevel = "warning";
      }

      return {
        allow: true,
        projectedCostMicroUsd,
        estimatedInputTokens,
        maxOutputTokens,
        monthlyLevel,
      };
    },
  };
}

/** Fail-closed guard used when real provider is selected without valid config. */
export function createDenyAllDivBrainCostGuard(
  reason: DivBrainCostGuardDenialReason = "config_invalid",
): DivBrainCostGuard {
  return {
    async preflight() {
      return { allow: false, reason };
    },
  };
}
