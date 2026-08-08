/**
 * In-memory DivBrain usage ledger port for deterministic unit tests.
 * Simulates atomic reserve/finalize with a serialized admission queue.
 * Never used in production wiring.
 */

import type {
  DivBrainFinalizeBudgetInput,
  DivBrainReserveBudgetInput,
  DivBrainReserveBudgetResult,
  DivBrainUsageEventRow,
  DivBrainUsageLedgerPort,
  DivBrainUsageSumQuery,
} from "./usage-ledger-persistence";

export type InMemoryDivBrainUsageLedgerState = {
  events: DivBrainUsageEventRow[];
  /** When true, reserveBudget fails closed (persistence unavailable). */
  reserveUnavailable?: boolean;
  /** When true, finalizeBudget fails closed. */
  finalizeUnavailable?: boolean;
  /** When true, sumReservedCostMicroUsd fails closed. */
  sumUnavailable?: boolean;
};

function sumReserved(
  events: readonly DivBrainUsageEventRow[],
  query: DivBrainUsageSumQuery,
): number {
  let sum = 0;
  for (const event of events) {
    if (
      (event.status === "reserved" || event.status === "finalized") &&
      event.created_at >= query.fromInclusive &&
      event.created_at < query.toExclusive
    ) {
      sum += event.reserved_cost_micro_usd;
    }
  }
  return sum;
}

function utcDayRange(nowIso: string): DivBrainUsageSumQuery {
  const now = new Date(nowIso);
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

function utcMonthRange(nowIso: string): DivBrainUsageSumQuery {
  const now = new Date(nowIso);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return {
    fromInclusive: from.toISOString(),
    toExclusive: to.toISOString(),
  };
}

/**
 * Simulate user/conversation/message deletion privacy lifecycle for tests.
 * Must never remove usage rows or reduce reserved aggregates.
 */
export function anonymizeInMemoryDivBrainUsageActor(
  state: InMemoryDivBrainUsageLedgerState,
  userId: string,
): void {
  for (const event of state.events) {
    if (event.user_id === userId) {
      event.user_id = null;
    }
  }
}

export function clearInMemoryDivBrainUsageConversationLink(
  state: InMemoryDivBrainUsageLedgerState,
  conversationId: string,
): void {
  for (const event of state.events) {
    if (event.conversation_id === conversationId) {
      event.conversation_id = null;
    }
  }
}

export function clearInMemoryDivBrainUsageMessageLink(
  state: InMemoryDivBrainUsageLedgerState,
  messageId: string,
): void {
  for (const event of state.events) {
    if (event.message_id === messageId) {
      event.message_id = null;
    }
  }
}

export function createInMemoryDivBrainUsageLedgerPort(
  state: InMemoryDivBrainUsageLedgerState = { events: [] },
): DivBrainUsageLedgerPort {
  let seq = 0;
  /** Serialize reserves to mirror DB advisory-lock admission. */
  let admissionChain: Promise<void> = Promise.resolve();

  const runExclusive = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    const previous = admissionChain;
    let release!: () => void;
    admissionChain = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  };

  return {
    async reserveBudget(input: DivBrainReserveBudgetInput) {
      return runExclusive(() => {
        if (state.reserveUnavailable) {
          return { ok: false, error: { kind: "unavailable" as const } };
        }

        if (
          input.projectedCostMicroUsd <= 0 ||
          input.maxRequestMicroUsd <= 0 ||
          input.dailyHardLimitMicroUsd <= 0 ||
          input.monthlyHardLimitMicroUsd <= 0 ||
          input.maxRequestMicroUsd > input.dailyHardLimitMicroUsd ||
          input.dailyHardLimitMicroUsd > input.monthlyHardLimitMicroUsd ||
          input.monthlyTargetMicroUsd > input.monthlyWarningMicroUsd ||
          input.monthlyWarningMicroUsd > input.monthlyHardLimitMicroUsd
        ) {
          const denied: DivBrainReserveBudgetResult = {
            ok: false,
            reason: "config_invalid",
          };
          return { ok: true, data: denied };
        }

        if (input.projectedCostMicroUsd > input.maxRequestMicroUsd) {
          return {
            ok: true,
            data: {
              ok: false,
              reason: "request_projected_over_limit",
            } satisfies DivBrainReserveBudgetResult,
          };
        }

        const daySum = sumReserved(state.events, utcDayRange(input.nowIso));
        if (daySum + input.projectedCostMicroUsd > input.dailyHardLimitMicroUsd) {
          return {
            ok: true,
            data: {
              ok: false,
              reason: "daily_hard_limit",
            } satisfies DivBrainReserveBudgetResult,
          };
        }

        const monthSum = sumReserved(state.events, utcMonthRange(input.nowIso));
        if (
          monthSum + input.projectedCostMicroUsd >
          input.monthlyHardLimitMicroUsd
        ) {
          return {
            ok: true,
            data: {
              ok: false,
              reason: "monthly_hard_limit",
            } satisfies DivBrainReserveBudgetResult,
          };
        }

        let monthlyLevel: "under_target" | "warning" | "above_warning" =
          "under_target";
        if (monthSum >= input.monthlyWarningMicroUsd) {
          monthlyLevel = "above_warning";
        } else if (monthSum >= input.monthlyTargetMicroUsd) {
          monthlyLevel = "warning";
        }

        seq += 1;
        const id = `dddddddd-dddd-4ddd-8ddd-${String(seq).padStart(12, "0")}`;
        const row: DivBrainUsageEventRow = {
          id,
          user_id: input.userId,
          conversation_id: input.conversationId,
          message_id: null,
          provider_id: input.providerId,
          model_id: input.modelId,
          input_tokens: null,
          output_tokens: null,
          total_tokens: null,
          reserved_cost_micro_usd: input.projectedCostMicroUsd,
          accounted_cost_micro_usd: null,
          cost_source: null,
          latency_ms: null,
          terminal_status: null,
          status: "reserved",
          created_at: input.nowIso,
          finalized_at: null,
        };
        state.events.push(row);

        return {
          ok: true,
          data: {
            ok: true,
            reservationId: id,
            monthlyLevel,
          } satisfies DivBrainReserveBudgetResult,
        };
      });
    },

    async finalizeBudget(input: DivBrainFinalizeBudgetInput) {
      if (state.finalizeUnavailable) {
        return { ok: false, error: { kind: "unavailable" as const } };
      }

      const row = state.events.find((event) => event.id === input.reservationId);
      if (!row) {
        return { ok: false, error: { kind: "not_found" as const } };
      }

      if (row.status === "finalized") {
        return { ok: true, data: { reservationId: row.id } };
      }

      if (row.status !== "reserved") {
        return { ok: false, error: { kind: "query_failed" as const } };
      }

      row.accounted_cost_micro_usd = input.accountedCostMicroUsd;
      row.cost_source = input.costSource;
      row.terminal_status = input.terminalStatus;
      row.input_tokens = input.inputTokens;
      row.output_tokens = input.outputTokens;
      row.total_tokens = input.totalTokens;
      row.latency_ms = input.latencyMs;
      if (input.messageId !== null) {
        row.message_id = input.messageId;
      }
      row.status = "finalized";
      row.finalized_at = input.nowIso;

      return { ok: true, data: { reservationId: row.id } };
    },

    async sumReservedCostMicroUsd(query: DivBrainUsageSumQuery) {
      if (state.sumUnavailable) {
        return { ok: false, error: { kind: "unavailable" as const } };
      }
      return { ok: true, data: sumReserved(state.events, query) };
    },
  };
}
