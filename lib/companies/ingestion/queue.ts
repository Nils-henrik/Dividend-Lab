import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanyIngestionJob = {
  id: string;
  companyId: string;
  jobType: "initial_sync";
  attempts: number;
};

export type ClaimCompanyIngestionJobResult =
  | { status: "claimed"; job: CompanyIngestionJob }
  | { status: "empty" }
  | { status: "error"; reason: "claim_failed" | "invalid_job" };

export type CompanyIngestionQueueClient = Pick<SupabaseClient, "rpc">;

export type RecoverStaleCompanyIngestionJobsResult =
  | { status: "recovered"; count: number }
  | { status: "error"; reason: "recovery_failed" | "invalid_count" };

export const SUPPORTED_COMPANY_INGESTION_SLUGS = [
  "investor",
  "volvo",
  "ericsson",
  "atlas-copco",
  "astrazeneca",
  "saab",
  "sandvik",
  "sca",
  "addtech",
  "eqt",
  "evolution",
  "nibe",
  "essity",
  "hm",
] as const;

export type SupportedCompanyIngestionSlug =
  (typeof SUPPORTED_COMPANY_INGESTION_SLUGS)[number];

export function isSupportedCompanyIngestionSlug(
  slug: string,
): slug is SupportedCompanyIngestionSlug {
  return (SUPPORTED_COMPANY_INGESTION_SLUGS as readonly string[]).includes(slug);
}

type ClaimedJobRow = {
  job_id?: unknown;
  company_id?: unknown;
  job_type?: unknown;
  attempts?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseClaimedJob(row: ClaimedJobRow): CompanyIngestionJob | null {
  if (
    typeof row.job_id !== "string" ||
    !UUID_PATTERN.test(row.job_id) ||
    typeof row.company_id !== "string" ||
    !UUID_PATTERN.test(row.company_id) ||
    row.job_type !== "initial_sync" ||
    typeof row.attempts !== "number" ||
    !Number.isInteger(row.attempts) ||
    row.attempts < 1 ||
    row.attempts > 10
  ) {
    return null;
  }

  return {
    id: row.job_id,
    companyId: row.company_id,
    jobType: row.job_type,
    attempts: row.attempts,
  };
}

export async function claimCompanyIngestionJob(
  client: CompanyIngestionQueueClient,
): Promise<ClaimCompanyIngestionJobResult> {
  const { data, error } = await client.rpc("claim_company_ingestion_job", {
    p_supported_company_slugs: [...SUPPORTED_COMPANY_INGESTION_SLUGS],
  });

  if (error) {
    return { status: "error", reason: "claim_failed" };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { status: "empty" };
  }

  const job = parseClaimedJob(data[0] as ClaimedJobRow);
  if (!job) {
    return { status: "error", reason: "invalid_job" };
  }

  return { status: "claimed", job };
}

export async function recoverStaleCompanyIngestionJobs(
  client: CompanyIngestionQueueClient,
): Promise<RecoverStaleCompanyIngestionJobsResult> {
  const { data, error } = await client.rpc(
    "recover_stale_company_ingestion_jobs",
  );

  if (error) {
    return { status: "error", reason: "recovery_failed" };
  }

  if (typeof data !== "number" || !Number.isInteger(data) || data < 0) {
    return { status: "error", reason: "invalid_count" };
  }

  return { status: "recovered", count: data };
}
