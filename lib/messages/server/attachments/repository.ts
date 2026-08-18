/**
 * Chat attachment repository — uploader-scoped prepare/confirm/discard
 * and conversation-scoped Storage API cleanup.
 *
 * Missing and cross-uploader ids both map to not_found (no existence leak).
 */

import { createHash, randomUUID } from "node:crypto";
import {
  CHAT_ATTACHMENT_ABANDONED_TTL_MS,
  CHAT_ATTACHMENT_BUCKET,
  CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER,
  CHAT_ATTACHMENT_SIGNED_DOWNLOAD_SECONDS,
  CHAT_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT,
  isChatAttachmentMimeType,
  isChatUuid,
  toConversationMessageAttachment,
  type ConversationMessageAttachment,
} from "../../attachments";
import type {
  ChatAttachmentPersistencePort,
  ChatAttachmentPersistenceResult,
  ChatAttachmentStoragePort,
} from "./persistence";
import type { ChatAttachmentRow } from "./types";
import {
  sniffChatAttachmentMime,
  validateChatAttachmentPrepareInput,
  type ChatAttachmentClientError,
} from "./validation";

export type ChatAttachmentRepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; clientError: ChatAttachmentClientError }
  | { ok: false; errorKind: "unavailable" | "not_found" };

export type ChatAttachmentPrepareUploadResult =
  | {
      ok: true;
      attachmentId: string;
      signedUrl: string;
      token: string;
      shell: ConversationMessageAttachment;
    }
  | { ok: false; clientError: ChatAttachmentClientError };

export type ChatAttachmentConfirmUploadResult =
  | { ok: true; shell: ConversationMessageAttachment }
  | { ok: false; clientError: ChatAttachmentClientError };

export type ChatAttachmentDiscardResult =
  | { ok: true }
  | { ok: false; clientError: ChatAttachmentClientError };

function persistenceUnavailable<T>(
  result: ChatAttachmentPersistenceResult<unknown>,
): ChatAttachmentRepositoryResult<T> {
  if (result.ok) {
    return { ok: false, errorKind: "unavailable" };
  }
  if (result.error.kind === "not_found") {
    return { ok: false, clientError: "not_found" };
  }
  return { ok: false, errorKind: "unavailable" };
}

export type ChatAttachmentRepository = {
  prepareUpload(params: {
    actorId: string;
    conversationId: string;
    filename: string;
    mimeType: string;
    byteSize: number;
  }): Promise<ChatAttachmentPrepareUploadResult>;

  confirmUpload(params: {
    actorId: string;
    attachmentId: string;
  }): Promise<ChatAttachmentConfirmUploadResult>;

  discardUnlinkedAttachment(params: {
    actorId: string;
    attachmentId: string;
  }): Promise<ChatAttachmentDiscardResult>;

  createSignedDownloadUrl(params: {
    storageBucket: string;
    storagePath: string;
    expiresInSeconds?: number;
  }): Promise<
    ChatAttachmentRepositoryResult<{ signedUrl: string }>
  >;

  cleanupConversationStorage(params: {
    conversationId: string;
  }): Promise<ChatAttachmentRepositoryResult<void>>;

  cleanupUploaderStorage(params: {
    uploaderId: string;
  }): Promise<ChatAttachmentRepositoryResult<void>>;
};

