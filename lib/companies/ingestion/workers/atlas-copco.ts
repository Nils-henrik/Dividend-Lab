import {
  ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
  ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES,
  ATLAS_COPCO_MAX_SITEMAP_BYTES,
  ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS,
  ATLAS_COPCO_ORIGIN,
  ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
  ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL,
  parseAtlasCopcoPressRelease,
  parseAtlasCopcoPressReleaseSitemap,
  type AtlasCopcoPressReleaseDocument,
} from "@/lib/companies/ingestion/adapters/atlas-copco";
import {
  JOB_DEADLINE_EXCEEDED,
  type JobDeadline,
} from "@/lib/companies/ingestion/deadline";
import { fetchBoundedText, waitForCrawlDelay } from "@/lib/companies/ingestion/http";
import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionStore } from "@/lib/companies/ingestion/store";

const REQUEST_TIMEOUT_MS = 10_000;

export type AtlasCopcoWorkerDependencies = {
  store: CompanyIngestionStore;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
};

export type AtlasCopcoWorkerResult =
  | { status: "completed"; savedDocuments: number }
  | { status: "retry_scheduled"; reason: string }
  | { status: "failed"; reason: string };

async function recordFailure(
  job: CompanyIngestionJob,
  reason: string,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  const recorded = await dependencies.store.retryOrFailJob(
    job,
    reason,
    (dependencies.now ?? (() => new Date()))().toISOString(),
  );

  if (!recorded || job.attempts >= 3) {
    return { status: "failed", reason };
  }

  return { status: "retry_scheduled", reason };
}

function timeoutWithinBudget(
  deadline: JobDeadline | undefined,
  normalTimeoutMs: number,
): number | null {
  if (!deadline) {
    return normalTimeoutMs;
  }

  return deadline.requestTimeoutMs(normalTimeoutMs);
}

export async function loadAtlasCopcoPressReleaseDocuments(
  dependencies: Pick<AtlasCopcoWorkerDependencies, "fetchImpl" | "sleep"> & {
    deadline?: JobDeadline;
  },
): Promise<
  | { status: "ok"; documents: AtlasCopcoPressReleaseDocument[] }
  | { status: "error"; reason: string }
> {
  const sitemapTimeout = timeoutWithinBudget(dependencies.deadline, REQUEST_TIMEOUT_MS);
  if (sitemapTimeout === null) {
    return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
  }

  const sitemapResponse = await fetchBoundedText(
    ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
    {
      allowedOrigin: ATLAS_COPCO_ORIGIN,
      acceptedContentTypes: ["application/xml", "text/xml"],
      maxBytes: ATLAS_COPCO_MAX_SITEMAP_BYTES,
      timeoutMs: sitemapTimeout,
      fetchImpl: dependencies.fetchImpl,
    },
  );
  if (sitemapResponse.status === "error") {
    return { status: "error", reason: `sitemap_${sitemapResponse.reason}` };
  }

  const sitemap = parseAtlasCopcoPressReleaseSitemap(
    sitemapResponse.text,
    ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
  );
  if (sitemap.status === "invalid" || sitemap.candidates.length === 0) {
    return { status: "error", reason: "sitemap_invalid" };
  }

  const documents: AtlasCopcoPressReleaseDocument[] = [];
  for (const candidate of sitemap.candidates) {
    if (
      dependencies.deadline &&
      !dependencies.deadline.allowDelay(ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS)
    ) {
      return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
    }

    await waitForCrawlDelay(
      ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS,
      dependencies.sleep,
    );
    const detailTimeout = timeoutWithinBudget(dependencies.deadline, REQUEST_TIMEOUT_MS);
    if (detailTimeout === null) {
      return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
    }

    const detailResponse = await fetchBoundedText(candidate.sourceUrl, {
      allowedOrigin: ATLAS_COPCO_ORIGIN,
      acceptedContentTypes: ["text/html"],
      maxBytes: ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES,
      timeoutMs: detailTimeout,
      fetchImpl: dependencies.fetchImpl,
    });
    if (detailResponse.status === "error") {
      return { status: "error", reason: `detail_${detailResponse.reason}` };
    }

    const detail = parseAtlasCopcoPressRelease(
      detailResponse.text,
      candidate.sourceUrl,
    );
    if (detail.status === "ok") {
      documents.push(detail.document);
    }
  }

  if (documents.length === 0) {
    return { status: "error", reason: "no_valid_documents" };
  }

  return { status: "ok", documents };
}

async function executeAtlasCopcoIngestionJob(
  job: CompanyIngestionJob,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  const sourceResult = await dependencies.store.loadOfficialSource({
    companyId: job.companyId,
    sourceType: "press_releases",
    sourceUrl: ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL,
  });
  if (sourceResult.status === "error") {
    return recordFailure(job, "official_source_unavailable", dependencies);
  }

  const loaded = await loadAtlasCopcoPressReleaseDocuments(dependencies);
  if (loaded.status === "error") {
    return recordFailure(job, loaded.reason, dependencies);
  }

  const documents = loaded.documents;

  const completedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  if (
    !(await dependencies.store.savePressReleases({
      companyId: job.companyId,
      sourceId: sourceResult.source.id,
      documents,
      fetchedAt: completedAt,
    })) ||
    !(await dependencies.store.markSourceChecked(
      sourceResult.source.id,
      completedAt,
    )) ||
    !(await dependencies.store.completeJob(job, completedAt))
  ) {
    return recordFailure(job, "database_write_failed", dependencies);
  }

  return { status: "completed", savedDocuments: documents.length };
}

export async function runAtlasCopcoIngestionJob(
  job: CompanyIngestionJob,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  try {
    return await executeAtlasCopcoIngestionJob(job, dependencies);
  } catch {
    try {
      return await recordFailure(job, "worker_unexpected_error", dependencies);
    } catch {
      return { status: "failed", reason: "worker_unexpected_error" };
    }
  }
}
