import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20260807120000_forum_content_revisions.sql",
  ),
  "utf8",
);

describe("forum content revisions migration invariants", () => {
  it("adds version metadata and append-only revision tables", () => {
    assert.match(migration, /add column if not exists content_version/);
    assert.match(migration, /add column if not exists edited_at/);
    assert.match(migration, /create table if not exists public\.forum_thread_revisions/);
    assert.match(migration, /create table if not exists public\.forum_reply_revisions/);
    assert.match(
      migration,
      /constraint forum_thread_revisions_thread_version_unique unique \(thread_id, version\)/,
    );
    assert.match(
      migration,
      /constraint forum_reply_revisions_reply_version_unique unique \(reply_id, version\)/,
    );
  });

  it("archives old content via SECURITY DEFINER triggers with safe search_path", () => {
    assert.match(migration, /create or replace function public\.archive_forum_thread_revision/);
    assert.match(migration, /create or replace function public\.archive_forum_reply_revision/);
    assert.match(migration, /security definer/);
    assert.match(migration, /set search_path = ''/);
    assert.match(migration, /insert into public\.forum_thread_revisions/);
    assert.match(migration, /insert into public\.forum_reply_revisions/);
    assert.match(migration, /new\.slug := old\.slug/);
    assert.match(migration, /new\.author_id := old\.author_id/);
    assert.match(migration, /new\.thread_id := old\.thread_id/);
    assert.match(
      migration,
      /revoke all on function public\.archive_forum_thread_revision\(\) from anon, authenticated/,
    );
    assert.match(
      migration,
      /revoke all on function public\.archive_forum_reply_revision\(\) from anon, authenticated/,
    );
  });

  it("allows public read of revisions but no user write path", () => {
    assert.match(
      migration,
      /create policy "Forum thread revisions are publicly readable"/,
    );
    assert.match(
      migration,
      /create policy "Forum reply revisions are publicly readable"/,
    );
    assert.match(migration, /grant select on public\.forum_thread_revisions to anon, authenticated/);
    assert.match(migration, /grant select on public\.forum_reply_revisions to anon, authenticated/);
    assert.match(migration, /revoke all on public\.forum_thread_revisions from anon, authenticated/);
    assert.doesNotMatch(
      migration,
      /grant insert on public\.forum_thread_revisions/,
    );
    assert.doesNotMatch(
      migration,
      /grant update on public\.forum_thread_revisions/,
    );
    assert.doesNotMatch(
      migration,
      /grant delete on public\.forum_thread_revisions/,
    );
    assert.doesNotMatch(
      migration,
      /grant insert on public\.forum_reply_revisions/,
    );
  });

  it("limits author updates to content columns with ownership RLS", () => {
    assert.match(
      migration,
      /create policy "Authors can update their own forum threads"/,
    );
    assert.match(
      migration,
      /create policy "Authors can update their own forum replies"/,
    );
    assert.match(migration, /using \(author_id = auth\.uid\(\)\)/);
    assert.match(migration, /with check \(author_id = auth\.uid\(\)\)/);
    assert.match(
      migration,
      /grant update \(title, body\) on public\.forum_threads to authenticated/,
    );
    assert.match(
      migration,
      /grant update \(body\) on public\.forum_replies to authenticated/,
    );
  });
});

describe("forum edit application wiring", () => {
  it("exposes author-only Redigera and public revision history UI", () => {
    const actionRow = readFileSync(
      join(root, "components/forum/ForumPostActionRow.tsx"),
      "utf8",
    );
    const opening = readFileSync(
      join(root, "components/forum/ForumThreadOpening.tsx"),
      "utf8",
    );
    const post = readFileSync(join(root, "components/forum/ForumPost.tsx"), "utf8");
    const actions = readFileSync(join(root, "app/forum/actions.ts"), "utf8");

    assert.match(actionRow, /Redigera/);
    assert.match(opening, /canEditForumContent/);
    assert.match(opening, /isDemoContent/);
    assert.match(opening, /ForumRevisionHistoryModal/);
    assert.match(post, /canEditForumContent/);
    assert.match(post, /isDemoContent/);
    assert.match(actions, /updateForumThreadAction/);
    assert.match(actions, /updateForumReplyAction/);
    assert.match(actions, /Du kan bara redigera dina egna inlägg/);
    assert.match(actions, /fetchForumThreadRevisionHistoryAction/);
    assert.match(actions, /fetchForumReplyRevisionHistoryAction/);
  });

  it("keeps slug stable in the thread edit path", () => {
    const actions = readFileSync(join(root, "app/forum/actions.ts"), "utf8");
    assert.match(actions, /updateForumThreadAction/);
    assert.doesNotMatch(
      actions,
      /updateForumThreadAction[\s\S]*createForumThreadSlug/,
    );
    assert.match(
      actions,
      /\.update\(\{\s*title: titleValidation\.title,\s*body: bodyValidation\.body,\s*\}\)/,
    );
  });
});
