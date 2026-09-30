import type { CompanyIngestionJobType } from "@/lib/companies/ingestion/queue";
import { BASELINE_SOURCE_STALE_MS } from "@/lib/companies/ingestion/schedule";

/**
 * Claim order for company_ingestion_jobs.
 *
 * This is the executable spec for
 * public.claim_company_ingestion_job. The database function is what the
 * cron actually runs; keep the two in lockstep.
 *
 * Job age is not a priority key. An older pending row must not outrank a
 * company that currently has a higher source priority.
 */
export const CLAIM_ROTATION_MODULUS = 997;
export const CLAIM_STALE_AFTER_MS = BASELINE_SOURCE_STALE_MS;

export type ClaimSourceState = {
  supportMode: "automated" | "source_link_only" | "blocked";
  isOfficial?: boolean;
  isActive?: boolean;
  lastCheckedAt: string | null;
  lastFailureReason?: string | null;
};

export type CompanyIngestionClaimCandidate = {
  jobId: string;
  slug: string;
  followed: boolean;
  jobType: CompanyIngestionJobType;
  lastError: string | null;
  availableAt: string;
  createdAt: string;
  sources: readonly ClaimSourceState[];
};

export function utcDayNumber(now: Date): number {
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000,
  );
}

/**
 * Daily permutation of a slug. Multiplying by a day-dependent factor modulo
 * a prime changes which equal-priority company is first on successive UTC
 * days. Adding a constant would not.
 */
export function claimRotationRank(slug: string, now: Date): number {
  let weighted = 0;
  for (let index = 0; index < slug.length; index += 1) {
    weighted += slug.charCodeAt(index) * (index + 1);
  }
  const base = weighted % CLAIM_ROTATION_MODULUS;
  const factor = (utcDayNumber(now) % (CLAIM_ROTATION_MODULUS - 1)) + 1;
  return (base * factor) % CLAIM_ROTATION_MODULUS;
}

export function isCompanyIngestionClaimEligible(
  job: Pick<CompanyIngestionClaimCandidate, "jobType" | "followed" | "availableAt">,
  now: Date,
): boolean {
  const availableAt = new Date(job.availableAt).getTime();
  if (!Number.isFinite(availableAt) || availableAt > now.getTime()) return false;
  return job.jobType === "baseline_refresh" || job.followed;
}

function automatedSources(sources: readonly ClaimSourceState[]): ClaimSourceState[] {
  return sources.filter((source) => {
    if (source.supportMode !== "automated") return false;
    if (source.isOfficial === false) return false;
    if (source.isActive === false) return false;
    return true;
  });
}

export function companyIngestionClaimTier(
  job: Pick<CompanyIngestionClaimCandidate, "followed" | "sources">,
  now: Date,
): number {
  const sources = automatedSources(job.sources);
  const neverChecked = sources.some(
    (source) => source.lastCheckedAt === null && !source.lastFailureReason,
  );
  if (neverChecked) return 0;

  const cleanStale = sources.some((source) => {
    if (source.lastFailureReason) return false;
    if (source.lastCheckedAt === null) return true;
    const checkedAt = new Date(source.lastCheckedAt).getTime();
    return Number.isFinite(checkedAt) && checkedAt < now.getTime() - CLAIM_STALE_AFTER_MS;
  });
  if (job.followed && cleanStale) return 1;
  if (sources.some((source) => Boolean(source.lastFailureReason))) return 2;
  return 3;
}

/**
 * 0 when every automated source is still unchecked. A company that already
 * has a checked automated source stays in its tier, but behind companies
 * that have never been checked at all.
 */
export function companyIngestionClaimCoverage(
  job: Pick<CompanyIngestionClaimCandidate, "sources">,
): number {
  return automatedSources(job.sources).some((source) => source.lastCheckedAt !== null)
    ? 1
    : 0;
}

export function companyIngestionDeadlinePenalty(
  job: Pick<CompanyIngestionClaimCandidate, "lastError">,
): number {
  return job.lastError === "job_deadline_exceeded" ? 1 : 0;
}

function compareCompanyIngestionClaims(
  first: CompanyIngestionClaimCandidate,
  second: CompanyIngestionClaimCandidate,
  now: Date,
): number {
  const tier = companyIngestionClaimTier(first, now) - companyIngestionClaimTier(second, now);
  if (tier !== 0) return tier;
  const penalty = companyIngestionDeadlinePenalty(first) - companyIngestionDeadlinePenalty(second);
  if (penalty !== 0) return penalty;
  const coverage = companyIngestionClaimCoverage(first) - companyIngestionClaimCoverage(second);
  if (coverage !== 0) return coverage;
  const rotation = claimRotationRank(first.slug, now) - claimRotationRank(second.slug, now);
  if (rotation !== 0) return rotation;
  const slug = first.slug.localeCompare(second.slug);
  if (slug !== 0) return slug;
  return first.jobId.localeCompare(second.jobId);
}

export function orderCompanyIngestionClaims(
  jobs: readonly CompanyIngestionClaimCandidate[],
  now: Date,
): CompanyIngestionClaimCandidate[] {
  return jobs
    .filter((job) => isCompanyIngestionClaimEligible(job, now))
    .slice()
    .sort((first, second) => compareCompanyIngestionClaims(first, second, now));
}
