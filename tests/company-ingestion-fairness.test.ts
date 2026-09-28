import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { classifySourceProgress, planBaselineRefresh } from "@/lib/companies/ingestion/baseline";
import { createJobDeadline } from "@/lib/companies/ingestion/deadline";
import { runCompanyIngestionJob } from "@/lib/companies/ingestion/run-job";
import {
  COMPANY_INGESTION_BATCH_LIMIT,
  COMPANY_INGESTION_ROUTE_BUDGET_MS,
  COMPANY_INGESTION_SOURCE_ATTEMPT_BUDGET_MS,
  COMPANY_INGESTION_SOURCE_CONTINUE_MIN_MS,
  companyIngestionRouteFitsPlatformLimit,
  drainCompanyIngestionJobs,
} from "@/lib/companies/ingestion/schedule";
import type { CompanyIngestionOrchestratorStore, OfficialCompanySource } from "@/lib/companies/ingestion/store";

const NOW = new Date("2026-09-28T03:17:00.000Z");
const JOB = {
  id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
  companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
  jobType: "baseline_refresh" as const,
  attempts: 1,
};

function source(type: OfficialCompanySource["sourceType"], url: string): OfficialCompanySource {
  return {
    id: `99970661-3c0b-4d3f-a0ce-cd03dd45f61${type.length % 10}`,
    sourceType: type,
    sourceUrl: url,
    publisher: "Publisher",
    lastCheckedAt: null,
    supportMode: "automated",
    lastSuccessAt: null,
    lastFailureReason: null,
  };
}

