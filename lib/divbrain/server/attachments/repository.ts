/**
 * DivBrain attachment repository — ownership-scoped server operations.
 * Missing and cross-owner ids both map to not_found (no existence leak).
 */

import {
  DIVBRAIN_ATTACHMENT_BUCKET,
  isDivBrainAttachmentMimeType,
  toDivBrainShellAttachment,
  type DivBrainAttachmentStatus,
  type DivBrainShellAttachment,
} from "../../attachments";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { createDivBrainError } from "../../errors";
import { normalizeDivBrainActorId, normalizeDivBrainResourceId, isDivBrainUuid } from "../repository/ids";
import type {
  DivBrainAttachmentPersistencePort,
  DivBrainAttachmentStoragePort,
} from "./persistence";
import type {
  DivBrainAttachmentRecord,
  DivBrainAttachmentRow,
} from "./types";
import {
  sniffDivBrainAttachmentMime,
  validateDivBrainAttachmentPrepareInput,
  divBrainAttachmentSafeMessage,
  type DivBrainAttachmentClientError,
} from "./validation";
import { createHash, randomUUID } from "node:crypto";

function mapPersistenceFailure<T>(
  kind: string,
): DivBrainResult<T> {
  switch (kind) {
    case "not_found":
      return divBrainFailureFromCode("not_found");
    case "configuration":
      return divBrainFailureFromCode("internal_error");
    default:
      return divBrainFailureFromCode("persistence_failed");
  }
}

function persistenceError(kind: string) {
  const failure = mapPersistenceFailure(kind);
  if (!failure.ok) {
    return failure.error;
  }
  return createDivBrainError("persistence_failed");
}

