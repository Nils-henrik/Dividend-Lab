/**
 * In-memory DivBrain usage ledger port for deterministic unit tests.
 * Never used in production wiring.
 */

import type {
  DivBrainUsageEventInsert,
  DivBrainUsageEventRow,
  DivBrainUsageLedgerPort,
  DivBrainUsageSumQuery,
} from "./usage-ledger-persistence";

export type InMemoryDivBrainUsageLedgerState = {
  events: DivBrainUsageEventRow[];
};

export function createInMemoryDivBrainUsageLedgerPort(
  state: InMemoryDivBrainUsageLedgerState = { events: [] },
): DivBrainUsageLedgerPort {
  let seq = 0;

  return {
    async insertUsageEvent(input: DivBrainUsageEventInsert) {
      seq += 1;
      const id = `dddddddd-dddd-4ddd-8ddd-${String(seq).padStart(12, "0")}`;
      const row: DivBrainUsageEventRow = {
        ...input,
        id,
        created_at: new Date().toISOString(),
      };
      state.events.push(row);
      return { ok: true, data: { id } };
    },

    async sumCostMicroUsd(query: DivBrainUsageSumQuery) {
      let sum = 0;
      for (const event of state.events) {
        if (
          event.created_at >= query.fromInclusive &&
          event.created_at < query.toExclusive
        ) {
          sum += event.cost_micro_usd;
        }
      }
      return { ok: true, data: sum };
    },
  };
}
