/**
 * DivBrain usage ledger repository (Issue #105 / #103).
 *
 * Atomic reserve before paid generate + durable finalize after provider attempt.
 * Hard-limit accounting uses reserved_cost_micro_usd (never double-counts).
 * Never stores prompts, completions, policy text, source excerpts, secrets,
 * raw provider payloads, or raw errors.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import {
  divBrainFailureFromCode,
  divBrainSuccess,
} from "../../results";
import { normalizeDivBrainActorId, normalizeDivBrainResourceId } from "./ids";
import type {
  DivBrainFinalizeBudgetInput,
  DivBrainReserveBudgetDenialReason,
  DivBrainReserveBudgetResult,
  DivBrainUsageCostSource,
  DivBrainUsageLedgerPort,
  DivBrainUsageTerminalStatus,
} from "./usage-ledger-persistence";

export type DivBrainUsageLedgerUtcRange = {
  readonly fromInclusive: string;
  readonly toExclusive: string;
};

export type ReserveDivBrainUsageBudgetParams = {
  actorId: string;
  conversationId?: string | null;
  providerId: string;
  modelId: string;
  projectedCostMicroUsd: number;
  maxRequestMicroUsd: number;
  dailyHardLimitMicroUsd: number;
  monthlyTargetMicroUsd: number;
  monthlyWarningMicroUsd: number;
  monthlyHardLimitMicroUsd: number;
};

export type FinalizeDivBrainUsageBudgetParams = {
  reservationId: string;
  accountedCostMicroUsd: number;
  costSource: DivBrainUsageCostSource;
  terminalStatus: DivBrainUsageTerminalStatus;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  latencyMs?: number | null;
  messageId?: string | null;
};

export type DivBrainUsageReservation =
  | {
      readonly admitted: true;
      readonly reservationId: string;
      readonly monthlyLevel: "under_target" | "warning" | "above_warning";
    }
  | {
      readonly admitted: false;
      readonly reason: DivBrainReserveBudgetDenialReason;
    };

export type DivBrainUsageLedgerRepository = {
  /**
   * Atomic admission: validates projected charge against request/day/month
   * hard limits and reserves the projected amount before generate.
   */
  reserveBudget(
    params: ReserveDivBrainUsageBudgetParams,
  ): Promise<DivBrainResult<DivBrainUsageReservation>>;
  /**
   * Finalize a reserved charge after a provider attempt.
   * Failure must not erase the reserved hard-limit charge.
   */
  finalizeBudget(
    params: FinalizeDivBrainUsageBudgetParams,
  ): Promise<DivBrainResult<{ reservationId: string }>>;
  sumReservedCostMicroUsdForUtcDay(
    now?: Date,
  ): Promise<DivBrainResult<number>>;
  sumReservedCostMicroUsdForUtcMonth(
    now?: Date,
  ): Promise<DivBrainResult<number>>;
};

const COST_SOURCES = new Set<DivBrainUsageCostSource>([
  "gateway_actual",
  "conservative_estimate",
  "fail_closed_ceiling",
]);

const TERMINAL_STATUSES = new Set<DivBrainUsageTerminalStatus>([
  "completed",
  "failed",
  "cancelled",
  "provider_unavailable",
]);

function isNonNegativeInt(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isPositiveSafeInt(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isNonEmptyId(value: unknown, max: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= max
  );
}

/** UTC day `[00:00:00.000Z, next day)` for the given instant. */
export function divBrainUtcDayRange(now: Date): DivBrainUsageLedgerUtcRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const from = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
  return {
    fromInclusive: from.toISOString(),
    toExclusive: to.toISOString(),
  };
}

/** UTC calendar month `[1st 00:00:00.000Z, next month 1st)` for the given instant. */
export function divBrainUtcMonthRange(now: Date): DivBrainUsageLedgerUtcRange {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return {
    fromInclusive: from.toISOString(),
    toExclusive: to.toISOString(),
  };
}

function mapReserveResult(
  result: DivBrainReserveBudgetResult,
): DivBrainUsageReservation {
  if (result.ok) {
    return {
      admitted: true,
      reservationId: result.reservationId,
      monthlyLevel: result.monthlyLevel,
    };
  }
  return {
    admitted: false,
    reason: result.reason,
  };
}

/**
 * Create a usage-ledger repository over a narrow persistence port.
 * Hard-limit admission is atomic via reserveBudget — never app-side TOCTOU.
 */
