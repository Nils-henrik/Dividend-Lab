/**
 * Narrow persistence port for DivBrain usage ledger (Issue #103).
 *
 * Production adapter uses service_role PostgREST + SQL aggregate RPC.
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

export type DivBrainUsageEventInsert = {
  user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  provider_id: string;
  model_id: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_micro_usd: number;
  cost_source: DivBrainUsageCostSource;
  latency_ms: number | null;
  terminal_status: DivBrainUsageTerminalStatus;
};

export type DivBrainUsageEventRow = DivBrainUsageEventInsert & {
  id: string;
  created_at: string;
};

export type DivBrainUsageSumQuery = {
  fromInclusive: string;
  toExclusive: string;
};

export type DivBrainUsageLedgerPort = {
  insertUsageEvent(
    input: DivBrainUsageEventInsert,
  ): Promise<DivBrainPersistenceResult<{ id: string }>>;
  sumCostMicroUsd(
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

/**
 * Supabase/PostgREST adapter for the usage ledger.
 * Uses SELECT/INSERT only; aggregates via SQL RPC (no unbounded row fetch).
 */
export function createSupabaseDivBrainUsageLedgerPort(
  client: SupabaseClient,
): DivBrainUsageLedgerPort {
  return {
    async insertUsageEvent(input) {
      const { data, error } = await client
        .from("divbrain_usage_events")
        .insert({
          user_id: input.user_id,
          conversation_id: input.conversation_id,
          message_id: input.message_id,
          provider_id: input.provider_id,
          model_id: input.model_id,
          input_tokens: input.input_tokens,
          output_tokens: input.output_tokens,
          total_tokens: input.total_tokens,
          cost_micro_usd: input.cost_micro_usd,
          cost_source: input.cost_source,
          latency_ms: input.latency_ms,
          terminal_status: input.terminal_status,
        })
        .select("id")
        .single();

      if (error) {
        return mapPostgrestError(error);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        typeof (data as { id?: unknown }).id !== "string"
      ) {
        return failed("malformed_response");
      }

      return { ok: true, data: { id: (data as { id: string }).id } };
    },

    async sumCostMicroUsd(query) {
      const { data, error } = await client.rpc(
        "divbrain_usage_cost_sum_micro_usd",
        {
          p_from: query.fromInclusive,
          p_to: query.toExclusive,
        },
      );

      if (error) {
        return mapPostgrestError(error);
      }

      if (typeof data === "number" && Number.isSafeInteger(data) && data >= 0) {
        return { ok: true, data };
      }

      if (typeof data === "string" && /^\d+$/.test(data)) {
        const parsed = Number.parseInt(data, 10);
        if (Number.isSafeInteger(parsed) && parsed >= 0) {
          return { ok: true, data: parsed };
        }
      }

      return failed("malformed_response");
    },
  };
}
