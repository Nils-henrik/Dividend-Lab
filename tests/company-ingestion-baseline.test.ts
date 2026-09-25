import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { createJobDeadline, JOB_DEADLINE_EXCEEDED } from "@/lib/companies/ingestion/deadline";
import { claimCompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionQueueClient } from "@/lib/companies/ingestion/queue";

describe("baseline refresh migration", () => {
  it("keeps baseline jobs independent of follows, bounds the batch and preserves first-follow sync", () => {
    const migration = readFileSync(
      new URL("../supabase/migrations/20260925120000_company_official_data_parity.sql", import.meta.url),
      "utf8",
    );
    const original = readFileSync(
      new URL("../supabase/migrations/20260921190629_enqueue_company_ingestion_on_follow.sql", import.meta.url),
      "utf8",
    );
    assert.match(migration, /job_type = 'baseline_refresh'/);
    assert.match(migration, /least\(greatest\(coalesce\(p_limit, 2\), 1\), 3\)/);
    assert.match(migration, /support_mode = 'automated'/);
    assert.match(migration, /source\.last_checked_at is null/);
    assert.match(migration, /grant execute on function public\.enqueue_stale_company_baseline_refreshes\(text\[\], integer, interval\)\s+to service_role/);
    assert.match(migration, /revoke all on function public\.enqueue_stale_company_baseline_refreshes\(text\[\], integer, interval\)\s+from public, anon, authenticated/);
    assert.match(migration, /grant select on table public\.company_facts to anon, authenticated/);
    assert.match(migration, /grant all on table public\.company_facts to service_role/);
    assert.match(migration, /grant select on table public\.company_ownership to anon, authenticated/);
    assert.doesNotMatch(migration, /grant insert|grant update|grant delete/);
    assert.match(original, /create trigger company_follows_enqueue_initial_sync/);
    assert.match(original, /when attempts >= 3 then 'failed'/);
    assert.match(migration, /for update skip locked/);
    assert.match(migration, /order by\s+case\s+when exists \(\s+select 1\s+from public\.company_follows as follow/s);
  });

  it("accepts a baseline job and still rejects an unknown job type", async () => {
    const calls: string[] = [];
    const client = {
      async rpc(name: string) {
        calls.push(name);
        return {
          data: [{
            job_id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
            company_id: "fd31b206-b20a-4183-9e98-a5af9545c458",
            job_type: "baseline_refresh",
            attempts: 1,
          }],
          error: null,
        };
      },
    } as unknown as CompanyIngestionQueueClient;
    const claimed = await claimCompanyIngestionJob(client);
    assert.equal(claimed.status, "claimed");
    assert.equal(claimed.status === "claimed" ? claimed.job.jobType : "", "baseline_refresh");
    assert.deepEqual(calls, ["claim_company_ingestion_job"]);

    const invalid = {
      async rpc() {
        return {
          data: [{
            job_id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
            company_id: "fd31b206-b20a-4183-9e98-a5af9545c458",
            job_type: "scrape_everything",
            attempts: 1,
          }],
          error: null,
        };
      },
    } as unknown as CompanyIngestionQueueClient;
    assert.deepEqual(await claimCompanyIngestionJob(invalid), { status: "error", reason: "invalid_job" });
  });

  it("stops a job before the platform deadline", () => {
    let elapsed = 0;
    const deadline = createJobDeadline({ clock: () => elapsed });
    elapsed = 44_000;
    assert.equal(deadline.requestTimeoutMs(10_000), null);
    assert.equal(JOB_DEADLINE_EXCEEDED, "job_deadline_exceeded");
  });
});