function mapRow(row: DivBrainAttachmentRow): DivBrainResult<DivBrainAttachmentRecord> {
  if (!isDivBrainAttachmentMimeType(row.mime_type)) {
    return divBrainFailureFromCode("persistence_failed");
  }

  const status = row.status as DivBrainAttachmentStatus;
  return divBrainSuccess({
    id: row.id,
    userId: row.user_id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    checksumSha256: row.checksum_sha256,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export type DivBrainAttachmentRepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: import("../../errors").DivBrainError };

export type DivBrainAttachmentPrepareUploadResult =
  | {
      ok: true;
      attachmentId: string;
      signedUrl: string;
      token: string;
      shell: DivBrainShellAttachment;
    }
  | { ok: false; clientError: DivBrainAttachmentClientError }
  | { ok: false; error: import("../../errors").DivBrainError };

export type DivBrainAttachmentConfirmUploadResult =
  | { ok: true; shell: DivBrainShellAttachment }
  | { ok: false; clientError: DivBrainAttachmentClientError }
  | { ok: false; error: import("../../errors").DivBrainError };

export type DivBrainAttachmentRepository = {
  prepareUpload(params: {
    actorId: string;
    conversationId: string;
    filename: string;
    mimeType: string;
    byteSize: number;
  }): Promise<DivBrainAttachmentPrepareUploadResult>;

  confirmUpload(params: {
    actorId: string;
    attachmentId: string;
  }): Promise<DivBrainAttachmentConfirmUploadResult>;

  resolveReadyAttachmentsForSubmit(params: {
    actorId: string;
    conversationId: string;
    attachmentIds: readonly string[];
  }): Promise<DivBrainResult<DivBrainAttachmentRecord[]>>;

  linkToMessage(params: {
    actorId: string;
    conversationId: string;
    messageId: string;
    attachmentIds: readonly string[];
  }): Promise<DivBrainResult<void>>;

  listForMessages(params: {
    actorId: string;
    conversationId: string;
    messageIds: readonly string[];
  }): Promise<DivBrainResult<DivBrainAttachmentRecord[]>>;

  listRecentReadyForConversation(params: {
    actorId: string;
    conversationId: string;
    limit: number;
  }): Promise<DivBrainResult<DivBrainAttachmentRecord[]>>;

  downloadBytes(params: {
    actorId: string;
    attachment: DivBrainAttachmentRecord;
  }): Promise<DivBrainResult<Uint8Array>>;

  createSignedDownloadUrl(params: {
    actorId: string;
    attachmentId: string;
    expiresInSeconds?: number;
  }): Promise<DivBrainResult<{ signedUrl: string; filename: string; mimeType: string }>>;

  cleanupConversationStorage(params: {
    actorId: string;
    conversationId: string;
  }): Promise<DivBrainResult<void>>;
};

export function createDivBrainAttachmentRepository(deps: {
  persistence: DivBrainAttachmentPersistencePort;
  storage: DivBrainAttachmentStoragePort;
}): DivBrainAttachmentRepository {
  const { persistence, storage } = deps;

  return {
    async prepareUpload(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return { ok: false as const, error: actorResult.error };
      }
      const conversationResult = normalizeDivBrainResourceId(params.conversationId);
      if (!conversationResult.ok) {
        return { ok: false as const, error: conversationResult.error };
      }

      const validated = validateDivBrainAttachmentPrepareInput({
        filename: params.filename,
        mimeType: params.mimeType,
        byteSize: params.byteSize,
      });
      if (!validated.ok) {
        if ("clientError" in validated) {
          return validated;
        }
        return { ok: false as const, clientError: "invalid" as const };
      }

      const attachmentId = randomUUID();
      const storagePath = `${actorResult.data}/${conversationResult.data}/${attachmentId}/${validated.data.filename}`;

      const insertResult = await persistence.insertAttachment({
        id: attachmentId,
        user_id: actorResult.data,
        conversation_id: conversationResult.data,
        storage_bucket: DIVBRAIN_ATTACHMENT_BUCKET,
        storage_path: storagePath,
        original_filename: validated.data.filename,
        mime_type: validated.data.mimeType,
        byte_size: validated.data.byteSize,
        status: "pending",
      });
      if (!insertResult.ok) {
        return { ok: false as const, error: persistenceError(insertResult.error.kind) };
      }

      const signed = await storage.createSignedUploadUrl({
        bucket: DIVBRAIN_ATTACHMENT_BUCKET,
        path: storagePath,
        upsert: false,
      });
      if (!signed.ok) {
        await persistence.updateAttachmentStatusForActor({
          attachmentId,
          userId: actorResult.data,
          status: "failed",
        });
        return { ok: false as const, clientError: "upload_failure" as const };
      }

      return {
        ok: true as const,
        attachmentId,
        signedUrl: signed.data.signedUrl,
        token: signed.data.token,
        shell: toDivBrainShellAttachment({
          id: attachmentId,
          filename: validated.data.filename,
          mimeType: validated.data.mimeType,
          byteSize: validated.data.byteSize,
        }),
      };
    },

    async confirmUpload(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return { ok: false as const, error: actorResult.error };
      }
      const idResult = normalizeDivBrainResourceId(params.attachmentId);
      if (!idResult.ok) {
        return { ok: false as const, error: createDivBrainError("not_found") };
      }

      const found = await persistence.findAttachmentForActor({
        attachmentId: idResult.data,
        userId: actorResult.data,
      });
      if (!found.ok) {
        return { ok: false as const, error: persistenceError(found.error.kind) };
      }
      if (!found.data) {
        return { ok: false as const, error: createDivBrainError("not_found") };
      }
      if (found.data.status === "ready") {
        const mapped = mapRow(found.data);
        if (!mapped.ok) {
          return { ok: false as const, error: mapped.error };
        }
        return {
          ok: true as const,
          shell: toDivBrainShellAttachment({
            id: mapped.data.id,
            filename: mapped.data.originalFilename,
            mimeType: mapped.data.mimeType,
            byteSize: mapped.data.byteSize,
          }),
        };
      }
      if (found.data.status !== "pending" && found.data.status !== "uploaded") {
        return { ok: false as const, clientError: "incomplete" as const };
      }

      const exists = await storage.objectExists({
        bucket: found.data.storage_bucket,
        path: found.data.storage_path,
      });
      if (!exists.ok || !exists.data) {
        await persistence.updateAttachmentStatusForActor({
          attachmentId: idResult.data,
          userId: actorResult.data,
          status: "failed",
        });
        return { ok: false as const, clientError: "upload_failure" as const };
      }

      const downloaded = await storage.downloadObject({
        bucket: found.data.storage_bucket,
        path: found.data.storage_path,
      });
      if (!downloaded.ok) {
        return { ok: false as const, clientError: "upload_failure" as const };
      }

      if (downloaded.data.byteLength !== found.data.byte_size) {
        await persistence.updateAttachmentStatusForActor({
          attachmentId: idResult.data,
          userId: actorResult.data,
          status: "failed",
        });
        return { ok: false as const, clientError: "upload_failure" as const };
      }

      if (!isDivBrainAttachmentMimeType(found.data.mime_type)) {
        return { ok: false as const, clientError: "unsupported" as const };
      }

      const sniffed = sniffDivBrainAttachmentMime(
        downloaded.data,
        found.data.mime_type,
      );
      if (!sniffed) {
        await persistence.updateAttachmentStatusForActor({
          attachmentId: idResult.data,
          userId: actorResult.data,
          status: "failed",
        });
        return { ok: false as const, clientError: "unsupported" as const };
      }

      const checksum = createHash("sha256")
        .update(downloaded.data)
        .digest("hex");

      const updated = await persistence.updateAttachmentStatusForActor({
        attachmentId: idResult.data,
        userId: actorResult.data,
        status: "ready",
        checksumSha256: checksum,
      });
      if (!updated.ok) {
        return { ok: false as const, error: persistenceError(updated.error.kind) };
      }
      if (!updated.data) {
        return { ok: false as const, error: createDivBrainError("not_found") };
      }

      const mapped = mapRow(updated.data);
      if (!mapped.ok) {
        return { ok: false as const, error: mapped.error };
      }

      return {
        ok: true as const,
        shell: toDivBrainShellAttachment({
          id: mapped.data.id,
          filename: mapped.data.originalFilename,
          mimeType: mapped.data.mimeType,
          byteSize: mapped.data.byteSize,
        }),
      };
    },

    async resolveReadyAttachmentsForSubmit(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const conversationResult = normalizeDivBrainResourceId(
        params.conversationId,
      );
      if (!conversationResult.ok) {
        return conversationResult;
      }

      const uniqueIds: string[] = [];
      const seen = new Set<string>();
      for (const raw of params.attachmentIds) {
        if (typeof raw !== "string" || !isDivBrainUuid(raw)) {
          return divBrainFailureFromCode("not_found");
        }
        const id = raw.toLowerCase();
        if (seen.has(id)) {
          continue;
        }
        seen.add(id);
        uniqueIds.push(id);
      }

      if (uniqueIds.length === 0) {
        return divBrainSuccess([]);
      }

      const listed = await persistence.listAttachmentsForActorByIds({
        attachmentIds: uniqueIds,
        userId: actorResult.data,
        conversationId: conversationResult.data,
      });
      if (!listed.ok) {
        return mapPersistenceFailure(listed.error.kind);
      }

      // Cross-user / other-conversation / missing → same not_found surface.
      if (listed.data.length !== uniqueIds.length) {
        return divBrainFailureFromCode("not_found");
      }

      const byId = new Map(listed.data.map((row) => [row.id, row]));
      const records: DivBrainAttachmentRecord[] = [];

      for (const id of uniqueIds) {
        const row = byId.get(id);
        if (!row) {
          return divBrainFailureFromCode("not_found");
        }
        if (row.status !== "ready") {
          return divBrainFailureFromCode("invalid_request");
        }
        if (row.message_id !== null) {
          return divBrainFailureFromCode("invalid_request");
        }
        if (row.conversation_id !== conversationResult.data) {
          return divBrainFailureFromCode("not_found");
        }
        const mapped = mapRow(row);
        if (!mapped.ok) {
          return mapped;
        }
        records.push(mapped.data);
      }

      return divBrainSuccess(records);
    },

    async linkToMessage(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const conversationResult = normalizeDivBrainResourceId(
        params.conversationId,
      );
      if (!conversationResult.ok) {
        return conversationResult;
      }
      const messageResult = normalizeDivBrainResourceId(params.messageId);
      if (!messageResult.ok) {
        return messageResult;
      }

      const linked = await persistence.linkAttachmentsToMessage({
        attachmentIds: params.attachmentIds,
        userId: actorResult.data,
        conversationId: conversationResult.data,
        messageId: messageResult.data,
      });
      if (!linked.ok) {
        return mapPersistenceFailure(linked.error.kind);
      }
      if (linked.data !== params.attachmentIds.length) {
        return divBrainFailureFromCode("persistence_failed");
      }
      return divBrainSuccess(undefined);
    },

    async listForMessages(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const conversationResult = normalizeDivBrainResourceId(
        params.conversationId,
      );
      if (!conversationResult.ok) {
        return conversationResult;
      }

      const listed = await persistence.listAttachmentsForMessages({
        messageIds: params.messageIds,
        userId: actorResult.data,
        conversationId: conversationResult.data,
      });
      if (!listed.ok) {
        return mapPersistenceFailure(listed.error.kind);
      }

      const records: DivBrainAttachmentRecord[] = [];
      for (const row of listed.data) {
        const mapped = mapRow(row);
        if (!mapped.ok) {
          return mapped;
        }
        records.push(mapped.data);
      }
      return divBrainSuccess(records);
    },

    async listRecentReadyForConversation(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const conversationResult = normalizeDivBrainResourceId(
        params.conversationId,
      );
      if (!conversationResult.ok) {
        return conversationResult;
      }

      const listed = await persistence.listReadyAttachmentsForConversation({
        userId: actorResult.data,
        conversationId: conversationResult.data,
        limit: params.limit,
      });
      if (!listed.ok) {
        return mapPersistenceFailure(listed.error.kind);
      }

      const records: DivBrainAttachmentRecord[] = [];
      for (const row of listed.data) {
        const mapped = mapRow(row);
        if (!mapped.ok) {
          return mapped;
        }
        records.push(mapped.data);
      }
      return divBrainSuccess(records);
    },

    async downloadBytes(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      if (params.attachment.userId !== actorResult.data) {
        return divBrainFailureFromCode("not_found");
      }

      const downloaded = await storage.downloadObject({
        bucket: params.attachment.storageBucket,
        path: params.attachment.storagePath,
      });
      if (!downloaded.ok) {
        return mapPersistenceFailure(downloaded.error.kind);
      }
      return divBrainSuccess(downloaded.data);
    },

    async createSignedDownloadUrl(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const idResult = normalizeDivBrainResourceId(params.attachmentId);
      if (!idResult.ok) {
        return divBrainFailureFromCode("not_found");
      }

      const found = await persistence.findAttachmentForActor({
        attachmentId: idResult.data,
        userId: actorResult.data,
      });
      if (!found.ok) {
        return mapPersistenceFailure(found.error.kind);
      }
      if (!found.data || found.data.status !== "ready") {
        return divBrainFailureFromCode("not_found");
      }

      const signed = await storage.createSignedDownloadUrl({
        bucket: found.data.storage_bucket,
        path: found.data.storage_path,
        expiresInSeconds: params.expiresInSeconds ?? 60,
      });
      if (!signed.ok) {
        return mapPersistenceFailure(signed.error.kind);
      }

      return divBrainSuccess({
        signedUrl: signed.data.signedUrl,
        filename: found.data.original_filename,
        mimeType: found.data.mime_type,
      });
    },

    async cleanupConversationStorage(params) {
      const actorResult = normalizeDivBrainActorId(params.actorId);
      if (!actorResult.ok) {
        return actorResult;
      }
      const conversationResult = normalizeDivBrainResourceId(
        params.conversationId,
      );
      if (!conversationResult.ok) {
        return conversationResult;
      }

      const listed = await persistence.listStoragePathsForConversation({
        userId: actorResult.data,
        conversationId: conversationResult.data,
      });
      if (!listed.ok) {
        return mapPersistenceFailure(listed.error.kind);
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
          // Best-effort app-side cleanup; DB trigger is the primary guarantee.
          continue;
        }
      }

      return divBrainSuccess(undefined);
    },
  };
}

export { divBrainAttachmentSafeMessage };
