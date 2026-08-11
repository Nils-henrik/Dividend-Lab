/**
 * DivBrain Cost Guard atomic admission (Issue #105 / #103).
 *
 * Must reserve budget before `provider.generate()` for real (AI Gateway)
 * providers. Fail closed on missing/malformed config, unpriceable models,
 * budget caps, or reservation persistence failure.
 *
 * Hard limits are enforced by a DB-backed (or equivalently atomic in-memory)
 * reserve operation — never by separate app-side SUM reads + generate.
 *
 * This module must never be imported by client components.
 */

import { estimateDivBrainContextTokens } from "../context/estimate-size";
import type { DivBrainUsageLedgerRepository } from "../repository/usage-ledger";
import type { DivBrainReserveBudgetDenialReason } from "../repository/usage-ledger-persistence";
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
  | DivBrainReserveBudgetDenialReason
  | "model_unpriceable";

export type DivBrainCostGuardDecision =
  | {
      readonly allow: true;
      readonly reservationId: string;
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
   * Atomic pre-flight reservation. Must be awaited before any paid generate.
   * Never performs provider/network generation itself.
   */
  reserve(params: {
    actorId: string;
    conversationId: string;
    providerId: string;
    request: DivBrainProviderRequest;
    modelId: string;
    maxOutputTokens: number;
  }): Promise<DivBrainCostGuardDecision>;
};

export function providerRequiresDivBrainCostGuard(providerId: string): boolean {
  return providerId === DIVBRAIN_AI_GATEWAY_PROVIDER_ID;
}

/**
 * Conservative file/image token estimate for Cost Guard reservation.
 * Prefer over-reserving vs under-reserving when multimodal input is present.
 */
export function estimateDivBrainProviderFilePartTokens(params: {
  mediaType: string;
  byteLength: number;
}): number {
  const bytes = Math.max(0, Math.floor(params.byteLength));
  if (bytes === 0) {
    return 0;
  }

  // Images: rough high-side heuristic for vision tokens.
  if (params.mediaType.startsWith("image/")) {
    return Math.max(1_000, Math.ceil(bytes / 256) + 512);
  }

  // PDFs / other binary file parts: conservative byte→token ceiling.
  if (params.mediaType === "application/pdf") {
    return Math.max(2_000, Math.ceil(bytes / 180) + 1_000);
  }

  return Math.max(500, Math.ceil(bytes / 220) + 256);
}

function estimateMessageContentTokens(
  content: DivBrainProviderRequest["messages"][number]["content"],
): number {
  if (typeof content === "string") {
    return estimateDivBrainContextTokens(content);
  }

  let total = 0;
  for (const part of content) {
    if (part.type === "text") {
      total += estimateDivBrainContextTokens(part.text);
      continue;
    }
    total += estimateDivBrainProviderFilePartTokens({
      mediaType: part.mediaType,
      byteLength: part.data.byteLength,
    });
  }
  return total;
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
    total += estimateMessageContentTokens(message.content);
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
}): DivBrainCostGuard {
  return {
    async reserve({
      actorId,
      conversationId,
      providerId,
      request,
      modelId,
      maxOutputTokens,
    }) {
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

      // Local request ceiling short-circuit (also re-checked atomically in RPC).
      if (projectedCostMicroUsd > config.maxRequestMicroUsd) {
        return { allow: false, reason: "request_projected_over_limit" };
      }

      const reserved = await params.usageLedger.reserveBudget({
        actorId,
        conversationId,
        providerId,
        modelId,
        projectedCostMicroUsd,
        maxRequestMicroUsd: config.maxRequestMicroUsd,
        dailyHardLimitMicroUsd: config.dailyHardLimitMicroUsd,
        monthlyTargetMicroUsd: config.monthlyTargetMicroUsd,
        monthlyWarningMicroUsd: config.monthlyWarningMicroUsd,
        monthlyHardLimitMicroUsd: config.monthlyHardLimitMicroUsd,
      });

      if (!reserved.ok) {
        return { allow: false, reason: "aggregate_unavailable" };
      }

      if (!reserved.data.admitted) {
        return { allow: false, reason: reserved.data.reason };
      }

      return {
        allow: true,
        reservationId: reserved.data.reservationId,
        projectedCostMicroUsd,
        estimatedInputTokens,
        maxOutputTokens,
        monthlyLevel: reserved.data.monthlyLevel,
      };
    },
  };
}

/** Fail-closed guard used when real provider is selected without valid config. */
export function createDenyAllDivBrainCostGuard(
  reason: DivBrainCostGuardDenialReason = "config_invalid",
): DivBrainCostGuard {
  return {
    async reserve() {
      return { allow: false, reason };
    },
  };
}
