/**
 * Narrow DivBrain persistence port.
 *
 * Repository operations depend on this interface so unit tests can inject
 * in-memory fakes without a live Supabase project. The Supabase adapter is
 * the only production wiring to PostgREST.
 */

import type {
  DivBrainCompletionStatus,
  DivBrainMessageRole,
} from "../../types";
import type { DivBrainGuardrailDecision } from "../../guardrails";
import type { DivBrainErrorCode } from "../../errors";
import type { DivBrainSource } from "../../sources";
import type {
  DivBrainConversationRow,
  DivBrainMessageRow,
} from "./rows";
import type {
  DivBrainConversationCursor,
  DivBrainMessageCursor,
} from "./pagination";

export type DivBrainPersistenceError = {
  /**
   * Safe internal label only — never exposed to callers as-is.
   * Refined PostgREST buckets support operational diagnostics without
   * carrying raw codes or messages across the repository boundary.
   */
  kind:
    | "not_found"
    | "unavailable"
    | "query_failed"
    | "malformed_response"
    | "configuration"
    | "permission_denied"
    | "relation_missing"
    | "column_missing"
    | "auth_rejected"
    | "postgrest_other";
};

export type DivBrainPersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DivBrainPersistenceError };

export type DivBrainConversationArchiveFilter =
  | "active"
  | "archived"
  | "all";

export type DivBrainConversationInsert = {
  user_id: string;
  title: string;
  summary?: string | null;
  archived_at?: string | null;
};

export type DivBrainConversationUpdatePatch = {
  title?: string;
  summary?: string | null;
  archived_at?: string | null;
};

export type DivBrainMessageInsert = {
  conversation_id: string;
  role: DivBrainMessageRole;
  content: string;
  completion_status: DivBrainCompletionStatus;
  safety_classification?: DivBrainGuardrailDecision | null;
  /** Validated DivBrainSource array only — never arbitrary caller metadata. */
  sources?: DivBrainSource[];
  error_code?: DivBrainErrorCode | null;
};

export type DivBrainListConversationsQuery = {
  userId: string;
  archiveFilter: DivBrainConversationArchiveFilter;
  limit: number;
  cursor?: DivBrainConversationCursor;
};

export type DivBrainListMessagesQuery = {
  conversationId: string;
  limit: number;
  cursor?: DivBrainMessageCursor;
};

/**
 * Actor-scoped persistence operations.
 * Implementations that use a privileged client MUST still apply user_id /
 * ownership filters in every query — never load by resource id alone.
 */
export type DivBrainPersistencePort = {
  insertConversation(
    input: DivBrainConversationInsert,
  ): Promise<DivBrainPersistenceResult<DivBrainConversationRow>>;

  findConversationForActor(params: {
    conversationId: string;
    userId: string;
  }): Promise<DivBrainPersistenceResult<DivBrainConversationRow | null>>;

  listConversationsForActor(
    query: DivBrainListConversationsQuery,
  ): Promise<DivBrainPersistenceResult<DivBrainConversationRow[]>>;

  updateConversationForActor(params: {
    conversationId: string;
    userId: string;
    patch: DivBrainConversationUpdatePatch;
  }): Promise<DivBrainPersistenceResult<DivBrainConversationRow | null>>;

  deleteConversationForActor(params: {
    conversationId: string;
    userId: string;
  }): Promise<DivBrainPersistenceResult<DivBrainConversationRow | null>>;

  listMessagesForConversation(
    query: DivBrainListMessagesQuery,
  ): Promise<DivBrainPersistenceResult<DivBrainMessageRow[]>>;

  insertMessage(
    input: DivBrainMessageInsert,
  ): Promise<DivBrainPersistenceResult<DivBrainMessageRow>>;
};
