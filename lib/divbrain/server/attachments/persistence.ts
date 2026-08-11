/**
 * Narrow DivBrain attachment persistence port.
 * Unit tests inject in-memory fakes; production uses Supabase service-role.
 */

import type { DivBrainAttachmentMimeType } from "../../attachments";
import type {
  DivBrainAttachmentInsert,
  DivBrainAttachmentRow,
} from "./types";

export type DivBrainAttachmentPersistenceError = {
  kind:
    | "not_found"
    | "unavailable"
    | "query_failed"
    | "malformed_response"
    | "configuration"
    | "quota_exceeded";
};

export type DivBrainAttachmentPersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DivBrainAttachmentPersistenceError };

export type DivBrainAttachmentPersistencePort = {
  insertAttachment(
    input: DivBrainAttachmentInsert,
  ): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow>>;

  findAttachmentForActor(params: {
    attachmentId: string;
    userId: string;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow | null>>;

  listAttachmentsForActorByIds(params: {
    attachmentIds: readonly string[];
    userId: string;
    conversationId: string;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow[]>>;

  listAttachmentsForMessages(params: {
    messageIds: readonly string[];
    userId: string;
    conversationId: string;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow[]>>;

  listReadyAttachmentsForConversation(params: {
    userId: string;
    conversationId: string;
    limit: number;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow[]>>;

  listStoragePathsForConversation(params: {
    userId: string;
    conversationId: string;
  }): Promise<
    DivBrainAttachmentPersistenceResult<
      Array<{ storage_bucket: string; storage_path: string }>
    >
  >;

  /**
   * Bounded scan of the actor's unlinked (message_id IS NULL), non-deleted
   * attachment rows — oldest first. Used for opportunistic TTL cleanup + quota.
   */
  listUnlinkedAttachmentsForActor(params: {
    userId: string;
    limit: number;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow[]>>;

  updateAttachmentStatusForActor(params: {
    attachmentId: string;
    userId: string;
    status: "uploaded" | "ready" | "failed" | "deleted";
    checksumSha256?: string | null;
  }): Promise<DivBrainAttachmentPersistenceResult<DivBrainAttachmentRow | null>>;

  linkAttachmentsToMessage(params: {
    attachmentIds: readonly string[];
    userId: string;
    conversationId: string;
    messageId: string;
  }): Promise<DivBrainAttachmentPersistenceResult<number>>;
};

export type DivBrainAttachmentStoragePort = {
  createSignedUploadUrl(params: {
    bucket: string;
    path: string;
    upsert?: boolean;
  }): Promise<
    DivBrainAttachmentPersistenceResult<{
      signedUrl: string;
      token: string;
      path: string;
    }>
  >;

  createSignedDownloadUrl(params: {
    bucket: string;
    path: string;
    expiresInSeconds: number;
  }): Promise<DivBrainAttachmentPersistenceResult<{ signedUrl: string }>>;

  downloadObject(params: {
    bucket: string;
    path: string;
  }): Promise<DivBrainAttachmentPersistenceResult<Uint8Array>>;

  removeObjects(params: {
    bucket: string;
    paths: readonly string[];
  }): Promise<DivBrainAttachmentPersistenceResult<void>>;

  objectExists(params: {
    bucket: string;
    path: string;
  }): Promise<DivBrainAttachmentPersistenceResult<boolean>>;
};

export type { DivBrainAttachmentMimeType };
