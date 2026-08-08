import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { createInMemoryDivBrainUsageLedgerPort } from "./usage-ledger-memory";
import type { DivBrainUsageEventRow } from "./usage-ledger-persistence";
import { createDivBrainUsageLedgerRepository } from "./usage-ledger";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const CONVERSATION = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NOW = new Date("2026-08-08T12:00:00.000Z");

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../../../supabase/migrations");

describe("DivBrain usage reconciliation hard-limit accounting", () => {
  it("raises hard-limit reservation when reconciled actual cost is higher", async () => {
    const state: { events: DivBrainUsageEventRow[] } = { events: [] };
    const ledger = createDivBrainUsageLedgerRepository({
      port: createInMemoryDivBrainUsageLedgerPort(state),
      now: () => NOW,
    });

    const first = await ledger.reserveBudget({
      actorId: ACTOR,
      conversationId: CONVERSATION,
      providerId: "ai-gateway",
      modelId: "openai/gpt-5.6-luna",
      projectedCostMicroUsd: 100,
      maxRequestMicroUsd: 100,
      dailyHardLimitMicroUsd: 250,
      monthlyTargetMicroUsd: 250,
      monthlyWarningMicroUsd: 250,
      monthlyHardLimitMicroUsd: 250,
    });

    assert.equal(first.ok, true);
    if (!first.ok || !first.data.admitted) {
      throw new Error("expected first reservation to be admitted");
    }

    const finalized = await ledger.finalizeBudget({
      reservationId: first.data.reservationId,
      accountedCostMicroUsd: 200,
      costSource: "gateway_actual",
      terminalStatus: "completed",
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
    });
    assert.equal(finalized.ok, true);

    assert.equal(state.events.length, 1);
    assert.equal(state.events[0]?.reserved_cost_micro_usd, 200);
    assert.equal(state.events[0]?.accounted_cost_micro_usd, 200);

    const daySum = await ledger.sumReservedCostMicroUsdForUtcDay();
    assert.equal(daySum.ok, true);
    if (daySum.ok) {
      assert.equal(daySum.data, 200);
    }

    const second = await ledger.reserveBudget({
      actorId: ACTOR,
      conversationId: CONVERSATION,
      providerId: "ai-gateway",
      modelId: "openai/gpt-5.6-luna",
      projectedCostMicroUsd: 100,
      maxRequestMicroUsd: 100,
      dailyHardLimitMicroUsd: 250,
      monthlyTargetMicroUsd: 250,
      monthlyWarningMicroUsd: 250,
      monthlyHardLimitMicroUsd: 250,
    });

    assert.equal(second.ok, true);
    if (second.ok) {
      assert.equal(second.data.admitted, false);
      if (!second.data.admitted) {
        assert.equal(second.data.reason, "daily_hard_limit");
      }
    }
  });

  it("migration serializes finalize with reserve and raises reserved cost via greatest", () => {
    const migrationName = readdirSync(migrationsDir).find((name) =>
      name.includes("create_divbrain_usage_ledger"),
    );
    assert.ok(migrationName);

    const sql = readFileSync(join(migrationsDir, migrationName!), "utf8")
      .replace(/--[^\n]*/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    const finalizeStart = sql.indexOf(
      "create or replace function public.divbrain_finalize_usage_budget",
    );
    assert.ok(finalizeStart >= 0);
    const finalizeSql = sql.slice(finalizeStart);

    assert.match(
      finalizeSql,
      /pg_advisory_xact_lock\s*\(\s*hashtext\s*\(\s*'divbrain_usage_budget_v1'\s*\)\s*\)/,
    );
    assert.match(
      finalizeSql,
      /reserved_cost_micro_usd\s*=\s*greatest\s*\(\s*reserved_cost_micro_usd\s*,\s*p_accounted_cost_micro_usd\s*\)/,
    );
  });
});
