import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionStore } from "@/lib/companies/ingestion/store";
import { runAtlasCopcoIngestionJob } from "@/lib/companies/ingestion/workers/atlas-copco";

const JOB: CompanyIngestionJob = {
  id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
  companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
  jobType: "initial_sync",
  attempts: 1,
};
const SOURCE_ID = "99970661-3c0b-4d3f-a0ce-cd03dd45f610";
const PRESS_URL =
  "https://www.atlascopcogroup.com/en/media/press-releases/2026/example";
const SITEMAP = `<?xml version="1.0"?><urlset><url><loc>${PRESS_URL}</loc><lastmod>2026-08-28</lastmod></url></urlset>`;
const DETAIL = `
  <html>
    <h1 class="cmp-title__text">Verified Atlas Copco release</h1>
    <p class="cmp-pagedate">August 27, 2026</p>
  </html>`;

function testStore() {
  const calls: Array<{ operation: string; value?: unknown }> = [];
  const store: CompanyIngestionStore = {
    async loadOfficialSource(input) {
      calls.push({ operation: "source", value: input });
      return { status: "ok", source: { id: SOURCE_ID } };
    },
    async savePressReleases(input) {
      calls.push({ operation: "save", value: input });
      return true;
    },
    async markSourceChecked(sourceId, checkedAt) {
      calls.push({ operation: "checked", value: { sourceId, checkedAt } });
      return true;
    },
    async completeJob(job, completedAt) {
      calls.push({ operation: "complete", value: { job, completedAt } });
      return true;
    },
    async retryOrFailJob(job, reason, failedAt) {
      calls.push({ operation: "retry", value: { job, reason, failedAt } });
      return true;
    },
  };

  return { store, calls };
}

describe("Atlas Copco ingestion worker", () => {
  it("respekterar crawl-delay och sparar ett verifierat dokument idempotent", async () => {
    const { store, calls } = testStore();
    const urls: string[] = [];
    const delays: number[] = [];
    const fetchImpl = (async (input) => {
      const url = String(input);
      urls.push(url);
      return url.endsWith("sitemap.xml")
        ? new Response(SITEMAP, {
            headers: { "content-type": "application/xml" },
          })
        : new Response(DETAIL, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
    }) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, {
        store,
        fetchImpl,
        sleep: async (delay) => {
          delays.push(delay);
        },
        now: () => new Date("2026-09-22T12:00:00.000Z"),
      }),
      { status: "completed", savedDocuments: 1 },
    );
    assert.equal(urls.length, 2);
    assert.deepEqual(delays, [1_000]);
    assert.deepEqual(
      calls.map((call) => call.operation),
      ["source", "save", "checked", "complete"],
    );
    const save = calls.find((call) => call.operation === "save")?.value as {
      documents: Array<{ title: string; sourceUrl: string }>;
    };
    assert.equal(save.documents[0].title, "Verified Atlas Copco release");
    assert.equal(save.documents[0].sourceUrl, PRESS_URL);
  });

  it("schemalägger om ett tillfälligt hämtningsfel utan databaslagring", async () => {
    const { store, calls } = testStore();
    const fetchImpl = (async () =>
      new Response("unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, {
        store,
        fetchImpl,
        now: () => new Date("2026-09-22T12:00:00.000Z"),
      }),
      { status: "retry_scheduled", reason: "sitemap_http_status" },
    );
    assert.deepEqual(
      calls.map((call) => call.operation),
      ["source", "retry"],
    );
  });

  it("markerar tredje misslyckade försöket som permanent fel", async () => {
    const { store } = testStore();
    const fetchImpl = (async () =>
      new Response("unavailable", {
        status: 503,
        headers: { "content-type": "text/plain" },
      })) as typeof fetch;

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(
        { ...JOB, attempts: 3 },
        { store, fetchImpl },
      ),
      { status: "failed", reason: "sitemap_http_status" },
    );
  });

  it("fångar oväntade fel och lämnar jobbet för kontrollerad retry", async () => {
    const { store, calls } = testStore();
    store.loadOfficialSource = async () => {
      throw new Error("secret database detail");
    };

    assert.deepEqual(
      await runAtlasCopcoIngestionJob(JOB, { store }),
      { status: "retry_scheduled", reason: "worker_unexpected_error" },
    );
    assert.equal(calls.at(-1)?.operation, "retry");
    assert.doesNotMatch(JSON.stringify(calls), /secret database detail/);
  });

  it("lagrar med unik bolags- och originallänk som idempotensnyckel", () => {
    const source = readFileSync(
      new URL("../lib/companies/ingestion/store.ts", import.meta.url),
      "utf8",
    );

    assert.match(source, /onConflict: "company_id,source_url"/);
    assert.match(source, /\.eq\("status", "processing"\)/);
    assert.doesNotMatch(source, /console\.(?:log|error)/);
  });
});
