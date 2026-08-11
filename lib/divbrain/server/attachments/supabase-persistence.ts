/**
 * Supabase adapters for DivBrain attachment metadata + private storage.
 * Service-role only. Never import from client components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DivBrainAttachmentPersistencePort,
  DivBrainAttachmentPersistenceResult,
  DivBrainAttachmentStoragePort,
} from "./persistence";
import type {
  DivBrainAttachmentInsert,
  DivBrainAttachmentRow,
} from "./types";

function ok<T>(data: T): DivBrainAttachmentPersistenceResult<T> {
  return { ok: true, data };
}

function fail(
  kind: "not_found" | "unavailable" | "query_failed" | "malformed_response" | "configuration",
): DivBrainAttachmentPersistenceResult<never> {
  return { ok: false, error: { kind } };
}

function isAttachmentRow(value: unknown): value is DivBrainAttachmentRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.user_id === "string" &&
    typeof row.conversation_id === "string" &&
    (row.message_id === null || typeof row.message_id === "string") &&
    typeof row.storage_bucket === "string" &&
    typeof row.storage_path === "string" &&
    typeof row.original_filename === "string" &&
    typeof row.mime_type === "string" &&
    typeof row.byte_size === "number" &&
    (row.checksum_sha256 === null || typeof row.checksum_sha256 === "string") &&
    typeof row.status === "string" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string"
  );
}

export function createSupabaseDivBrainAttachmentPersistencePort(
  client: SupabaseClient,
): DivBrainAttachmentPersistencePort {
  return {
    async insertAttachment(input: DivBrainAttachmentInsert) {
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .insert(input)
          .select("*")
          .single();

        if (error || !isAttachmentRow(data)) {
          return fail(error ? "query_failed" : "malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async findAttachmentForActor({ attachmentId, userId }) {
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("*")
          .eq("id", attachmentId)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          return fail("query_failed");
        }
        if (data === null) {
          return ok(null);
        }
        if (!isAttachmentRow(data)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async listAttachmentsForActorByIds({
      attachmentIds,
      userId,
      conversationId,
    }) {
      if (attachmentIds.length === 0) {
        return ok([]);
      }
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("*")
          .eq("user_id", userId)
          .eq("conversation_id", conversationId)
          .in("id", [...attachmentIds]);

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data) || !data.every(isAttachmentRow)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async listAttachmentsForMessages({
      messageIds,
      userId,
      conversationId,
    }) {
      if (messageIds.length === 0) {
        return ok([]);
      }
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("*")
          .eq("user_id", userId)
          .eq("conversation_id", conversationId)
          .in("message_id", [...messageIds])
          .order("created_at", { ascending: true });

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data) || !data.every(isAttachmentRow)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async listReadyAttachmentsForConversation({
      userId,
      conversationId,
      limit,
    }) {
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("*")
          .eq("user_id", userId)
          .eq("conversation_id", conversationId)
          .eq("status", "ready")
          .not("message_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data) || !data.every(isAttachmentRow)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async listStoragePathsForConversation({ userId, conversationId }) {
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("storage_bucket, storage_path")
          .eq("user_id", userId)
          .eq("conversation_id", conversationId);

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data)) {
          return fail("malformed_response");
        }
        const paths: Array<{ storage_bucket: string; storage_path: string }> = [];
        for (const row of data) {
          if (
            typeof row === "object" &&
            row !== null &&
            typeof (row as { storage_bucket?: unknown }).storage_bucket ===
              "string" &&
            typeof (row as { storage_path?: unknown }).storage_path === "string"
          ) {
            paths.push({
              storage_bucket: (row as { storage_bucket: string }).storage_bucket,
              storage_path: (row as { storage_path: string }).storage_path,
            });
          } else {
            return fail("malformed_response");
          }
        }
        return ok(paths);
      } catch {
        return fail("unavailable");
      }
    },

    async listUnlinkedAttachmentsForActor({ userId, limit }) {
      const boundedLimit = Math.max(0, Math.min(Math.floor(limit), 100));
      if (boundedLimit === 0) {
        return ok([]);
      }
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .select("*")
          .eq("user_id", userId)
          .is("message_id", null)
          .neq("status", "deleted")
          .order("created_at", { ascending: true })
          .limit(boundedLimit);

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data) || !data.every(isAttachmentRow)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async updateAttachmentStatusForActor({
      attachmentId,
      userId,
      status,
      checksumSha256,
    }) {
      try {
        const patch: Record<string, unknown> = { status };
        if (checksumSha256 !== undefined) {
          patch.checksum_sha256 = checksumSha256;
        }

        const { data, error } = await client
          .from("divbrain_attachments")
          .update(patch)
          .eq("id", attachmentId)
          .eq("user_id", userId)
          .select("*")
          .maybeSingle();

        if (error) {
          return fail("query_failed");
        }
        if (data === null) {
          return ok(null);
        }
        if (!isAttachmentRow(data)) {
          return fail("malformed_response");
        }
        return ok(data);
      } catch {
        return fail("unavailable");
      }
    },

    async linkAttachmentsToMessage({
      attachmentIds,
      userId,
      conversationId,
      messageId,
    }) {
      if (attachmentIds.length === 0) {
        return ok(0);
      }
      try {
        const { data, error } = await client
          .from("divbrain_attachments")
          .update({ message_id: messageId, status: "ready" })
          .eq("user_id", userId)
          .eq("conversation_id", conversationId)
          .eq("status", "ready")
          .is("message_id", null)
          .in("id", [...attachmentIds])
          .select("id");

        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data)) {
          return fail("malformed_response");
        }
        return ok(data.length);
      } catch {
        return fail("unavailable");
      }
    },
  };
}

export function createSupabaseDivBrainAttachmentStoragePort(
  client: SupabaseClient,
): DivBrainAttachmentStoragePort {
  return {
    async createSignedUploadUrl({ bucket, path, upsert = false }) {
      try {
        const { data, error } = await client.storage
          .from(bucket)
          .createSignedUploadUrl(path, { upsert });

        if (error || !data?.signedUrl || !data?.token || !data?.path) {
          return fail("query_failed");
        }
        return ok({
          signedUrl: data.signedUrl,
          token: data.token,
          path: data.path,
        });
      } catch {
        return fail("unavailable");
      }
    },

    async createSignedDownloadUrl({ bucket, path, expiresInSeconds }) {
      try {
        const { data, error } = await client.storage
          .from(bucket)
          .createSignedUrl(path, expiresInSeconds);

        if (error || !data?.signedUrl) {
          return fail("query_failed");
        }
        return ok({ signedUrl: data.signedUrl });
      } catch {
        return fail("unavailable");
      }
    },

    async downloadObject({ bucket, path }) {
      try {
        const { data, error } = await client.storage.from(bucket).download(path);
        if (error || !data) {
          return fail("query_failed");
        }
        const buffer = new Uint8Array(await data.arrayBuffer());
        return ok(buffer);
      } catch {
        return fail("unavailable");
      }
    },

    async removeObjects({ bucket, paths }) {
      if (paths.length === 0) {
        return ok(undefined);
      }
      try {
        const { error } = await client.storage.from(bucket).remove([...paths]);
        if (error) {
          return fail("query_failed");
        }
        return ok(undefined);
      } catch {
        return fail("unavailable");
      }
    },

    async objectExists({ bucket, path }) {
      try {
        const folder = path.includes("/")
          ? path.slice(0, path.lastIndexOf("/"))
          : "";
        const name = path.includes("/")
          ? path.slice(path.lastIndexOf("/") + 1)
          : path;

        const { data, error } = await client.storage.from(bucket).list(folder, {
          search: name,
          limit: 20,
        });
        if (error) {
          return fail("query_failed");
        }
        if (!Array.isArray(data)) {
          return fail("malformed_response");
        }
        return ok(data.some((entry) => entry.name === name));
      } catch {
        return fail("unavailable");
      }
    },
  };
}
