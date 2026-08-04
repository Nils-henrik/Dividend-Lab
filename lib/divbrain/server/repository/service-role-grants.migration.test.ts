/**
 * Migration contract: DivBrain service_role table privileges.
 *
 * Reads the focused grant migration as UTF-8 text.
 * Does not parse SQL generically and does not connect to a database.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../../");
const migrationsDir = join(repoRoot, "supabase/migrations");

const MIGRATION_SUFFIX = "_grant_divbrain_service_role_privileges.sql";
const ORIGINAL_SCHEMA_MIGRATION =
  "20260719110800_create_divbrain_conversations_and_messages.sql";

function normalizeSql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findGrantMigrationFilename(): string {
  const matches = readdirSync(migrationsDir).filter((name) =>
    name.endsWith(MIGRATION_SUFFIX),
  );
  assert.equal(
    matches.length,
    1,
    `expected exactly one ${MIGRATION_SUFFIX} migration`,
  );
  return matches[0]!;
}

describe("DivBrain service_role grant migration contract", () => {
  const filename = findGrantMigrationFilename();
  const absolutePath = join(migrationsDir, filename);
  const source = readFileSync(absolutePath, "utf8");
  const normalized = normalizeSql(source);

  it("uses a timestamped filename after the original DivBrain schema migration", () => {
    assert.match(filename, /^\d{14}_grant_divbrain_service_role_privileges\.sql$/);
    assert.ok(
      filename.localeCompare(ORIGINAL_SCHEMA_MIGRATION) > 0,
      "grant migration must sort after the Ticket 1A-6 schema migration",
    );
  });

  it("grants exactly SELECT/INSERT/UPDATE/DELETE on divbrain_conversations to service_role", () => {
    assert.match(
      normalized,
      /grant select,\s*insert,\s*update,\s*delete\s+on table public\.divbrain_conversations\s+to service_role\s*;/,
    );

    const conversationGrants = [
      ...normalized.matchAll(
        /grant\s+([^;]+?)\s+on table public\.divbrain_conversations\s+to\s+([^;]+?)\s*;/g,
      ),
    ];
    assert.equal(conversationGrants.length, 1);
    assert.equal(conversationGrants[0]![1], "select, insert, update, delete");
    assert.equal(conversationGrants[0]![2], "service_role");
  });

  it("grants exactly SELECT/INSERT on divbrain_messages to service_role", () => {
    assert.match(
      normalized,
      /grant select,\s*insert\s+on table public\.divbrain_messages\s+to service_role\s*;/,
    );

    const messageGrants = [
      ...normalized.matchAll(
        /grant\s+([^;]+?)\s+on table public\.divbrain_messages\s+to\s+([^;]+?)\s*;/g,
      ),
    ];
    assert.equal(messageGrants.length, 1);
    assert.equal(messageGrants[0]![1], "select, insert");
    assert.equal(messageGrants[0]![2], "service_role");
  });

  it("does not use GRANT ALL", () => {
    assert.equal(/\bgrant\s+all\b/i.test(normalized), false);
  });

  it("does not grant to anon or authenticated", () => {
    const grantTargets = [
      ...normalized.matchAll(/\bgrant\b[^;]*\bto\s+([^;]+?)\s*;/g),
    ].map((match) => match[1]!.trim());

    assert.ok(grantTargets.length > 0);
    for (const target of grantTargets) {
      assert.equal(target, "service_role");
    }

    assert.equal(/\bgrant\b[^;]*\bto\s+anon\b/i.test(normalized), false);
    assert.equal(
      /\bgrant\b[^;]*\bto\s+authenticated\b/i.test(normalized),
      false,
    );
    assert.equal(/\bgrant\b[^;]*\bto\s+public\b/i.test(normalized), false);
  });

  it("does not grant UPDATE or DELETE on divbrain_messages to service_role", () => {
    assert.equal(
      /grant[^;]*\b(update|delete)\b[^;]*on table public\.divbrain_messages[^;]*to service_role/i.test(
        normalized,
      ),
      false,
    );
  });

  it("does not alter RLS, policies, ownership, roles, or default privileges", () => {
    const forbidden = [
      /\benable\s+row\s+level\s+security\b/i,
      /\bdisable\s+row\s+level\s+security\b/i,
      /\bcreate\s+policy\b/i,
      /\balter\s+policy\b/i,
      /\bdrop\s+policy\b/i,
      /\balter\s+table\b/i,
      /\balter\s+role\b/i,
      /\bowner\s+to\b/i,
      /\balter\s+default\s+privileges\b/i,
      /\bbypassrls\b/i,
      /\bsecurity\s+definer\b/i,
      /\bcreate\s+or\s+replace\s+function\b/i,
      /\bcreate\s+function\b/i,
    ];

    for (const pattern of forbidden) {
      assert.equal(pattern.test(source), false, `forbidden pattern: ${pattern}`);
    }
  });

  it("contains no secret, UUID, or environment value", () => {
    assert.equal(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(
        source,
      ),
      false,
    );
    assert.equal(/\bsk[_-]live\b/i.test(source), false);
    assert.equal(/\beyJ[A-Za-z0-9_-]+\b/.test(source), false);
    assert.equal(/process\.env/i.test(source), false);
    assert.equal(/\bSUPABASE_[A-Z0-9_]+\b/.test(source), false);
    assert.equal(/\bNEXT_PUBLIC_[A-Z0-9_]+\b/.test(source), false);
    assert.equal(/https?:\/\//i.test(source), false);
  });
});
