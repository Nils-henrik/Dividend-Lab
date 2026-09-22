import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { isAuthorizedCompanyIngestionCron } from "@/lib/companies/ingestion/cron-auth";

describe("company ingestion cron", () => {
  it("failar stängt utan exakt bearer-hemlighet", () => {
    assert.equal(isAuthorizedCompanyIngestionCron(null, undefined), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer secret", undefined), false);
    assert.equal(isAuthorizedCompanyIngestionCron("secret", "secret"), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer wrong", "secret"), false);
    assert.equal(isAuthorizedCompanyIngestionCron("Bearer secret", "secret"), true);
  });

  it("håller workern server-only och svarar neutralt vid internfel", () => {
    const route = readFileSync(
      new URL(
        "../app/api/internal/company-ingestion/run/route.ts",
        import.meta.url,
      ),
      "utf8",
    );

    assert.match(route, /process\.env\.CRON_SECRET/);
    assert.match(route, /runNextCompanyIngestionJob/);
    assert.match(route, /maxDuration = 60/);
    assert.match(route, /status: 401/);
    assert.match(route, /status === "recovery_error"/);
    assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("registrerar en kostnadssnål daglig Vercel-cron", () => {
    const config = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    ) as {
      crons?: Array<{ path?: string; schedule?: string }>;
    };

    assert.deepEqual(config.crons, [
      {
        path: "/api/internal/company-ingestion/run",
        schedule: "17 3 * * *",
      },
    ]);
  });
});
