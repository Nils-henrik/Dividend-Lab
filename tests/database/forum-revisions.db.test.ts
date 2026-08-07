/**
 * Real database + RLS validation for forum content revisions.
 * Requires a running local Supabase instance with migrations applied.
 */
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const API_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

type TestUser = {
  id: string;
  email: string;
  password: string;
  username: string;
  client: SupabaseClient;
};

const admin = createClient(API_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function execSql(query: string): Promise<string> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  const candidateContainers = [
    process.env.SUPABASE_DB_CONTAINER,
    "supabase_db_Dividend-Lab",
    "supabase_db_dividend-lab",
    "supabase_db_workspace",
  ].filter(Boolean) as string[];

  let lastError: unknown;

  for (const container of candidateContainers) {
    try {
      const { stdout } = await execFileAsync(
        "docker",
        [
          "exec",
          "-i",
          container,
          "psql",
          "-U",
          "postgres",
          "-d",
          "postgres",
          "-v",
          "ON_ERROR_STOP=1",
          "-At",
          "-c",
          query,
        ],
        { maxBuffer: 10 * 1024 * 1024 },
      );
      return stdout.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to execute SQL against local Supabase database.");
}

async function createAuthedUser(
  label: string,
  username: string,
): Promise<TestUser> {
  const email = `${label}.${Date.now()}@example.com`;
  const password = "TestPass123!secure";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      legal_acceptance_confirmed: true,
      username,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Failed to create user ${label}: ${error?.message ?? "unknown error"}`,
    );
  }

  await execSql(`
    update public.profiles
    set
      username = '${username}',
      display_name = 'Test ${label.toUpperCase()}'
    where id = '${data.user.id}'
  `);

  const client = createClient(API_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error(`Failed to sign in ${label}: ${signInError.message}`);
  }

  return {
    id: data.user.id,
    email,
    password,
    username,
    client,
  };
}

let author: TestUser;
let other: TestUser;
let threadId = "";
let replyId = "";
const threadSlug = `edit-history-${Date.now()}`;
const createdIds: string[] = [];

before(async () => {
  author = await createAuthedUser("forum-edit-a", `fe_a_${Date.now() % 100000}`);
  other = await createAuthedUser("forum-edit-b", `fe_b_${Date.now() % 100000}`);
  createdIds.push(author.id, other.id);

  const { data: thread, error: threadError } = await author.client
    .from("forum_threads")
    .insert({
      slug: threadSlug,
      author_id: author.id,
      category_slug: "dividend-strategy",
      title: "Originalrubrik",
      body: "Originaltext i tråden",
    })
    .select("id, content_version, edited_at, slug")
    .single();

  if (threadError || !thread) {
    throw new Error(
      `Failed to create thread: ${threadError?.message ?? "unknown error"}`,
    );
  }

  threadId = thread.id;
  assert.equal(thread.content_version, 1);
  assert.equal(thread.edited_at, null);
  assert.equal(thread.slug, threadSlug);

  const { data: reply, error: replyError } = await author.client
    .from("forum_replies")
    .insert({
      thread_id: threadId,
      author_id: author.id,
      body: "Originalsvar",
    })
    .select("id, content_version, edited_at")
    .single();

  if (replyError || !reply) {
    throw new Error(
      `Failed to create reply: ${replyError?.message ?? "unknown error"}`,
    );
  }

  replyId = reply.id;
  assert.equal(reply.content_version, 1);
  assert.equal(reply.edited_at, null);
});

after(async () => {
  if (threadId) {
    await admin.from("forum_threads").delete().eq("id", threadId);
  }

  for (const userId of createdIds) {
    await admin.auth.admin.deleteUser(userId);
  }
});

describe("forum revision database behavior", () => {
  it("archives prior thread content on real edits and keeps slug stable", async () => {
    const { data, error } = await author.client
      .from("forum_threads")
      .update({
        title: "Uppdaterad rubrik",
        body: "Uppdaterad text i tråden",
      })
      .eq("id", threadId)
      .select("id, slug, title, body, content_version, edited_at, author_id")
      .single();

    assert.equal(error, null);
    assert.equal(data?.slug, threadSlug);
    assert.equal(data?.title, "Uppdaterad rubrik");
    assert.equal(data?.body, "Uppdaterad text i tråden");
    assert.equal(data?.content_version, 2);
    assert.ok(data?.edited_at);
    assert.equal(data?.author_id, author.id);

    const { data: revisions, error: revisionsError } = await createClient(
      API_URL,
      ANON_KEY,
    )
      .from("forum_thread_revisions")
      .select("version, title, body")
      .eq("thread_id", threadId)
      .order("version", { ascending: true });

    assert.equal(revisionsError, null);
    assert.equal(revisions?.length, 1);
    assert.equal(revisions?.[0]?.version, 1);
    assert.equal(revisions?.[0]?.title, "Originalrubrik");
    assert.equal(revisions?.[0]?.body, "Originaltext i tråden");
  });

  it("does not archive a no-op thread update", async () => {
    const before = await author.client
      .from("forum_thread_revisions")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);

    const { data, error } = await author.client
      .from("forum_threads")
      .update({
        title: "Uppdaterad rubrik",
        body: "Uppdaterad text i tråden",
      })
      .eq("id", threadId)
      .select("content_version")
      .single();

    assert.equal(error, null);
    assert.equal(data?.content_version, 2);

    const after = await author.client
      .from("forum_thread_revisions")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId);

    assert.equal(before.count, after.count);
  });

  it("prevents another user from editing the thread or reply", async () => {
    const { data: threadData, error: threadError } = await other.client
      .from("forum_threads")
      .update({
        title: "Hackad rubrik",
        body: "Hackad text",
      })
      .eq("id", threadId)
      .select("id");

    assert.equal(threadError, null);
    assert.equal(threadData?.length ?? 0, 0);

    const { data: replyData, error: replyError } = await other.client
      .from("forum_replies")
      .update({
        body: "Hackat svar",
      })
      .eq("id", replyId)
      .select("id");

    assert.equal(replyError, null);
    assert.equal(replyData?.length ?? 0, 0);
  });

  it("archives reply revisions and blocks ordinary write/delete on history", async () => {
    const { data, error } = await author.client
      .from("forum_replies")
      .update({ body: "Uppdaterat svar" })
      .eq("id", replyId)
      .select("body, content_version, edited_at")
      .single();

    assert.equal(error, null);
    assert.equal(data?.body, "Uppdaterat svar");
    assert.equal(data?.content_version, 2);
    assert.ok(data?.edited_at);

    const anon = createClient(API_URL, ANON_KEY);
    const { data: revisions, error: readError } = await anon
      .from("forum_reply_revisions")
      .select("version, body")
      .eq("reply_id", replyId);

    assert.equal(readError, null);
    assert.equal(revisions?.length, 1);
    assert.equal(revisions?.[0]?.body, "Originalsvar");

    const { error: insertError } = await author.client
      .from("forum_reply_revisions")
      .insert({
        reply_id: replyId,
        version: 99,
        body: "Forged",
      });
    assert.ok(insertError);

    const { error: updateError } = await author.client
      .from("forum_reply_revisions")
      .update({ body: "Changed history" })
      .eq("reply_id", replyId);
    assert.ok(updateError);

    const { error: deleteError } = await author.client
      .from("forum_reply_revisions")
      .delete()
      .eq("reply_id", replyId);
    assert.ok(deleteError);

    const { error: threadInsertError } = await author.client
      .from("forum_thread_revisions")
      .insert({
        thread_id: threadId,
        version: 99,
        title: "Forged",
        body: "Forged",
      });
    assert.ok(threadInsertError);

    const { error: threadDeleteError } = await author.client
      .from("forum_thread_revisions")
      .delete()
      .eq("thread_id", threadId);
    assert.ok(threadDeleteError);
  });

  it("does not allow authors to change slug or author_id via update grants", async () => {
    const { error } = await author.client
      .from("forum_threads")
      .update({
        slug: "hijacked-slug",
        author_id: other.id,
        title: "Uppdaterad rubrik igen",
      } as Record<string, string>)
      .eq("id", threadId);

    // Column-level grants should reject unknown/disallowed columns.
    assert.ok(error);

    const { data } = await admin
      .from("forum_threads")
      .select("slug, author_id, title")
      .eq("id", threadId)
      .single();

    assert.equal(data?.slug, threadSlug);
    assert.equal(data?.author_id, author.id);
  });
});
