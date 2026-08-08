/**
 * DivBrain usage ledger repository (Issue #103).
 *
 * Server-owned inserts + bounded day/month cost aggregates.
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
  DivBrainUsageCostSource,
  DivBrainUsageEventInsert,
  DivBrainUsageLedgerPort,
  DivBrainUsageTerminalStatus,
} from "./usage-ledger-persistence";

export type DivBrainUsageLedgerUtcRange = {
  readonly fromInclusive: string;
  readonly toExclusive: string;
};

export type RecordDivBrainUsageEventParams = {
  actorId: string;
  conversationId?: string | null;
  messageId?: string | null;
  providerId: string;
  modelId: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  costMicroUsd: number;
  costSource: DivBrainUsageCostSource;
  latencyMs?: number | null;
  terminalStatus: DivBrainUsageTerminalStatus;
};

export type DivBrainUsageLedgerRepository = {
  recordEvent(
    params: RecordDivBrainUsageEventParams,
  ): Promise<DivBrainResult<{ id: string }>>;
  sumCostMicroUsdForUtcDay(
    now?: Date,
  ): Promise<DivBrainResult<number>>;
  sumCostMicroUsdForUtcMonth(
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

function validateRecordParams(
  params: RecordDivBrainUsageEventParams,
): DivBrainResult<DivBrainUsageEventInsert> {
  const actorResult = normalizeDivBrainActorId(params.actorId);
  if (!actorResult.ok) {
    return actorResult;
  }

  if (!isNonEmptyId(params.providerId, 64)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!isNonEmptyId(params.modelId, 192)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!isPositiveSafeInt(params.costMicroUsd)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!COST_SOURCES.has(params.costSource)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!TERMINAL_STATUSES.has(params.terminalStatus)) {
    return divBrainFailureFromCode("invalid_request");
  }

  let conversationId: string | null = null;
  if (params.conversationId != null && params.conversationId !== "") {
    const idResult = normalizeDivBrainResourceId(params.conversationId);
    if (!idResult.ok) {
      return idResult;
    }
    conversationId = idResult.data;
  }

  let messageId: string | null = null;
  if (params.messageId != null && params.messageId !== "") {
    const idResult = normalizeDivBrainResourceId(params.messageId);
    if (!idResult.ok) {
      return idResult;
    }
    messageId = idResult.data;
  }

  const inputTokens =
    params.inputTokens === undefined || params.inputTokens === null
      ? null
      : params.inputTokens;
  const outputTokens =
    params.outputTokens === undefined || params.outputTokens === null
      ? null
      : params.outputTokens;
  const totalTokens =
    params.totalTokens === undefined || params.totalTokens === null
      ? null
      : params.totalTokens;
  const latencyMs =
    params.latencyMs === undefined || params.latencyMs === null
      ? null
      : params.latencyMs;

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

  return divBrainSuccess({
    user_id: actorResult.data,
    conversation_id: conversationId,
    message_id: messageId,
    provider_id: params.providerId.trim(),
    model_id: params.modelId.trim(),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    cost_micro_usd: params.costMicroUsd,
    cost_source: params.costSource,
    latency_ms: latencyMs,
    terminal_status: params.terminalStatus,
  });
}

/**
 * Create a usage-ledger repository over a narrow persistence port.
 * Aggregates use server-side SUM — never unbounded history fetch.
 */
export function createDivBrainUsageLedgerRepository(params: {
  port: DivBrainUsageLedgerPort;
  now?: () => Date;
}): DivBrainUsageLedgerRepository {
  const now = params.now ?? (() => new Date());

  return {
    async recordEvent(input) {
      const validated = validateRecordParams(input);
      if (!validated.ok) {
        return validated;
      }

      const inserted = await params.port.insertUsageEvent(validated.data);
      if (!inserted.ok) {
        return divBrainFailureFromCode("persistence_failed");
      }

      return divBrainSuccess({ id: inserted.data.id });
    },

    async sumCostMicroUsdForUtcDay(at) {
      const range = divBrainUtcDayRange(at ?? now());
      const result = await params.port.sumCostMicroUsd({
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

    async sumCostMicroUsdForUtcMonth(at) {
      const range = divBrainUtcMonthRange(at ?? now());
      const result = await params.port.sumCostMicroUsd({
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
