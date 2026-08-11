/**
 * DivBrain attachments server surface (Issue #166).
 * Server-only — must never be imported by client components.
 */

export {
  DIVBRAIN_ATTACHMENT_BUCKET,
  DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE,
  DIVBRAIN_ATTACHMENT_MAX_BYTES,
  DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  DIVBRAIN_ATTACHMENT_COMBINED_PROVIDER_MAX_BYTES,
  DIVBRAIN_ATTACHMENT_ABANDONED_TTL_MS,
  DIVBRAIN_ATTACHMENT_MAX_UNLINKED_PER_USER,
  DIVBRAIN_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT,
  DIVBRAIN_ATTACHMENT_COPY_SV,
  DIVBRAIN_UNLINKED_QUOTA_SQLSTATE,
  DIVBRAIN_UNLINKED_QUOTA_MESSAGE,
  formatDivBrainAttachmentOnlyLabel,
  toDivBrainShellAttachment,
} from "../../attachments";

export type {
  DivBrainAttachmentRepository,
} from "./repository";
export {
  createDivBrainAttachmentRepository,
  divBrainAttachmentSafeMessage,
} from "./repository";
export { createDivBrainServiceRoleAttachmentRepository } from "./wiring";
export {
  prepareDivBrainAttachmentsForGeneration,
  prepareRecentDivBrainAttachmentContext,
} from "./prepare";
export type { DivBrainPreparedAttachmentPayload } from "./types";
export type { DivBrainAttachmentClientError } from "./validation";
export {
  validateDivBrainAttachmentBatchLimits,
  sniffDivBrainAttachmentMime,
} from "./validation";
