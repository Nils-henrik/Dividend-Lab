#!/usr/bin/env node
/**
 * Real migration/backfill test for legacy duplicate 1:1 conversations.
 *
 * Starts from the schema immediately before
 * 20260728213100_enhance_private_conversations.sql, seeds two historical
 * conversations for the same user pair, applies the enhancement migration,
 * and asserts consolidation into one canonical conversation.
 *
 * Requires local Supabase DB container. Destructive: runs `supabase db reset`.
 * Seeds users via SQL so Auth API availability is not required for the test body.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import os from "node:os";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const ENHANCE_NAME = "20260728213100_enhance_private_conversations.sql";
const ENHANCE_PATH = path.join(MIGRATIONS_DIR, ENHANCE_NAME);
const HOLD_PATH = path.join(os.tmpdir(), ENHANCE_NAME);

async function run(command, args, options = {}) {
  // Windows: npx is a .cmd shim; execFile needs npx.cmd + shell.
  const winNpx = process.platform === "win32" && command === "npx";
  const { stdout, stderr } = await execFileAsync(winNpx ? "npx.cmd" : command, args, {
    cwd: ROOT,
    maxBuffer: 20 * 1024 * 1024,
    shell: winNpx,
    ...options,
  });
  return { stdout: stdout?.toString() ?? "", stderr: stderr?.toString() ?? "" };
}

async function execSql(query) {
  const { stdout } = await run("docker", [
    "exec",
    "-i",
    "supabase_db_workspace",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-q",
    "-At",
    "-c",
    query,
  ]);
  const lines = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^(INSERT|UPDATE|DELETE|SELECT)\b/i.test(line));
  return lines.join("\n").trim();
}

async function sqlRows(query) {
  const wrapped = `select coalesce(json_agg(row_to_json(q)), '[]'::json)::text from (${query}) q`;
  const stdout = await execSql(wrapped);
  return JSON.parse(stdout || "[]");
}

async function waitForDb(retries = 60) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const ready = await execSql("select 1");
      if (ready === "1") return;
    } catch {
      // still restarting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Postgres is not reachable in supabase_db_workspace");
}

async function createUser(label) {
  const id = randomUUID();
  const email = `legacy.${label}.${Date.now()}@example.com`;
  const username = `lg${label}${Date.now().toString(36).slice(-8)}`.slice(0, 20);

  // Insert auth user + identity; profile trigger should create the profile row.
  await execSql(`
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      '${id}',
      'authenticated',
      'authenticated',
      '${email}',
      crypt('TestPass123!secure', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"legal_acceptance_confirmed": true}'::jsonb,
      now(),
      now()
    )
  `);

  await execSql(`
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      '${id}',
      '${id}',
      jsonb_build_object('sub', '${id}', 'email', '${email}'),
      'email',
      '${id}',
      now(),
      now(),
      now()
    )
  `);

  // Ensure profile exists and has a valid username (trigger may already insert).
  await execSql(`
    insert into public.profiles (id, username, display_name)
    values ('${id}', '${username}', 'Legacy ${label.toUpperCase()}')
    on conflict (id) do update
      set username = excluded.username,
          display_name = excluded.display_name
  `);

  return id;
}

async function main() {
  console.log("== legacy duplicate conversation migration test ==");

  await fs.rename(ENHANCE_PATH, HOLD_PATH);
  let enhanceRestored = false;

  try {
    console.log("Resetting database without enhance migration...");
    await run("npx", ["supabase", "db", "reset", "--yes"], {
      env: process.env,
    });
    await waitForDb();

    const hasPair = await execSql(`
      select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'conversations'
          and column_name = 'pair_user_low'
      )
    `);
    assert.equal(
      hasPair,
      "f",
      "pair columns must not exist before enhance migration",
    );

    const userA = await createUser("a");
    const userB = await createUser("b");
    const userC = await createUser("c");

    const expectedCanonical = await execSql(`
      insert into public.conversations (subject, created_at, updated_at)
      values ('Oldest subject', '2024-01-01 10:00:00+00', '2024-01-01 10:00:00+00')
      returning id::text
    `);
    const duplicateId = await execSql(`
      insert into public.conversations (subject, created_at, updated_at)
      values ('Newer duplicate', '2024-06-01 12:00:00+00', '2024-06-01 12:00:00+00')
      returning id::text
    `);
    const unrelatedId = await execSql(`
      insert into public.conversations (subject, created_at, updated_at)
      values ('Unrelated trio', '2024-03-01 09:00:00+00', '2024-03-01 09:00:00+00')
      returning id::text
    `);

    await execSql(`
      insert into public.conversation_participants (conversation_id, user_id, last_read_at)
      values
        ('${expectedCanonical}', '${userA}', '2024-01-02 08:00:00+00'),
        ('${expectedCanonical}', '${userB}', '2024-01-03 09:00:00+00'),
        ('${duplicateId}', '${userA}', '2024-06-10 11:00:00+00'),
        ('${duplicateId}', '${userB}', '2024-06-05 10:00:00+00'),
        ('${unrelatedId}', '${userA}', null),
        ('${unrelatedId}', '${userB}', null),
        ('${unrelatedId}', '${userC}', null)
    `);

    await execSql(`
      insert into public.messages (conversation_id, sender_id, body, created_at)
      values
        ('${expectedCanonical}', '${userA}', 'First historical message', '2024-01-01 10:05:00+00'),
        ('${expectedCanonical}', '${userB}', 'Reply in oldest conversation', '2024-01-01 11:00:00+00'),
        ('${duplicateId}', '${userA}', 'Message in newer duplicate', '2024-06-01 12:05:00+00'),
        ('${duplicateId}', '${userB}', 'Later reply in duplicate', '2024-06-01 13:00:00+00'),
        ('${unrelatedId}', '${userC}', 'Unrelated group message', '2024-03-01 09:05:00+00')
    `);

    const abBefore = await sqlRows(`
      select c.id::text as id
      from public.conversations c
      where (
        select count(*) from public.conversation_participants cp where cp.conversation_id = c.id
      ) = 2
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = '${userA}'
        )
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = '${userB}'
        )
      order by c.created_at asc, c.id asc
    `);
    assert.equal(abBefore.length, 2, "expected two historical A-B conversations");
    assert.equal(abBefore[0].id, expectedCanonical);
    assert.equal(abBefore[1].id, duplicateId);

    console.log("Restoring enhance migration and applying...");
    await fs.rename(HOLD_PATH, ENHANCE_PATH);
    enhanceRestored = true;

    await run("npx", ["supabase", "migration", "up", "--yes"], {
      env: process.env,
    });

    const afterConversations = await sqlRows(`
      select id::text as id, subject, status, pair_user_low::text as pair_user_low,
             pair_user_high::text as pair_user_high, created_at
      from public.conversations
      where pair_user_low = least('${userA}'::uuid, '${userB}'::uuid)
        and pair_user_high = greatest('${userA}'::uuid, '${userB}'::uuid)
      order by created_at asc
    `);
    assert.equal(
      afterConversations.length,
      1,
      "exactly one canonical populated pair expected",
    );
    assert.equal(afterConversations[0].id, expectedCanonical);
    assert.equal(afterConversations[0].subject, "Oldest subject");
    assert.equal(afterConversations[0].status, "active");
    assert.ok(afterConversations[0].pair_user_low);
    assert.ok(afterConversations[0].pair_user_high);

    const duplicateGone = await execSql(
      `select exists(select 1 from public.conversations where id = '${duplicateId}')`,
    );
    assert.equal(duplicateGone, "f", "duplicate conversation row must be removed");

    const messages = await sqlRows(`
      select body, sender_id::text as sender_id, created_at
      from public.messages
      where conversation_id = '${expectedCanonical}'
      order by created_at asc, id asc
    `);
    assert.equal(messages.length, 4, "all historical messages must be preserved");
    assert.deepEqual(
      messages.map((row) => row.body),
      [
        "First historical message",
        "Reply in oldest conversation",
        "Message in newer duplicate",
        "Later reply in duplicate",
      ],
    );
    assert.equal(messages[0].sender_id, userA);
    assert.equal(messages[1].sender_id, userB);
    assert.equal(messages[2].sender_id, userA);
    assert.equal(messages[3].sender_id, userB);

    const participants = await sqlRows(`
      select user_id::text as user_id, last_read_at
      from public.conversation_participants
      where conversation_id = '${expectedCanonical}'
      order by user_id::text
    `);
    assert.equal(participants.length, 2, "both participants must remain");

    const readA = participants.find((row) => row.user_id === userA)?.last_read_at;
    const readB = participants.find((row) => row.user_id === userB)?.last_read_at;
    assert.equal(
      new Date(readA).toISOString(),
      new Date("2024-06-10T11:00:00.000Z").toISOString(),
      "user A should keep the later last_read_at",
    );
    assert.equal(
      new Date(readB).toISOString(),
      new Date("2024-06-05T10:00:00.000Z").toISOString(),
      "user B should keep the later last_read_at",
    );

    const inboxVisible = await sqlRows(`
      select count(*)::int as count
      from public.conversations c
      where (
        select count(*) from public.conversation_participants x
        where x.conversation_id = c.id
      ) = 2
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = '${userA}'
        )
        and exists (
          select 1 from public.conversation_participants cp
          where cp.conversation_id = c.id and cp.user_id = '${userB}'
        )
    `);
    assert.equal(
      inboxVisible[0].count,
      1,
      "no second inbox-visible conversation for the same pair",
    );

    const unrelated = await sqlRows(`
      select id::text as id,
        (select count(*)::int from public.conversation_participants cp where cp.conversation_id = c.id) as participants,
        pair_user_low,
        pair_user_high
      from public.conversations c
      where id = '${unrelatedId}'
    `);
    assert.equal(unrelated.length, 1, "unrelated conversation must remain");
    assert.equal(unrelated[0].participants, 3);
    assert.equal(unrelated[0].pair_user_low, null);
    assert.equal(unrelated[0].pair_user_high, null);

    const unrelatedMessage = await sqlRows(`
      select body from public.messages where conversation_id = '${unrelatedId}'
    `);
    assert.equal(unrelatedMessage[0].body, "Unrelated group message");

    console.log("PASS: legacy duplicate conversations consolidated correctly");
    console.log(
      JSON.stringify(
        {
          canonicalConversation: expectedCanonical,
          messagesPreserved: messages.length,
          participantsPreserved: participants.length,
          inboxVisiblePairConversations: inboxVisible[0].count,
          unrelatedLeftUntouched: true,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("FAIL:", error);
    process.exitCode = 1;
  } finally {
    if (!enhanceRestored) {
      try {
        await fs.access(HOLD_PATH);
        await fs.rename(HOLD_PATH, ENHANCE_PATH);
        console.log("Restored enhance migration file after failure.");
      } catch {
        // already restored or missing
      }
    }
  }
}

main();
