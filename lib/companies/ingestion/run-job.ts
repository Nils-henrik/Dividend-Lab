import {
  COMPANY_SOURCE_TYPES,
  type CompanySourceType,
} from "@/lib/companies/ingestion/document";
import {
  collectCompanySource,
  companyDocumentOrigins,
} from "@/lib/companies/ingestion/collect";
import { createJobDeadline, JOB_DEADLINE_EXCEEDED } from "@/lib/companies/ingestion/deadline";
import {
  INGESTION_REQUEST_TIMEOUT_MS,
  pauseBetweenRequests,
  type SourceFetchContext,
} from "@/lib/companies/ingestion/fetch-source";
import {
  isSupportedCompanyIngestionSlug,
  type CompanyIngestionJob,
} from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionOrchestratorStore } from "@/lib/companies/ingestion/store";

export type CompanyIngestionWorkerDependencies = {
  store: CompanyIngestionOrchestratorStore;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
  clock?: () => number;
};

export type CompanyIngestionWorkerResult =
  | { status: "completed"; savedDocuments: number }
  | { status: "retry_scheduled"; reason: string }
  | { status: "failed"; reason: string };

const MAX_JOB_ATTEMPTS = 3;

async function recordFailure(
  job: CompanyIngestionJob,
  reason: string,
  dependencies: CompanyIngestionWorkerDependencies,
): Promise<CompanyIngestionWorkerResult> {
  const recorded = await dependencies.store.retryOrFailJob(
    job,
    reason,
    (dependencies.now ?? (() => new Date()))().toISOString(),
  );
  if (!recorded || job.attempts >= MAX_JOB_ATTEMPTS) {
    return { status: "failed", reason };
  }

  return { status: "retry_scheduled", reason };
}

async function executeCompanyIngestionJob(
  job: CompanyIngestionJob,
  dependencies: CompanyIngestionWorkerDependencies,
): Promise<CompanyIngestionWorkerResult> {
  const now = (dependencies.now ?? (() => new Date()))();
  const deadline = createJobDeadline(
    dependencies.clock ? { clock: dependencies.clock } : undefined,
  );
  const context: SourceFetchContext = {
    fetchImpl: dependencies.fetchImpl,
    sleep: dependencies.sleep,
    now,
    deadline,
  };
  const company = await dependencies.store.loadCompany(job.companyId);
  if (company.status === "error") {
    return recordFailure(job, "company_unresolved", dependencies);
  }

  if (!isSupportedCompanyIngestionSlug(company.company.slug)) {
    return recordFailure(job, "unsupported_company", dependencies);
  }

  const sources = await dependencies.store.loadOfficialSources(job.companyId);
  if (sources.status === "error") {
    return recordFailure(job, "official_source_unavailable", dependencies);
  }

  let savedDocuments = 0;
  let failure: string | null = null;
  let fetchedSources = 0;
  for (const sourceType of COMPANY_SOURCE_TYPES) {
    const source = sources.sources.find((item) => item.sourceType === sourceType);
    if (!source) {
      failure ??= `${sourceType}_official_source_unavailable`;
      continue;
    }

    if (source.lastCheckedAt) {
      continue;
    }

    if (fetchedSources > 0) {
      if ((await pauseBetweenRequests(context)) === JOB_DEADLINE_EXCEEDED) {
        return recordFailure(job, JOB_DEADLINE_EXCEEDED, dependencies);
      }
    }
    if (deadline.requestTimeoutMs(INGESTION_REQUEST_TIMEOUT_MS) === null) {
      return recordFailure(job, JOB_DEADLINE_EXCEEDED, dependencies);
    }
    fetchedSources += 1;

    const collected = await collectCompanySource(
      company.company.slug,
      { sourceType: source.sourceType as CompanySourceType, sourceUrl: source.sourceUrl },
      context,
    );
    if (collected.status === "error") {
      if (collected.reason === JOB_DEADLINE_EXCEEDED) {
        return recordFailure(job, JOB_DEADLINE_EXCEEDED, dependencies);
      }
      failure ??= `${sourceType}_${collected.reason}`;
      continue;
    }

    const fetchedAt = now.toISOString();
    const saved = await dependencies.store.saveDocuments({
      companyId: job.companyId,
      sourceId: source.id,
      documents: collected.documents,
      allowedOrigins: companyDocumentOrigins(company.company.slug),
      fetchedAt,
    });
    const checked = saved
      && await dependencies.store.markSourceChecked(source.id, fetchedAt);
    if (!checked) {
      failure ??= "database_write_failed";
      continue;
    }

    savedDocuments += collected.documents.length;
  }

  if (failure) {
    return recordFailure(job, failure, dependencies);
  }

  if (!(await dependencies.store.completeJob(job, now.toISOString()))) {
    return recordFailure(job, "database_write_failed", dependencies);
  }

  return { status: "completed", savedDocuments };
}

export async function runCompanyIngestionJob(
  job: CompanyIngestionJob,
  dependencies: CompanyIngestionWorkerDependencies,
): Promise<CompanyIngestionWorkerResult> {
  try {
    return await executeCompanyIngestionJob(job, dependencies);
  } catch {
    try {
      return await recordFailure(job, "worker_unexpected_error", dependencies);
    } catch {
      return { status: "failed", reason: "worker_unexpected_error" };
    }
  }
}
