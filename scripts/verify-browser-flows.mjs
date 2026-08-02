#!/usr/bin/env node
/**
 * Authenticated browser regression for contacts + private chat.
 *
 * Requires:
 * - local Next.js on APP_URL (default http://localhost:3000) against local Supabase
 * - local Supabase API at http://127.0.0.1:54321
 * - Playwright Chromium (`npx playwright install chromium`)
 *
 * Screenshots: /opt/cursor/artifacts/screenshots/verify-*
 * Report: /opt/cursor/artifacts/browser-verification-report.json
 *
 * Any failed assertion exits non-zero.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const playwrightPkg = require("playwright/package.json");

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const API = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const PASSWORD = "TestPass123!secure";
const SHOT_DIR = "/opt/cursor/artifacts/screenshots";
const REPORT_PATH = "/opt/cursor/artifacts/browser-verification-report.json";

mkdirSync(SHOT_DIR, { recursive: true });

const admin = createClient(API, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? ` — ${detail}` : ""}`);
}

async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
    return true;
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function execSql(query) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const { stdout } = await execFileAsync(
    "docker",
    [
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
    ],
    { maxBuffer: 5 * 1024 * 1024 },
  );
  const lines = stdout
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^(INSERT|UPDATE|DELETE|SELECT)\b/i.test(line));
  return lines.join("\n").trim();
}

async function sqlValue(query) {
  return execSql(query);
}

async function ensureUser(email, username, displayName) {
  let userId = await execSql(
    `select id::text from auth.users where email = '${email}' limit 1`,
  );

  if (!userId) {
    const created = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { legal_acceptance_confirmed: true },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? `create ${email}`);
    }
    userId = created.data.user.id;
  } else {
    await admin.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { legal_acceptance_confirmed: true },
    });
  }

  await execSql(
    `update public.profiles set username='${username}', display_name='${displayName.replace(/'/g, "''")}' where id='${userId}'`,
  );
  return { id: userId, email, username, displayName };
}

function authedClient() {
  return createClient(API, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function signInRpc(email) {
  const client = authedClient();
  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw error;
  return client;
}

async function shot(page, name) {
  const path = `${SHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function login(page, email) {
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  if (!page.url().includes("/login")) {
    await page.context().clearCookies();
    await page.goto(`${BASE}/login?redirect=/contacts`, {
      waitUntil: "networkidle",
    });
  }
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

async function logout(page) {
  await page.context().clearCookies();
  await page.goto("about:blank");
  await page
    .evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
    })
    .catch(() => {});
}

function pairIds(a, b) {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

async function connectionStatus(userAId, userBId) {
  const pair = pairIds(userAId, userBId);
  return sqlValue(
    `select coalesce(status, '') from public.user_connections
     where user_low_id = '${pair.low}' and user_high_id = '${pair.high}'
     limit 1`,
  );
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth ?? 0),
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth,
    };
  });
  assert.ok(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `${label}: horizontal overflow (scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth})`,
  );
  return metrics;
}

async function assertElementInViewport(page, locator, label) {
  const count = await locator.count();
  assert.ok(count > 0, `${label}: element not found`);
  const box = await locator.first().boundingBox();
  assert.ok(box, `${label}: missing bounding box`);
  const viewport = page.viewportSize();
  assert.ok(viewport, `${label}: missing viewport`);
  assert.ok(box.x >= -1, `${label}: left edge outside viewport (${box.x})`);
  assert.ok(
    box.x + box.width <= viewport.width + 1,
    `${label}: right edge outside viewport (${box.x + box.width} > ${viewport.width})`,
  );
  assert.ok(box.y + box.height > 0, `${label}: entirely above viewport`);
  assert.ok(
    box.y < viewport.height,
    `${label}: entirely below viewport (y=${box.y})`,
  );
  return box;
}

async function assertBubbleFitsContainer(page) {
  const overflow = await page.evaluate(() => {
    const bubbles = Array.from(
      document.querySelectorAll(
        '[data-testid="message-bubble"], .divlab-surface-panel p, article p, li p',
      ),
    );
    const candidates = bubbles.length
      ? bubbles
      : Array.from(document.querySelectorAll("main p, main li"));
    for (const el of candidates) {
      const text = (el.textContent || "").trim();
      if (text.length < 40) continue;
      const parent = el.parentElement;
      if (!parent) continue;
      if (el.scrollWidth > parent.clientWidth + 2) {
        return {
          overflow: true,
          scrollWidth: el.scrollWidth,
          parentWidth: parent.clientWidth,
          sample: text.slice(0, 48),
        };
      }
    }
    return { overflow: false };
  });
  assert.equal(
    overflow.overflow,
    false,
    `message bubble exceeds container (${JSON.stringify(overflow)})`,
  );
}

async function assertMeaningfulFocus(page) {
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) {
      return { ok: false, tag: el?.tagName ?? null, role: null, name: null };
    }
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    const interactive =
      ["a", "button", "input", "textarea", "select", "summary"].includes(tag) ||
      role === "button" ||
      role === "link" ||
      role === "tab" ||
      role === "menuitem" ||
      el.isContentEditable ||
      el.tabIndex >= 0;
    return {
      ok: interactive,
      tag,
      role,
      name: (el.getAttribute("aria-label") || el.textContent || "")
        .trim()
        .slice(0, 80),
    };
  });
  assert.ok(
    info.ok,
    `activeElement is not a meaningful interactive control (${JSON.stringify(info)})`,
  );
  return info;
}

async function waitForRest(retries = 40) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(`${API}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          apikey: ANON,
          Authorization: `Bearer ${ANON}`,
        },
      });
      if (response.ok || response.status === 200 || response.status === 206) {
        return;
      }
      // 503/PGRST002 during schema reload — keep waiting.
    } catch {
      // API still restarting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Supabase REST is not ready at ${API}/rest/v1`);
}

async function main() {
  console.log(
    JSON.stringify(
      {
        command: "npm run test:browser",
        playwrightVersion: playwrightPkg.version,
        appUrl: BASE,
        supabaseUrl: API,
      },
      null,
      2,
    ),
  );

  const health = await fetch(`${API}/auth/v1/health`).catch(() => null);
  assert.ok(health?.ok, `Local Supabase Auth is not reachable at ${API}`);
  await waitForRest();
  const app = await fetch(`${BASE}/login`).catch(() => null);
  assert.ok(app?.ok, `App is not reachable at ${BASE}/login`);

  const userA = await ensureUser(
    "kontakta@example.com",
    "kontakta",
    "Test A Long Display Name That Wraps!",
  );
  const userB = await ensureUser("kontaktb@example.com", "kontaktb", "Test B");
  const userC = await ensureUser("kontaktc@example.com", "kontaktc", "Test C");
  const pairAB = pairIds(userA.id, userB.id);

  await execSql(`
    delete from public.messages
    where conversation_id in (
      select id from public.conversations
      where (pair_user_low, pair_user_high) in (
        (least('${userA.id}'::uuid,'${userB.id}'::uuid), greatest('${userA.id}'::uuid,'${userB.id}'::uuid)),
        (least('${userA.id}'::uuid,'${userC.id}'::uuid), greatest('${userA.id}'::uuid,'${userC.id}'::uuid)),
        (least('${userB.id}'::uuid,'${userC.id}'::uuid), greatest('${userB.id}'::uuid,'${userC.id}'::uuid))
      )
    );
    delete from public.conversation_participants
    where conversation_id in (
      select id from public.conversations
      where (pair_user_low, pair_user_high) in (
        (least('${userA.id}'::uuid,'${userB.id}'::uuid), greatest('${userA.id}'::uuid,'${userB.id}'::uuid)),
        (least('${userA.id}'::uuid,'${userC.id}'::uuid), greatest('${userA.id}'::uuid,'${userC.id}'::uuid)),
        (least('${userB.id}'::uuid,'${userC.id}'::uuid), greatest('${userB.id}'::uuid,'${userC.id}'::uuid))
      )
    );
    delete from public.conversations
    where (pair_user_low, pair_user_high) in (
      (least('${userA.id}'::uuid,'${userB.id}'::uuid), greatest('${userA.id}'::uuid,'${userB.id}'::uuid)),
      (least('${userA.id}'::uuid,'${userC.id}'::uuid), greatest('${userA.id}'::uuid,'${userC.id}'::uuid)),
      (least('${userB.id}'::uuid,'${userC.id}'::uuid), greatest('${userB.id}'::uuid,'${userC.id}'::uuid))
    );
    delete from public.user_connections
    where user_low_id in ('${userA.id}','${userB.id}','${userC.id}')
       or user_high_id in ('${userA.id}','${userB.id}','${userC.id}');
  `);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  let conversationId = "";

  try {
    let clientA = await signInRpc(userA.email);
    let clientB = await signInRpc(userB.email);
    let clientC = await signInRpc(userC.email);

    await check("contacts: outgoing request cancellation", async () => {
      const req = await clientA.rpc("send_contact_request", {
        p_target_user_id: userB.id,
      });
      assert.equal(req.error, null, req.error?.message);
      assert.equal(req.data.status, "pending");

      await login(page, userA.email);
      await page.goto(`${BASE}/profile/${userB.username}`, {
        waitUntil: "networkidle",
      });
      await shot(page, "verify-1280-profile-outgoing-pending");

      const cancelBtn = page.getByRole("button", { name: /Avbryt förfrågan/i });
      assert.equal(await cancelBtn.count(), 1, "cancel button must exist");
      await cancelBtn.click();
      await page.waitForTimeout(900);

      assert.equal(
        await cancelBtn.count(),
        0,
        "pending cancel button must disappear",
      );
      const addBtn = page.getByRole("button", { name: /Lägg till kontakt/i });
      assert.ok(await addBtn.count(), "add-contact CTA must return");
      await shot(page, "verify-1280-cancel-outgoing");

      const status = await connectionStatus(userA.id, userB.id);
      assert.equal(status, "cancelled", `db status expected cancelled, got ${status}`);
      return `db=${status}`;
    });

    await check("contacts: incoming request decline", async () => {
      clientA = await signInRpc(userA.email);
      const req = await clientA.rpc("send_contact_request", {
        p_target_user_id: userB.id,
      });
      assert.equal(req.error, null, req.error?.message);

      await logout(page);
      await login(page, userB.email);
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /Inkommande/i }).click();
      await shot(page, "verify-1280-contacts-incoming");

      assert.ok(
        await page.getByText(/Test A|kontakta/i).count(),
        "incoming request row must be visible",
      );
      await page.getByRole("button", { name: /^Neka$/i }).click();
      await page.waitForTimeout(900);
      await shot(page, "verify-1280-decline-incoming");

      const empty = await page
        .getByText(/Du har inga inkommande kontaktförfrågningar/i)
        .count();
      assert.ok(empty > 0, "incoming list must become empty");
      const status = await connectionStatus(userA.id, userB.id);
      assert.equal(status, "rejected", `db status expected rejected, got ${status}`);
      return `db=${status}`;
    });

    await check("contacts: accepted list and singular label", async () => {
      clientA = await signInRpc(userA.email);
      clientB = await signInRpc(userB.email);
      const req = await clientA.rpc("send_contact_request", {
        p_target_user_id: userB.id,
      });
      const accept = await clientB.rpc("accept_contact_request", {
        p_connection_id: req.data.id,
      });
      assert.equal(accept.error, null, accept.error?.message);

      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /^Kontakter/i }).click();
      await shot(page, "verify-1280-contacts-accepted");
      const bodyText = await page.locator("body").innerText();
      assert.match(bodyText, /Test A|kontakta/i);

      await page.goto(`${BASE}/profile/${userA.username}`, {
        waitUntil: "networkidle",
      });
      const profileText = await page.locator("body").innerText();
      assert.match(profileText, /1 kontakt(?!er)/);
      await shot(page, "verify-1280-profile-one-contact");
      return "1 kontakt";
    });

    await check("contacts: removal clears UI and database", async () => {
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /^Kontakter/i }).click();
      const removeBtn = page.getByRole("button", { name: /Ta bort kontakt/i });
      assert.ok(await removeBtn.count(), "remove button must exist");
      await removeBtn.first().click();
      const confirm = page.getByRole("button", {
        name: /Bekräfta borttagning/i,
      });
      assert.ok(await confirm.count(), "confirm removal button must appear");
      await confirm.click();
      await page.waitForTimeout(1000);
      await shot(page, "verify-1280-contact-removed");

      assert.ok(
        await page.getByText(/Du har inga kontakter ännu/i).count(),
        "accepted list must be empty after removal",
      );

      await page.goto(`${BASE}/profile/${userA.username}`, {
        waitUntil: "networkidle",
      });
      const profileText = await page.locator("body").innerText();
      assert.match(profileText, /0 kontakter/);
      const status = await connectionStatus(userA.id, userB.id);
      assert.equal(status, "removed", `db status expected removed, got ${status}`);
      return `db=${status}; label=0 kontakter`;
    });

    await check("contacts: reconnect and reversed reconnect", async () => {
      clientA = await signInRpc(userA.email);
      clientB = await signInRpc(userB.email);
      const reconnect = await clientA.rpc("send_contact_request", {
        p_target_user_id: userB.id,
      });
      assert.equal(reconnect.error, null, reconnect.error?.message);
      assert.equal(reconnect.data.status, "pending");

      await logout(page);
      await login(page, userA.email);
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /Skickade/i }).click();
      await shot(page, "verify-1280-contacts-outgoing-reconnect");
      const outgoingCount = await page.getByText(/Test B|kontaktb/i).count();
      assert.ok(outgoingCount > 0, "outgoing reconnect row must be visible to sender");

      await clientA.rpc("cancel_contact_request", {
        p_connection_id: reconnect.data.id,
      });
      const reversed = await clientB.rpc("send_contact_request", {
        p_target_user_id: userA.id,
      });
      assert.equal(reversed.error, null, reversed.error?.message);
      assert.equal(reversed.data.requester_id, userB.id);
      const accept = await clientA.rpc("accept_contact_request", {
        p_connection_id: reversed.data.id,
      });
      assert.equal(accept.error, null, accept.error?.message);
      assert.equal(await connectionStatus(userA.id, userB.id), "accepted");
      return "reconnect + reversed accept";
    });

    await check("labels: plural contacts", async () => {
      clientA = await signInRpc(userA.email);
      clientC = await signInRpc(userC.email);
      // Ensure A-B remains accepted so A ends with two contacts after accepting C.
      if ((await connectionStatus(userA.id, userB.id)) !== "accepted") {
        clientB = await signInRpc(userB.email);
        const req = await clientA.rpc("send_contact_request", {
          p_target_user_id: userB.id,
        });
        await clientB.rpc("accept_contact_request", {
          p_connection_id: req.data.id,
        });
      }
      if ((await connectionStatus(userA.id, userC.id)) !== "accepted") {
        const ac = await clientA.rpc("send_contact_request", {
          p_target_user_id: userC.id,
        });
        await clientC.rpc("accept_contact_request", {
          p_connection_id: ac.data.id,
        });
      }
      await logout(page);
      await login(page, userA.email);
      await page.goto(`${BASE}/profile/${userA.username}`, {
        waitUntil: "networkidle",
      });
      const profileText = await page.locator("body").innerText();
      assert.match(profileText, /2 kontakter/);
      await shot(page, "verify-1280-profile-plural-contacts");
      return "2 kontakter";
    });

    await check("message request: ignore lifecycle", async () => {
      clientA = await signInRpc(userA.email);
      clientB = await signInRpc(userB.email);
      const ab = await connectionStatus(userA.id, userB.id);
      if (ab === "accepted") {
        const row = await sqlValue(
          `select id::text from public.user_connections
           where user_low_id='${pairAB.low}' and user_high_id='${pairAB.high}'`,
        );
        await clientA.rpc("remove_contact", { p_connection_id: row });
      }

      const msgReq = await clientA.rpc("open_or_create_private_conversation", {
        p_target_user_id: userB.id,
        p_initial_body:
          "Hej detta ar en lang meddelandeforfragan som ska wrappa i layouten over flera rader nar texten blir riktigt lang.",
        p_subject: null,
      });
      assert.equal(msgReq.error, null, msgReq.error?.message);
      conversationId = msgReq.data;

      await login(page, userA.email);
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      await shot(page, "verify-1280-message-request-sender");
      const senderPending = await page.locator("body").innerText();
      assert.ok(!/ignorerad|ignored/i.test(senderPending));

      await logout(page);
      await login(page, userB.email);
      await page.goto(`${BASE}/messages`, { waitUntil: "networkidle" });
      await shot(page, "verify-1280-messages-requests-list");
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      await shot(page, "verify-1280-message-request-recipient");
      await page.getByRole("button", { name: /Ignorera/i }).click();
      await page.waitForTimeout(1000);

      await page.goto(`${BASE}/messages`, { waitUntil: "networkidle" });
      await shot(page, "verify-1280-after-ignore-list");
      const afterIgnore = await page.locator("body").innerText();
      assert.ok(
        !afterIgnore.includes(conversationId),
        "ignored request must leave request list",
      );

      await logout(page);
      await login(page, userA.email);
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      const senderAfterIgnore = await page.locator("body").innerText();
      assert.ok(!/ignorerad|ignored|nekad|declined/i.test(senderAfterIgnore));
      const blocked = await clientA.rpc("send_private_message", {
        p_conversation_id: conversationId,
        p_body: "Ska blockeras efter ignore",
      });
      assert.ok(blocked.error, "sender must not send after ignore");
      return conversationId;
    });

    await check("message request: decline blocks further sends", async () => {
      clientA = await signInRpc(userA.email);
      clientC = await signInRpc(userC.email);
      const acStatus = await connectionStatus(userA.id, userC.id);
      if (acStatus === "accepted") {
        const row = await sqlValue(
          `select id::text from public.user_connections
           where user_low_id=least('${userA.id}'::uuid,'${userC.id}'::uuid)
             and user_high_id=greatest('${userA.id}'::uuid,'${userC.id}'::uuid)`,
        );
        await clientA.rpc("remove_contact", { p_connection_id: row });
      }
      const declineConv = await clientA.rpc(
        "open_or_create_private_conversation",
        {
          p_target_user_id: userC.id,
          p_initial_body: "Neka denna forfragan tack.",
          p_subject: null,
        },
      );
      assert.equal(declineConv.error, null, declineConv.error?.message);
      await clientC.rpc("decline_message_request", {
        p_conversation_id: declineConv.data,
      });
      const afterDeclineSend = await clientA.rpc("send_private_message", {
        p_conversation_id: declineConv.data,
        p_body: "Ska blockeras efter decline",
      });
      assert.ok(afterDeclineSend.error, "sender must not send after decline");
      return "declined blocked";
    });

    await check("contacts activate and reuse conversation", async () => {
      clientA = await signInRpc(userA.email);
      clientB = await signInRpc(userB.email);
      const reconnect = await clientA.rpc("send_contact_request", {
        p_target_user_id: userB.id,
      });
      await clientB.rpc("accept_contact_request", {
        p_connection_id: reconnect.data.id,
      });
      const reopen = await clientA.rpc("open_or_create_private_conversation", {
        p_target_user_id: userB.id,
        p_initial_body: null,
        p_subject: null,
      });
      assert.equal(reopen.data, conversationId);
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      await shot(page, "verify-1280-active-conversation");
      await page.goto(`${BASE}/messages`, { waitUntil: "networkidle" });
      await shot(page, "verify-1280-messages-inbox");
      const inboxHtml = await page.locator("body").innerHTML();
      const occurrences = (
        inboxHtml.match(new RegExp(`/messages/${conversationId}`, "g")) || []
      ).length;
      assert.ok(occurrences <= 2, `duplicate inbox rows: ${occurrences}`);
      return `reused ${conversationId}; hrefs=${occurrences}`;
    });

    await check("independence: chat after contact removal", async () => {
      clientA = await signInRpc(userA.email);
      const row = await sqlValue(
        `select id::text from public.user_connections
         where user_low_id='${pairAB.low}' and user_high_id='${pairAB.high}'`,
      );
      await clientA.rpc("remove_contact", { p_connection_id: row });
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      const hist = await page.locator("body").innerText();
      assert.match(hist, /lang meddelandeforfragan|Hej detta/i);
      await shot(page, "verify-1280-chat-after-contact-removal");
      const stillSend = await clientA.rpc("send_private_message", {
        p_conversation_id: conversationId,
        p_body: "Fortsatt chat efter borttagen kontakt.",
      });
      assert.equal(stillSend.error, null, stillSend.error?.message);
      return "history + send ok";
    });

    await check("unauthorized User C blocked", async () => {
      await logout(page);
      await login(page, userC.email);
      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      await shot(page, "verify-1280-unauthorized-userC");
      const unauthorized = await page.locator("body").innerText();
      assert.ok(
        !/lang meddelandeforfragan|Fortsatt chat|Hej detta/i.test(unauthorized),
      );
      assert.match(
        unauthorized,
        /Konversationen kunde inte öppnas|inte tillgång|Till inkorgen/i,
      );
      return "safe unauthorized state";
    });

    for (const width of [390, 412, 1280]) {
      await check(`viewport ${width}px layout integrity`, async () => {
        await page.setViewportSize({ width, height: 844 });
        await login(page, userA.email);

        await page.goto(`${BASE}/profile/${userA.username}`, {
          waitUntil: "networkidle",
        });
        await assertNoHorizontalOverflow(page, `profile@${width}`);
        await shot(page, `verify-${width}-profile`);

        await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page, `contacts@${width}`);
        const contactsPrimary = page
          .getByRole("tab", { name: /^Kontakter/i })
          .or(page.getByRole("heading", { name: /^Kontakter$/i }));
        await assertElementInViewport(
          page,
          contactsPrimary,
          `contacts primary@${width}`,
        );
        await shot(page, `verify-${width}-contacts`);

        await page.goto(`${BASE}/messages`, { waitUntil: "networkidle" });
        await assertNoHorizontalOverflow(page, `messages@${width}`);
        await shot(page, `verify-${width}-messages`);

        await page.goto(`${BASE}/messages/${conversationId}`, {
          waitUntil: "networkidle",
        });
        await assertNoHorizontalOverflow(page, `thread@${width}`);
        const composer = page
          .getByPlaceholder(/Skriv ett meddelande/i)
          .or(page.locator("textarea").first());
        await assertElementInViewport(page, composer, `composer@${width}`);
        assert.ok(await composer.isVisible(), `composer visible@${width}`);
        await assertBubbleFitsContainer(page);
        await shot(page, `verify-${width}-thread`);

        // Keyboard focus must land on a meaningful control.
        let focused = null;
        for (let i = 0; i < 12; i += 1) {
          await page.keyboard.press("Tab");
          try {
            focused = await assertMeaningfulFocus(page);
            break;
          } catch {
            // keep tabbing until an interactive control is focused
          }
        }
        assert.ok(focused, `no meaningful focus after Tab @${width}`);
        await shot(page, `verify-${width}-keyboard-focus`);
        return `scrollWidth ok; composer in view; focus=${focused.tag}`;
      });
    }

    await check("long display name and message wrapping", async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE}/profile/${userA.username}`, {
        waitUntil: "networkidle",
      });
      await assertNoHorizontalOverflow(page, "long display name profile");
      const nameEl = page.getByText(/Test A Long Display Name That Wraps!/i);
      assert.ok(await nameEl.count(), "long display name must render");
      await assertElementInViewport(page, nameEl, "long display name");
      await shot(page, "verify-1280-long-display-name");

      await page.goto(`${BASE}/messages/${conversationId}`, {
        waitUntil: "networkidle",
      });
      await assertNoHorizontalOverflow(page, "long message thread");
      await assertBubbleFitsContainer(page);
      await shot(page, "verify-1280-long-message-wrap");
      return "no overflow";
    });

    await check("menus/dialogs open inside viewport", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      const mobileNav = page.getByRole("button", {
        name: /Open navigation menu/i,
      });
      assert.ok(await mobileNav.count(), "mobile nav trigger must exist");
      await mobileNav.click();
      await page.waitForTimeout(400);
      const drawer = page.locator("#mobile-nav-drawer");
      assert.ok(await drawer.isVisible(), "mobile nav drawer must open");
      await assertElementInViewport(page, drawer, "mobile nav drawer");
      await shot(page, "verify-390-menu-open");

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      // Open remove confirmation mini-dialog as a real interactive panel.
      // Ensure an accepted contact exists for the confirm UI.
      clientA = await signInRpc(userA.email);
      clientB = await signInRpc(userB.email);
      const status = await connectionStatus(userA.id, userB.id);
      if (status !== "accepted") {
        if (status === "pending") {
          const id = await sqlValue(
            `select id::text from public.user_connections
             where user_low_id='${pairAB.low}' and user_high_id='${pairAB.high}'`,
          );
          const acting =
            (await sqlValue(
              `select addressee_id::text from public.user_connections where id='${id}'`,
            )) === userB.id
              ? clientB
              : clientA;
          await acting.rpc("accept_contact_request", { p_connection_id: id });
        } else {
          const req = await clientA.rpc("send_contact_request", {
            p_target_user_id: userB.id,
          });
          await clientB.rpc("accept_contact_request", {
            p_connection_id: req.data.id,
          });
        }
      }
      await page.goto(`${BASE}/contacts`, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: /^Kontakter/i }).click();
      await page.getByRole("button", { name: /Ta bort kontakt/i }).first().click();
      const confirm = page.getByRole("button", {
        name: /Bekräfta borttagning/i,
      });
      assert.ok(await confirm.isVisible(), "confirm dialog control must open");
      await assertElementInViewport(page, confirm, "confirm removal control");
      await shot(page, "verify-1280-menu-open");
      return "mobile drawer + confirm control in viewport";
    });
  } catch (error) {
    record("browser verification crashed", false, String(error));
    try {
      await shot(page, "verify-crash-state");
    } catch {
      // ignore
    }
  } finally {
    await browser.close();
  }

  const screenshots = readdirSync(SHOT_DIR).filter((name) =>
    name.startsWith("verify-"),
  );
  const summary = {
    command: "npm run test:browser",
    playwrightVersion: playwrightPkg.version,
    passed: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok).length,
    screenshotCount: screenshots.length,
    reportPath: REPORT_PATH,
    results,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
