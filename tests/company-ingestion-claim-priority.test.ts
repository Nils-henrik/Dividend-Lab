import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { shouldRefreshCompanySource } from "@/lib/companies/ingestion/baseline";
import {
  claimRotationRank,
  companyIngestionClaimTier,
  isCompanyIngestionClaimEligible,
  orderCompanyIngestionClaims,
  type CompanyIngestionClaimCandidate,
} from "@/lib/companies/ingestion/claim-priority";
import { COMPANY_INGESTION_PLATFORM_MAX_MS } from "@/lib/companies/ingestion/deadline";
import {
  COMPANY_INGESTION_BATCH_LIMIT,
  COMPANY_INGESTION_CRON_SCHEDULE,
  COMPANY_INGESTION_MIN_JOB_SLICE_MS,
  COMPANY_INGESTION_ROUTE_BUDGET_MS,
  drainCompanyIngestionJobs,
  isVercelHobbyDailyCron,
} from "@/lib/companies/ingestion/schedule";

const INCIDENT_AT = new Date("2026-09-30T03:25:24.000Z");
const CROWN = ["industrivarden", "nordea", "swedbank", "tele2"] as const;
const OLDER = ["sandvik", "evolution", "saab", "addtech"] as const;

function source(
  lastCheckedAt: string | null,
  lastFailureReason: string | null = null,
  supportMode: "automated" | "source_link_only" | "blocked" = "automated",
): CompanyIngestionClaimCandidate["sources"][number] {
  return { supportMode, lastCheckedAt, lastFailureReason };
}

function job(
  slug: string,
  createdAt: string,
  overrides: Partial<CompanyIngestionClaimCandidate> = {},
): CompanyIngestionClaimCandidate {
  return {
    jobId: overrides.jobId ?? `00000000-0000-4000-8000-${slug.padEnd(12, "0").slice(0, 12)}`,
    slug,
    followed: overrides.followed ?? false,
    jobType: overrides.jobType ?? "baseline_refresh",
    lastError: overrides.lastError ?? null,
    availableAt: overrides.availableAt ?? createdAt,
    createdAt,
    sources: overrides.sources ?? [source(null)],
  };
}

function incidentQueue(now = INCIDENT_AT): CompanyIngestionClaimCandidate[] {
  const checked = "2026-09-28T03:20:00.000Z";
  return [
    job("sandvik", "2026-09-28T03:17:01.000Z", {
      followed: true,
      sources: [source(checked), source(null)],
    }),
    job("evolution", "2026-09-28T03:17:02.000Z", {
      followed: true,
      sources: [source(checked), source(null)],
    }),
    job("saab", "2026-09-28T03:17:03.000Z", {
      followed: true,
      sources: [source(checked), source(null)],
    }),
    job("addtech", "2026-09-28T03:17:04.000Z", {
      followed: true,
      sources: [source(checked), source(null)],
    }),
    ...CROWN.map((slug) => job(slug, now.toISOString(), {
      sources: [source(null), source(null)],
    })),
  ];
}

function legacyOrder(
  jobs: readonly CompanyIngestionClaimCandidate[],
  now: Date,
): CompanyIngestionClaimCandidate[] {
  return jobs
    .filter((entry) => isCompanyIngestionClaimEligible(entry, now))
    .slice()
    .sort((first, second) => {
      const tier = companyIngestionClaimTier(first, now) - companyIngestionClaimTier(second, now);
      if (tier !== 0) return tier;
      const penalty = Number(first.lastError === "job_deadline_exceeded")
        - Number(second.lastError === "job_deadline_exceeded");
      if (penalty !== 0) return penalty;
      if (first.followed !== second.followed) return first.followed ? -1 : 1;
      const available = first.availableAt.localeCompare(second.availableAt);
      if (available !== 0) return available;
      return first.createdAt.localeCompare(second.createdAt);
    });
}

