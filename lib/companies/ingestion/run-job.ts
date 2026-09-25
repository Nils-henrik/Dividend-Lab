import { shouldRefreshCompanySource } from "@/lib/companies/ingestion/baseline";
import {
  COMPANY_FACT_SOURCE_TYPES,
  COMPANY_SOURCE_TYPES,
  type CompanySourceType,
} from "@/lib/companies/ingestion/document";
import {
  collectCompanySource,
  companyDocumentOrigins,
} from "@/lib/companies/ingestion/collect";
import { collectInvestorProfileSource } from "@/lib/companies/ingestion/investor-profile";
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
  const sourceTypes: CompanySourceType[] = [...COMPANY_SOURCE_TYPES, ...COMPANY_FACT_SOURCE_TYPES];
  for (const sourceType of sourceTypes) {
    const source = sources.sources.find((item) => item.sourceType === sourceType);
    if (!source) {
      if (COMPANY_SOURCE_TYPES.includes(sourceType as (typeof COMPANY_SOURCE_TYPES)[number])) {
        failure ??= `${sourceType}_official_source_unavailable`;
      }
      continue;
    }

    if (!shouldRefreshCompanySource({
      jobType: job.jobType,
      supportMode: source.supportMode ?? "automated",
      lastCheckedAt: source.lastCheckedAt,
      now,
    })) {
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
    const fetchedAt = now.toISOString();
    const allowedOrigins = companyDocumentOrigins(company.company.slug);
    const isFactSource = (COMPANY_FACT_SOURCE_TYPES as readonly string[]).includes(sourceType);

    if (isFactSource) {
      if (company.company.slug !== "investor") {
        const marked = await dependencies.store.markSourceSupport(source.id, "source_link_only", fetchedAt);
        if (!marked) failure ??= "database_write_failed";
        continue;
      }
      const profile = await collectInvestorProfileSource(source.sourceType, source.sourceUrl, context);
      if (profile.status === "error") {
        if (profile.reason === JOB_DEADLINE_EXCEEDED) {
          return recordFailure(job, JOB_DEADLINE_EXCEEDED, dependencies);
        }
        failure ??= `${sourceType}_${profile.reason}`;
        await dependencies.store.markSourceFailure(source.id, fetchedAt, profile.reason);
        continue;
      }
      const factsSaved = profile.facts.length === 0
        || await dependencies.store.saveFacts({
          companyId: job.companyId,
          facts: profile.facts,
          allowedOrigins,
          fetchedAt,
        });
      const ownersSaved = profile.ownership.length === 0
        || await dependencies.store.replaceOwnership({
          companyId: job.companyId,
          owners: profile.ownership,
          allowedOrigins,
          fetchedAt,
        });
      const checked = factsSaved && ownersSaved && await dependencies.store.markSourceChecked(source.id, fetchedAt);
      if (!checked) {
        failure ??= "database_write_failed";
        continue;
      }
      savedDocuments += profile.facts.length + profile.ownership.length;
      continue;
    }

    const collected = await collectCompanySource(
      company.company.slug,
      { sourceType: source.sourceType, sourceUrl: source.sourceUrl },
      context,
    );
    if (collected.status === "error") {
      if (collected.reason === JOB_DEADLINE_EXCEEDED) {
        return recordFailure(job, JOB_DEADLINE_EXCEEDED, dependencies);
      }
      if (collected.reason === "source_not_automated") {
        const marked = await dependencies.store.markSourceSupport(source.id, "source_link_only", fetchedAt);
        if (!marked) failure ??= "database_write_failed";
        continue;
      }
      failure ??= `${sourceType}_${collected.reason}`;
      await dependencies.store.markSourceFailure(source.id, fetchedAt, collected.reason);
      continue;
    }

    const saved = await dependencies.store.saveDocuments({
      companyId: job.companyId,
      sourceId: source.id,
      documents: collected.documents,
      allowedOrigins,
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
