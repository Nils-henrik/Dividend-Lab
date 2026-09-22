import type { SupabaseClient } from "@supabase/supabase-js";

import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { AtlasCopcoPressReleaseDocument } from "@/lib/companies/ingestion/adapters/atlas-copco";

export type CompanyIngestionSource = {
  id: string;
};

export type CompanyIngestionStore = {
  loadOfficialSource(input: {
    companyId: string;
    sourceType: "press_releases";
    sourceUrl: string;
  }): Promise<{ status: "ok"; source: CompanyIngestionSource } | { status: "error" }>;
  savePressReleases(input: {
    companyId: string;
    sourceId: string;
    documents: AtlasCopcoPressReleaseDocument[];
    fetchedAt: string;
  }): Promise<boolean>;
  markSourceChecked(sourceId: string, checkedAt: string): Promise<boolean>;
  completeJob(job: CompanyIngestionJob, completedAt: string): Promise<boolean>;
  retryOrFailJob(
    job: CompanyIngestionJob,
    reason: string,
    failedAt: string,
  ): Promise<boolean>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_JOB_ATTEMPTS = 3;

function sanitizeJobError(reason: string): string {
  return reason.replace(/[^a-z0-9_-]/gi, "_").slice(0, 160) || "unknown_error";
}

export function createCompanyIngestionStore(
  client: SupabaseClient,
): CompanyIngestionStore {
  return {
    async loadOfficialSource(input) {
      const { data, error } = await client
        .from("company_sources")
        .select("id")
        .eq("company_id", input.companyId)
        .eq("source_type", input.sourceType)
        .eq("source_url", input.sourceUrl)
        .eq("is_official", true)
        .eq("is_active", true)
        .maybeSingle();

      if (
        error ||
        !data ||
        typeof data.id !== "string" ||
        !UUID_PATTERN.test(data.id)
      ) {
        return { status: "error" };
      }

      return { status: "ok", source: { id: data.id } };
    },

    async savePressReleases(input) {
      if (input.documents.length === 0) {
        return true;
      }

      const rows = input.documents.map((document) => ({
        company_id: input.companyId,
        source_id: input.sourceId,
        document_type: document.documentType,
        title: document.title,
        source_url: document.sourceUrl,
        source_publisher: document.sourcePublisher,
        published_at: document.publishedAt,
        event_at: null,
        fiscal_period: null,
        fetched_at: input.fetchedAt,
        is_published: true,
      }));
      const { error } = await client.from("company_documents").upsert(rows, {
        onConflict: "company_id,source_url",
      });

      return !error;
    },

    async markSourceChecked(sourceId, checkedAt) {
      const { data, error } = await client
        .from("company_sources")
        .update({ last_checked_at: checkedAt })
        .eq("id", sourceId)
        .select("id")
        .maybeSingle();

      return !error && data?.id === sourceId;
    },

    async completeJob(job, completedAt) {
      const { data, error } = await client
        .from("company_ingestion_jobs")
        .update({
          status: "completed",
          completed_at: completedAt,
          locked_at: null,
          last_error: null,
        })
        .eq("id", job.id)
        .eq("company_id", job.companyId)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      return !error && data?.id === job.id;
    },

    async retryOrFailJob(job, reason, failedAt) {
      const permanentlyFailed = job.attempts >= MAX_JOB_ATTEMPTS;
      const retryDelaySeconds = Math.min(60 * 60, 60 * 2 ** (job.attempts - 1));
      const availableAt = new Date(
        new Date(failedAt).getTime() + retryDelaySeconds * 1_000,
      ).toISOString();
      const { data, error } = await client
        .from("company_ingestion_jobs")
        .update({
          status: permanentlyFailed ? "failed" : "pending",
          available_at: permanentlyFailed ? failedAt : availableAt,
          completed_at: permanentlyFailed ? failedAt : null,
          locked_at: null,
          last_error: sanitizeJobError(reason),
        })
        .eq("id", job.id)
        .eq("company_id", job.companyId)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      return !error && data?.id === job.id;
    },
  };
}
