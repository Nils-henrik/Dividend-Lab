import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getCompanyProfile,
  getPilotCompanies,
  getRelatedCompanies,
} from "../lib/companies/catalog";
import { articleMatchesCompany, getCompanyNews } from "../lib/companies/news";
import type { NewsArticle } from "../types/news";

function article(
  id: string,
  companies: string[] = [],
  tickers: string[] = [],
): NewsArticle {
  return {
    id,
    title: id,
    summary: id,
    category: "company",
    source: "DivLab",
    publishedAt: "2026-09-21T08:00:00.000Z",
    url: null,
    featured: false,
    internalLinking: { companies, tickers },
  };
}

test("pilotkatalogen har fem unika bolag och TradingView-symboler", () => {
  const companies = getPilotCompanies();

  assert.equal(companies.length, 5);
  assert.equal(new Set(companies.map((company) => company.slug)).size, 5);
  assert.ok(companies.every((company) => company.tradingViewSymbol.includes(":")));
  assert.ok(companies.every((company) => company.websiteUrl.startsWith("https://")));
  assert.ok(companies.every((company) => company.description.length > 60));
});

test("relaterade bolag ger säkra interna länkar utan självreferenser", () => {
  for (const company of getPilotCompanies()) {
    const relatedCompanies = getRelatedCompanies(company);

    assert.equal(relatedCompanies.length, 3);
    assert.equal(new Set(relatedCompanies.map((item) => item.slug)).size, 3);
    assert.ok(relatedCompanies.every((item) => item.slug !== company.slug));
  }
});

test("bolagsartiklar matchas endast via explicit metadata", () => {
  const company = getCompanyProfile("atlas-copco");
  assert.ok(company);

  assert.equal(
    articleMatchesCompany(article("company", ["Atlas Copco"]), company),
    true,
  );
  assert.equal(
    articleMatchesCompany(article("ticker", [], ["ATCO-A"]), company),
    true,
  );
  assert.equal(
    articleMatchesCompany(article("unrelated", ["Volvo"]), company),
    false,
  );
});

test("bolagsflödet behåller ordningen och respekterar maxantal", () => {
  const company = getCompanyProfile("astrazeneca");
  assert.ok(company);

  const articles = [
    article("first", ["AstraZeneca"]),
    article("unrelated", ["Investor"]),
    article("second", [], ["AZN"]),
  ];

  assert.deepEqual(
    getCompanyNews(company, articles, 1).map((item) => item.id),
    ["first"],
  );
});

test("följmigreringen låser privata rader med RLS och minsta grant", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260921182717_create_company_following.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /create table public\.company_follows/);
  assert.match(migration, /primary key \(user_id, company_id\)/);
  assert.match(
    migration,
    /create index company_follows_company_created_idx\s+on public\.company_follows \(company_id, created_at\)/,
  );
  assert.match(
    migration,
    /alter table public\.company_follows enable row level security/,
  );
  assert.match(migration, /create policy company_follows_own_read/);
  assert.match(migration, /create policy company_follows_own_insert/);
  assert.match(migration, /create policy company_follows_own_delete/);
  assert.doesNotMatch(migration, /create policy company_follows_own_update/);
  assert.match(
    migration,
    /grant select, insert, delete on table public\.company_follows to authenticated/,
  );
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
});

test("pilotbolagen har tre verifierade officiella källor var", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260921185839_seed_pilot_company_sources.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const expectedHosts = [
    "www.investorab.com",
    "www.volvogroup.com",
    "www.ericsson.com",
    "www.atlascopcogroup.com",
    "www.astrazeneca.com",
  ];

  for (const company of getPilotCompanies()) {
    assert.equal(
      migration.match(new RegExp(`'${company.slug}'`, "g"))?.length,
      3,
      `${company.name} ska ha exakt tre källor`,
    );
  }

  for (const sourceType of [
    "press_releases",
    "financial_reports",
    "financial_calendar",
  ]) {
    assert.equal(
      migration.match(new RegExp(`'${sourceType}'`, "g"))?.length,
      5,
      `${sourceType} ska finnas för samtliga pilotbolag`,
    );
  }

  for (const host of expectedHosts) {
    assert.match(migration, new RegExp(`https://${host.replaceAll(".", "\\.")}/`));
  }

  assert.match(migration, /is_official,\s+is_active/);
  assert.match(
    migration,
    /on conflict \(company_id, source_type, source_url\) do update/,
  );
});

test("första följningen köar privat import och sista avföljningen avbryter väntande jobb", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260921190629_enqueue_company_ingestion_on_follow.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /create table public\.company_ingestion_jobs/);
  assert.match(
    migration,
    /alter table public\.company_ingestion_jobs enable row level security/,
  );
  assert.match(
    migration,
    /revoke all on table public\.company_ingestion_jobs from anon, authenticated/,
  );
  assert.match(
    migration,
    /grant all on table public\.company_ingestion_jobs to service_role/,
  );
  assert.doesNotMatch(migration, /create policy company_ingestion_jobs_/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(
    migration,
    /create or replace function private\.enqueue_company_initial_sync\(\)/,
  );
  assert.match(
    migration,
    /create or replace function private\.cancel_company_initial_sync_without_followers\(\)/,
  );
  assert.doesNotMatch(
    migration,
    /create or replace function public\.(?:enqueue|cancel)_company_initial_sync/,
  );
  assert.match(
    migration,
    /revoke all on function private\.enqueue_company_initial_sync\(\)\s+from public, anon, authenticated, service_role/,
  );
  assert.match(migration, /create trigger company_follows_enqueue_initial_sync/);
  assert.match(
    migration,
    /create trigger company_follows_cancel_pending_initial_sync/,
  );
  assert.match(
    migration,
    /on conflict \(company_id, job_type\)\s+where status in \('pending', 'processing'\)\s+do nothing/,
  );
  assert.match(
    migration,
    /and status = 'pending';\s+end if;\s+return old;/,
  );
  assert.match(
    migration,
    /create or replace function public\.claim_company_ingestion_job\(\s+p_supported_company_slugs text\[\] default null\s+\)/,
  );
  assert.match(migration, /security invoker\s+set search_path = ''/);
  assert.match(migration, /for update skip locked/);
  assert.match(
    migration,
    /from public\.company_follows as follow\s+where follow\.company_id = job\.company_id/,
  );
  assert.match(
    migration,
    /p_supported_company_slugs is null\s+or company\.slug = any\(p_supported_company_slugs\)/,
  );
  assert.match(
    migration,
    /revoke all on function public\.claim_company_ingestion_job\(text\[\]\)\s+from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.claim_company_ingestion_job\(text\[\]\)\s+to service_role/,
  );
  assert.match(
    migration,
    /create or replace function public\.recover_stale_company_ingestion_jobs\(\)/,
  );
  assert.match(
    migration,
    /locked_at <= now\(\) - interval '15 minutes'/,
  );
  assert.match(
    migration,
    /revoke all on function public\.recover_stale_company_ingestion_jobs\(\)\s+from public, anon, authenticated/,
  );
  assert.match(
    migration,
    /grant execute on function public\.recover_stale_company_ingestion_jobs\(\)\s+to service_role/,
  );
});

test("dokumentkällans sammansatta FK har ett täckande index", () => {
  const migration = readFileSync(
    new URL(
      "../supabase/migrations/20260922160607_index_company_documents_source.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    migration,
    /create index company_documents_source_company_idx\s+on public\.company_documents \(company_id, source_id\)/,
  );
});
