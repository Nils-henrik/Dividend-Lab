/**
 * Real database + RLS validation for user notifications.
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

async function deleteUser(userId: string) {
  await admin.auth.admin.deleteUser(userId);
}

describe("user notifications", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;
  let threadId: string;
  let threadSlug: string;

  before(async () => {
    const suffix = Date.now().toString(36);
    userA = await createAuthedUser(`notify-a-${suffix}`, `notifya${suffix}`);
    userB = await createAuthedUser(`notify-b-${suffix}`, `notifyb${suffix}`);
    userC = await createAuthedUser(`notify-c-${suffix}`, `notifyc${suffix}`);

    threadSlug = `notify-thread-${suffix}`;
    const { data: thread, error } = await userA.client
      .from("forum_threads")
      .insert({
        slug: threadSlug,
        author_id: userA.id,
        category_slug: "dividend-strategy",
        title: "Notifikationstest",
        body: "Tråd skapad för notifieringsverifiering.",
      })
      .select("id")
      .single();

    if (error || !thread) {
      throw new Error(
        `Failed to create forum thread: ${error?.message ?? "unknown"}`,
      );
    }

    threadId = thread.id;
  });

  after(async () => {
    if (threadId) {
      await admin.from("forum_threads").delete().eq("id", threadId);
    }

    await Promise.allSettled([
      userA ? deleteUser(userA.id) : Promise.resolve(),
      userB ? deleteUser(userB.id) : Promise.resolve(),
      userC ? deleteUser(userC.id) : Promise.resolve(),
    ]);
  });

  it("creates a contact-request notification for the addressee only", async () => {
    const { data: connection, error } = await userB.client.rpc(
      "send_contact_request",
      { p_target_user_id: userA.id },
    );

    assert.equal(error, null);
    assert.ok(connection?.id);

    const { data: forA, error: errorA } = await userA.client
      .from("user_notifications")
      .select("*")
      .eq("type", "contact_request")
      .eq("entity_id", connection.id);

    assert.equal(errorA, null);
    assert.equal(forA?.length, 1);
    assert.equal(forA?.[0]?.recipient_id, userA.id);
    assert.equal(forA?.[0]?.actor_id, userB.id);
    assert.equal(forA?.[0]?.read_at, null);
    assert.match(
      forA?.[0]?.destination_path ?? "",
      /\/contacts\?tab=incoming/,
    );

    const { data: forB, error: errorB } = await userB.client
      .from("user_notifications")
      .select("id")
      .eq("type", "contact_request")
      .eq("entity_id", connection.id);

    assert.equal(errorB, null);
    assert.equal(forB?.length, 0);

    // Retry must not create duplicates.
    const { error: retryError } = await userB.client.rpc("send_contact_request", {
      p_target_user_id: userA.id,
    });
    assert.equal(retryError, null);

    const { data: afterRetry } = await userA.client
      .from("user_notifications")
      .select("id")
      .eq("type", "contact_request")
      .eq("entity_id", connection.id);

    assert.equal(afterRetry?.length, 1);

    const { error: acceptError } = await userA.client.rpc(
      "accept_contact_request",
      { p_connection_id: connection.id },
    );
    assert.equal(acceptError, null);

    const { data: afterAccept } = await userA.client
      .from("user_notifications")
      .select("read_at")
      .eq("entity_id", connection.id)
      .single();

    assert.ok(afterAccept?.read_at);
  });

  it("creates a forum-reply notification for the thread owner only", async () => {
    const { data: reply, error } = await userB.client
      .from("forum_replies")
      .insert({
        thread_id: threadId,
        author_id: userB.id,
        body: "Ett svar som ska skapa en notifikation.",
      })
      .select("id")
      .single();

    assert.equal(error, null);
    assert.ok(reply?.id);

    const { data: forA } = await userA.client
      .from("user_notifications")
      .select("*")
      .eq("type", "forum_reply")
      .eq("entity_id", reply.id);

    assert.equal(forA?.length, 1);
    assert.equal(forA?.[0]?.recipient_id, userA.id);
    assert.equal(
      forA?.[0]?.destination_path,
      `/forum/${threadSlug}#reply-${reply.id}`,
    );

    const { data: forB } = await userB.client
      .from("user_notifications")
      .select("id")
      .eq("entity_id", reply.id);

    assert.equal(forB?.length, 0);

    // Direct insert retry simulation via dedupe key uniqueness.
    await execSql(`
      insert into public.user_notifications (
        recipient_id, actor_id, type, entity_id, destination_path, payload, dedupe_key
      ) values (
        '${userA.id}',
        '${userB.id}',
        'forum_reply',
        '${reply.id}',
        '/forum/${threadSlug}#reply-${reply.id}',
        '{}'::jsonb,
        'forum_reply:${reply.id}:${userA.id}'
      )
      on conflict (dedupe_key) do nothing
    `);

    const { data: afterDedupe } = await userA.client
      .from("user_notifications")
      .select("id")
      .eq("entity_id", reply.id);
    assert.equal(afterDedupe?.length, 1);

    const { error: markError } = await userA.client.rpc(
      "mark_notification_read",
      { p_notification_id: forA?.[0]?.id },
    );
    assert.equal(markError, null);

    const { data: marked } = await userA.client
      .from("user_notifications")
      .select("read_at")
      .eq("id", forA?.[0]?.id)
      .single();
    assert.ok(marked?.read_at);
  });

  it("prevents reading or mutating another user's notifications", async () => {
    const { data: reply } = await userC.client
      .from("forum_replies")
      .insert({
        thread_id: threadId,
        author_id: userC.id,
        body: "Svar från användare C.",
      })
      .select("id")
      .single();

    const { data: ownerNotification } = await userA.client
      .from("user_notifications")
      .select("id")
      .eq("entity_id", reply?.id)
      .single();

    assert.ok(ownerNotification?.id);

    const { data: leaked } = await userB.client
      .from("user_notifications")
      .select("id")
      .eq("id", ownerNotification.id);

    assert.equal(leaked?.length, 0);

    const { error: forgeInsertError } = await userB.client
      .from("user_notifications")
      .insert({
        recipient_id: userA.id,
        actor_id: userB.id,
        type: "forum_reply",
        entity_id: reply?.id,
        destination_path: "/forum/forged",
        dedupe_key: `forged:${Date.now()}`,
      });

    assert.ok(forgeInsertError);

    const { error: forgeMarkError } = await userB.client.rpc(
      "mark_notification_read",
      { p_notification_id: ownerNotification.id },
    );
    assert.ok(forgeMarkError);
  });
});
