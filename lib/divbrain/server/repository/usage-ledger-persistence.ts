/**
 * Narrow persistence port for DivBrain usage ledger (Issue #105 / #103).
 *
 * Production adapter uses service_role PostgREST + atomic reserve/finalize RPCs.
 * Unit tests inject in-memory fakes — no remote network.
 *
 * This module must never be imported by client components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { classifyPostgrestFailure } from "./postgrest-failure";
import type {
  DivBrainPersistenceError,
  DivBrainPersistenceResult,
} from "./persistence";

export const DIVBRAIN_USAGE_COST_SOURCES = [
  "gateway_actual",
  "conservative_estimate",
  "fail_closed_ceiling",
] as const;

export type DivBrainUsageCostSource =
  (typeof DIVBRAIN_USAGE_COST_SOURCES)[number];

export const DIVBRAIN_USAGE_TERMINAL_STATUSES = [
  "completed",
  "failed",
  "cancelled",
  "provider_unavailable",
] as const;

export type DivBrainUsageTerminalStatus =
  (typeof DIVBRAIN_USAGE_TERMINAL_STATUSES)[number];

export const DIVBRAIN_USAGE_EVENT_STATUSES = ["reserved", "finalized"] as const;

export type DivBrainUsageEventStatus =
  (typeof DIVBRAIN_USAGE_EVENT_STATUSES)[number];

export type DivBrainUsageEventRow = {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  provider_id: string;
  model_id: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  reserved_cost_micro_usd: number;
  accounted_cost_micro_usd: number | null;
  cost_source: DivBrainUsageCostSource | null;
  latency_ms: number | null;
  terminal_status: DivBrainUsageTerminalStatus | null;
  status: DivBrainUsageEventStatus;
  created_at: string;
  finalized_at: string | null;
};

export type DivBrainUsageSumQuery = {
  fromInclusive: string;
  toExclusive: string;
};

export type DivBrainReserveBudgetInput = {
  userId: string;
  conversationId: string | null;
  providerId: string;
  modelId: string;
  projectedCostMicroUsd: number;
  maxRequestMicroUsd: number;
  dailyHardLimitMicroUsd: number;
  monthlyTargetMicroUsd: number;
  monthlyWarningMicroUsd: number;
  monthlyHardLimitMicroUsd: number;
  nowIso: string;
};

export type DivBrainReserveBudgetOk = {
  ok: true;
  reservationId: string;
  monthlyLevel: "under_target" | "warning" | "above_warning";
};

export type DivBrainReserveBudgetDenialReason =
  | "config_invalid"
  | "request_projected_over_limit"
  | "daily_hard_limit"
  | "monthly_hard_limit"
  | "aggregate_unavailable";

export type DivBrainReserveBudgetDenied = {
  ok: false;
  reason: DivBrainReserveBudgetDenialReason;
};

export type DivBrainReserveBudgetResult =
  | DivBrainReserveBudgetOk
  | DivBrainReserveBudgetDenied;

export type DivBrainFinalizeBudgetInput = {
  reservationId: string;
  accountedCostMicroUsd: number;
  costSource: DivBrainUsageCostSource;
  terminalStatus: DivBrainUsageTerminalStatus;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latencyMs: number | null;
  messageId: string | null;
  nowIso: string;
};

export type DivBrainUsageLedgerPort = {
  /**
   * Atomic check+reserve. Must be the only admission path before generate.
   * Never fetches unbounded history into app memory.
   */
  reserveBudget(
    input: DivBrainReserveBudgetInput,
  ): Promise<DivBrainPersistenceResult<DivBrainReserveBudgetResult>>;
  finalizeBudget(
    input: DivBrainFinalizeBudgetInput,
  ): Promise<DivBrainPersistenceResult<{ reservationId: string }>>;
  sumReservedCostMicroUsd(
    query: DivBrainUsageSumQuery,
  ): Promise<DivBrainPersistenceResult<number>>;
};

function failed(
  kind: DivBrainPersistenceError["kind"],
): DivBrainPersistenceResult<never> {
  return { ok: false, error: { kind } };
}

function mapPostgrestError(error: {
  message?: string;
  code?: string;
} | null): DivBrainPersistenceResult<never> {
  return failed(classifyPostgrestFailure(error));
}

