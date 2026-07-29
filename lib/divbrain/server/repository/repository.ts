/**
 * DivBrain conversation/message repository (Ticket 1A-7a).
 *
 * Server-only persistence boundary. Actor identity must come from a trusted
 * server authentication layer — never from browser-supplied ownership fields.
 *
 * Privileged clients bypass RLS, so every actor-scoped operation filters by
 * both resource id and actor id. Unowned and missing resources both return
 * typed `not_found`.
 */

import {
  DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  DIVBRAIN_TITLE_MAX_LENGTH,
} from "../../constants";
import {
  DIVBRAIN_ERROR_CODES,
  isDivBrainErrorCode,
  type DivBrainErrorCode,
} from "../../errors";
import {
  DIVBRAIN_GUARDRAIL_DECISIONS,
  type DivBrainGuardrailDecision,
} from "../../guardrails";
import type { DivBrainResult } from "../../results";
import {
  divBrainFailureFromCode,
  divBrainSuccess,
} from "../../results";
import type {
  DivBrainCompletionStatus,
  DivBrainConversation,
  DivBrainMessage,
  DivBrainMessageRole,
} from "../../types";
import {
  normalizeDivBrainMessageContent,
  normalizeDivBrainTitle,
  validateDivBrainCompletionStatus,
  validateDivBrainMessageRole,
} from "../../validation";
import {
  normalizeDivBrainActorId,
  normalizeDivBrainResourceId,
} from "./ids";
import {
  mapConversationRowToDomain,
  mapMessageRowToDomain,
} from "./mapping";
import {
  decodeConversationCursor,
  decodeMessageCursor,
  encodeConversationCursor,
  encodeMessageCursor,
  normalizeDivBrainPageSize,
} from "./pagination";
import type {
  DivBrainConversationArchiveFilter,
  DivBrainPersistencePort,
  DivBrainPersistenceResult,
} from "./persistence";

/** Default title when create input omits title (schema requires non-blank). */
export const DIVBRAIN_DEFAULT_CONVERSATION_TITLE = "Ny konversation";

export type DivBrainTrustedActorId = string;

export type CreateDivBrainConversationParams = {
  actorId: DivBrainTrustedActorId;
  title?: string;
  summary?: string | null;
};

export type GetDivBrainConversationParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
};

export type ListDivBrainConversationsParams = {
  actorId: DivBrainTrustedActorId;
  archiveFilter?: DivBrainConversationArchiveFilter;
  pageSize?: number;
  cursor?: string;
};

export type UpdateDivBrainConversationParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
  title?: string;
  summary?: string | null;
};

export type ArchiveDivBrainConversationParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
};

export type DeleteDivBrainConversationParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
};

export type ListDivBrainMessagesParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
  pageSize?: number;
  cursor?: string;
};

export type CreateDivBrainMessageParams = {
  actorId: DivBrainTrustedActorId;
  conversationId: string;
  role: DivBrainMessageRole;
  content: string;
  completionStatus: DivBrainCompletionStatus;
  safetyClassification?: DivBrainGuardrailDecision | null;
  sources?: unknown[];
  errorCode?: DivBrainErrorCode | null;
};

export type DivBrainConversationPage = {
  items: DivBrainConversation[];
  nextCursor: string | null;
};

export type DivBrainMessagePage = {
  items: DivBrainMessage[];
  nextCursor: string | null;
};