export function createChatAttachmentRepository(deps: {
  persistence: ChatAttachmentPersistencePort;
  storage: ChatAttachmentStoragePort;
  nowMs?: () => number;
}): ChatAttachmentRepository {
  const { persistence, storage } = deps;
  const nowMs = deps.nowMs ?? (() => Date.now());

  async function retireUnlinkedAttachmentObject(params: {
    actorId: string;
    row: ChatAttachmentRow;
  }): Promise<ChatAttachmentDiscardResult> {
    const removed = await storage.removeObjects({
      bucket: params.row.storage_bucket,
      paths: [params.row.storage_path],
    });
    if (!removed.ok) {
      return { ok: false, clientError: "discard_failure" };
    }

    const updated = await persistence.updateAttachmentStatusForUploader({
      attachmentId: params.row.id,
      uploaderId: params.actorId,
      status: "deleted",
    });
    if (!updated.ok) {
      return { ok: false, clientError: "upload_failure" };
    }
    return { ok: true };
  }

  async function enforceUnlinkedQuotaBeforePrepare(params: {
    actorId: string;
  }): Promise<
    | { ok: true }
    | { ok: false; clientError: ChatAttachmentClientError }
  > {
    const listed = await persistence.listUnlinkedAttachmentsForUploader({
      uploaderId: params.actorId,
      limit: CHAT_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT,
    });
    if (!listed.ok) {
      return { ok: false, clientError: "upload_failure" };
    }

    const cutoff = nowMs() - CHAT_ATTACHMENT_ABANDONED_TTL_MS;
    for (const row of listed.data) {
      const createdMs = Date.parse(row.created_at);
      if (!Number.isFinite(createdMs) || createdMs > cutoff) {
        continue;
      }
      const retired = await retireUnlinkedAttachmentObject({
        actorId: params.actorId,
        row,
      });
      if (!retired.ok) {
        return { ok: false, clientError: "upload_failure" };
      }
    }

    const afterCleanup = await persistence.listUnlinkedAttachmentsForUploader({
      uploaderId: params.actorId,
      limit: CHAT_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT,
    });
    if (!afterCleanup.ok) {
      return { ok: false, clientError: "upload_failure" };
    }

    if (afterCleanup.data.length >= CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER) {
      return { ok: false, clientError: "unlinked_quota" };
    }

    return { ok: true };
  }

  async function cleanupPaths(
    listed: ChatAttachmentPersistenceResult<
      Array<{ storage_bucket: string; storage_path: string }>
    >,
  ): Promise<ChatAttachmentRepositoryResult<void>> {
    if (!listed.ok) {
      return persistenceUnavailable(listed);
    }

    const byBucket = new Map<string, string[]>();
    for (const row of listed.data) {
      const paths = byBucket.get(row.storage_bucket) ?? [];
      paths.push(row.storage_path);
      byBucket.set(row.storage_bucket, paths);
    }

    for (const [bucket, paths] of byBucket) {
      const removed = await storage.removeObjects({ bucket, paths });
      if (!removed.ok) {
        return { ok: false, errorKind: "unavailable" };
      }
    }

    return { ok: true, data: undefined };
  }

  return {
    async prepareUpload(params) {
      if (!isChatUuid(params.actorId) || !isChatUuid(params.conversationId)) {
        return { ok: false, clientError: "invalid" };
      }

      const validated = validateChatAttachmentPrepareInput({
        filename: params.filename,
        mimeType: params.mimeType,
        byteSize: params.byteSize,
      });
      if (!validated.ok) {
        return validated;
      }

      const quota = await enforceUnlinkedQuotaBeforePrepare({
        actorId: params.actorId,
      });
      if (!quota.ok) {
        return quota;
      }

      const attachmentId = randomUUID();
      const storagePath = `${params.actorId}/${attachmentId}`;

      const insertResult = await persistence.insertAttachment({
        id: attachmentId,
        conversation_id: params.conversationId,
        uploader_id: params.actorId,
        storage_bucket: CHAT_ATTACHMENT_BUCKET,
        storage_path: storagePath,
        original_filename: validated.data.filename,
        mime_type: validated.data.mimeType,
        byte_size: validated.data.byteSize,
        status: "pending",
      });
      if (!insertResult.ok) {
        if (insertResult.error.kind === "quota_exceeded") {
          return { ok: false, clientError: "unlinked_quota" };
        }
        return { ok: false, clientError: "upload_failure" };
      }

      const signed = await storage.createSignedUploadUrl({
        bucket: CHAT_ATTACHMENT_BUCKET,
        path: storagePath,
        upsert: false,
      });
      if (!signed.ok) {
        await persistence.updateAttachmentStatusForUploader({
          attachmentId,
          uploaderId: params.actorId,
          status: "deleted",
        });
        return { ok: false, clientError: "upload_failure" };
      }

      return {
        ok: true,
        attachmentId,
        signedUrl: signed.data.signedUrl,
        token: signed.data.token,
        shell: toConversationMessageAttachment({
          id: attachmentId,
          filename: validated.data.filename,
          mimeType: validated.data.mimeType,
          byteSize: validated.data.byteSize,
        }),
      };
    },

    async confirmUpload(params) {
      if (!isChatUuid(params.actorId) || !isChatUuid(params.attachmentId)) {
        return { ok: false, clientError: "not_found" };
      }

      const found = await persistence.findAttachmentForUploader({
        attachmentId: params.attachmentId,
        uploaderId: params.actorId,
      });
      if (!found.ok) {
        return { ok: false, clientError: "upload_failure" };
      }
      if (!found.data) {
        return { ok: false, clientError: "not_found" };
      }
      if (found.data.status === "ready") {
        if (!isChatAttachmentMimeType(found.data.mime_type)) {
          return { ok: false, clientError: "unsupported" };
        }
        return {
          ok: true,
          shell: toConversationMessageAttachment({
            id: found.data.id,
            filename: found.data.original_filename,
            mimeType: found.data.mime_type,
            byteSize: found.data.byte_size,
          }),
        };
      }
      if (found.data.status !== "pending" && found.data.status !== "uploaded") {
        return { ok: false, clientError: "incomplete" };
      }

      const exists = await storage.objectExists({
        bucket: found.data.storage_bucket,
        path: found.data.storage_path,
      });
      if (!exists.ok || !exists.data) {
        await persistFailedThenDiscard({
          persistence,
          storage,
          actorId: params.actorId,
          row: found.data,
        });
        return { ok: false, clientError: "upload_failure" };
      }

      const downloaded = await storage.downloadObject({
        bucket: found.data.storage_bucket,
        path: found.data.storage_path,
      });
      if (!downloaded.ok) {
        return { ok: false, clientError: "upload_failure" };
      }

      if (downloaded.data.byteLength !== found.data.byte_size) {
        await persistFailedThenDiscard({
          persistence,
          storage,
          actorId: params.actorId,
          row: found.data,
        });
        return { ok: false, clientError: "too_large" };
      }

      if (!isChatAttachmentMimeType(found.data.mime_type)) {
        await persistFailedThenDiscard({
          persistence,
          storage,
          actorId: params.actorId,
          row: found.data,
        });
        return { ok: false, clientError: "unsupported" };
      }

      const sniffed = sniffChatAttachmentMime(
        downloaded.data,
        found.data.mime_type,
      );
      if (!sniffed) {
        await persistFailedThenDiscard({
          persistence,
          storage,
          actorId: params.actorId,
          row: found.data,
        });
        return { ok: false, clientError: "unsupported" };
      }

      const checksum = createHash("sha256")
        .update(downloaded.data)
        .digest("hex");

      const updated = await persistence.updateAttachmentStatusForUploader({
        attachmentId: params.attachmentId,
        uploaderId: params.actorId,
        status: "ready",
        checksumSha256: checksum,
      });
      if (!updated.ok || !updated.data) {
        return { ok: false, clientError: "upload_failure" };
      }
      if (!isChatAttachmentMimeType(updated.data.mime_type)) {
        return { ok: false, clientError: "unsupported" };
      }

      return {
        ok: true,
        shell: toConversationMessageAttachment({
          id: updated.data.id,
          filename: updated.data.original_filename,
          mimeType: updated.data.mime_type,
          byteSize: updated.data.byte_size,
        }),
      };
    },

    async discardUnlinkedAttachment(params) {
      if (!isChatUuid(params.actorId) || !isChatUuid(params.attachmentId)) {
        return { ok: false, clientError: "not_found" };
      }

      const found = await persistence.findAttachmentForUploader({
        attachmentId: params.attachmentId,
        uploaderId: params.actorId,
      });
      if (!found.ok) {
        return { ok: false, clientError: "upload_failure" };
      }
      if (!found.data) {
        return { ok: false, clientError: "not_found" };
      }
      if (found.data.status === "deleted") {
        return { ok: true };
      }
      if (found.data.message_id !== null) {
        return { ok: false, clientError: "not_found" };
      }

      const removed = await storage.removeObjects({
        bucket: found.data.storage_bucket,
        paths: [found.data.storage_path],
      });
      if (!removed.ok) {
        return { ok: false, clientError: "upload_failure" };
      }

      const updated = await persistence.updateAttachmentStatusForUploader({
        attachmentId: params.attachmentId,
        uploaderId: params.actorId,
        status: "deleted",
      });
      if (!updated.ok) {
        return { ok: false, clientError: "upload_failure" };
      }
      return { ok: true };
    },

    async createSignedDownloadUrl(params) {
      if (
        params.storageBucket !== CHAT_ATTACHMENT_BUCKET ||
        !params.storagePath.includes("/")
      ) {
        return { ok: false, clientError: "not_found" };
      }

      const signed = await storage.createSignedDownloadUrl({
        bucket: params.storageBucket,
        path: params.storagePath,
        expiresInSeconds:
          params.expiresInSeconds ?? CHAT_ATTACHMENT_SIGNED_DOWNLOAD_SECONDS,
      });
      if (!signed.ok) {
        return { ok: false, errorKind: "unavailable" };
      }
      return { ok: true, data: { signedUrl: signed.data.signedUrl } };
    },

    async cleanupConversationStorage(params) {
      if (!isChatUuid(params.conversationId)) {
        return { ok: false, clientError: "invalid" };
      }
      const listed = await persistence.listStoragePathsForConversation({
        conversationId: params.conversationId,
      });
      return cleanupPaths(listed);
    },

    async cleanupUploaderStorage(params) {
      if (!isChatUuid(params.uploaderId)) {
        return { ok: false, clientError: "invalid" };
      }
      const listed = await persistence.listStoragePathsForUploader({
        uploaderId: params.uploaderId,
      });
      return cleanupPaths(listed);
    },
  };
}

async function persistFailedThenDiscard(params: {
  persistence: ChatAttachmentPersistencePort;
  storage: ChatAttachmentStoragePort;
  actorId: string;
  row: ChatAttachmentRow;
}): Promise<void> {
  await params.persistence.updateAttachmentStatusForUploader({
    attachmentId: params.row.id,
    uploaderId: params.actorId,
    status: "failed",
  });
  const removed = await params.storage.removeObjects({
    bucket: params.row.storage_bucket,
    paths: [params.row.storage_path],
  });
  if (!removed.ok) {
    return;
  }
  await params.persistence.updateAttachmentStatusForUploader({
    attachmentId: params.row.id,
    uploaderId: params.actorId,
    status: "deleted",
  });
}