export function createDivBrainUsageLedgerRepository(params: {
  port: DivBrainUsageLedgerPort;
  now?: () => Date;
}): DivBrainUsageLedgerRepository {
  const now = params.now ?? (() => new Date());

  return {
    async reserveBudget(input) {
      const actorResult = normalizeDivBrainActorId(input.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      if (!isNonEmptyId(input.providerId, 64)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (!isNonEmptyId(input.modelId, 192)) {
        return divBrainFailureFromCode("invalid_request");
      }

      const amounts = [
        input.projectedCostMicroUsd,
        input.maxRequestMicroUsd,
        input.dailyHardLimitMicroUsd,
        input.monthlyTargetMicroUsd,
        input.monthlyWarningMicroUsd,
        input.monthlyHardLimitMicroUsd,
      ];
      if (!amounts.every(isPositiveSafeInt)) {
        return divBrainFailureFromCode("invalid_request");
      }

      let conversationId: string | null = null;
      if (input.conversationId != null && input.conversationId !== "") {
        const idResult = normalizeDivBrainResourceId(input.conversationId);
        if (!idResult.ok) {
          return idResult;
        }
        conversationId = idResult.data;
      }

      const reserved = await params.port.reserveBudget({
        userId: actorResult.data,
        conversationId,
        providerId: input.providerId.trim(),
        modelId: input.modelId.trim(),
        projectedCostMicroUsd: input.projectedCostMicroUsd,
        maxRequestMicroUsd: input.maxRequestMicroUsd,
        dailyHardLimitMicroUsd: input.dailyHardLimitMicroUsd,
        monthlyTargetMicroUsd: input.monthlyTargetMicroUsd,
        monthlyWarningMicroUsd: input.monthlyWarningMicroUsd,
        monthlyHardLimitMicroUsd: input.monthlyHardLimitMicroUsd,
        nowIso: now().toISOString(),
      });

      if (!reserved.ok) {
        // Persistence unavailable ⇒ fail closed (zero provider calls).
        return divBrainFailureFromCode("persistence_failed");
      }

      return divBrainSuccess(mapReserveResult(reserved.data));
    },

    async finalizeBudget(input) {
      if (!isNonEmptyId(input.reservationId, 64)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (!isPositiveSafeInt(input.accountedCostMicroUsd)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (!COST_SOURCES.has(input.costSource)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (!TERMINAL_STATUSES.has(input.terminalStatus)) {
        return divBrainFailureFromCode("invalid_request");
      }

      let messageId: string | null = null;
      if (input.messageId != null && input.messageId !== "") {
        const idResult = normalizeDivBrainResourceId(input.messageId);
        if (!idResult.ok) {
          return idResult;
        }
        messageId = idResult.data;
      }

      const inputTokens =
        input.inputTokens === undefined || input.inputTokens === null
          ? null
          : input.inputTokens;
      const outputTokens =
        input.outputTokens === undefined || input.outputTokens === null
          ? null
          : input.outputTokens;
      const totalTokens =
        input.totalTokens === undefined || input.totalTokens === null
          ? null
          : input.totalTokens;
      const latencyMs =
        input.latencyMs === undefined || input.latencyMs === null
          ? null
          : input.latencyMs;

      if (inputTokens !== null && !isNonNegativeInt(inputTokens)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (outputTokens !== null && !isNonNegativeInt(outputTokens)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (totalTokens !== null && !isNonNegativeInt(totalTokens)) {
        return divBrainFailureFromCode("invalid_request");
      }
      if (latencyMs !== null && !isNonNegativeInt(latencyMs)) {
        return divBrainFailureFromCode("invalid_request");
      }

      const finalizeInput: DivBrainFinalizeBudgetInput = {
        reservationId: input.reservationId.trim(),
        accountedCostMicroUsd: input.accountedCostMicroUsd,
        costSource: input.costSource,
        terminalStatus: input.terminalStatus,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs,
        messageId,
        nowIso: now().toISOString(),
      };

      const finalized = await params.port.finalizeBudget(finalizeInput);
      if (!finalized.ok) {
        // Reserved charge remains — do not treat as zero/unrecorded spend.
        return divBrainFailureFromCode("persistence_failed");
      }

      return divBrainSuccess({ reservationId: finalized.data.reservationId });
    },

    async sumReservedCostMicroUsdForUtcDay(at) {
      const range = divBrainUtcDayRange(at ?? now());
      const result = await params.port.sumReservedCostMicroUsd({
        fromInclusive: range.fromInclusive,
        toExclusive: range.toExclusive,
      });
      if (!result.ok) {
        return divBrainFailureFromCode("persistence_failed");
      }
      if (!Number.isSafeInteger(result.data) || result.data < 0) {
        return divBrainFailureFromCode("persistence_failed");
      }
      return divBrainSuccess(result.data);
    },

    async sumReservedCostMicroUsdForUtcMonth(at) {
      const range = divBrainUtcMonthRange(at ?? now());
      const result = await params.port.sumReservedCostMicroUsd({
        fromInclusive: range.fromInclusive,
        toExclusive: range.toExclusive,
      });
      if (!result.ok) {
        return divBrainFailureFromCode("persistence_failed");
      }
      if (!Number.isSafeInteger(result.data) || result.data < 0) {
        return divBrainFailureFromCode("persistence_failed");
      }
      return divBrainSuccess(result.data);
    },
  };
}
