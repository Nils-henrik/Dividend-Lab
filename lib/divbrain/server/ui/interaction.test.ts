/**
 * DivBrain interaction orchestration tests (Ticket 1A-9b).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDivBrainError } from "../../errors";
import { buildDivBrainGuardrailAssessment } from "../../guardrails";
import { divBrainFailure, divBrainSuccess } from "../../results";
import type { DivBrainConversation, DivBrainMessage } from "../../types";
import type { DivBrainConversationRepository } from "../repository/repository";
import type {
  DivBrainApplicationService,
  DivBrainSubmitMessageOutcome,
} from "../service/types";
import {
  runArchiveDivBrainConversation,
  runCreateDivBrainConversation,
  runDeleteDivBrainConversation,
  runRenameDivBrainConversation,
  runRestoreDivBrainConversation,
  runSubmitDivBrainMessage,
  type DivBrainInteractionDeps,
} from "./interaction";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONV = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PROMPT = "Hur ska jag investera hela mitt sparkapital?";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

function conversation(
  overrides: Partial<DivBrainConversation> = {},
): DivBrainConversation {
  return {
    id: CONV,
    title: "Ny konversation",
    summary: null,
    createdAt: "2026-08-04T12:00:00.000Z",
    updatedAt: "2026-08-04T12:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

function message(
  overrides: Partial<DivBrainMessage> = {},
): DivBrainMessage {
  return {
    id: "11111111-1111-4111-8111-111111111101",
    conversationId: CONV,
    role: "user",
    content: "Hej",
    completionStatus: "completed",
    createdAt: "2026-08-04T12:00:00.000Z",
    ...overrides,
  };
}

type CallLog = {
  resolveActor: number;
  checkAccess: number;
  createRepository: number;
  createApplicationService: number;
  repo: string[];
  submitInputs: unknown[];
};

function createDeps(options: {
  authenticated?: boolean;
  allowed?: boolean;
  repositoryOk?: boolean;
  repository?: Partial<DivBrainConversationRepository>;
  submitOutcome?:
    | { ok: true; data: DivBrainSubmitMessageOutcome }
    | { ok: false; code: Parameters<typeof createDivBrainError>[0] }
    | (() => never);
  throwOnResolve?: boolean;
  throwOnAccess?: boolean;
  throwOnRepository?: boolean;
}): { deps: DivBrainInteractionDeps; log: CallLog } {
  const log: CallLog = {
    resolveActor: 0,
    checkAccess: 0,
    createRepository: 0,
    createApplicationService: 0,
    repo: [],
    submitInputs: [],
  };

  const baseRepo: DivBrainConversationRepository = {
    async createConversation(params) {
      log.repo.push("createConversation");
      assert.equal(params.actorId, ACTOR);
      assert.equal(
        Object.prototype.hasOwnProperty.call(params, "userId"),
        false,
      );
      return divBrainSuccess(conversation());
    },
    async getConversation() {
      log.repo.push("getConversation");
      return divBrainSuccess(conversation());
    },
    async listConversations() {
      log.repo.push("listConversations");
      return divBrainSuccess({ items: [], nextCursor: null });
    },
    async updateConversation(params) {
      log.repo.push("updateConversation");
      assert.equal(params.actorId, ACTOR);
      assert.equal(params.conversationId, CONV);
      return divBrainSuccess(
        conversation({ title: String(params.title ?? "Renamed") }),
      );
    },
    async archiveConversation(params) {
      log.repo.push("archiveConversation");
      assert.equal(params.actorId, ACTOR);
      assert.equal(params.conversationId, CONV);
      return divBrainSuccess(
        conversation({ archivedAt: "2026-08-04T13:00:00.000Z" }),
      );
    },
    async restoreConversation(params) {
      log.repo.push("restoreConversation");
      assert.equal(params.actorId, ACTOR);
      assert.equal(params.conversationId, CONV);
      return divBrainSuccess(conversation({ archivedAt: null }));
    },
    async deleteConversation(params) {
      log.repo.push("deleteConversation");
      assert.equal(params.actorId, ACTOR);
      assert.equal(params.conversationId, CONV);
      return divBrainSuccess(conversation());
    },
    async listMessages() {
      log.repo.push("listMessages");
      return divBrainSuccess({ items: [], nextCursor: null });
    },
    async createMessage() {
      log.repo.push("createMessage");
      return divBrainSuccess(message());
    },
    ...options.repository,
  };

  const deps: DivBrainInteractionDeps = {
    actorResolver: {
      async resolveActor() {
        log.resolveActor += 1;
        if (options.throwOnResolve) {
          throw new Error("auth boom");
        }
        if (options.authenticated === false) {
          return divBrainFailure(createDivBrainError("authentication_required"));
        }
        return divBrainSuccess({ actorId: ACTOR });
      },
    },
    accessGate: {
      async checkAccess(actorId) {
        log.checkAccess += 1;
        assert.equal(actorId, ACTOR);
        if (options.throwOnAccess) {
          throw new Error("gate boom");
        }
        if (options.allowed === false) {
          return divBrainFailure(createDivBrainError("access_denied"));
        }
        return divBrainSuccess(undefined);
      },
    },
    createRepository: () => {
      log.createRepository += 1;
      if (options.throwOnRepository) {
        throw new Error("repo boom");
      }
      if (options.repositoryOk === false) {
        return divBrainFailure(createDivBrainError("internal_error"));
      }
      return divBrainSuccess(baseRepo);
    },
    createApplicationService: (repository) => {
      log.createApplicationService += 1;
      assert.equal(repository, baseRepo);
      const service: DivBrainApplicationService = {
        async submitMessage(input) {
          log.submitInputs.push(input);
          if (typeof options.submitOutcome === "function") {
            options.submitOutcome();
          }
          if (!options.submitOutcome || !("ok" in options.submitOutcome)) {
            return divBrainFailure(createDivBrainError("internal_error"));
          }
          if (!options.submitOutcome.ok) {
            return divBrainFailure(
              createDivBrainError(options.submitOutcome.code),
            );
          }
          return divBrainSuccess(options.submitOutcome.data);
        },
      };
      return service;
    },
  };

  return { deps, log };
}

function assertSafeState(state: {
  safeMessage: string | null;
  status: string;
}) {
  const serialized = JSON.stringify(state);
  assert.equal(serialized.includes(ACTOR), false);
  assert.equal(serialized.includes(OTHER), false);
  assert.equal(serialized.includes(PROMPT), false);
  assert.equal(serialized.includes("service_role"), false);
  assert.equal(serialized.includes("SUPABASE"), false);
  assert.equal(serialized.includes("stack"), false);
  assert.equal(serialized.includes("actorId"), false);
  assert.equal(serialized.includes("userId"), false);
}

describe("DivBrain interaction orchestration security", () => {
  it("authentication failure causes zero gate/repository/provider calls", async () => {
    const { deps, log } = createDeps({ authenticated: false });
    const result = await runCreateDivBrainConversation(deps);
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "error");
      assertSafeState(result.state);
    }
    assert.equal(log.resolveActor, 1);
    assert.equal(log.checkAccess, 0);
    assert.equal(log.createRepository, 0);
    assert.equal(log.createApplicationService, 0);
    assert.deepEqual(log.repo, []);
  });

  it("Alpha denial causes zero repository/provider calls", async () => {
    const { deps, log } = createDeps({ allowed: false });
    const result = await runArchiveDivBrainConversation(
      deps,
      form({ conversationId: CONV }),
    );
    assert.equal(result.kind, "state");
    assert.equal(log.checkAccess, 1);
    assert.equal(log.createRepository, 0);
    assert.deepEqual(log.repo, []);
  });

  it("repository construction failure returns a safe result", async () => {
    const { deps, log } = createDeps({ repositoryOk: false });
    const result = await runCreateDivBrainConversation(deps);
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "error");
      assert.equal(result.state.clearComposer, false);
      assertSafeState(result.state);
    }
    assert.equal(log.createRepository, 1);
    assert.deepEqual(log.repo, []);
  });

  it("create conversation uses trusted actor identity only", async () => {
    const { deps, log } = createDeps({});
    const result = await runCreateDivBrainConversation(deps);
    assert.equal(result.kind, "redirect");
    if (result.kind === "redirect") {
      assert.equal(
        result.href,
        `/brain?conversation=${CONV}`,
      );
    }
    assert.deepEqual(log.repo, ["createConversation"]);
  });

  it("rename passes only conversation id + title", async () => {
    const { deps, log } = createDeps({
      repository: {
        async updateConversation(params) {
          log.repo.push("updateConversation");
          assert.deepEqual(Object.keys(params).sort(), [
            "actorId",
            "conversationId",
            "title",
          ]);
          assert.equal(params.title, "Nytt namn");
          return divBrainSuccess(conversation({ title: "Nytt namn" }));
        },
      },
    });
    const result = await runRenameDivBrainConversation(
      deps,
      form({
        conversationId: CONV,
        title: "Nytt namn",
        userId: OTHER,
      }),
    );
    assert.equal(result.kind, "redirect");
    assert.deepEqual(log.repo, ["updateConversation"]);
  });

  it("archive and restore are actor-scoped", async () => {
    const { deps, log } = createDeps({});
    const archived = await runArchiveDivBrainConversation(
      deps,
      form({ conversationId: CONV }),
    );
    assert.equal(archived.kind, "redirect");
    if (archived.kind === "redirect") {
      assert.equal(
        archived.href,
        `/brain?archive=archived&conversation=${CONV}`,
      );
    }

    const restored = await runRestoreDivBrainConversation(
      deps,
      form({ conversationId: CONV }),
    );
    assert.equal(restored.kind, "redirect");
    if (restored.kind === "redirect") {
      assert.equal(restored.href, `/brain?conversation=${CONV}`);
    }
    assert.deepEqual(log.repo, ["archiveConversation", "restoreConversation"]);
  });

  it("delete is actor-scoped and requires confirmation", async () => {
    const { deps, log } = createDeps({});
    const denied = await runDeleteDivBrainConversation(
      deps,
      form({ conversationId: CONV }),
    );
    assert.equal(denied.kind, "state");
    assert.deepEqual(log.repo, []);

    const deleted = await runDeleteDivBrainConversation(
      deps,
      form({
        conversationId: CONV,
        confirmDelete: "permanent",
        archiveScope: "archived",
      }),
    );
    assert.equal(deleted.kind, "redirect");
    if (deleted.kind === "redirect") {
      assert.equal(deleted.href, "/brain?archive=archived");
    }
    assert.deepEqual(log.repo, ["deleteConversation"]);
  });

  it("cross-owner/missing resources collapse to not_found", async () => {
    const { deps } = createDeps({
      repository: {
        async updateConversation() {
          return divBrainFailure(createDivBrainError("not_found"));
        },
      },
    });
    const result = await runRenameDivBrainConversation(
      deps,
      form({ conversationId: CONV, title: "X" }),
    );
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.safeMessage, "Konversationen hittades inte.");
      assertSafeState(result.state);
    }
  });
});

describe("DivBrain message submission orchestration", () => {
  it("submit constructs exactly conversationId + content and uses the application service", async () => {
    const { deps, log } = createDeps({
      submitOutcome: {
        ok: true,
        data: {
          status: "provider_unavailable",
          persisted: true,
          guardrailAssessment: buildDivBrainGuardrailAssessment({
            decision: "allow",
            reasonCodes: [],
            constraints: [],
            publicMessageKey: "allow_education",
          }),
          userMessage: message({ content: PROMPT }),
          assistantMessage: message({
            role: "assistant",
            completionStatus: "provider_unavailable",
            content: "AI-motorn är inte tillgänglig just nu.",
          }),
        },
      },
    });

    const result = await runSubmitDivBrainMessage(
      deps,
      form({
        conversationId: CONV,
        content: PROMPT,
        actorId: OTHER,
        role: "assistant",
        completionStatus: "completed",
      }),
    );

    assert.equal(log.createApplicationService, 1);
    assert.deepEqual(log.submitInputs, [
      { conversationId: CONV, content: PROMPT },
    ]);
    assert.equal(log.repo.includes("createMessage"), false);
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "provider_unavailable");
      assert.equal(result.state.persisted, true);
      assert.equal(result.state.clearComposer, true);
      assert.equal(
        result.state.safeMessage,
        "Frågan sparades. AI-motorn är ännu inte ansluten.",
      );
      assertSafeState(result.state);
    }
  });

  it("blocked does not request composer clearing and keeps no prompt in state", async () => {
    const { deps } = createDeps({
      submitOutcome: {
        ok: true,
        data: {
          status: "blocked",
          persisted: false,
          error: createDivBrainError("safety_blocked"),
          guardrailAssessment: buildDivBrainGuardrailAssessment({
            decision: "block",
            reasonCodes: ["personal_financial_advice"],
            constraints: ["no_personal_recommendation"],
            publicMessageKey: "blocked_generic",
          }),
        },
      },
    });
    const result = await runSubmitDivBrainMessage(
      deps,
      form({ conversationId: CONV, content: PROMPT }),
    );
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "blocked");
      assert.equal(result.state.persisted, false);
      assert.equal(result.state.clearComposer, false);
      assertSafeState(result.state);
    }
  });

  it("pre-persistence failure does not clear the composer", async () => {
    const { deps } = createDeps({
      submitOutcome: { ok: false, code: "invalid_request" },
    });
    const result = await runSubmitDivBrainMessage(
      deps,
      form({ conversationId: CONV, content: PROMPT }),
    );
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "error");
      assert.equal(result.state.clearComposer, false);
      assert.equal(result.state.persisted, false);
      assertSafeState(result.state);
    }
  });

  it("unexpected thrown values collapse to a fresh internal error", async () => {
    const { deps } = createDeps({
      submitOutcome: () => {
        throw { code: "attacker_code", message: PROMPT, stack: "TRACE" };
      },
    });
    const result = await runSubmitDivBrainMessage(
      deps,
      form({ conversationId: CONV, content: PROMPT }),
    );
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.status, "error");
      assert.equal(result.state.safeMessage, "Något gick fel. Försök igen.");
      assertSafeState(result.state);
      assert.equal(JSON.stringify(result.state).includes("attacker_code"), false);
      assert.equal(JSON.stringify(result.state).includes("TRACE"), false);
    }
  });

  it("raw repository/provider errors are never returned", async () => {
    const { deps } = createDeps({
      repository: {
        async createConversation() {
          return divBrainFailure(createDivBrainError("persistence_failed"));
        },
      },
    });
    const result = await runCreateDivBrainConversation(deps);
    assert.equal(result.kind, "state");
    if (result.kind === "state") {
      assert.equal(result.state.safeMessage?.includes("PostgREST"), false);
      assert.equal(result.state.safeMessage?.includes("42501"), false);
      assertSafeState(result.state);
    }
  });
});
