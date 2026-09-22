import "server-only";

import { createCompanyIngestionAdminClient } from "@/lib/companies/ingestion/admin";
import {
  claimCompanyIngestionJob,
  recoverStaleCompanyIngestionJobs,
  type ClaimCompanyIngestionJobResult,
} from "@/lib/companies/ingestion/queue";
import { createCompanyIngestionStore } from "@/lib/companies/ingestion/store";
import {
  runAtlasCopcoIngestionJob,
  type AtlasCopcoWorkerResult,
} from "@/lib/companies/ingestion/workers/atlas-copco";

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
  | AtlasCopcoWorkerResult
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

  return runAtlasCopcoIngestionJob(claim.job, {
    store: createCompanyIngestionStore(client),
  });
}
