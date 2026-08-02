/**
 * Seed three local authenticated test users for browser verification.
 * Local-only demo keys; do not commit secrets for remote environments.
 */
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync } from "node:fs";

const execFileAsync = promisify(execFile);
const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const admin = createClient(API_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function execSql(query) {
  await execFileAsync(
    "sudo",
    [
      "docker",
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
      "-c",
      query,
    ],
    { maxBuffer: 5 * 1024 * 1024 },
  );
}

async function ensureUser(label, username, password) {
  const email = `${username}@example.com`;
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = existing.data.users.find((user) => user.email === email);
  let userId = found?.id;

  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { legal_acceptance_confirmed: true },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? `Failed creating ${label}`);
    }
    userId = created.data.user.id;
  }

  await execSql(`
    update public.profiles
    set username = '${username}', display_name = 'Test ${label}'
    where id = '${userId}';
  `);

  return { label, email, password, username, id: userId };
}

const password = "TestPass123!secure";
const users = {
  A: await ensureUser("A", "kontakta", password),
  B: await ensureUser("B", "kontaktb", password),
  C: await ensureUser("C", "kontaktc", password),
};

writeFileSync(
  "/tmp/divlab-test-users.json",
  JSON.stringify({ password, users, anonKey: ANON_KEY, apiUrl: API_URL }, null, 2),
);
console.log(JSON.stringify(users, null, 2));
