import "server-only";

import { createCompanyIngestionAdminClient } from "@/lib/companies/ingestion/admin";
import { createJobDeadline } from "@/lib/companies/ingestion/deadline";
import {
  claimCompanyIngestionJob,
  enqueueStaleCompanyBaselineRefreshes,
  recoverStaleCompanyIngestionJobs,
  type ClaimCompanyIngestionJobResult,
} from "@/lib/companies/ingestion/queue";
import { runCompanyIngestionJob, type CompanyIngestionWorkerResult } from "@/lib/companies/ingestion/run-job";
import {
  COMPANY_INGESTION_BATCH_LIMIT,
  drainCompanyIngestionJobs,
  type CompanyIngestionDrainStop,
} from "@/lib/companies/ingestion/schedule";
import { createCompanyIngestionStore } from "@/lib/companies/ingestion/store";

export type ClaimNextCompanyIngestionJobResult =
  | ClaimCompanyIngestionJobResult
  | { status: "unavailable" };

export async function claimNextCompanyIngestionJob(): Promise<ClaimNextCompanyIngestionJobResult> {
  const client = createCompanyIngestionAdminClient();
  if (!client) {
    return { status: "unavailable" };
  }

  return claimCompanyIngestionJob(client);
}

export type RunCompanyIngestionBatchResult =
  | {
      status: "completed" | "empty";
      enqueued: number;
      jobs: CompanyIngestionWorkerResult[];
      stoppedReason: CompanyIngestionDrainStop;
    }
  | {
      status: "unavailable" | "recovery_error" | "enqueue_error" | "claim_error";
    };

export async function runCompanyIngestionBatch(): Promise<RunCompanyIngestionBatchResult> {
  const client = createCompanyIngestionAdminClient();
  if (!client) {
    return { status: "unavailable" };
  }

  const deadline = createJobDeadline();
  const recovery = await recoverStaleCompanyIngestionJobs(client);
  if (recovery.status === "error") {
    return { status: "recovery_error" };
  }

  const enqueued = await enqueueStaleCompanyBaselineRefreshes(
    client,
    COMPANY_INGESTION_BATCH_LIMIT,
  );
  if (enqueued.status === "error") {
    return { status: "enqueue_error" };
  }

  const store = createCompanyIngestionStore(client);
  const drained = await drainCompanyIngestionJobs({
    deadline,
    claim: () => claimCompanyIngestionJob(client),
    run: (job, budgetMs) => runCompanyIngestionJob(job, { store, budgetMs }),
  });

  if (drained.stoppedReason === "claim_error" && drained.jobs.length === 0) {
    return { status: "claim_error" };
  }

  return {
    status: drained.jobs.length === 0 ? "empty" : "completed",
    enqueued: enqueued.count,
    jobs: drained.jobs,
    stoppedReason: drained.stoppedReason,
  };
}
