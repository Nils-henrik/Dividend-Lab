/**
 * Deterministic DivBrain interaction orchestration (Ticket 1A-9b).
 *
 * Independent auth + Alpha gate + repository/service wiring for every mutation.
 * Thin Next.js server actions call into this module.
 *
 * Server-only — must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import type { DivBrainResult } from "../../results";
import {
  buildDivBrainHref,
  type DivBrainArchiveScope,
} from "../../brain-routes";
import { createDivBrainAlphaApplicationService } from "../access/wiring";
import { isDivBrainUuid } from "../repository/ids";
import type {
  DivBrainConversationRepository,
  DivBrainTrustedActorId,
} from "../repository/repository";
import type {
  DivBrainApplicationService,
  DivBrainSubmitMessageOutcome,
} from "../service/types";
import {
  createDivBrainActionState,
  type DivBrainActionState,
} from "../../action-state";
import { createDivBrainRuntimeRepository } from "./runtime";

export type DivBrainInteractionActorResolver = {
  resolveActor(): Promise<DivBrainResult<{ actorId: DivBrainTrustedActorId }>>;
};

export type DivBrainInteractionAccessGate = {
  checkAccess(
    actorId: DivBrainTrustedActorId,
  ): Promise<DivBrainResult<void>>;
};

export type DivBrainInteractionDeps = {
  actorResolver: DivBrainInteractionActorResolver;
  accessGate: DivBrainInteractionAccessGate;
  createRepository?: () => DivBrainResult<DivBrainConversationRepository>;
  createApplicationService?: (
    repository: DivBrainConversationRepository,
  ) => DivBrainApplicationService;
};

export type DivBrainInteractionRedirectResult = {
  kind: "redirect";
  href: string;
};

export type DivBrainInteractionStateResult = {
  kind: "state";
  state: DivBrainActionState;
};

export type DivBrainInteractionResult =
  | DivBrainInteractionRedirectResult
  | DivBrainInteractionStateResult;

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapCatalogError(code: Parameters<typeof createDivBrainError>[0]): DivBrainActionState {
  const error = createDivBrainError(code);
  return createDivBrainActionState({
    status: "error",
    safeMessage: error.message,
    persisted: false,
    clearComposer: false,
  });
}

function internalErrorState(): DivBrainActionState {
  return mapCatalogError("internal_error");
}

async function resolveTrustedActorAndAccess(
  deps: DivBrainInteractionDeps,
): Promise<
  | { ok: true; actorId: DivBrainTrustedActorId }
  | { ok: false; state: DivBrainActionState }
> {
  let actorResult: DivBrainResult<{ actorId: DivBrainTrustedActorId }>;
  try {
    actorResult = await deps.actorResolver.resolveActor();
  } catch {
    return { ok: false, state: internalErrorState() };
  }

  if (!actorResult.ok) {
    return {
      ok: false,
      state: createDivBrainActionState({
        status: "error",
        safeMessage: actorResult.error.message,
        persisted: false,
        clearComposer: false,
      }),
    };
  }

  let accessResult: DivBrainResult<void>;
  try {
    accessResult = await deps.accessGate.checkAccess(actorResult.data.actorId);
  } catch {
    return { ok: false, state: internalErrorState() };
  }

  if (!accessResult.ok) {
    return {
      ok: false,
      state: createDivBrainActionState({
        status: "error",
        safeMessage: accessResult.error.message,
        persisted: false,
        clearComposer: false,
      }),
    };
  }

  return { ok: true, actorId: actorResult.data.actorId };
}

function createRepository(
  deps: DivBrainInteractionDeps,
): DivBrainResult<DivBrainConversationRepository> {
  if (deps.createRepository) {
    try {
      return deps.createRepository();
    } catch {
      return {
        ok: false,
        error: createDivBrainError("internal_error"),
      };
    }
  }

  return createDivBrainRuntimeRepository();
}

function readConversationId(formData: FormData): string | null {
  const conversationId = getFormString(formData, "conversationId").trim();
  if (!isDivBrainUuid(conversationId)) {
    return null;
  }
  return conversationId;
}

function mutationFailureState(
  result: DivBrainResult<unknown>,
): DivBrainActionState {
  if (!result.ok) {
    return createDivBrainActionState({
      status: "error",
      safeMessage: result.error.message,
      persisted: false,
      clearComposer: false,
    });
  }
  return internalErrorState();
}

export async function runCreateDivBrainConversation(
  deps: DivBrainInteractionDeps,
): Promise<DivBrainInteractionResult> {
  try {
    const access = await resolveTrustedActorAndAccess(deps);
    if (!access.ok) {
      return { kind: "state", state: access.state };
    }

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    // Ignore any browser-supplied ownership / title fields — default title only.
    const created = await repositoryResult.data.createConversation({
      actorId: access.actorId,
    });

    if (!created.ok) {
      return { kind: "state", state: mutationFailureState(created) };
    }

    return {
      kind: "redirect",
      href: buildDivBrainHref({
        archiveScope: "active",
        conversationId: created.data.id,
      }),
    };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}

export async function runRenameDivBrainConversation(
  deps: DivBrainInteractionDeps,
  formData: FormData,
): Promise<DivBrainInteractionResult> {
  try {
    const access = await resolveTrustedActorAndAccess(deps);
    if (!access.ok) {
      return { kind: "state", state: access.state };
    }

    const conversationId = readConversationId(formData);
    const title = getFormString(formData, "title");

    if (!conversationId) {
      return { kind: "state", state: mapCatalogError("not_found") };
    }

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const updated = await repositoryResult.data.updateConversation({
      actorId: access.actorId,
      conversationId,
      title,
    });

    if (!updated.ok) {
      return { kind: "state", state: mutationFailureState(updated) };
    }

    const archiveScope: DivBrainArchiveScope = updated.data.archivedAt
      ? "archived"
      : "active";

    return {
      kind: "redirect",
      href: buildDivBrainHref({
        archiveScope,
        conversationId: updated.data.id,
      }),
    };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}

export async function runArchiveDivBrainConversation(
  deps: DivBrainInteractionDeps,
  formData: FormData,
): Promise<DivBrainInteractionResult> {
  try {
    const access = await resolveTrustedActorAndAccess(deps);
    if (!access.ok) {
      return { kind: "state", state: access.state };
    }

    const conversationId = readConversationId(formData);
    if (!conversationId) {
      return { kind: "state", state: mapCatalogError("not_found") };
    }

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const archived = await repositoryResult.data.archiveConversation({
      actorId: access.actorId,
      conversationId,
    });

    if (!archived.ok) {
      return { kind: "state", state: mutationFailureState(archived) };
    }

    return {
      kind: "redirect",
      href: buildDivBrainHref({
        archiveScope: "archived",
        conversationId: archived.data.id,
      }),
    };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}

export async function runRestoreDivBrainConversation(
  deps: DivBrainInteractionDeps,
  formData: FormData,
): Promise<DivBrainInteractionResult> {
  try {
    const access = await resolveTrustedActorAndAccess(deps);
    if (!access.ok) {
      return { kind: "state", state: access.state };
    }

    const conversationId = readConversationId(formData);
    if (!conversationId) {
      return { kind: "state", state: mapCatalogError("not_found") };
    }

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const restored = await repositoryResult.data.restoreConversation({
      actorId: access.actorId,
      conversationId,
    });

    if (!restored.ok) {
      return { kind: "state", state: mutationFailureState(restored) };
    }

    return {
      kind: "redirect",
      href: buildDivBrainHref({
        archiveScope: "active",
        conversationId: restored.data.id,
      }),
    };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}

export async function runDeleteDivBrainConversation(
  deps: DivBrainInteractionDeps,
  formData: FormData,
): Promise<DivBrainInteractionResult> {
  try {
    const access = await resolveTrustedActorAndAccess(deps);
    if (!access.ok) {
      return { kind: "state", state: access.state };
    }

    const conversationId = readConversationId(formData);
    if (!conversationId) {
      return { kind: "state", state: mapCatalogError("not_found") };
    }

    const confirmed = getFormString(formData, "confirmDelete").trim();
    if (confirmed !== "permanent") {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: "Bekräfta permanent borttagning för att fortsätta.",
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const scopeHint = getFormString(formData, "archiveScope").trim();
    const archiveScope: DivBrainArchiveScope =
      scopeHint === "archived" ? "archived" : "active";

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const deleted = await repositoryResult.data.deleteConversation({
      actorId: access.actorId,
      conversationId,
    });

    if (!deleted.ok) {
      return { kind: "state", state: mutationFailureState(deleted) };
    }

    return {
      kind: "redirect",
      href: buildDivBrainHref({ archiveScope }),
    };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}

function mapSubmitOutcome(
  outcome: DivBrainSubmitMessageOutcome,
): DivBrainActionState {
  switch (outcome.status) {
    case "blocked":
      return createDivBrainActionState({
        status: "blocked",
        safeMessage: outcome.error.message,
        persisted: false,
        clearComposer: false,
      });
    case "provider_unavailable":
      return createDivBrainActionState({
        status: "provider_unavailable",
        safeMessage:
          "Frågan sparades. AI-motorn är ännu inte ansluten.",
        persisted: true,
        clearComposer: true,
      });
    case "completed":
      return createDivBrainActionState({
        status: "success",
        safeMessage: null,
        persisted: true,
        clearComposer: true,
      });
    case "failed":
      return createDivBrainActionState({
        status: "failed",
        safeMessage: createDivBrainError("internal_error").message,
        persisted: true,
        clearComposer: true,
      });
    case "cancelled":
      return createDivBrainActionState({
        status: "cancelled",
        safeMessage: createDivBrainError("cancelled").message,
        persisted: true,
        clearComposer: true,
      });
    default:
      return internalErrorState();
  }
}

export async function runSubmitDivBrainMessage(
  deps: DivBrainInteractionDeps,
  formData: FormData,
): Promise<DivBrainInteractionResult> {
  try {
    // Auth + Alpha are enforced again inside the application service.
    // The action still constructs the service through Alpha wiring only.
    const conversationId = readConversationId(formData);
    const content = getFormString(formData, "content");

    if (!conversationId) {
      return { kind: "state", state: mapCatalogError("not_found") };
    }

    const repositoryResult = createRepository(deps);
    if (!repositoryResult.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: repositoryResult.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    const createApplicationService =
      deps.createApplicationService ??
      ((repository: DivBrainConversationRepository) =>
        createDivBrainAlphaApplicationService({ repository }));

    const service = createApplicationService(repositoryResult.data);

    // Exact plain object — never spread FormData; never accept actor/role/status.
    const submitInput = {
      conversationId,
      content,
    };

    const result = await service.submitMessage(submitInput);

    if (!result.ok) {
      return {
        kind: "state",
        state: createDivBrainActionState({
          status: "error",
          safeMessage: result.error.message,
          persisted: false,
          clearComposer: false,
        }),
      };
    }

    return { kind: "state", state: mapSubmitOutcome(result.data) };
  } catch {
    return { kind: "state", state: internalErrorState() };
  }
}