export type DivBrainConversationRepository = {
  createConversation(
    params: CreateDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  getConversation(
    params: GetDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  listConversations(
    params: ListDivBrainConversationsParams,
  ): Promise<DivBrainResult<DivBrainConversationPage>>;
  updateConversation(
    params: UpdateDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  archiveConversation(
    params: ArchiveDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  restoreConversation(
    params: ArchiveDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  deleteConversation(
    params: DeleteDivBrainConversationParams,
  ): Promise<DivBrainResult<DivBrainConversation>>;
  listMessages(
    params: ListDivBrainMessagesParams,
  ): Promise<DivBrainResult<DivBrainMessagePage>>;
  createMessage(
    params: CreateDivBrainMessageParams,
  ): Promise<DivBrainResult<DivBrainMessage>>;
};

function mapPersistenceFailure<T>(
  result: DivBrainPersistenceResult<T>,
): DivBrainResult<never> {
  if (result.ok) {
    return divBrainFailureFromCode("internal_error");
  }

  switch (result.error.kind) {
    case "unavailable":
      return divBrainFailureFromCode("persistence_failed");
    case "configuration":
      return divBrainFailureFromCode("internal_error");
    case "not_found":
      return divBrainFailureFromCode("not_found");
    case "malformed_response":
    case "query_failed":
    default:
      return divBrainFailureFromCode("persistence_failed");
  }
}

function normalizeOptionalSummary(
  summary: unknown,
): DivBrainResult<string | null | undefined> {
  if (summary === undefined) {
    return divBrainSuccess(undefined);
  }

  if (summary === null) {
    return divBrainSuccess(null);
  }

  if (typeof summary !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const trimmed = summary.trim();
  return divBrainSuccess(trimmed.length === 0 ? null : trimmed);
}

function isGuardrailDecision(
  value: unknown,
): value is DivBrainGuardrailDecision {
  return (
    typeof value === "string" &&
    (DIVBRAIN_GUARDRAIL_DECISIONS as readonly string[]).includes(value)
  );
}

/**
 * Reject caller-supplied ownership fields. Trusted `actorId` is the only
 * identity input — never `userId` / `user_id` / `ownerId` / `owner_id`.
 */
function assertNoOwnershipFields(input: object): DivBrainResult<void> {
  if (
    "userId" in input ||
    "user_id" in input ||
    "ownerId" in input ||
    "owner_id" in input
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(undefined);
}

export function createDivBrainConversationRepository(options: {
  persistence: DivBrainPersistencePort;
}): DivBrainConversationRepository {
  const { persistence } = options;

  return {
    async createConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const ownershipCheck = assertNoOwnershipFields(
        params as unknown as object,
      );
      if (!ownershipCheck.ok) {
        return ownershipCheck;
      }

      let title = DIVBRAIN_DEFAULT_CONVERSATION_TITLE;
      if (params.title !== undefined) {
        if (typeof params.title !== "string") {
          return divBrainFailureFromCode("invalid_request");
        }
        const titleResult = normalizeDivBrainTitle(params.title);
        if (!titleResult.ok) {
          return titleResult;
        }
        title = titleResult.data;
      }

      if (title.length > DIVBRAIN_TITLE_MAX_LENGTH) {
        return divBrainFailureFromCode("invalid_request");
      }

      const summaryResult = normalizeOptionalSummary(params.summary);
      if (!summaryResult.ok) {
        return summaryResult;
      }

      const insertResult = await persistence.insertConversation({
        user_id: actorResult.data,
        title,
        ...(summaryResult.data !== undefined
          ? { summary: summaryResult.data }
          : {}),
      });

      if (!insertResult.ok) {
        return mapPersistenceFailure(insertResult);
      }

      return mapConversationRowToDomain(insertResult.data);
    },

    async getConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      const findResult = await persistence.findConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!findResult.ok) {
        return mapPersistenceFailure(findResult);
      }

      if (findResult.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      return mapConversationRowToDomain(findResult.data);
    },

    async listConversations(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const archiveFilter = params.archiveFilter ?? "active";
      if (
        archiveFilter !== "active" &&
        archiveFilter !== "archived" &&
        archiveFilter !== "all"
      ) {
        return divBrainFailureFromCode("invalid_request");
      }

      const pageSizeResult = normalizeDivBrainPageSize(params.pageSize);
      if (!pageSizeResult.ok) {
        return pageSizeResult;
      }

      let cursor;
      if (params.cursor !== undefined) {
        const cursorResult = decodeConversationCursor(params.cursor);
        if (!cursorResult.ok) {
          return cursorResult;
        }
        cursor = cursorResult.data;
      }

      const fetchLimit = pageSizeResult.data + 1;
      const listResult = await persistence.listConversationsForActor({
        userId: actorResult.data,
        archiveFilter,
        limit: fetchLimit,
        cursor,
      });

      if (!listResult.ok) {
        return mapPersistenceFailure(listResult);
      }

      const hasMore = listResult.data.length > pageSizeResult.data;
      const pageRows = hasMore
        ? listResult.data.slice(0, pageSizeResult.data)
        : listResult.data;

      const items: DivBrainConversation[] = [];
      for (const row of pageRows) {
        const mapped = mapConversationRowToDomain(row);
        if (!mapped.ok) {
          return mapped;
        }
        items.push(mapped.data);
      }

      let nextCursor: string | null = null;
      if (hasMore && pageRows.length > 0) {
        const last = pageRows[pageRows.length - 1];
        nextCursor = encodeConversationCursor({
          updatedAt: last.updated_at,
          id: last.id,
        });
      }

      return divBrainSuccess({ items, nextCursor });
    },

    async updateConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      if (
        "userId" in params ||
        "user_id" in params ||
        "ownerId" in params ||
        "owner_id" in params
      ) {
        return divBrainFailureFromCode("invalid_request");
      }

      const hasTitle = params.title !== undefined;
      const hasSummary = params.summary !== undefined;

      if (!hasTitle && !hasSummary) {
        return divBrainFailureFromCode("invalid_request");
      }

      const patch: {
        title?: string;
        summary?: string | null;
      } = {};

      if (hasTitle) {
        if (typeof params.title !== "string") {
          return divBrainFailureFromCode("invalid_request");
        }
        const titleResult = normalizeDivBrainTitle(params.title);
        if (!titleResult.ok) {
          return titleResult;
        }
        patch.title = titleResult.data;
      }

      if (hasSummary) {
        const summaryResult = normalizeOptionalSummary(params.summary);
        if (!summaryResult.ok) {
          return summaryResult;
        }
        patch.summary = summaryResult.data ?? null;
      }

      const updateResult = await persistence.updateConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
        patch,
      });

      if (!updateResult.ok) {
        return mapPersistenceFailure(updateResult);
      }

      if (updateResult.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      return mapConversationRowToDomain(updateResult.data);
    },

    async archiveConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      const existing = await persistence.findConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!existing.ok) {
        return mapPersistenceFailure(existing);
      }

      if (existing.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      // Idempotent: already archived → return current domain row.
      if (existing.data.archived_at !== null) {
        return mapConversationRowToDomain(existing.data);
      }

      const updateResult = await persistence.updateConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
        patch: { archived_at: new Date().toISOString() },
      });

      if (!updateResult.ok) {
        return mapPersistenceFailure(updateResult);
      }

      if (updateResult.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      return mapConversationRowToDomain(updateResult.data);
    },

    async restoreConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      const existing = await persistence.findConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!existing.ok) {
        return mapPersistenceFailure(existing);
      }

      if (existing.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      // Idempotent: already active → return current domain row.
      if (existing.data.archived_at === null) {
        return mapConversationRowToDomain(existing.data);
      }

      const updateResult = await persistence.updateConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
        patch: { archived_at: null },
      });

      if (!updateResult.ok) {
        return mapPersistenceFailure(updateResult);
      }

      if (updateResult.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      return mapConversationRowToDomain(updateResult.data);
    },

    async deleteConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      const deleteResult = await persistence.deleteConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!deleteResult.ok) {
        return mapPersistenceFailure(deleteResult);
      }

      if (deleteResult.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      return mapConversationRowToDomain(deleteResult.data);
    },

    async listMessages(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      const ownership = await persistence.findConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!ownership.ok) {
        return mapPersistenceFailure(ownership);
      }

      if (ownership.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      const pageSizeResult = normalizeDivBrainPageSize(params.pageSize);
      if (!pageSizeResult.ok) {
        return pageSizeResult;
      }

      let cursor;
      if (params.cursor !== undefined) {
        const cursorResult = decodeMessageCursor(params.cursor);
        if (!cursorResult.ok) {
          return cursorResult;
        }
        cursor = cursorResult.data;
      }

      const fetchLimit = pageSizeResult.data + 1;
      const listResult = await persistence.listMessagesForConversation({
        conversationId: idResult.data,
        limit: fetchLimit,
        cursor,
      });

      if (!listResult.ok) {
        return mapPersistenceFailure(listResult);
      }

      const hasMore = listResult.data.length > pageSizeResult.data;
      const pageRows = hasMore
        ? listResult.data.slice(0, pageSizeResult.data)
        : listResult.data;

      const items: DivBrainMessage[] = [];
      for (const row of pageRows) {
        if (row.conversation_id.toLowerCase() !== idResult.data) {
          return divBrainFailureFromCode("persistence_failed");
        }
        const mapped = mapMessageRowToDomain(row);
        if (!mapped.ok) {
          return mapped;
        }
        items.push(mapped.data);
      }

      let nextCursor: string | null = null;
      if (hasMore && pageRows.length > 0) {
        const last = pageRows[pageRows.length - 1];
        nextCursor = encodeMessageCursor({
          createdAt: last.created_at,
          id: last.id,
        });
      }

      return divBrainSuccess({ items, nextCursor });
    },

    async createMessage(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }

      const idResult = normalizeDivBrainResourceId(params.conversationId);
      if (!idResult.ok) {
        return idResult;
      }

      if (
        "userId" in params ||
        "user_id" in params ||
        "ownerId" in params ||
        "owner_id" in params
      ) {
        return divBrainFailureFromCode("invalid_request");
      }

      const roleResult = validateDivBrainMessageRole(params.role);
      if (!roleResult.ok) {
        return roleResult;
      }

      if (typeof params.content !== "string") {
        return divBrainFailureFromCode("invalid_request");
      }

      const contentResult = normalizeDivBrainMessageContent(params.content);
      if (!contentResult.ok) {
        return contentResult;
      }

      if (contentResult.data.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
        return divBrainFailureFromCode("invalid_request");
      }

      const statusResult = validateDivBrainCompletionStatus(
        params.completionStatus,
      );
      if (!statusResult.ok) {
        return statusResult;
      }

      if (params.safetyClassification !== undefined) {
        if (
          params.safetyClassification !== null &&
          !isGuardrailDecision(params.safetyClassification)
        ) {
          return divBrainFailureFromCode("invalid_request");
        }
      }

      if (params.sources !== undefined) {
        if (!Array.isArray(params.sources)) {
          return divBrainFailureFromCode("invalid_request");
        }
      }

      if (params.errorCode !== undefined) {
        if (
          params.errorCode !== null &&
          !isDivBrainErrorCode(params.errorCode)
        ) {
          return divBrainFailureFromCode("invalid_request");
        }
      }

      const ownership = await persistence.findConversationForActor({
        conversationId: idResult.data,
        userId: actorResult.data,
      });

      if (!ownership.ok) {
        return mapPersistenceFailure(ownership);
      }

      if (ownership.data === null) {
        return divBrainFailureFromCode("not_found");
      }

      if (ownership.data.archived_at !== null) {
        return divBrainFailureFromCode("invalid_request");
      }

      const insertResult = await persistence.insertMessage({
        conversation_id: idResult.data,
        role: roleResult.data,
        content: contentResult.data,
        completion_status: statusResult.data,
        ...(params.safetyClassification !== undefined
          ? { safety_classification: params.safetyClassification }
          : {}),
        ...(params.sources !== undefined ? { sources: params.sources } : {}),
        ...(params.errorCode !== undefined
          ? { error_code: params.errorCode }
          : {}),
      });

      if (!insertResult.ok) {
        return mapPersistenceFailure(insertResult);
      }

      return mapMessageRowToDomain(insertResult.data);
    },
  };
}

/** Stable export for tests asserting the public error catalog remains closed. */
export const DIVBRAIN_REPOSITORY_PUBLIC_ERROR_CODES = DIVBRAIN_ERROR_CODES;
