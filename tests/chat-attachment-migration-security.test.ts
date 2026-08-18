import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../supabase/migrations");

function attachmentMigrationSource() {
  const matches = readdirSync(migrationsDir).filter((name) =>
    name.includes("create_chat_message_attachments"),
  );
  assert.equal(matches.length, 1);
  return readFileSync(join(migrationsDir, matches[0]!), "utf8");
}

describe("chat attachment migration security contract", () => {
  it("creates a private bucket with no public read and no USING (true)", () => {
    const source = attachmentMigrationSource();
    assert.match(source, /'chat-attachments'/);
    assert.match(source, /public = excluded\.public/);
    assert.match(source, /file_size_limit = excluded\.file_size_limit/);
    assert.match(source, /\bfalse,\s*10485760/);
    assert.doesNotMatch(source, /using\s*\(\s*true\s*\)/i);
    assert.match(source, /force row level security/);
    assert.match(
      source,
      /grant select on table public\.message_attachments to authenticated/,
    );
    assert.match(
      source,
      /revoke all on table public\.message_attachments from anon/,
    );
    assert.doesNotMatch(
      source,
      /grant insert on table public\.message_attachments to authenticated/i,
    );
    assert.doesNotMatch(
      source,
      /create policy[\s\S]{0,400}on storage\.objects/i,
    );
  });

  it("scopes metadata reads to ready linked participant rows", () => {
    const source = attachmentMigrationSource();
    const policy = source.match(
      /create policy "Participants can read linked chat attachments"[\s\S]*?;/,
    );
    assert.ok(policy);
    assert.match(policy[0]!, /status = 'ready'/);
    assert.match(policy[0]!, /message_id is not null/);
    assert.match(policy[0]!, /is_conversation_participant/);
    assert.match(policy[0]!, /\(select auth\.uid\(\)\)/);
  });

  it("keeps send permission on can_send_private_message and allows empty bodies only with attachments", () => {
    const source = attachmentMigrationSource();
    assert.match(source, /can_send_private_message/);
    assert.match(source, /send_private_message_with_attachments/);
    assert.match(
      source,
      /char_length\(normalized_body\) = 0 and cardinality\(attachment_ids\) = 0/,
    );
    assert.match(source, /char_length\(btrim\(body\)\) between 0 and 2000/);
    assert.match(source, /cardinality\(attachment_ids\) > 3/);
  });

  it("pins the quota trigger search_path and Storage-API cleanup comments", () => {
    const source = attachmentMigrationSource();
    const functionMatch = source.match(
      /create or replace function public\.message_attachments_enforce_unlinked_quota\(\)[\s\S]*?\$\$;/i,
    );
    assert.ok(functionMatch);
    assert.match(functionMatch[0]!, /language plpgsql\s+set search_path = ''/i);
    assert.match(functionMatch[0]!, /pg_catalog\.pg_advisory_xact_lock/i);
    assert.match(source, /Storage API/);
    assert.match(source, /chat_attachment_unlinked_quota_exceeded/);
    assert.match(source, /errcode = 'CHQ20'/);
    assert.doesNotMatch(source, /^\s*delete from storage\.objects/im);
  });

  it("allowlists only conservative v1 MIME types", () => {
    const source = attachmentMigrationSource();
    assert.match(source, /image\/gif/);
    assert.match(source, /application\/pdf/);
    assert.doesNotMatch(source, /video\//);
    assert.doesNotMatch(source, /audio\//);
    assert.doesNotMatch(source, /application\/zip/);
    assert.doesNotMatch(source, /application\/x-msdownload/);
  });
});
