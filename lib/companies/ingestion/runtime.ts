import "server-only";

import { createCompanyIngestionAdminClient } from "@/lib/companies/ingestion/admin";
import {
  claimCompanyIngestionJob,
  recoverStaleCompanyIngestionJobs,
  type ClaimCompanyIngestionJobResult,
} from "@/lib/companies/ingestion/queue";
import { runCompanyIngestionJob, type CompanyIngestionWorkerResult } from "@/lib/companies/ingestion/run-job";
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

export type RunNextCompanyIngestionJobResult =
  | CompanyIngestionWorkerResult
  | {
      status:
        | "empty"
        | "unavailable"
        | "recovery_error"
        | "claim_error";
    };

export async function runNextCompanyIngestionJob(): Promise<RunNextCompanyIngestionJobResult> {
  const client = createCompanyIngestionAdminClient();
  if (!client) {
    return { status: "unavailable" };
  }

  const recovery = await recoverStaleCompanyIngestionJobs(client);
  if (recovery.status === "error") {
    return { status: "recovery_error" };
  }

  const claim = await claimCompanyIngestionJob(client);
  if (claim.status === "empty") {
    return { status: "empty" };
  }
  if (claim.status === "error") {
    return { status: "claim_error" };
  }

  return runCompanyIngestionJob(claim.job, {
    store: createCompanyIngestionStore(client),
  });
}