describe("company ingestion fairness", () => {
  it("classifies source progress without a new table", () => {
    assert.equal(classifySourceProgress({ supportMode: "automated", lastCheckedAt: null }), "never_checked");
    assert.equal(classifySourceProgress({
      supportMode: "automated",
      lastCheckedAt: null,
      lastFailureReason: "listing_http_status",
    }), "failed_retryable");
    assert.equal(classifySourceProgress({
      supportMode: "automated",
      lastCheckedAt: NOW.toISOString(),
      lastFailureReason: null,
    }), "succeeded");
    assert.equal(classifySourceProgress({ supportMode: "blocked", lastCheckedAt: null }), "blocked");
    assert.equal(classifySourceProgress({ supportMode: "source_link_only", lastCheckedAt: null }), "source_link_only");
  });

  it("gives never-checked companies the batch before a followed retry", () => {
    const neverChecked = Array.from({ length: 8 }, (_, index) => ({
      slug: `fresh-${index}`,
      followed: false,
      sources: [{ supportMode: "automated" as const, lastCheckedAt: null, lastFailureReason: null }],
    }));
    const planned = planBaselineRefresh({
      now: NOW,
      companies: [
        {
          slug: "ericsson",
          followed: true,
          sources: [{
            supportMode: "automated",
            lastCheckedAt: null,
            lastFailureReason: "listing_http_status",
          }],
        },
        ...neverChecked,
      ],
    });
    assert.equal(planned.length, COMPANY_INGESTION_BATCH_LIMIT);
    assert.equal(planned.includes("ericsson"), false);
    assert.equal(planned.length, 8);
  });

  it("does not let a deadline failure jump ahead of another retry the next day", () => {
    const stale = new Date(NOW.getTime() - 21 * 60 * 60 * 1000).toISOString();
    const planned = planBaselineRefresh({
      now: NOW,
      companies: [
        {
          slug: "atlas-copco",
          followed: true,
          sources: [{
            supportMode: "automated",
            lastCheckedAt: stale,
            lastFailureReason: "job_deadline_exceeded",
          }],
        },
        {
          slug: "eqt",
          followed: false,
          sources: [{
            supportMode: "automated",
            lastCheckedAt: stale,
            lastFailureReason: "listing_http_status",
          }],
        },
        {
          slug: "nibe",
          followed: false,
          sources: [{ supportMode: "automated", lastCheckedAt: null, lastFailureReason: null }],
        },
      ],
    });
    assert.deepEqual(planned, ["nibe", "eqt", "atlas-copco"]);
  });

  it("keeps the shared route budget, the batch of eight and a source slice", async () => {
    assert.equal(companyIngestionRouteFitsPlatformLimit(), true);
    assert.equal(COMPANY_INGESTION_ROUTE_BUDGET_MS, 45_000);
    assert.equal(COMPANY_INGESTION_BATCH_LIMIT, 8);
    assert.ok(COMPANY_INGESTION_SOURCE_ATTEMPT_BUDGET_MS < COMPANY_INGESTION_ROUTE_BUDGET_MS);
    assert.ok(COMPANY_INGESTION_SOURCE_CONTINUE_MIN_MS < COMPANY_INGESTION_SOURCE_ATTEMPT_BUDGET_MS);
    let claims = 0;
    const drained = await drainCompanyIngestionJobs({
      clock: () => 0,
      budgetMs: COMPANY_INGESTION_ROUTE_BUDGET_MS,
      batchLimit: COMPANY_INGESTION_BATCH_LIMIT,
      claim: async () => {
        claims += 1;
        return { status: "claimed", job: claims };
      },
      run: async (job) => job,
    });
    assert.equal(drained.jobs.length, 8);
    assert.equal(drained.stoppedReason, "batch_limit");
    const deadline = createJobDeadline({ budgetMs: COMPANY_INGESTION_ROUTE_BUDGET_MS });
    assert.equal(deadline.requestTimeoutMs(10_000), 10_000);
  });

  it("saves a successful category when another category fails and records the failure time", async () => {
    const failures: Array<{ checkedAt: string; reason: string }> = [];
    const checked: string[] = [];
    const press = "https://www.volvogroup.com/en/news-and-media.html";
    const reports = "https://www.volvogroup.com/en/investors/reports-and-presentations.html";
    const calendar = "https://www.volvogroup.com/en/investors/financial-calendar.html";
    const store = {
      async loadCompany() {
        return { status: "ok", company: { id: JOB.companyId, slug: "volvo" } };
      },
      async loadOfficialSources() {
        return {
          status: "ok",
          sources: [
            source("press_releases", press),
            source("financial_reports", reports),
            source("financial_calendar", calendar),
          ],
        };
      },
      async saveDocuments() {
        return true;
      },
      async saveFacts() {
        return true;
      },
      async replaceOwnership() {
        return true;
      },
      async markSourceChecked(sourceId) {
        checked.push(sourceId);
        return true;
      },
      async markSourceFailure(_sourceId, checkedAt, reason) {
        failures.push({ checkedAt, reason });
        return true;
      },
      async markSourceSupport() {
        return true;
      },
      async loadOfficialSource() {
        return { status: "error" };
      },
      async savePressReleases() {
        return false;
      },
      async completeJob() {
        return true;
      },
      async retryOrFailJob() {
        return true;
      },
    } as CompanyIngestionOrchestratorStore;
    const result = await runCompanyIngestionJob(JOB, {
      store,
      now: () => NOW,
      sleep: async () => undefined,
      fetchImpl: (async (input) => {
        const url = String(input);
        if (url === press) {
          return new Response("down", { status: 503, headers: { "content-type": "text/html" } });
        }
        if (url === reports) {
          return new Response(`<div data-nc-params-Teaser='{"analyticsData":{"title":"Volvo Group Second Quarter 2026"},"CTAURL":"/en/news-and-media/events/2026/jul/second-quarter-2026.html"}'></div>`, {
            headers: { "content-type": "text/html" },
          });
        }
        if (url.endsWith("second-quarter-2026.html")) {
          return new Response(`<div data-nc-params-eventinformation='{"startDate":"2026-07-17T07:20:00+02:00"}'></div><a href="/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf">Report</a>`, {
            headers: { "content-type": "text/html" },
          });
        }
        return new Response(`<div class="eventlist--upcoming"><li class="eventlist__item"><a href="https://www.volvogroup.com/en/news-and-media/events/2026/oct/third-quarter-2026.html"><time datetime="2026-10-23T05:20:00.000Z">October 23, 2026</time><span class="eventlist__titleLink">Third quarter 2026</span></a></li></div>`, {
          headers: { "content-type": "text/html" },
        });
      }) as typeof fetch,
    });
    assert.equal(result.status, "retry_scheduled");
    assert.match(result.status === "retry_scheduled" ? result.reason : "", /press_releases_/);
    assert.equal(failures[0]?.checkedAt, NOW.toISOString());
    assert.match(failures[0]?.reason ?? "", /http_status/);
    assert.equal(checked.length, 2);
  });

  it("mirrors first-pass priority in the fairness migration", () => {
    const migration = readFileSync(
      new URL("../supabase/migrations/20260928120000_company_ingestion_fairness.sql", import.meta.url),
      "utf8",
    );
    const store = readFileSync(
      new URL("../lib/companies/ingestion/store.ts", import.meta.url),
      "utf8",
    );
    assert.match(migration, /source\.last_checked_at is null\s+and source\.last_failure_reason is null/);
    assert.match(migration, /source\.last_failure_reason is not null/);
    assert.match(migration, /job\.last_error = 'job_deadline_exceeded'/);
    assert.match(migration, /least\(greatest\(coalesce\(p_limit, 8\), 1\), 8\)/);
    assert.match(migration, /interval '20 hours'/);
    assert.match(migration, /alertir|source_link_only/);
    assert.match(store, /async markSourceFailure\(sourceId, checkedAt, reason\)/);
    assert.match(store, /last_checked_at: checkedAt/);
    assert.doesNotMatch(migration, /grant insert|grant update|grant delete/);
  });
});
