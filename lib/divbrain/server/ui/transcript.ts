/**
 * Bounded read-only transcript loading for the DivBrain shell.
 *
 * Differs from the context-history loader: terminal statuses such as
 * provider_unavailable, failed, and cancelled are retained for honest UI.
 * System messages are never exposed. Hidden reasoning is never present.
 * Completed assistant messages may expose a minimal validated source subset.
 *
 * Unexpected throws fail closed as a fresh catalog `internal_error`.
 * Thrown public error codes are not preserved.
 *
 * Server-only — must never be imported by client components.
 */

import { createDivBrainError } from "../../errors";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainSource } from "../../sources";
import type { DivBrainMessage } from "../../types";
import {
  toDivBrainShellAttachment,
  type DivBrainShellAttachment,
} from "../../attachments";
import {
  DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE,
  type DivBrainConversationRepository,
  type DivBrainTrustedActorId,
} from "../repository";
import type { DivBrainAttachmentRepository } from "../attachments/repository";
import {
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS,
  DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT,
  type DivBrainShellTranscriptItem,
  type DivBrainShellTranscriptSource,
  type DivBrainShellTranscriptView,
} from "./types";

export type LoadDivBrainShellTranscriptParams = {
  repository: DivBrainConversationRepository;
  actorId: DivBrainTrustedActorId;
  conversationId: string;
  /** Defaults to DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT. */
  renderLimit?: number;
  /** Defaults to DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS. */
  maxPageRounds?: number;
  /** Optional attachment metadata for user message chips. */
  attachmentRepository?: DivBrainAttachmentRepository;
};

const INCOMPLETE_NOTICE =
  "Den tidigare åtgärden slutfördes inte. Uppdatera sidan om du vill kontrollera status igen.";

const BLOCKED_NOTICE = "Den här begäran kunde inte visas.";

const UNAVAILABLE_NOTICE = "Meddelandet är inte tillgängligt just nu.";

function mapSourceForShell(source: DivBrainSource): DivBrainShellTranscriptSource {
  return {
    id: source.id,
    title: source.title,
    ...(source.publisher ? { publisher: source.publisher } : {}),
    ...(source.attribution ? { attribution: source.attribution } : {}),
    ...(source.internalRoute ? { internalRoute: source.internalRoute } : {}),
    ...(source.canonicalUrl ? { canonicalUrl: source.canonicalUrl } : {}),
  };
}

function mapSourcesForShell(
  sources: readonly DivBrainSource[] | undefined,
): DivBrainShellTranscriptSource[] {
  if (!sources || sources.length === 0) {
    return [];
  }

  return sources.map(mapSourceForShell);
}

/**
 * Map a persisted message to a safe browser transcript item.
 * Returns null when the message must be excluded (system, wrong conversation).
 * Blocked content never exposes stored prompt text.
 */
export function mapDivBrainMessageToShellTranscriptItem(
  message: DivBrainMessage,
  conversationId: string,
  attachmentsByMessageId?: ReadonlyMap<string, readonly DivBrainShellAttachment[]>,
): DivBrainShellTranscriptItem | null {
  if (message.conversationId !== conversationId) {
    return null;
  }

  if (message.role === "system") {
    return null;
  }

  if (message.role !== "user" && message.role !== "assistant") {
    return {
      kind: "unavailable",
      id: message.id,
      message: UNAVAILABLE_NOTICE,
      createdAt: message.createdAt,
    };
  }

  switch (message.completionStatus) {
    case "completed": {
      if (message.role === "user") {
        const attachments = attachmentsByMessageId?.get(message.id);
        return {
          kind: "user_message",
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          ...(attachments && attachments.length > 0 ? { attachments } : {}),
        };
      }

      const sources = mapSourcesForShell(message.sources);
      return {
        kind: "assistant_message",
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        ...(sources.length > 0 ? { sources } : {}),
      };
    }
    case "provider_unavailable": {
      return {
        kind: "provider_unavailable",
        id: message.id,
        message: createDivBrainError("provider_unavailable").message,
        createdAt: message.createdAt,
      };
    }
    case "failed": {
      // Prefer catalog message — never forward raw stored failure payloads.
      const catalog = createDivBrainError("internal_error");
      const stored = message.content.trim();
      const safeMessage =
        stored.length > 0 &&
        (stored === catalog.message ||
          stored === createDivBrainError("persistence_failed").message ||
          stored === createDivBrainError("provider_unavailable").message)
          ? stored
          : catalog.message;

      return {
        kind: "failed",
        id: message.id,
        message: safeMessage,
        createdAt: message.createdAt,
      };
    }
    case "cancelled": {
      return {
        kind: "cancelled",
        id: message.id,
        message: createDivBrainError("cancelled").message,
        createdAt: message.createdAt,
      };
    }
    case "pending":
    case "generating": {
      return {
        kind: "incomplete",
        id: message.id,
        message: INCOMPLETE_NOTICE,
        createdAt: message.createdAt,
      };
    }
    case "blocked": {
      return {
        kind: "blocked",
        id: message.id,
        message: BLOCKED_NOTICE,
        createdAt: message.createdAt,
      };
    }
    default: {
      return {
        kind: "unavailable",
        id: message.id,
        message: UNAVAILABLE_NOTICE,
        createdAt: message.createdAt,
      };
    }
  }
}

