import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  claimCompanyIngestionJob,
  recoverStaleCompanyIngestionJobs,
  type CompanyIngestionQueueClient,
} from "@/lib/companies/ingestion/queue";

function queueClient(result: { data: unknown; error: unknown }) {
  const calls: Array<{ name: string; args?: unknown }> = [];
  const client = {
    async rpc(name: string, args?: unknown) {
      calls.push({ name, args });
      return result;
    },
  } as unknown as CompanyIngestionQueueClient;

  return { client, calls };
}

describe("company ingestion queue adapter", () => {
  it("normaliserar ett giltigt jobb från den atomiska RPC:n", async () => {
    const { client, calls } = queueClient({
      data: [
        {
          job_id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
          company_id: "fd31b206-b20a-4183-9e98-a5af9545c458",
          job_type: "initial_sync",
          attempts: 1,
        },
      ],
      error: null,
    });

    assert.deepEqual(await claimCompanyIngestionJob(client), {
      status: "claimed",
      job: {
        id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
        companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
        jobType: "initial_sync",
        attempts: 1,
      },
    });
    assert.deepEqual(calls, [
      {
        name: "claim_company_ingestion_job",
        args: {
          p_supported_company_slugs: [
            "investor",
            "volvo",
            "ericsson",
            "atlas-copco",
            "astrazeneca",
          ],
        },
      },
    ]);
  });

  it("returnerar empty när kön saknar följda bolag", async () => {
    const { client } = queueClient({ data: [], error: null });

    assert.deepEqual(await claimCompanyIngestionJob(client), {
      status: "empty",
    });
  });

  it("failar stängt för databasfel och ogiltiga jobbrader", async () => {
    const databaseFailure = queueClient({
      data: null,
      error: { message: "internal" },
    });
    const malformedRow = queueClient({
      data: [
        {
          job_id: "not-a-uuid",
          company_id: "fd31b206-b20a-4183-9e98-a5af9545c458",
          job_type: "initial_sync",
          attempts: 1,
        },
      ],
      error: null,
    });

    assert.deepEqual(await claimCompanyIngestionJob(databaseFailure.client), {
      status: "error",
      reason: "claim_failed",
    });
    assert.deepEqual(await claimCompanyIngestionJob(malformedRow.client), {
      status: "error",
      reason: "invalid_job",
    });
  });

  it("håller service-role-konfigurationen i server-only-moduler", () => {
    const adminSource = readFileSync(
      new URL("../lib/companies/ingestion/admin.ts", import.meta.url),
      "utf8",
    );
    const runtimeSource = readFileSync(
      new URL("../lib/companies/ingestion/runtime.ts", import.meta.url),
      "utf8",
    );

    assert.match(adminSource, /^import "server-only";/);
    assert.match(runtimeSource, /^import "server-only";/);
    assert.match(adminSource, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(adminSource, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("återställer fastnade jobb före nästa claim", async () => {
    const recovered = queueClient({ data: 2, error: null });
    const failed = queueClient({ data: null, error: { message: "internal" } });
    const malformed = queueClient({ data: -1, error: null });

    assert.deepEqual(await recoverStaleCompanyIngestionJobs(recovered.client), {
      status: "recovered",
      count: 2,
    });
    assert.deepEqual(recovered.calls, [
      { name: "recover_stale_company_ingestion_jobs", args: undefined },
    ]);
    assert.deepEqual(await recoverStaleCompanyIngestionJobs(failed.client), {
      status: "error",
      reason: "recovery_failed",
    });
    assert.deepEqual(await recoverStaleCompanyIngestionJobs(malformed.client), {
      status: "error",
      reason: "invalid_count",
    });
  });
});
