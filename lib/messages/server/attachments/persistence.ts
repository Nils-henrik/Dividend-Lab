/**
 * Narrow chat attachment persistence port.
 * Unit tests inject in-memory fakes; production uses Supabase service-role.
 */

import type { ChatAttachmentInsert, ChatAttachmentRow } from "./types";

export type ChatAttachmentPersistenceError = {
  kind:
    | "not_found"
    | "unavailable"
    | "query_failed"
    | "malformed_response"
    | "configuration"
    | "quota_exceeded";
};

export type ChatAttachmentPersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ChatAttachmentPersistenceError };

export type ChatAttachmentPersistencePort = {
  insertAttachment(
    input: ChatAttachmentInsert,
  ): Promise<ChatAttachmentPersistenceResult<ChatAttachmentRow>>;

  findAttachmentForUploader(params: {
    attachmentId: string;
    uploaderId: string;
  }): Promise<ChatAttachmentPersistenceResult<ChatAttachmentRow | null>>;

  listUnlinkedAttachmentsForUploader(params: {
    uploaderId: string;
    limit: number;
  }): Promise<ChatAttachmentPersistenceResult<ChatAttachmentRow[]>>;

  updateAttachmentStatusForUploader(params: {
    attachmentId: string;
    uploaderId: string;
    status: "uploaded" | "ready" | "failed" | "deleted";
    checksumSha256?: string | null;
  }): Promise<ChatAttachmentPersistenceResult<ChatAttachmentRow | null>>;

  listStoragePathsForConversation(params: {
    conversationId: string;
  }): Promise<
    ChatAttachmentPersistenceResult<
      Array<{ storage_bucket: string; storage_path: string }>
    >
  >;

  listStoragePathsForUploader(params: {
    uploaderId: string;
  }): Promise<
    ChatAttachmentPersistenceResult<
      Array<{ storage_bucket: string; storage_path: string }>
    >
  >;
};

export type ChatAttachmentStoragePort = {
  createSignedUploadUrl(params: {
    bucket: string;
    path: string;
    upsert?: boolean;
  }): Promise<
    ChatAttachmentPersistenceResult<{
      signedUrl: string;
      token: string;
      path: string;
    }>
  >;

  createSignedDownloadUrl(params: {
    bucket: string;
    path: string;
    expiresInSeconds: number;
  }): Promise<ChatAttachmentPersistenceResult<{ signedUrl: string }>>;

  downloadObject(params: {
    bucket: string;
    path: string;
  }): Promise<ChatAttachmentPersistenceResult<Uint8Array>>;

  removeObjects(params: {
    bucket: string;
    paths: readonly string[];
  }): Promise<ChatAttachmentPersistenceResult<void>>;

  objectExists(params: {
    bucket: string;
    path: string;
  }): Promise<ChatAttachmentPersistenceResult<boolean>>;
};