/**
 * Map persisted messages to shell transcript items without mutating input.
 * Chronological order is preserved. System and cross-conversation rows drop.
 */
export function mapMessagesToShellTranscriptItems(
  messages: readonly DivBrainMessage[],
  conversationId: string,
  attachmentsByMessageId?: ReadonlyMap<string, readonly DivBrainShellAttachment[]>,
): DivBrainShellTranscriptItem[] {
  const items: DivBrainShellTranscriptItem[] = [];

  for (const message of messages) {
    const item = mapDivBrainMessageToShellTranscriptItem(
      message,
      conversationId,
      attachmentsByMessageId,
    );
    if (item) {
      items.push(item);
    }
  }

  return items;
}

function isSafeMessagePage(value: unknown): value is {
  items: readonly DivBrainMessage[];
  nextCursor: string | null;
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const page = value as {
    items?: unknown;
    nextCursor?: unknown;
  };

  if (!Array.isArray(page.items)) {
    return false;
  }

  if (!(typeof page.nextCursor === "string" || page.nextCursor === null)) {
    return false;
  }

  return true;
}

async function loadDivBrainShellTranscriptInner(
  params: LoadDivBrainShellTranscriptParams,
): Promise<DivBrainResult<DivBrainShellTranscriptView>> {
  const renderLimit =
    typeof params.renderLimit === "number" &&
    Number.isInteger(params.renderLimit) &&
    params.renderLimit > 0
      ? Math.min(params.renderLimit, DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT)
      : DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT;

  const maxPageRounds =
    typeof params.maxPageRounds === "number" &&
    Number.isInteger(params.maxPageRounds) &&
    params.maxPageRounds > 0
      ? Math.min(params.maxPageRounds, DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS)
      : DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS;

  const collected: DivBrainMessage[] = [];
  let cursor: string | undefined;
  let rounds = 0;
  const seenCursors = new Set<string>();
  let unfinished = true;

  while (rounds < maxPageRounds) {
    rounds += 1;

    if (cursor !== undefined) {
      if (seenCursors.has(cursor)) {
        return divBrainFailureFromCode("internal_error");
      }
      seenCursors.add(cursor);
    }

    const pageBeforeCount = collected.length;

    let page: DivBrainResult<{
      items: readonly DivBrainMessage[];
      nextCursor: string | null;
    }>;

    try {
      page = await params.repository.listMessages({
        actorId: params.actorId,
        conversationId: params.conversationId,
        pageSize: DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE,
        ...(cursor !== undefined ? { cursor } : {}),
      });
    } catch {
      return divBrainFailureFromCode("internal_error");
    }

    if (!page.ok) {
      // Typed repository failure — never forward raw thrown values.
      return divBrainFailureFromCode(page.error.code);
    }

    if (!isSafeMessagePage(page.data)) {
      return divBrainFailureFromCode("internal_error");
    }

    collected.push(...page.data.items);

    if (page.data.nextCursor === null) {
      unfinished = false;
      break;
    }

    if (collected.length === pageBeforeCount) {
      return divBrainFailureFromCode("internal_error");
    }

    if (page.data.nextCursor === cursor) {
      return divBrainFailureFromCode("internal_error");
    }

    cursor = page.data.nextCursor;
  }

  if (unfinished) {
    return divBrainFailureFromCode("internal_error");
  }

  const attachmentsByMessageId = new Map<
    string,
    DivBrainShellAttachment[]
  >();

  if (params.attachmentRepository) {
    const userMessageIds = collected
      .filter(
        (message) =>
          message.role === "user" && message.completionStatus === "completed",
      )
      .map((message) => message.id);

    if (userMessageIds.length > 0) {
      const listed = await params.attachmentRepository.listForMessages({
        actorId: params.actorId,
        conversationId: params.conversationId,
        messageIds: userMessageIds,
      });
      if (listed.ok) {
        for (const attachment of listed.data) {
          if (!attachment.messageId) continue;
          const shell = toDivBrainShellAttachment({
            id: attachment.id,
            filename: attachment.originalFilename,
            mimeType: attachment.mimeType,
            byteSize: attachment.byteSize,
          });
          const existing = attachmentsByMessageId.get(attachment.messageId) ?? [];
          existing.push(shell);
          attachmentsByMessageId.set(attachment.messageId, existing);
        }
      }
    }
  }

  const mapped = mapMessagesToShellTranscriptItems(
    collected,
    params.conversationId,
    attachmentsByMessageId,
  );

  if (mapped.length === 0) {
    return divBrainSuccess({ status: "empty" });
  }

  const historyTruncated = mapped.length > renderLimit;
  const items = historyTruncated
    ? mapped.slice(mapped.length - renderLimit)
    : mapped;

  return divBrainSuccess({
    status: "ready",
    items,
    historyTruncated,
  });
}

/**
 * Load a bounded transcript for the shell UI.
 * Reaches the chronological tail before presenting; fails safely on overflow.
 * Unexpected throws never escape as raw errors.
 */
export async function loadDivBrainShellTranscript(
  params: LoadDivBrainShellTranscriptParams,
): Promise<DivBrainResult<DivBrainShellTranscriptView>> {
  try {
    return await loadDivBrainShellTranscriptInner(params);
  } catch {
    return divBrainFailureFromCode("internal_error");
  }
}
