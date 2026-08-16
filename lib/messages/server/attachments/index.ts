/**
 * Chat attachments server surface (Issue #239).
 * Server-only — must never be imported by client components.
 */

export {
  CHAT_ATTACHMENT_BUCKET,
  CHAT_ATTACHMENT_MAX_PER_MESSAGE,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  CHAT_ATTACHMENT_ABANDONED_TTL_MS,
  CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER,
  CHAT_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT,
  CHAT_ATTACHMENT_COPY_SV,
  CHAT_ATTACHMENT_UNLINKED_QUOTA_SQLSTATE,
  CHAT_ATTACHMENT_UNLINKED_QUOTA_MESSAGE,
  toConversationMessageAttachment,
} from "../../attachments";

export type { ChatAttachmentRepository } from "./repository";
export { createChatAttachmentRepository } from "./repository";
export { createChatServiceRoleAttachmentRepository } from "./wiring";
export type { ChatAttachmentClientError } from "./validation";
export {
  chatAttachmentSafeMessage,
  validateChatAttachmentBatchLimits,
  sniffChatAttachmentMime,
} from "./validation";
