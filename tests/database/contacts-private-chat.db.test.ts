/**
 * Real database + RLS validation for contacts and private chat.
 * Requires a running local Supabase instance with migrations applied.
 *
 * Usage:
 *   node --experimental-strip-types --test tests/database/contacts-private-chat.db.test.ts
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
      `Failed to create user ${label}: ${error?.message ?? "unknown error"} ${JSON.stringify(error ?? {})}`,
    );
  }

  // Profile row is created by the auth trigger; set public fields via SQL as postgres.
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

async function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  query: string,
): Promise<{ rows: T[] }> {
  const wrapped = `select coalesce(json_agg(row_to_json(q)), '[]'::json)::text from (${query}) q`;
  const stdout = await execSql(wrapped);
  return { rows: JSON.parse(stdout || "[]") as T[] };
}

async function deleteUser(userId: string) {
  await admin.auth.admin.deleteUser(userId);
}

let userA: TestUser;
let userB: TestUser;
let userC: TestUser;
let pairAB: { low: string; high: string };

before(async () => {
  // Ensure local API is reachable.
  const health = await fetch(`${API_URL}/auth/v1/health`).catch(() => null);
  if (!health || !health.ok) {
    throw new Error(
      `Local Supabase Auth is not reachable at ${API_URL}. Start it with supabase start.`,
    );
  }

  const suffix = Date.now().toString(36);
  userA = await createAuthedUser("a", `contact_a_${suffix}`);
  userB = await createAuthedUser("b", `contact_b_${suffix}`);
  userC = await createAuthedUser("c", `contact_c_${suffix}`);
  pairAB = {
    low: userA.id < userB.id ? userA.id : userB.id,
    high: userA.id < userB.id ? userB.id : userA.id,
  };
});

after(async () => {
  if (userA?.id) await deleteUser(userA.id).catch(() => undefined);
  if (userB?.id) await deleteUser(userB.id).catch(() => undefined);
  if (userC?.id) await deleteUser(userC.id).catch(() => undefined);
});

describe("contacts: authorization and uniqueness", () => {
  it("rejects self contact requests", async () => {
    const { error } = await userA.client.rpc("send_contact_request", {
      p_target_user_id: userA.id,
    });
    assert.ok(error, "expected self-request to fail");
  });

  it("creates one pending request and rejects duplicate same-direction rows", async () => {
    const first = await userA.client.rpc("send_contact_request", {
      p_target_user_id: userB.id,
    });
    assert.equal(first.error, null, first.error?.message);
    const second = await userA.client.rpc("send_contact_request", {
      p_target_user_id: userB.id,
    });
    assert.equal(second.error, null, second.error?.message);
    assert.equal(first.data.id, second.data.id);

    const { rows } = await sql(
      `select count(*)::int as count from public.user_connections
       where user_low_id = '${pairAB.low}' and user_high_id = '${pairAB.high}'`,
    );
    assert.equal(rows[0].count, 1);
    assert.equal(first.data.status, "pending");
    assert.equal(first.data.requester_id, userA.id);
    assert.equal(first.data.addressee_id, userB.id);
  });

  it("does not create a second row for reversed pending requests", async () => {
    const reversed = await userB.client.rpc("send_contact_request", {
      p_target_user_id: userA.id,
    });
    assert.equal(reversed.error, null, reversed.error?.message);
    assert.equal(reversed.data.requester_id, userA.id);
    assert.equal(reversed.data.addressee_id, userB.id);

    const { rows } = await sql(
      `select count(*)::int as count from public.user_connections
       where user_low_id = '${pairAB.low}' and user_high_id = '${pairAB.high}'`,
    );
    assert.equal(rows[0].count, 1);
  });

  it("allows only participants to read the relationship row", async () => {
    const forA = await userA.client
      .from("user_connections")
      .select("id, status")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high);
    assert.equal(forA.error, null, forA.error?.message);
    assert.equal(forA.data?.length, 1);

    const forC = await userC.client
      .from("user_connections")
      .select("id, status")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high);
    assert.equal(forC.error, null, forC.error?.message);
    assert.equal(forC.data?.length, 0);
  });

  it("rejects client direct insert of accepted relationships", async () => {
    const { error } = await userA.client.from("user_connections").insert({
      requester_id: userA.id,
      addressee_id: userC.id,
      user_low_id: userA.id < userC.id ? userA.id : userC.id,
      user_high_id: userA.id < userC.id ? userC.id : userA.id,
      status: "accepted",
    });
    assert.ok(error, "direct insert should be denied");
  });

  it("rejects client status updates", async () => {
    const pending = await userA.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();
    const { error } = await userA.client
      .from("user_connections")
      .update({ status: "accepted" })
      .eq("id", pending.data!.id);
    assert.ok(error, "direct status update should be denied");
  });

  it("rejects participant id changes by clients", async () => {
    const pending = await userA.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();
    const { error } = await userA.client
      .from("user_connections")
      .update({ requester_id: userC.id, addressee_id: userA.id })
      .eq("id", pending.data!.id);
    assert.ok(error, "participant id update should be denied");
  });

  it("allows only the recipient to accept or decline", async () => {
    const pending = await userA.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();

    const senderAccept = await userA.client.rpc("accept_contact_request", {
      p_connection_id: pending.data!.id,
    });
    assert.ok(senderAccept.error, "sender must not accept");

    const senderDecline = await userA.client.rpc("decline_contact_request", {
      p_connection_id: pending.data!.id,
    });
    assert.ok(senderDecline.error, "sender must not decline");

    const cancelByRecipient = await userB.client.rpc("cancel_contact_request", {
      p_connection_id: pending.data!.id,
    });
    assert.ok(cancelByRecipient.error, "recipient must not cancel");
  });

  it("lets the sender cancel, then reconnect, then recipient decline", async () => {
    const row = await userA.client
      .from("user_connections")
      .select("id, status")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();

    const cancel = await userA.client.rpc("cancel_contact_request", {
      p_connection_id: row.data!.id,
    });
    assert.equal(cancel.error, null, cancel.error?.message);
    assert.equal(cancel.data.status, "cancelled");

    const reconnect = await userA.client.rpc("send_contact_request", {
      p_target_user_id: userB.id,
    });
    assert.equal(reconnect.error, null, reconnect.error?.message);
    assert.equal(reconnect.data.status, "pending");
    assert.equal(reconnect.data.requester_id, userA.id);
    assert.equal(reconnect.data.id, row.data!.id);

    const decline = await userB.client.rpc("decline_contact_request", {
      p_connection_id: reconnect.data.id,
    });
    assert.equal(decline.error, null, decline.error?.message);
    assert.equal(decline.data.status, "rejected");
  });

  it("supports reversed-direction reconnect after rejection", async () => {
    const reconnect = await userB.client.rpc("send_contact_request", {
      p_target_user_id: userA.id,
    });
    assert.equal(reconnect.error, null, reconnect.error?.message);
    assert.equal(reconnect.data.status, "pending");
    assert.equal(reconnect.data.requester_id, userB.id);
    assert.equal(reconnect.data.addressee_id, userA.id);

    const { rows } = await sql(
      `select count(*)::int as count from public.user_connections
       where user_low_id = '${pairAB.low}' and user_high_id = '${pairAB.high}'`,
    );
    assert.equal(rows[0].count, 1);
  });

  it("counts only accepted relationships for both users", async () => {
    const pendingCountA = await userA.client.rpc("get_accepted_contact_count", {
      p_user_id: userA.id,
    });
    const pendingCountB = await userB.client.rpc("get_accepted_contact_count", {
      p_user_id: userB.id,
    });
    assert.equal(Number(pendingCountA.data), 0);
    assert.equal(Number(pendingCountB.data), 0);

    const row = await userA.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();

    const accept = await userA.client.rpc("accept_contact_request", {
      p_connection_id: row.data!.id,
    });
    assert.equal(accept.error, null, accept.error?.message);

    const acceptedA = await userA.client.rpc("get_accepted_contact_count", {
      p_user_id: userA.id,
    });
    const acceptedB = await userB.client.rpc("get_accepted_contact_count", {
      p_user_id: userB.id,
    });
    assert.equal(Number(acceptedA.data), 1);
    assert.equal(Number(acceptedB.data), 1);
  });

  it("lets either accepted participant remove the contact and zero the counts", async () => {
    const row = await userB.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .single();

    const remove = await userB.client.rpc("remove_contact", {
      p_connection_id: row.data!.id,
    });
    assert.equal(remove.error, null, remove.error?.message);
    assert.equal(remove.data.status, "removed");

    const countA = await userA.client.rpc("get_accepted_contact_count", {
      p_user_id: userA.id,
    });
    const countB = await userB.client.rpc("get_accepted_contact_count", {
      p_user_id: userB.id,
    });
    assert.equal(Number(countA.data), 0);
    assert.equal(Number(countB.data), 0);
  });

  it("reconnects after removal on the same canonical pair", async () => {
    const reconnect = await userA.client.rpc("send_contact_request", {
      p_target_user_id: userB.id,
    });
    assert.equal(reconnect.error, null, reconnect.error?.message);
    assert.equal(reconnect.data.status, "pending");
    assert.equal(reconnect.data.requester_id, userA.id);

    const { rows } = await sql(
      `select count(*)::int as count from public.user_connections
       where user_low_id = '${pairAB.low}' and user_high_id = '${pairAB.high}'`,
    );
    assert.equal(rows[0].count, 1);
  });
});

describe("contacts: concurrent uniqueness", () => {
  it("keeps one row under concurrent send_contact_request storms", async () => {
    // Use A+C so it does not collide with the A+B lifecycle above.
    const pairLow = userA.id < userC.id ? userA.id : userC.id;
    const pairHigh = userA.id < userC.id ? userC.id : userA.id;

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        (index % 2 === 0 ? userA.client : userC.client).rpc(
          "send_contact_request",
          {
            p_target_user_id: index % 2 === 0 ? userC.id : userA.id,
          },
        ),
      ),
    );

    for (const result of results) {
      assert.equal(result.error, null, result.error?.message);
    }

    const { rows } = await sql(
      `select count(*)::int as count from public.user_connections
       where user_low_id = '${pairLow}' and user_high_id = '${pairHigh}'`,
    );
    assert.equal(rows[0].count, 1);
  });
});

describe("conversations and message requests", () => {
  let conversationId = "";

  it("creates one canonical message request for non-contacts", async () => {
    // Ensure A/B are not accepted contacts for this path.
    const connection = await userA.client
      .from("user_connections")
      .select("id, status")
      .eq("user_low_id", pairAB.low)
      .eq("user_high_id", pairAB.high)
      .maybeSingle();

    if (connection.data?.status === "pending") {
      await userA.client.rpc("cancel_contact_request", {
        p_connection_id: connection.data.id,
      });
    } else if (connection.data?.status === "accepted") {
      await userA.client.rpc("remove_contact", {
        p_connection_id: connection.data.id,
      });
    }

    const created = await userA.client.rpc("open_or_create_private_conversation", {
      p_target_user_id: userB.id,
      p_initial_body: "Hej, detta ar en meddelandeforfragan.",
      p_subject: null,
    });
    assert.equal(created.error, null, created.error?.message);
    conversationId = created.data as string;

    const again = await userA.client.rpc("open_or_create_private_conversation", {
      p_target_user_id: userB.id,
      p_initial_body: "Andra forsoeket ska inte skapa ny konversation.",
      p_subject: null,
    });
    assert.equal(again.error, null, again.error?.message);
    assert.equal(again.data, conversationId);

    const reversed = await userB.client.rpc(
      "open_or_create_private_conversation",
      {
        p_target_user_id: userA.id,
        p_initial_body: "Omvand riktning ska ateranvanda samma chat.",
        p_subject: null,
      },
    );
    // Recipient cannot send before acceptance; open may succeed but must reuse.
    assert.equal(reversed.data, conversationId);

    const { rows } = await sql(
      `select count(*)::int as count, max(status) as status
       from public.conversations
       where pair_user_low = '${pairAB.low}' and pair_user_high = '${pairAB.high}'`,
    );
    assert.equal(rows[0].count, 1);
    assert.equal(rows[0].status, "message_request");

    const messageCount = await sql(
      `select count(*)::int as count from public.messages where conversation_id = '${conversationId}'`,
    );
    assert.equal(messageCount.rows[0].count, 1);
  });

  it("rejects a second sender message before acceptance via RPC and direct insert", async () => {
    const rpc = await userA.client.rpc("send_private_message", {
      p_conversation_id: conversationId,
      p_body: "Detta ska blockeras.",
    });
    assert.ok(rpc.error, "second RPC message must fail");

    const direct = await userA.client.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userA.id,
      body: "Direkt insert ska ocksa blockeras.",
    });
    assert.ok(direct.error, "direct insert must fail before acceptance");
  });

  it("hides the conversation from unrelated users", async () => {
    const conversation = await userC.client
      .from("conversations")
      .select("id")
      .eq("id", conversationId);
    assert.equal(conversation.data?.length, 0);

    const messages = await userC.client
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId);
    assert.equal(messages.data?.length, 0);
  });

  it("rejects forged sender ids on insert", async () => {
    const forged = await userA.client.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userB.id,
      body: "Forged sender",
    });
    assert.ok(forged.error, "forged sender_id must be rejected");
  });

  it("allows only the recipient to accept/ignore/decline", async () => {
    const senderAccept = await userA.client.rpc("accept_message_request", {
      p_conversation_id: conversationId,
    });
    assert.ok(senderAccept.error, "sender must not accept");

    const senderIgnore = await userA.client.rpc("ignore_message_request", {
      p_conversation_id: conversationId,
    });
    assert.ok(senderIgnore.error, "sender must not ignore");

    const senderDecline = await userA.client.rpc("decline_message_request", {
      p_conversation_id: conversationId,
    });
    assert.ok(senderDecline.error, "sender must not decline");
  });

  it("accepts the request without creating a contact relationship", async () => {
    const beforeA = await userA.client.rpc("get_accepted_contact_count", {
      p_user_id: userA.id,
    });
    const beforeB = await userB.client.rpc("get_accepted_contact_count", {
      p_user_id: userB.id,
    });

    const accept = await userB.client.rpc("accept_message_request", {
      p_conversation_id: conversationId,
    });
    assert.equal(accept.error, null, accept.error?.message);
    assert.equal(accept.data.status, "active");

    const afterA = await userA.client.rpc("get_accepted_contact_count", {
      p_user_id: userA.id,
    });
    const afterB = await userB.client.rpc("get_accepted_contact_count", {
      p_user_id: userB.id,
    });
    assert.equal(Number(afterA.data), Number(beforeA.data));
    assert.equal(Number(afterB.data), Number(beforeB.data));

    const contacts = await sql(
      `select status from public.user_connections
       where user_low_id = '${pairAB.low}' and user_high_id = '${pairAB.high}'`,
    );
    assert.notEqual(contacts.rows[0]?.status, "accepted");
  });

  it("allows both participants to send after acceptance and preserves history", async () => {
    const fromB = await userB.client.rpc("send_private_message", {
      p_conversation_id: conversationId,
      p_body: "Accepterat. Haller med.",
    });
    assert.equal(fromB.error, null, fromB.error?.message);

    const fromA = await userA.client.rpc("send_private_message", {
      p_conversation_id: conversationId,
      p_body: "Perfekt, vi fortsatter.",
    });
    assert.equal(fromA.error, null, fromA.error?.message);

    const messages = await userA.client
      .from("messages")
      .select("body")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    assert.equal(messages.error, null, messages.error?.message);
    assert.ok((messages.data?.length ?? 0) >= 3);
    assert.equal(
      messages.data?.[0]?.body,
      "Hej, detta ar en meddelandeforfragan.",
    );
  });
});

describe("contact and chat independence", () => {
  it("activates an existing request when users become contacts and never duplicates", async () => {
    // Create a fresh pair using service cleanup of A-C conversation if needed.
    // Use B as sender to C for an isolated pending chat, then accept contact.
    const created = await userB.client.rpc("open_or_create_private_conversation", {
      p_target_user_id: userC.id,
      p_initial_body: "Request innan kontakt.",
      p_subject: null,
    });
    assert.equal(created.error, null, created.error?.message);
    const conversationId = created.data as string;

    const request = await userB.client.rpc("send_contact_request", {
      p_target_user_id: userC.id,
    });
    assert.equal(request.error, null, request.error?.message);

    const accept = await userC.client.rpc("accept_contact_request", {
      p_connection_id: request.data.id,
    });
    assert.equal(accept.error, null, accept.error?.message);

    const conversation = await sql(
      `select status from public.conversations where id = '${conversationId}'`,
    );
    assert.equal(conversation.rows[0].status, "active");

    const reopen = await userB.client.rpc("open_or_create_private_conversation", {
      p_target_user_id: userC.id,
      p_initial_body: null,
      p_subject: null,
    });
    assert.equal(reopen.error, null, reopen.error?.message);
    assert.equal(reopen.data, conversationId);

    const pairLow = userB.id < userC.id ? userB.id : userC.id;
    const pairHigh = userB.id < userC.id ? userC.id : userB.id;
    const count = await sql(
      `select count(*)::int as count from public.conversations
       where pair_user_low = '${pairLow}' and pair_user_high = '${pairHigh}'`,
    );
    assert.equal(count.rows[0].count, 1);
  });

  it("preserves active chat and messages after contact removal", async () => {
    const pairLow = userB.id < userC.id ? userB.id : userC.id;
    const pairHigh = userB.id < userC.id ? userC.id : userB.id;

    const connection = await userB.client
      .from("user_connections")
      .select("id")
      .eq("user_low_id", pairLow)
      .eq("user_high_id", pairHigh)
      .single();

    const conversation = await sql(
      `select id, status from public.conversations
       where pair_user_low = '${pairLow}' and pair_user_high = '${pairHigh}'`,
    );
    const conversationId = conversation.rows[0].id as string;
    const beforeMessages = await sql(
      `select count(*)::int as count from public.messages where conversation_id = '${conversationId}'`,
    );

    const remove = await userB.client.rpc("remove_contact", {
      p_connection_id: connection.data!.id,
    });
    assert.equal(remove.error, null, remove.error?.message);

    const afterConversation = await sql(
      `select status from public.conversations where id = '${conversationId}'`,
    );
    assert.equal(afterConversation.rows[0].status, "active");

    const afterMessages = await sql(
      `select count(*)::int as count from public.messages where conversation_id = '${conversationId}'`,
    );
    assert.equal(afterMessages.rows[0].count, beforeMessages.rows[0].count);

    const stillSend = await userB.client.rpc("send_private_message", {
      p_conversation_id: conversationId,
      p_body: "Fortsatt aktiv chat efter borttagen kontakt.",
    });
    assert.equal(stillSend.error, null, stillSend.error?.message);
  });
});

describe("ignored and declined message-request lifecycle", () => {
  it("keeps ignored requests non-spammy and reusable after contacts", async () => {
    const suffix = Date.now().toString(36);
    const sender = await createAuthedUser(`ign_s_${suffix}`, `ign_s_${suffix}`);
    const recipient = await createAuthedUser(
      `ign_r_${suffix}`,
      `ign_r_${suffix}`,
    );

    try {
      const created = await sender.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: recipient.id,
          p_initial_body: "Ignorera denna forfragan.",
          p_subject: null,
        },
      );
      assert.equal(created.error, null, created.error?.message);
      const conversationId = created.data as string;

      const ignore = await recipient.client.rpc("ignore_message_request", {
        p_conversation_id: conversationId,
      });
      assert.equal(ignore.error, null, ignore.error?.message);
      assert.equal(ignore.data.status, "ignored");

      const second = await sender.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: recipient.id,
          p_initial_body: "Nytt spamforsok.",
          p_subject: null,
        },
      );
      assert.equal(second.error, null, second.error?.message);
      assert.equal(second.data, conversationId);

      const messageCount = await sql(
        `select count(*)::int as count from public.messages where conversation_id = '${conversationId}'`,
      );
      assert.equal(messageCount.rows[0].count, 1);

      const status = await sql(
        `select status from public.conversations where id = '${conversationId}'`,
      );
      assert.equal(status.rows[0].status, "ignored");

      const contact = await sender.client.rpc("send_contact_request", {
        p_target_user_id: recipient.id,
      });
      assert.equal(contact.error, null, contact.error?.message);
      const acceptContact = await recipient.client.rpc("accept_contact_request", {
        p_connection_id: contact.data.id,
      });
      assert.equal(acceptContact.error, null, acceptContact.error?.message);

      // Becoming contacts should activate ignored conversation when opened.
      const reopen = await sender.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: recipient.id,
          p_initial_body: null,
          p_subject: null,
        },
      );
      assert.equal(reopen.error, null, reopen.error?.message);
      assert.equal(reopen.data, conversationId);

      const activated = await sql(
        `select status from public.conversations where id = '${conversationId}'`,
      );
      assert.equal(activated.rows[0].status, "active");

      const preserved = await sql(
        `select count(*)::int as count from public.messages where conversation_id = '${conversationId}'`,
      );
      assert.equal(preserved.rows[0].count, 1);
    } finally {
      await deleteUser(sender.id).catch(() => undefined);
      await deleteUser(recipient.id).catch(() => undefined);
    }
  });

  it("keeps declined requests locked until users become contacts", async () => {
    const suffix = Date.now().toString(36);
    const sender = await createAuthedUser(`dec_s_${suffix}`, `dec_s_${suffix}`);
    const recipient = await createAuthedUser(
      `dec_r_${suffix}`,
      `dec_r_${suffix}`,
    );

    try {
      const created = await sender.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: recipient.id,
          p_initial_body: "Neka denna forfragan.",
          p_subject: null,
        },
      );
      const conversationId = created.data as string;

      const decline = await recipient.client.rpc("decline_message_request", {
        p_conversation_id: conversationId,
      });
      assert.equal(decline.error, null, decline.error?.message);

      const blocked = await sender.client.rpc("send_private_message", {
        p_conversation_id: conversationId,
        p_body: "Ska blockeras efter nekning.",
      });
      assert.ok(blocked.error);

      const contact = await sender.client.rpc("send_contact_request", {
        p_target_user_id: recipient.id,
      });
      await recipient.client.rpc("accept_contact_request", {
        p_connection_id: contact.data.id,
      });

      const reopen = await sender.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: recipient.id,
          p_initial_body: null,
          p_subject: null,
        },
      );
      assert.equal(reopen.data, conversationId);
      const status = await sql(
        `select status from public.conversations where id = '${conversationId}'`,
      );
      assert.equal(status.rows[0].status, "active");
    } finally {
      await deleteUser(sender.id).catch(() => undefined);
      await deleteUser(recipient.id).catch(() => undefined);
    }
  });
});

describe("privacy probes: contact graph and conversation membership", () => {
  it("lets A and B check their own accepted-contact relationship", async () => {
    const suffix = Date.now().toString(36);
    const left = await createAuthedUser(`priv_a_${suffix}`, `priv_a_${suffix}`);
    const right = await createAuthedUser(`priv_b_${suffix}`, `priv_b_${suffix}`);
    const stranger = await createAuthedUser(
      `priv_c_${suffix}`,
      `priv_c_${suffix}`,
    );

    try {
      const request = await left.client.rpc("send_contact_request", {
        p_target_user_id: right.id,
      });
      assert.equal(request.error, null, request.error?.message);
      const accept = await right.client.rpc("accept_contact_request", {
        p_connection_id: request.data.id,
      });
      assert.equal(accept.error, null, accept.error?.message);

      const fromA = await left.client.rpc("are_accepted_contacts", {
        p_user_a: left.id,
        p_user_b: right.id,
      });
      assert.equal(fromA.error, null, fromA.error?.message);
      assert.equal(fromA.data, true);

      const fromB = await right.client.rpc("are_accepted_contacts", {
        p_user_a: left.id,
        p_user_b: right.id,
      });
      assert.equal(fromB.error, null, fromB.error?.message);
      assert.equal(fromB.data, true);

      // Unrelated User C must not learn whether A and B are contacts.
      const fromCTruePair = await stranger.client.rpc("are_accepted_contacts", {
        p_user_a: left.id,
        p_user_b: right.id,
      });
      assert.equal(fromCTruePair.error, null, fromCTruePair.error?.message);
      assert.equal(fromCTruePair.data, false);

      const fromCReversed = await stranger.client.rpc("are_accepted_contacts", {
        p_user_a: right.id,
        p_user_b: left.id,
      });
      assert.equal(fromCReversed.data, false);

      // Counts remain public aggregates only (no relationship rows).
      const count = await stranger.client.rpc("get_accepted_contact_count", {
        p_user_id: left.id,
      });
      assert.equal(count.error, null, count.error?.message);
      assert.equal(Number(count.data), 1);

      const relationshipRows = await stranger.client
        .from("user_connections")
        .select("id, status, requester_id, addressee_id")
        .or(
          `requester_id.eq.${left.id},addressee_id.eq.${left.id},user_low_id.eq.${left.id},user_high_id.eq.${left.id}`,
        );
      assert.equal(relationshipRows.data?.length, 0);

      // Hardened contact check must not break contact-based chat activation.
      const conversation = await left.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: right.id,
          p_initial_body: null,
          p_subject: null,
        },
      );
      assert.equal(conversation.error, null, conversation.error?.message);
      const status = await sql(
        `select status from public.conversations where id = '${conversation.data}'`,
      );
      assert.equal(status.rows[0].status, "active");
    } finally {
      await deleteUser(left.id).catch(() => undefined);
      await deleteUser(right.id).catch(() => undefined);
      await deleteUser(stranger.id).catch(() => undefined);
    }
  });

  it("prevents unrelated User C from probing A-B conversation membership", async () => {
    const suffix = Date.now().toString(36);
    const left = await createAuthedUser(`memb_a_${suffix}`, `memb_a_${suffix}`);
    const right = await createAuthedUser(`memb_b_${suffix}`, `memb_b_${suffix}`);
    const stranger = await createAuthedUser(
      `memb_c_${suffix}`,
      `memb_c_${suffix}`,
    );

    try {
      const created = await left.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: right.id,
          p_initial_body: "Private membership probe target.",
          p_subject: null,
        },
      );
      assert.equal(created.error, null, created.error?.message);
      const conversationId = created.data as string;

      const selfCheck = await left.client.rpc("is_conversation_participant", {
        check_conversation_id: conversationId,
        check_user_id: left.id,
      });
      assert.equal(selfCheck.error, null, selfCheck.error?.message);
      assert.equal(selfCheck.data, true);

      const peerSelfCheck = await right.client.rpc(
        "is_conversation_participant",
        {
          check_conversation_id: conversationId,
          check_user_id: right.id,
        },
      );
      assert.equal(peerSelfCheck.data, true);

      const probeOtherUser = await stranger.client.rpc(
        "is_conversation_participant",
        {
          check_conversation_id: conversationId,
          check_user_id: left.id,
        },
      );
      assert.equal(probeOtherUser.error, null, probeOtherUser.error?.message);
      assert.equal(probeOtherUser.data, false);

      const probeSelfOnForeign = await stranger.client.rpc(
        "is_conversation_participant",
        {
          check_conversation_id: conversationId,
          check_user_id: stranger.id,
        },
      );
      assert.equal(probeSelfOnForeign.data, false);

      const canSendProbe = await stranger.client.rpc(
        "can_send_private_message",
        {
          p_conversation_id: conversationId,
          p_user_id: left.id,
        },
      );
      assert.equal(canSendProbe.data, false);
    } finally {
      await deleteUser(left.id).catch(() => undefined);
      await deleteUser(right.id).catch(() => undefined);
      await deleteUser(stranger.id).catch(() => undefined);
    }
  });
});

describe("conversation concurrent uniqueness", () => {
  it("creates exactly one conversation and one initial message under same-direction concurrency", async () => {
    const suffix = Date.now().toString(36);
    const left = await createAuthedUser(`conc_s_${suffix}`, `conc_s_${suffix}`);
    const right = await createAuthedUser(`conc_t_${suffix}`, `conc_t_${suffix}`);

    try {
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          left.client.rpc("open_or_create_private_conversation", {
            p_target_user_id: right.id,
            p_initial_body: `Same-direction concurrent message ${index}`,
            p_subject: null,
          }),
        ),
      );

      const ids = results
        .filter((result) => !result.error && result.data)
        .map((result) => result.data as string);
      assert.ok(ids.length >= 1);
      assert.equal(new Set(ids).size, 1);

      const pairLow = left.id < right.id ? left.id : right.id;
      const pairHigh = left.id < right.id ? right.id : left.id;
      const conversations = await sql(
        `select count(*)::int as count from public.conversations
         where pair_user_low = '${pairLow}' and pair_user_high = '${pairHigh}'`,
      );
      assert.equal(conversations.rows[0].count, 1);

      const messages = await sql(
        `select count(*)::int as count from public.messages m
         join public.conversations c on c.id = m.conversation_id
         where c.pair_user_low = '${pairLow}' and c.pair_user_high = '${pairHigh}'`,
      );
      assert.equal(messages.rows[0].count, 1);

      const direct = await left.client.from("messages").insert({
        conversation_id: ids[0],
        sender_id: left.id,
        body: "Direct client insert must not add another pending request message.",
      });
      assert.ok(direct.error, "direct insert must fail while request is pending");

      const afterDirect = await sql(
        `select count(*)::int as count from public.messages where conversation_id = '${ids[0]}'`,
      );
      assert.equal(afterDirect.rows[0].count, 1);
    } finally {
      await deleteUser(left.id).catch(() => undefined);
      await deleteUser(right.id).catch(() => undefined);
    }
  });

  it("creates exactly one conversation and one initial message under reversed-direction concurrency", async () => {
    const suffix = Date.now().toString(36);
    const left = await createAuthedUser(`conc_l_${suffix}`, `conc_l_${suffix}`);
    const right = await createAuthedUser(`conc_r_${suffix}`, `conc_r_${suffix}`);

    try {
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, index) =>
          (index % 2 === 0 ? left.client : right.client).rpc(
            "open_or_create_private_conversation",
            {
              p_target_user_id: index % 2 === 0 ? right.id : left.id,
              p_initial_body: `Reversed concurrent message ${index}`,
              p_subject: null,
            },
          ),
        ),
      );

      const ids = results
        .filter((result) => !result.error && result.data)
        .map((result) => result.data as string);
      assert.ok(ids.length >= 1);
      assert.equal(new Set(ids).size, 1);

      const pairLow = left.id < right.id ? left.id : right.id;
      const pairHigh = left.id < right.id ? right.id : left.id;
      const count = await sql(
        `select count(*)::int as count from public.conversations
         where pair_user_low = '${pairLow}' and pair_user_high = '${pairHigh}'`,
      );
      assert.equal(count.rows[0].count, 1);

      const messageCount = await sql(
        `select count(*)::int as count from public.messages m
         join public.conversations c on c.id = m.conversation_id
         where c.pair_user_low = '${pairLow}' and c.pair_user_high = '${pairHigh}'`,
      );
      assert.equal(messageCount.rows[0].count, 1);

      const direct = await left.client.from("messages").insert({
        conversation_id: ids[0],
        sender_id: left.id,
        body: "Extra pending request via direct insert.",
      });
      assert.ok(direct.error);
      const after = await sql(
        `select count(*)::int as count from public.messages where conversation_id = '${ids[0]}'`,
      );
      assert.equal(after.rows[0].count, 1);
    } finally {
      await deleteUser(left.id).catch(() => undefined);
      await deleteUser(right.id).catch(() => undefined);
    }
  });
});

describe("account deletion foreign keys", () => {
  it("removes contact relationships for a deleted account without wiping peer message rows from others", async () => {
    const suffix = Date.now().toString(36);
    const doomed = await createAuthedUser(`doom_${suffix}`, `doom_${suffix}`);
    const survivor = await createAuthedUser(`surv_${suffix}`, `surv_${suffix}`);

    try {
      const contact = await doomed.client.rpc("send_contact_request", {
        p_target_user_id: survivor.id,
      });
      await survivor.client.rpc("accept_contact_request", {
        p_connection_id: contact.data.id,
      });

      const conversation = await doomed.client.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: survivor.id,
          p_initial_body: null,
          p_subject: null,
        },
      );
      const conversationId = conversation.data as string;
      await doomed.client.rpc("send_private_message", {
        p_conversation_id: conversationId,
        p_body: "Meddelande fran doomed.",
      });
      await survivor.client.rpc("send_private_message", {
        p_conversation_id: conversationId,
        p_body: "Meddelande fran survivor.",
      });

      const beforeCount = await survivor.client.rpc(
        "get_accepted_contact_count",
        { p_user_id: survivor.id },
      );
      assert.equal(Number(beforeCount.data), 1);

      await deleteUser(doomed.id);

      const afterCount = await survivor.client.rpc(
        "get_accepted_contact_count",
        { p_user_id: survivor.id },
      );
      assert.equal(Number(afterCount.data), 0);

      const connections = await sql(
        `select count(*)::int as count from public.user_connections
         where requester_id = '${doomed.id}' or addressee_id = '${doomed.id}'
            or user_low_id = '${doomed.id}' or user_high_id = '${doomed.id}'`,
      );
      assert.equal(connections.rows[0].count, 0);

      // Existing schema cascades deleted sender messages; survivor messages remain.
      const survivorMessages = await sql(
        `select count(*)::int as count, coalesce(bool_and(sender_id = '${survivor.id}'), true) as only_survivor
         from public.messages where conversation_id = '${conversationId}'`,
      );
      assert.equal(survivorMessages.rows[0].only_survivor, true);
      assert.equal(survivorMessages.rows[0].count, 1);
    } finally {
      await deleteUser(survivor.id).catch(() => undefined);
    }
  });
});
