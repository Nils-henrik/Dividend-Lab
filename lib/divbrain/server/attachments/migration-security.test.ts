import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../../../supabase/migrations");

function attachmentMigrationSource(): string {
  const matches = readdirSync(migrationsDir).filter((name) =>
    name.includes("create_divbrain_attachments"),
  );
  assert.equal(matches.length, 1);
  return readFileSync(join(migrationsDir, matches[0]!), "utf8");
}

describe("DivBrain attachment migration security hardening", () => {
  it("pins the quota trigger function search_path and pg_catalog calls", () => {
    const source = attachmentMigrationSource();
    const functionMatch = source.match(
      /create or replace function public\.divbrain_attachments_enforce_unlinked_quota\(\)[\s\S]*?\$\$;/i,
    );
    assert.ok(functionMatch);
    const functionSource = functionMatch[0];

    assert.match(functionSource, /language plpgsql\s+set search_path = ''/i);
    assert.match(functionSource, /pg_catalog\.pg_advisory_xact_lock/i);
    assert.match(functionSource, /pg_catalog\.hashtext/i);
  });
});