const RESERVE_DENIAL_REASONS = new Set<string>([
  "config_invalid",
  "request_projected_over_limit",
  "daily_hard_limit",
  "monthly_hard_limit",
  "aggregate_unavailable",
]);

function parseReserveRpcPayload(
  data: unknown,
): DivBrainReserveBudgetResult | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  if (record.ok === true) {
    const reservationId = record.reservation_id;
    const monthlyLevel = record.monthly_level;
    if (
      typeof reservationId !== "string" ||
      reservationId.trim().length === 0 ||
      (monthlyLevel !== "under_target" &&
        monthlyLevel !== "warning" &&
        monthlyLevel !== "above_warning")
    ) {
      return null;
    }
    return {
      ok: true,
      reservationId,
      monthlyLevel,
    };
  }

  if (record.ok === false) {
    const reason = record.reason;
    if (typeof reason !== "string" || !RESERVE_DENIAL_REASONS.has(reason)) {
      return null;
    }
    return {
      ok: false,
      reason: reason as DivBrainReserveBudgetDenialReason,
    };
  }

  return null;
}

function parseFinalizeRpcPayload(
  data: unknown,
): { reservationId: string } | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (record.ok !== true) {
    return null;
  }
  const reservationId = record.reservation_id;
  if (typeof reservationId !== "string" || reservationId.trim().length === 0) {
    return null;
  }
  return { reservationId };
}

function parseNonNegativeSafeInt(data: unknown): number | null {
  if (typeof data === "number" && Number.isSafeInteger(data) && data >= 0) {
    return data;
  }
  if (typeof data === "string" && /^\d+$/.test(data)) {
    const parsed = Number.parseInt(data, 10);
    if (Number.isSafeInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

/**
 * Supabase/PostgREST adapter for the usage ledger.
 * Mutations only via atomic RPCs; aggregates via SQL SUM RPC.
 */
export function createSupabaseDivBrainUsageLedgerPort(
  client: SupabaseClient,
): DivBrainUsageLedgerPort {
  return {
    async reserveBudget(input) {
      const { data, error } = await client.rpc("divbrain_reserve_usage_budget", {
        p_user_id: input.userId,
        p_conversation_id: input.conversationId,
        p_provider_id: input.providerId,
        p_model_id: input.modelId,
        p_projected_cost_micro_usd: input.projectedCostMicroUsd,
        p_max_request_micro_usd: input.maxRequestMicroUsd,
        p_daily_hard_limit_micro_usd: input.dailyHardLimitMicroUsd,
        p_monthly_target_micro_usd: input.monthlyTargetMicroUsd,
        p_monthly_warning_micro_usd: input.monthlyWarningMicroUsd,
        p_monthly_hard_limit_micro_usd: input.monthlyHardLimitMicroUsd,
        p_now: input.nowIso,
      });

      if (error) {
        return mapPostgrestError(error);
      }

      const parsed = parseReserveRpcPayload(data);
      if (parsed === null) {
        return failed("malformed_response");
      }
      return { ok: true, data: parsed };
    },

    async finalizeBudget(input) {
      const { data, error } = await client.rpc(
        "divbrain_finalize_usage_budget",
        {
          p_reservation_id: input.reservationId,
          p_accounted_cost_micro_usd: input.accountedCostMicroUsd,
          p_cost_source: input.costSource,
          p_terminal_status: input.terminalStatus,
          p_input_tokens: input.inputTokens,
          p_output_tokens: input.outputTokens,
          p_total_tokens: input.totalTokens,
          p_latency_ms: input.latencyMs,
          p_message_id: input.messageId,
          p_now: input.nowIso,
        },
      );

      if (error) {
        return mapPostgrestError(error);
      }

      const parsed = parseFinalizeRpcPayload(data);
      if (parsed === null) {
        return failed("malformed_response");
      }
      return { ok: true, data: parsed };
    },

    async sumReservedCostMicroUsd(query) {
      const { data, error } = await client.rpc(
        "divbrain_usage_reserved_cost_sum_micro_usd",
        {
          p_from: query.fromInclusive,
          p_to: query.toExclusive,
        },
      );

      if (error) {
        return mapPostgrestError(error);
      }

      const parsed = parseNonNegativeSafeInt(data);
      if (parsed === null) {
        return failed("malformed_response");
      }
      return { ok: true, data: parsed };
    },
  };
}
