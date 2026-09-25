import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { isAuthorizedCompanyIngestionCron } from "@/lib/companies/ingestion/cron-auth";
import { createJobDeadline } from "@/lib/companies/ingestion/deadline";
import { enqueueStaleCompanyBaselineRefreshes } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionQueueClient } from "@/lib/companies/ingestion/queue";
import {
  BASELINE_ENQUEUE_LIMIT,
  BASELINE_STALE_AFTER,
  COMPANY_INGESTION_BATCH_LIMIT,
  COMPANY_INGESTION_CRON_SCHEDULE,
  COMPANY_INGESTION_MIN_JOB_SLICE_MS,
  COMPANY_INGESTION_ROUTE_BUDGET_MS,
  companyIngestionRouteFitsPlatformLimit,
  drainCompanyIngestionJobs,
  isVercelHobbyDailyCron,
} from "@/lib/companies/ingestion/schedule";

describe("company ingestion cron", () => {
  it("failar stängt utan exakt bearer-hemlighet", () => {
    assert.equal(isAuthorizedCompanyIngestionCron(null, undefined), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer secret", undefined), false);
    assert.equal(isAuthorizedCompanyIngestionCron("secret", "secret"), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer wrong", "secret"), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer secret", "secret"), true);
  });

  it("håller workern server-only och svarar neutralt vid internfel", () => {
    const route = readFileSync(
      new URL(
        "../app/api/internal/company-ingestion/run/route.ts",
        import.meta.url,
      ),
      "utf8",
    );

    assert.match(route, /process\.env\.CRON_SECRET/);
    assert.match(route, /runCompanyIngestionBatch/);
    assert.match(route, /maxDuration = 60/);
    assert.doesNotMatch(route, /runNextCompanyIngestionJob/);
    assert.match(route, /status: 401/);
    assert.match(route, /status === "recovery_error"/);
    assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("registrerar en Vercel Hobby-cron som bara körs en gång per dag", () => {
    const config = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    ) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    assert.deepEqual(config.crons, [
      {
        path: "/api/internal/company-ingestion/run",
        schedule: COMPANY_INGESTION_CRON_SCHEDULE,
      },
    ]);
    assert.equal(COMPANY_INGESTION_CRON_SCHEDULE, "17 3 * * *");
    assert.equal(isVercelHobbyDailyCron(COMPANY_INGESTION_CRON_SCHEDULE), true);
    assert.equal(isVercelHobbyDailyCron("17 */6 * * *"), false);
    assert.equal(isVercelHobbyDailyCron("17 3,15 * * *"), false);
    assert.equal(isVercelHobbyDailyCron("*/15 3 * * *"), false);
    assert.equal(isVercelHobbyDailyCron("17 3-5 * * *"), false);
    assert.equal(companyIngestionRouteFitsPlatformLimit(), true);
    assert.equal(COMPANY_INGESTION_ROUTE_BUDGET_MS, 45_000);
    assert.ok(COMPANY_INGESTION_ROUTE_BUDGET_MS < 60_000);
    assert.equal(COMPANY_INGESTION_BATCH_LIMIT, 8);
    assert.equal(BASELINE_ENQUEUE_LIMIT, 8);
    assert.equal(BASELINE_STALE_AFTER, "20 hours");
    assert.equal(COMPANY_INGESTION_MIN_JOB_SLICE_MS, 12_000);
  });

  it("enqueuear dagens batch med 20 timmars stale-gräns", async () => {
    let args: Record<string, unknown> | undefined;
    const client = {
      async rpc(_name: string, payload: Record<string, unknown>) {
        args = payload;
        return { data: 8, error: null };
      },
    } as unknown as CompanyIngestionQueueClient;

    const enqueued = await enqueueStaleCompanyBaselineRefreshes(client);
    assert.deepEqual(enqueued, { status: "enqueued", count: 8 });
    assert.equal(args?.p_limit, 8);
    assert.equal(args?.p_stale_after, "20 hours");
    assert.equal(Array.isArray(args?.p_supported_company_slugs), true);
    assert.equal((args?.p_supported_company_slugs as string[]).length, 17);
  });

  it("kör flera jobb i samma anrop och stannar innan plattformsgränsen", async () => {
    let now = 0;
    const claims: number[] = [];
    const budgets: number[] = [];
    const drained = await drainCompanyIngestionJobs({
      clock: () => now,
      budgetMs: COMPANY_INGESTION_ROUTE_BUDGET_MS,
      batchLimit: COMPANY_INGESTION_BATCH_LIMIT,
      minJobSliceMs: COMPANY_INGESTION_MIN_JOB_SLICE_MS,
      claim: async () => {
        claims.push(now);
        return { status: "claimed" as const, job: { id: String(claims.length) } };
      },
      run: async (job, budgetMs) => {
        budgets.push(budgetMs);
        now += 10_000;
        return job.id;
      },
    });

    assert.deepEqual(drained.jobs, ["1", "2", "3", "4"]);
    assert.equal(drained.stoppedReason, "route_budget");
    assert.equal(claims.length, 4);
    assert.ok(budgets.every((budget) => budget <= COMPANY_INGESTION_ROUTE_BUDGET_MS));
    assert.ok(budgets[0] === 45_000);
    assert.ok(budgets[3] >= COMPANY_INGESTION_MIN_JOB_SLICE_MS);
    assert.ok(budgets[3] < 60_000);
  });

  it("stannar vid batchgränsen även när tid finns kvar", async () => {
    let claims = 0;
    const drained = await drainCompanyIngestionJobs({
      clock: () => 0,
      budgetMs: 45_000,
      batchLimit: 3,
      minJobSliceMs: 12_000,
      claim: async () => {
        claims += 1;
        return { status: "claimed" as const, job: claims };
      },
      run: async (job) => job,
    });

    assert.deepEqual(drained.jobs, [1, 2, 3]);
    assert.equal(drained.stoppedReason, "batch_limit");
    assert.equal(claims, 3);
  });

  it("claimar inte nästa jobb när den delade budgeten är slut", async () => {
    let now = 0;
    const deadline = createJobDeadline({ clock: () => now, budgetMs: 45_000 });
    now = 40_000;
    let claims = 0;
    const drained = await drainCompanyIngestionJobs({
      deadline,
      claim: async () => {
        claims += 1;
        return { status: "claimed" as const, job: claims };
      },
      run: async (job) => job,
    });

    assert.deepEqual(drained.jobs, []);
    assert.equal(drained.stoppedReason, "route_budget");
    assert.equal(claims, 0);
    let elapsed = 0;
    const lateSlice = createJobDeadline({ clock: () => elapsed, budgetMs: 12_000 });
    elapsed = 8_000;
    assert.equal(lateSlice.requestTimeoutMs(10_000), null);
  });

  it("slutar när kön är tom eller claim misslyckas", async () => {
    const empty = await drainCompanyIngestionJobs({
      clock: () => 0,
      claim: async () => ({ status: "empty" as const }),
      run: async () => "ran",
    });
    assert.deepEqual(empty, { jobs: [], stoppedReason: "queue_empty" });

    let ran = 0;
    const failed = await drainCompanyIngestionJobs({
      clock: () => 0,
      claim: async () => ({ status: "error" as const }),
      run: async () => {
        ran += 1;
        return "ran";
      },
    });
    assert.deepEqual(failed, { jobs: [], stoppedReason: "claim_error" });
    assert.equal(ran, 0);
  });
});