describe("company ingestion claim priority", () => {
  it("proves older tier-0 jobs starve never-checked companies under the previous claim order", async () => {
    const legacy = legacyOrder(incidentQueue(), INCIDENT_AT);
    assert.deepEqual(
      legacy.slice(0, 4).map((entry) => entry.slug),
      [...OLDER],
    );
    assert.equal(legacy.slice(0, 4).some((entry) => CROWN.includes(entry.slug as typeof CROWN[number])), false);

    const queue = legacy.slice();
    let elapsed = 0;
    const drained = await drainCompanyIngestionJobs({
      clock: () => elapsed,
      budgetMs: COMPANY_INGESTION_ROUTE_BUDGET_MS,
      batchLimit: COMPANY_INGESTION_BATCH_LIMIT,
      minJobSliceMs: COMPANY_INGESTION_MIN_JOB_SLICE_MS,
      claim: async () => {
        const next = queue.shift();
        if (!next) return { status: "empty" };
        return { status: "claimed", job: next };
      },
      run: async (entry) => {
        elapsed += entry.slug === "addtech" ? 20_000 : 10_000;
        return entry.slug;
      },
    });

    assert.deepEqual(drained.jobs, [...OLDER]);
    assert.equal(drained.stoppedReason, "route_budget");
    assert.deepEqual(
      queue.map((entry) => entry.slug).sort(),
      [...CROWN].sort(),
    );
  });

  it("claims a newly eligible never-checked company before an older low-priority pending job", () => {
    const now = INCIDENT_AT;
    const ordered = orderCompanyIngestionClaims([
      job("sandvik", "2026-09-01T03:17:00.000Z", {
        followed: true,
        sources: [source("2026-09-28T03:00:00.000Z")],
      }),
      job("nordea", "2026-09-30T03:25:24.000Z", {
        sources: [source(null)],
      }),
    ], now);
    assert.deepEqual(ordered.map((entry) => entry.slug), ["nordea", "sandvik"]);
    assert.equal(companyIngestionClaimTier(ordered[0], now), 0);
    assert.equal(companyIngestionClaimTier(ordered[1], now), 1);
  });

  it("does not let a deadline retry outrank priority-1 work", () => {
    const ordered = orderCompanyIngestionClaims([
      job("addtech", "2026-09-28T03:17:04.000Z", {
        followed: true,
        lastError: "job_deadline_exceeded",
        sources: [source(null)],
      }),
      job("nordea", "2026-09-30T03:25:24.000Z", {
        sources: [source(null)],
      }),
      job("sandvik", "2026-09-28T03:17:01.000Z", {
        followed: true,
        sources: [source("2026-09-28T03:20:00.000Z"), source(null)],
      }),
    ], INCIDENT_AT);
    assert.equal(ordered[0]?.slug, "nordea");
    assert.equal(ordered.at(-1)?.slug, "addtech");
  });

  it("rotates equal priority-1 companies deterministically by UTC day", () => {
    const companies = CROWN.map((slug) => job(slug, "2026-09-29T03:17:00.000Z"));
    const firstDay = new Date("2026-09-30T03:17:00.000Z");
    const nextDay = new Date("2026-10-01T03:17:00.000Z");
    const first = orderCompanyIngestionClaims(companies, firstDay).map((entry) => entry.slug);
    const second = orderCompanyIngestionClaims(companies, nextDay).map((entry) => entry.slug);
    const repeated = orderCompanyIngestionClaims(companies, firstDay).map((entry) => entry.slug);
    assert.deepEqual(first, repeated);
    assert.notDeepEqual(first, second);
    assert.deepEqual([...first].sort(), [...CROWN].sort());
    assert.deepEqual([...second].sort(), [...CROWN].sort());
    assert.equal(claimRotationRank("nordea", firstDay), 174);
  });

  it("claims never-checked crown companies before older partial and deadline jobs", async () => {
    const queue = orderCompanyIngestionClaims(incidentQueue(), INCIDENT_AT);
    assert.deepEqual(queue.slice(0, 4).map((entry) => entry.slug).sort(), [...CROWN].sort());
    assert.equal(OLDER.every((slug) => queue.findIndex((entry) => entry.slug === slug) >= 4), true);

    const pending = queue.slice();
    let elapsed = 0;
    const drained = await drainCompanyIngestionJobs({
      clock: () => elapsed,
      budgetMs: COMPANY_INGESTION_ROUTE_BUDGET_MS,
      batchLimit: COMPANY_INGESTION_BATCH_LIMIT,
      minJobSliceMs: COMPANY_INGESTION_MIN_JOB_SLICE_MS,
      claim: async () => {
        const next = pending.shift();
        if (!next) return { status: "empty" };
        return { status: "claimed", job: next };
      },
      run: async (entry) => {
        elapsed += 10_000;
        return entry.slug;
      },
    });

    assert.equal(drained.stoppedReason, "route_budget");
    assert.equal(drained.jobs.every((slug) => CROWN.includes(slug as typeof CROWN[number])), true);
    assert.equal(drained.jobs.some((slug) => OLDER.includes(slug as typeof OLDER[number])), false);
  });

  it("preserves queue safety, hobby bounds, and leaves unrelated systems alone", () => {
    const claim = readFileSync(
      new URL("../supabase/migrations/20260930140000_company_ingestion_claim_priority.sql", import.meta.url),
      "utf8",
    );
    const follow = readFileSync(
      new URL("../supabase/migrations/20260921190629_enqueue_company_ingestion_on_follow.sql", import.meta.url),
      "utf8",
    );
    const enqueue = readFileSync(
      new URL("../supabase/migrations/20260928120000_company_ingestion_fairness.sql", import.meta.url),
      "utf8",
    );
    const worker = readFileSync(
      new URL("../lib/companies/ingestion/run-job.ts", import.meta.url),
      "utf8",
    );
    const store = readFileSync(
      new URL("../lib/companies/ingestion/store.ts", import.meta.url),
      "utf8",
    );
    const vercel = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");
    const orderBy = claim.slice(claim.indexOf("order by"));

    assert.match(follow, /create unique index company_ingestion_jobs_one_active_idx/);
    assert.match(enqueue, /on conflict \(company_id, job_type\)\s+where status in \('pending', 'processing'\)\s+do nothing/);
    assert.doesNotMatch(claim, /drop index company_ingestion_jobs_one_active_idx/);
    assert.match(follow, /when attempts >= 3 then 'failed'/);
    assert.match(follow, /locked_at <= now\(\) - interval '15 minutes'/);
    assert.match(follow, /create trigger company_follows_enqueue_initial_sync/);
    assert.doesNotMatch(claim, /recover_stale_company_ingestion_jobs|enqueue_company_initial_sync|enqueue_stale_company/);
    assert.match(worker, /const MAX_JOB_ATTEMPTS = 3/);
    assert.match(worker, /job\.attempts >= MAX_JOB_ATTEMPTS/);
    assert.match(store, /const MAX_JOB_ATTEMPTS = 3/);
    assert.match(claim, /for update of job skip locked/);
    assert.match(claim, /job_type = 'baseline_refresh'/);
    assert.doesNotMatch(orderBy, /job\.created_at|job\.available_at/);
    assert.match(orderBy, /from public\.company_follows as follow/);
    assert.match(orderBy, /job\.last_error = 'job_deadline_exceeded'/);
    assert.match(orderBy, /% 997/);
    assert.match(orderBy, /% 996/);
    const deadlineAt = orderBy.indexOf("job.last_error = 'job_deadline_exceeded'");
    const coverageAt = orderBy.indexOf("source.last_checked_at is not null");
    assert.ok(deadlineAt > 0 && coverageAt > deadlineAt);

    assert.equal(isCompanyIngestionClaimEligible(job("nordea", INCIDENT_AT.toISOString(), {
      jobType: "initial_sync",
      followed: false,
    }), INCIDENT_AT), false);
    assert.equal(isCompanyIngestionClaimEligible(job("nordea", INCIDENT_AT.toISOString(), {
      jobType: "initial_sync",
      followed: true,
    }), INCIDENT_AT), true);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "blocked",
      lastCheckedAt: null,
      now: INCIDENT_AT,
    }), false);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "source_link_only",
      lastCheckedAt: null,
      now: INCIDENT_AT,
    }), false);
    assert.equal(shouldRefreshCompanySource({
      jobType: "initial_sync",
      supportMode: "automated",
      lastCheckedAt: null,
      now: INCIDENT_AT,
    }), true);
    assert.equal(shouldRefreshCompanySource({
      jobType: "initial_sync",
      supportMode: "automated",
      lastCheckedAt: "2026-09-29T00:00:00.000Z",
      now: INCIDENT_AT,
    }), false);

    const blockedOnly = orderCompanyIngestionClaims([
      job("abb", "2026-09-01T00:00:00.000Z", {
        sources: [source(null, null, "blocked")],
      }),
      job("nordea", "2026-09-30T03:25:24.000Z"),
    ], INCIDENT_AT);
    assert.deepEqual(blockedOnly.map((entry) => entry.slug), ["nordea", "abb"]);

    assert.equal(COMPANY_INGESTION_CRON_SCHEDULE, "17 3 * * *");
    assert.equal(isVercelHobbyDailyCron(COMPANY_INGESTION_CRON_SCHEDULE), true);
    assert.equal(COMPANY_INGESTION_BATCH_LIMIT, 8);
    assert.ok(COMPANY_INGESTION_ROUTE_BUDGET_MS < COMPANY_INGESTION_PLATFORM_MAX_MS);
    assert.equal(JSON.parse(vercel).crons.length, 1);
    assert.doesNotMatch(claim, /borskollen|stripe|autoredaktion|article/i);
    assert.doesNotMatch(vercel, /company-ingestion[\s\S]*company-ingestion/);
  });
});
