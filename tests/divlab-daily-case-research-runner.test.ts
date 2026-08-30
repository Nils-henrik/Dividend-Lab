import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runDailyCaseDeepResearchDispatch,
} from "../lib/analysis/daily-case-research-runner";
import type {
  DailyCaseDeepResearchDispatchPlan,
  DailyCaseDeepResearchJob,
} from "../lib/analysis/daily-case-research-dispatch";

function job(index: number): DailyCaseDeepResearchJob {
  return {
    ordinal: index,
    jobKey: `run-1:${index}:CASE${index}@ST`,
    selectionDate: "2026-08-15",
    runKey: "run-1",
    asOf: "2026-08-15T01:00:00.000Z",
    symbol: `CASE${index}`,
    exchange: "ST",
    name: `Case ${index} AB`,
    selectionScore: 0.9 - index * 0.01,
    primaryDriver: "freshReport",
    sourceIds: [`report:case${index}`],
  };
}

function plan(count: number): DailyCaseDeepResearchDispatchPlan {
  const jobs = Array.from({ length: count }, (_, index) => job(index + 1));
  return {
    version: "daily-case-research-dispatch-v1",
    selectionDate: "2026-08-15",
    runKey: "run-1",
    asOf: "2026-08-15T01:00:00.000Z",
    jobs,
    stats: {
      selected: jobs.length,
      jobs: jobs.length,
    },
  };
}

describe("DivLab Daily Case heavy-research runner", () => {
  it("executes every approved job exactly once and preserves dispatch order", async () => {
    const calls: string[] = [];
    const result = await runDailyCaseDeepResearchDispatch({
      plan: plan(4),
      maxConcurrency: 2,
      executor: async (item) => {
        calls.push(item.jobKey);
        await new Promise((resolve) => setTimeout(resolve, item.ordinal % 2 === 0 ? 1 : 4));
        return { symbol: item.symbol };
      },
    });

    assert.equal(calls.length, 4);
    assert.equal(new Set(calls).size, 4);
    assert.deepEqual(
      result.results.map((item) => item.job.jobKey),
      plan(4).jobs.map((item) => item.jobKey),
    );
    assert.deepEqual(
      result.results.map((item) => item.result.symbol),
      ["CASE1", "CASE2", "CASE3", "CASE4"],
    );
    assert.equal(result.stats.jobs, 4);
    assert.equal(result.stats.completed, 4);
  });

  it("uses one concurrent heavy job by default", async () => {
    let active = 0;
    let maxActive = 0;
    await runDailyCaseDeepResearchDispatch({
      plan: plan(3),
      executor: async (item) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 3));
        active -= 1;
        return item.symbol;
      },
    });
    assert.equal(maxActive, 1);
  });

  it("never allows more than two concurrent heavy jobs", async () => {
    await assert.rejects(
      () =>
        runDailyCaseDeepResearchDispatch({
          plan: plan(1),
          maxConcurrency: 3,
          executor: async () => "unused",
        }),
      /daily_case_dispatch_concurrency_invalid/,
    );
  });

  it("does not silently downgrade an unexpected executor exception", async () => {
    await assert.rejects(
      () =>
        runDailyCaseDeepResearchDispatch({
          plan: plan(2),
          executor: async (item) => {
            if (item.ordinal === 2) throw new Error("unexpected_code_defect");
            return item.symbol;
          },
        }),
      /unexpected_code_defect/,
    );
  });

  it("rejects a tampered plan whose job count disagrees with its stats", async () => {
    const tampered = plan(2);
    tampered.stats.jobs = 1;
    await assert.rejects(
      () =>
        runDailyCaseDeepResearchDispatch({
          plan: tampered,
          executor: async (item) => item.symbol,
        }),
      /daily_case_research_execution_job_count_mismatch/,
    );
  });
});
