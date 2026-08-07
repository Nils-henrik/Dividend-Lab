/**
 * DivBrain shell source-boundary and access-order tests (Ticket 1A-9a).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDivBrainError } from "../../errors";
import { createDivBrainAlphaAccessGate, resolveDivBrainAlphaPageAccess } from "../access";
import { divBrainShellDataUnavailable, loadDivBrainShellData } from "./loader";

const ALLOWED = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../../");

function read(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function listFilesRecursive(dir: string, suffix: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(full, suffix));
    } else if (entry.endsWith(suffix)) {
      files.push(full);
    }
  }

  return files;
}

describe("DivBrain shell access integration", () => {
  it("denied presentation occurs before repository factory invocation", async () => {
    let repositoryFactoryCalls = 0;
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: OTHER,
      accessGate: createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED }),
    });
    assert.equal(access.status, "unavailable");

    if (access.status !== "unavailable") {
      repositoryFactoryCalls += 1;
    }

    assert.equal(repositoryFactoryCalls, 0);
  });

  it("allowed presentation may invoke the repository loader", async () => {
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: ALLOWED,
      accessGate: createDivBrainAlphaAccessGate({ rawUserIds: ALLOWED }),
    });
    assert.equal(access.status, "allowed_placeholder");

    let listCalled = false;
    const view = await loadDivBrainShellData({
      actorId: ALLOWED,
      repository: {
        async listConversations() {
          listCalled = true;
          return {
            ok: true,
            data: { items: [], nextCursor: null },
          };
        },
        async getConversation() {
          return { ok: false, error: createDivBrainError("not_found") };
        },
        async listMessages() {
          return { ok: true, data: { items: [], nextCursor: null } };
        },
        async createConversation() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
        async updateConversation() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
        async archiveConversation() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
        async restoreConversation() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
        async deleteConversation() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
        async createMessage() {
          return { ok: false, error: createDivBrainError("internal_error") };
        },
      },
    });

    assert.equal(listCalled, true);
    assert.equal(view.state, "empty");
  });

  it("missing Alpha configuration remains denied", async () => {
    const access = await resolveDivBrainAlphaPageAccess({
      actorId: ALLOWED,
      accessGate: createDivBrainAlphaAccessGate({ rawUserIds: undefined }),
    });
    assert.equal(access.status, "unavailable");
  });

  it("data-unavailable helper exposes no environment state", () => {
    const view = divBrainShellDataUnavailable();
    assert.deepEqual(view, { state: "data_unavailable" });
    assert.equal(JSON.stringify(view).includes("SUPABASE"), false);
  });
});

describe("DivBrain shell legacy and product boundaries", () => {
  it("canonical product UI uses DivBrain and not Dividend Brain", () => {
    const page = read("app/brain/page.tsx");
    assert.equal(page.includes("DivBrain"), true);
    assert.equal(page.includes("Dividend Brain"), false);
    assert.equal(page.includes("DividendBrainPanel"), false);
    assert.equal(page.includes("data/brain"), false);
    assert.equal(page.includes("Dagens insikter"), false);
  });

  it("dashboard brain route redirects to /brain", () => {
    const page = read("app/dashboard/brain/page.tsx");
    assert.equal(page.includes('redirect("/brain")'), true);
    assert.equal(page.includes("DividendBrainPanel"), false);
    assert.equal(page.includes("PlaceholderPage"), false);
  });

  it("legacy mock panel and data files are removed", () => {
    assert.equal(existsSync(join(repoRoot, "components/brain/DividendBrainPanel.tsx")), false);
    assert.equal(existsSync(join(repoRoot, "components/dashboard/DividendBrainPanel.tsx")), false);
    assert.equal(existsSync(join(repoRoot, "data/brain.ts")), false);
  });

  it("no product route imports legacy brain mocks", () => {
    const appFiles = listFilesRecursive(join(repoRoot, "app"), ".tsx");
    for (const file of appFiles) {
      const source = readFileSync(file, "utf8");
      assert.equal(source.includes("DividendBrainPanel"), false, file);
      assert.equal(source.includes("@/data/brain"), false, file);
      assert.equal(source.includes("Dagens insikter"), false, file);
    }
  });

  it("no client component imports lib/divbrain/server", () => {
    const componentFiles = listFilesRecursive(
      join(repoRoot, "components/brain"),
      ".tsx",
    );

    for (const file of componentFiles) {
      const source = readFileSync(file, "utf8");
      if (!source.includes('"use client"') && !source.includes("'use client'")) {
        continue;
      }
      assert.equal(
        source.includes("lib/divbrain/server"),
        false,
        file,
      );
      assert.equal(
        source.includes("@/lib/divbrain/server"),
        false,
        file,
      );
    }
  });

  it("new DivBrain components do not use dangerouslySetInnerHTML", () => {
    const componentFiles = listFilesRecursive(
      join(repoRoot, "components/brain"),
      ".tsx",
    );
    for (const file of componentFiles) {
      const source = readFileSync(file, "utf8");
      assert.equal(source.includes("dangerouslySetInnerHTML"), false, file);
    }
  });

  it("brain page keeps API-route free and wires actions separately", () => {
    const page = read("app/brain/page.tsx");
    assert.equal(page.includes("use server"), false);
    assert.equal(page.includes("submitMessage"), false);
    assert.equal(existsSync(join(repoRoot, "app/api/brain")), false);
    assert.equal(existsSync(join(repoRoot, "app/brain/actions.ts")), true);

    const actions = read("app/brain/actions.ts");
    assert.equal(actions.includes('"use server"'), true);
    assert.equal(actions.includes("createDivBrainAlphaApplicationService"), false);
    assert.equal(actions.includes("createDivBrainAlphaAccessModule"), true);
  });

  it("archived composer remains read-only while active composer is functional", () => {
    const archived = read("components/brain/DivBrainDisabledComposer.tsx");
    assert.equal(archived.includes("Återställ"), true);
    assert.equal(archived.includes("dangerouslySetInnerHTML"), false);

    const composer = read("components/brain/DivBrainComposer.tsx");
    assert.equal(composer.includes('"use client"'), true);
    assert.equal(composer.includes("submitDivBrainMessageAction"), true);
    assert.equal(composer.includes("aria-live"), true);
    assert.equal(composer.includes("dangerouslySetInnerHTML"), false);
    assert.equal(composer.includes("localStorage"), false);
  });

  it("rail and drawer expose active/archived scope and create action", () => {
    const rail = read("components/brain/DivBrainConversationRail.tsx");
    assert.equal(rail.includes("DivBrainScopeSwitch"), true);
    assert.equal(rail.includes("DivBrainCreateConversationButton"), true);

    const drawer = read("components/brain/DivBrainHistoryDrawer.tsx");
    assert.equal(drawer.includes("DivBrainScopeSwitch"), true);
    assert.equal(drawer.includes("DivBrainCreateConversationButton"), true);
    assert.equal(drawer.includes("Aktiva"), false);
  });

  it("conversation actions require explicit delete confirmation", () => {
    const actions = read("components/brain/DivBrainConversationActions.tsx");
    assert.equal(actions.includes("Ta bort permanent"), true);
    assert.equal(actions.includes('name="confirmDelete"'), true);
    assert.equal(actions.includes('value="permanent"'), true);
    assert.equal(actions.includes("aria-labelledby"), true);
    assert.equal(actions.includes("aria-describedby"), true);
    assert.equal(actions.includes("Escape"), true);
  });

  it("page authenticates and gates before repository construction", () => {
    const page = read("app/brain/page.tsx");
    assert.equal(page.includes("requireAuthenticatedUserWithProfile"), true);
    assert.equal(page.includes("resolveDivBrainAlphaPageAccess"), true);
    assert.equal(page.includes("createDivBrainRuntimeRepository"), true);

    const functionBody = page.slice(
      page.indexOf("export default async function DivBrainPage"),
    );
    const accessIndex = functionBody.indexOf("resolveDivBrainAlphaPageAccess");
    const unavailableIndex = functionBody.indexOf('status === "unavailable"');
    const runtimeCallIndex = functionBody.indexOf(
      "createDivBrainRuntimeRepository(",
    );

    assert.equal(accessIndex > -1, true);
    assert.equal(unavailableIndex > accessIndex, true);
    assert.equal(runtimeCallIndex > unavailableIndex, true);
  });
});
