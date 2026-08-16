import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../supabase/migrations");

function presenceMigrationSource() {
  const matches = readdirSync(migrationsDir).filter((name) =>
    name.includes("create_user_presence_and_chat_realtime"),
  );
  assert.equal(matches.length, 1);
  return readFileSync(join(migrationsDir, matches[0]!), "utf8");
}

function conversationMigrationSource() {
  return readFileSync(
    join(migrationsDir, "20260728213100_enhance_private_conversations.sql"),
    "utf8",
  );
}

describe("presence migration security contract", () => {
  it("scopes presence RLS to owner and accepted contacts", () => {
    const source = presenceMigrationSource();
    assert.match(source, /enable row level security/);
    assert.match(source, /force row level security/);
    assert.match(source, /_are_accepted_contacts_internal/);
    assert.match(source, /user_id = \(select auth\.uid\(\)\)/);
    assert.doesNotMatch(source, /using\s*\(\s*true\s*\)/i);
    assert.match(source, /revoke insert, update, delete on table public\.user_presence/);
    assert.match(source, /grant select on table public\.user_presence to authenticated/);
    assert.match(source, /revoke all on table public\.user_presence from anon/);
  });

  it("lets accepted contacts read the row after sharing is disabled", () => {
    const source = presenceMigrationSource();
    const policy = source.match(
      /create policy "Users can read own or accepted-contact presence"[\s\S]*?;/,
    );
    assert.ok(policy);
    assert.match(policy[0]!, /_are_accepted_contacts_internal/);
    assert.doesNotMatch(policy[0]!, /share_active_status/);
    assert.match(source, /last_seen_at timestamptz,/);
    assert.doesNotMatch(source, /last_seen_at timestamptz not null/);
  });

  it("nulls last_seen_at when sharing is disabled and keeps heartbeat from restoring it", () => {
    const source = presenceMigrationSource();
    assert.match(
      source,
      /when presence\.share_active_status is not true then null/,
    );
    assert.match(
      source,
      /when excluded\.share_active_status then now\(\)\s+else null/,
    );
    assert.match(
      source,
      /case when coalesce\(p_enabled, true\) then now\(\) else null end/,
    );
  });

  it("publishes only the narrowly required realtime tables", () => {
    const source = presenceMigrationSource();
    assert.match(source, /alter publication supabase_realtime add table public\.messages/);
    assert.match(source, /alter publication supabase_realtime add table public\.user_presence/);
    assert.doesNotMatch(source, /add table public\.profiles/);
    assert.doesNotMatch(source, /add table public\.user_connections/);
    assert.doesNotMatch(source, /add table public\.conversations/);
    assert.doesNotMatch(source, /add table public\.conversation_participants/);
  });

  it("does not weaken existing conversation or message RLS", () => {
    const presence = presenceMigrationSource();
    const conversations = conversationMigrationSource();
    assert.doesNotMatch(presence, /drop policy[\s\S]*on public\.messages/i);
    assert.doesNotMatch(presence, /drop policy[\s\S]*on public\.conversations/i);
    assert.match(conversations, /can_send_private_message/);
    assert.match(conversations, /send_private_message/);
  });

  it("keeps last_seen_at off the public profiles table", () => {
    const source = presenceMigrationSource();
    assert.doesNotMatch(source, /alter table public\.profiles[\s\S]*last_seen/);
    assert.match(source, /create table if not exists public\.user_presence/);
  });
});
