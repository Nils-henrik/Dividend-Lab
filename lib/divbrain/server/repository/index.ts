/**
 * DivBrain conversation repository public surface (Ticket 1A-7a).
 *
 * Server-only by convention (`lib/divbrain/server/`). Must never be imported
 * by client components. Package-level `import "server-only"` remains deferred.
 */

export {
  createDivBrainConversationRepository,
  DIVBRAIN_DEFAULT_CONVERSATION_TITLE,
  DIVBRAIN_REPOSITORY_PUBLIC_ERROR_CODES,
  type ArchiveDivBrainConversationParams,
  type CreateDivBrainConversationParams,
  type CreateDivBrainMessageParams,
  type DeleteDivBrainConversationParams,
  type DivBrainConversationPage,
  type DivBrainConversationRepository,
  type DivBrainMessagePage,
  type DivBrainTrustedActorId,
  type GetDivBrainConversationParams,
  type ListDivBrainConversationsParams,
  type ListDivBrainMessagesParams,
  type UpdateDivBrainConversationParams,
} from "./repository";

export {
  DIVBRAIN_REPOSITORY_DEFAULT_PAGE_SIZE,
  DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE,
  decodeConversationCursor,
  decodeMessageCursor,
  encodeConversationCursor,
  encodeMessageCursor,
  normalizeDivBrainPageSize,
} from "./pagination";

export {
  mapConversationRowToDomain,
  mapMessageRowToDomain,
} from "./mapping";

export type {
  DivBrainConversationRow,
  DivBrainMessageRow,
} from "./rows";

export type {
  DivBrainConversationArchiveFilter,
  DivBrainPersistencePort,
  DivBrainPersistenceResult,
} from "./persistence";

export { createSupabaseDivBrainPersistencePort } from "./supabase-persistence";

export {
  createDivBrainServiceRoleClient,
  type DivBrainServiceRoleClient,
} from "./service-role-client";
