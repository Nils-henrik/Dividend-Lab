/**
 * Real database + RLS validation for contact-scoped presence.
 * Requires a running local Supabase instance with migrations applied.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
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
  client: SupabaseClient;
};

const admin = createClient(API_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAuthedUser(label: string): Promise<TestUser> {
  const email = `${label}.${Date.now()}@example.com`;
  const password = "TestPass123!secure";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { legal_acceptance_confirmed: true },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  const client = createClient(API_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(signInError.message);
  }

  return { id: data.user.id, client };
}

let userA: TestUser;
let userB: TestUser;
let userC: TestUser;
const anon = createClient(API_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

before(async () => {
  const health = await fetch(`${API_URL}/auth/v1/health`).catch(() => null);
  if (!health || !health.ok) {
    throw new Error(
      `Local Supabase Auth is not reachable at ${API_URL}. Start it with supabase start.`,
    );
  }

  userA = await createAuthedUser("presence-a");
  userB = await createAuthedUser("presence-b");
  userC = await createAuthedUser("presence-c");

  const request = await userA.client.rpc("send_contact_request", {
    p_target_user_id: userB.id,
  });
  if (request.error) {
    throw new Error(request.error.message);
  }
  const accept = await userB.client.rpc("accept_contact_request", {
    p_connection_id: request.data.id,
  });
  if (accept.error) {
    throw new Error(accept.error.message);
  }
});

after(async () => {
  if (userA?.id) await admin.auth.admin.deleteUser(userA.id).catch(() => undefined);
  if (userB?.id) await admin.auth.admin.deleteUser(userB.id).catch(() => undefined);
  if (userC?.id) await admin.auth.admin.deleteUser(userC.id).catch(() => undefined);
});

describe("presence RLS", () => {
  it("lets an accepted contact read enabled presence", async () => {
    const beat = await userA.client.rpc("heartbeat_user_presence");
    assert.equal(beat.error, null, beat.error?.message);

    const visible = await userB.client
      .from("user_presence")
      .select("user_id, last_seen_at, share_active_status")
      .eq("user_id", userA.id);
    assert.equal(visible.error, null, visible.error?.message);
    assert.equal(visible.data?.length, 1);
    assert.equal(visible.data?.[0]?.share_active_status, true);
    assert.ok(visible.data?.[0]?.last_seen_at);
  });

  it("keeps a readable tombstone row when sharing is disabled", async () => {
    const disabled = await userA.client.rpc("set_share_active_status", {
      p_enabled: false,
    });
    assert.equal(disabled.error, null, disabled.error?.message);

    const hidden = await userB.client
      .from("user_presence")
      .select("user_id, last_seen_at, share_active_status")
      .eq("user_id", userA.id);
    assert.equal(hidden.error, null, hidden.error?.message);
    assert.equal(hidden.data?.length, 1);
    assert.equal(hidden.data?.[0]?.share_active_status, false);
    assert.equal(hidden.data?.[0]?.last_seen_at, null);
  });

  it("does not repopulate last_seen_at while sharing is disabled", async () => {
    const beat = await userA.client.rpc("heartbeat_user_presence");
    assert.equal(beat.error, null, beat.error?.message);

    const hidden = await userB.client
      .from("user_presence")
      .select("last_seen_at, share_active_status")
      .eq("user_id", userA.id)
      .single();
    assert.equal(hidden.error, null, hidden.error?.message);
    assert.equal(hidden.data?.share_active_status, false);
    assert.equal(hidden.data?.last_seen_at, null);
  });

  it("restores a fresh timestamp when sharing is re-enabled", async () => {
    const enabled = await userA.client.rpc("set_share_active_status", {
      p_enabled: true,
    });
    assert.equal(enabled.error, null, enabled.error?.message);

    const visible = await userB.client
      .from("user_presence")
      .select("last_seen_at, share_active_status")
      .eq("user_id", userA.id)
      .single();
    assert.equal(visible.error, null, visible.error?.message);
    assert.equal(visible.data?.share_active_status, true);
    assert.ok(visible.data?.last_seen_at);
  });

  it("hides presence from unrelated authenticated users", async () => {
    const hidden = await userC.client
      .from("user_presence")
      .select("user_id, last_seen_at")
      .eq("user_id", userA.id);
    assert.equal(hidden.error, null, hidden.error?.message);
    assert.equal(hidden.data?.length, 0);
  });

  it("hides presence from anonymous users", async () => {
    const hidden = await anon
      .from("user_presence")
      .select("user_id, last_seen_at")
      .eq("user_id", userA.id);
    assert.ok(hidden.error || (hidden.data?.length ?? 0) === 0);
  });

  it("rejects direct client writes", async () => {
    const inserted = await userA.client.from("user_presence").insert({
      user_id: userA.id,
      last_seen_at: new Date().toISOString(),
      share_active_status: true,
    });
    assert.ok(inserted.error, "direct insert should be denied");
  });
});
