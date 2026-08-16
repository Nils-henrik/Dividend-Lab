import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_ATTACHMENT_COPY_SV,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_PER_MESSAGE,
  CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER,
  formatChatMessagePreview,
  isChatAttachmentMimeExtensionCompatible,
  sanitizeChatAttachmentFilename,
} from "../lib/messages/attachments";
import { createChatAttachmentRepository } from "../lib/messages/server/attachments/repository";
import type {
  ChatAttachmentPersistencePort,
  ChatAttachmentStoragePort,
} from "../lib/messages/server/attachments/persistence";
import type { ChatAttachmentRow } from "../lib/messages/server/attachments/types";
import {
  sniffChatAttachmentMime,
  validateChatAttachmentBatchLimits,
  validateChatAttachmentPrepareInput,
} from "../lib/messages/server/attachments/validation";
import { parseChatAttachmentIds, validateMessageBody } from "../lib/messages/validation";
import { validateComposerFiles } from "../components/messages/chat/chatComposerAttachments";

const ACTOR = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const CONV = "33333333-3333-4333-8333-333333333333";

function pngBytes(): Uint8Array {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
}

function gifBytes(): Uint8Array {
  return Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
}

function pdfBytes(): Uint8Array {
  return new TextEncoder().encode("%PDF-1.4\ntrailer\n%%EOF\n");
}

function createMemoryPorts(seed: ChatAttachmentRow[] = []) {
  const rows = new Map<string, ChatAttachmentRow>(
    seed.map((row) => [row.id, { ...row }]),
  );
  const objects = new Map<string, Uint8Array>();

  const persistence: ChatAttachmentPersistencePort = {
    async insertAttachment(input) {
      const activeUnlinked = [...rows.values()].filter(
        (row) =>
          row.uploader_id === input.uploader_id &&
          row.message_id === null &&
          row.status !== "deleted",
      ).length;
      if (activeUnlinked >= CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER) {
        return { ok: false, error: { kind: "quota_exceeded" } };
      }
      const now = new Date().toISOString();
      const row: ChatAttachmentRow = {
        id: input.id,
        conversation_id: input.conversation_id,
        message_id: null,
        uploader_id: input.uploader_id,
        storage_bucket: input.storage_bucket,
        storage_path: input.storage_path,
        original_filename: input.original_filename,
        mime_type: input.mime_type,
        byte_size: input.byte_size,
        checksum_sha256: null,
        status: input.status,
        created_at: now,
        updated_at: now,
      };
      rows.set(row.id, row);
      return { ok: true, data: row };
    },
    async findAttachmentForUploader({ attachmentId, uploaderId }) {
      const row = rows.get(attachmentId);
      if (!row || row.uploader_id !== uploaderId) {
        return { ok: true, data: null };
      }
      return { ok: true, data: { ...row } };
    },
    async listUnlinkedAttachmentsForUploader({ uploaderId, limit }) {
      const listed = [...rows.values()]
        .filter(
          (row) =>
            row.uploader_id === uploaderId &&
            row.message_id === null &&
            row.status !== "deleted",
        )
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .slice(0, limit);
      return { ok: true, data: listed.map((row) => ({ ...row })) };
    },
    async updateAttachmentStatusForUploader({
      attachmentId,
      uploaderId,
      status,
      checksumSha256,
    }) {
      const row = rows.get(attachmentId);
      if (!row || row.uploader_id !== uploaderId) {
        return { ok: true, data: null };
      }
      const next = {
        ...row,
        status,
        checksum_sha256: checksumSha256 ?? row.checksum_sha256,
        updated_at: new Date().toISOString(),
      };
      rows.set(attachmentId, next);
      return { ok: true, data: { ...next } };
    },
    async listStoragePathsForConversation({ conversationId }) {
      return {
        ok: true,
        data: [...rows.values()]
          .filter((row) => row.conversation_id === conversationId)
          .map((row) => ({
            storage_bucket: row.storage_bucket,
            storage_path: row.storage_path,
          })),
      };
    },
    async listStoragePathsForUploader({ uploaderId }) {
      return {
        ok: true,
        data: [...rows.values()]
          .filter((row) => row.uploader_id === uploaderId)
          .map((row) => ({
            storage_bucket: row.storage_bucket,
            storage_path: row.storage_path,
          })),
      };
    },
  };

  const storage: ChatAttachmentStoragePort = {
    async createSignedUploadUrl({ path }) {
      return {
        ok: true,
        data: {
          signedUrl: `https://storage.example/upload/${path}`,
          token: "token",
          path,
        },
      };
    },
    async createSignedDownloadUrl({ path }) {
      return {
        ok: true,
        data: { signedUrl: `https://storage.example/download/${path}` },
      };
    },
    async downloadObject({ path }) {
      const bytes = objects.get(path);
      if (!bytes) {
        return { ok: false, error: { kind: "not_found" } };
      }
      return { ok: true, data: bytes };
    },
    async removeObjects({ paths }) {
      for (const path of paths) {
        objects.delete(path);
      }
      return { ok: true, data: undefined };
    },
    async objectExists({ path }) {
      return { ok: true, data: objects.has(path) };
    },
  };

  return { persistence, storage, rows, objects };
}

describe("chat attachment validation", () => {
  it("rejects oversize, unknown types and MIME/extension mismatch", () => {
    assert.equal(
      validateChatAttachmentPrepareInput({
        filename: "ok.png",
        mimeType: "image/png",
        byteSize: CHAT_ATTACHMENT_MAX_BYTES + 1,
      }).ok,
      false,
    );
    assert.equal(
      validateChatAttachmentPrepareInput({
        filename: "virus.exe",
        mimeType: "application/octet-stream",
        byteSize: 12,
      }).ok,
      false,
    );
    assert.equal(
      validateChatAttachmentPrepareInput({
        filename: "not-a-gif.png",
        mimeType: "image/gif",
        byteSize: 12,
      }).ok,
      false,
    );
    assert.equal(
      isChatAttachmentMimeExtensionCompatible("image/gif", "loop.gif"),
      true,
    );
  });

  it("enforces conservative batch limits", () => {
    assert.equal(
      validateChatAttachmentBatchLimits([1, 1, 1, 1]).ok,
      false,
    );
    assert.equal(CHAT_ATTACHMENT_MAX_PER_MESSAGE, 3);
    assert.equal(
      validateChatAttachmentBatchLimits([
        CHAT_ATTACHMENT_MAX_BYTES,
        CHAT_ATTACHMENT_MAX_BYTES,
        1,
      ]).ok,
      false,
    );
    assert.equal(validateChatAttachmentBatchLimits([12, 24]).ok, true);
  });

  it("sniffs GIF/PNG/PDF and rejects magic-byte mismatches", () => {
    assert.equal(sniffChatAttachmentMime(gifBytes(), "image/gif"), "image/gif");
    assert.equal(sniffChatAttachmentMime(pngBytes(), "image/png"), "image/png");
    assert.equal(
      sniffChatAttachmentMime(pdfBytes(), "application/pdf"),
      "application/pdf",
    );
    assert.equal(sniffChatAttachmentMime(pngBytes(), "image/gif"), null);
    assert.equal(sniffChatAttachmentMime(pdfBytes(), "text/plain"), null);
  });

  it("treats filenames as untrusted display text", () => {
    assert.equal(
      sanitizeChatAttachmentFilename("../../etc/passwd.gif"),
      ".._.._etc_passwd.gif",
    );
    assert.equal(
      sanitizeChatAttachmentFilename("<script>alert(1)</script>.png"),
      "_script_alert(1)__script_.png",
    );
  });
});

describe("chat attachment composer/send rules", () => {
  it("allows attachment-only messages without placeholder text", () => {
    assert.equal(validateMessageBody("", { required: false }).error, null);
    assert.equal(validateMessageBody("", { required: true }).error, "Skriv ett meddelande innan du skickar.");
    assert.equal(validateMessageBody("Hej", { required: true }).error, null);
  });

  it("parses opaque attachment ids and rejects junk", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    assert.deepEqual(parseChatAttachmentIds(JSON.stringify([id, id])).ids, [id]);
    assert.equal(parseChatAttachmentIds("not-json").error, "Bilagorna kunde inte tolkas.");
    assert.equal(parseChatAttachmentIds(["not-a-uuid"]).error, "Bilagorna kunde inte tolkas.");
  });

  it("rejects composer files before upload", () => {
    const file = {
      name: "ok.png",
      type: "image/png",
      size: 12,
    } as File;
    const tooBig = { name: "big.png", type: "image/png", size: CHAT_ATTACHMENT_MAX_BYTES + 1 } as File;
    const exe = { name: "x.exe", type: "application/x-msdownload", size: 10 } as File;

    assert.equal(
      validateComposerFiles({ current: [], incoming: [tooBig] }).error,
      CHAT_ATTACHMENT_COPY_SV.tooLarge,
    );
    assert.equal(
      validateComposerFiles({ current: [], incoming: [exe] }).error,
      CHAT_ATTACHMENT_COPY_SV.unsupported,
    );
    assert.equal(
      validateComposerFiles({
        current: [
          {
            localId: "1",
            file,
            filename: "a.png",
            mimeType: "image/png",
            byteSize: 1,
            previewUrl: null,
            status: "ready",
          },
          {
            localId: "2",
            file,
            filename: "b.png",
            mimeType: "image/png",
            byteSize: 1,
            previewUrl: null,
            status: "ready",
          },
          {
            localId: "3",
            file,
            filename: "c.png",
            mimeType: "image/png",
            byteSize: 1,
            previewUrl: null,
            status: "ready",
          },
        ],
        incoming: [file],
      }).error,
      CHAT_ATTACHMENT_COPY_SV.tooMany,
    );
  });

  it("formats inbox preview from attachments without fake body text", () => {
    assert.equal(
      formatChatMessagePreview({
        body: "",
        attachments: [
          {
            id: "a1",
            filename: "kvitto.pdf",
            mimeType: "application/pdf",
            byteSize: 10,
            kind: "file",
          },
        ],
      }),
      "Bilaga: kvitto.pdf",
    );
    assert.equal(
      formatChatMessagePreview({ body: "Hej", attachments: [] }),
      "Hej",
    );
  });
});

describe("chat attachment repository", () => {
  it("prepares, confirms and refuses cross-user access", async () => {
    const ports = createMemoryPorts();
    const repository = createChatAttachmentRepository(ports);
    const prepared = await repository.prepareUpload({
      actorId: ACTOR,
      conversationId: CONV,
      filename: "loop.gif",
      mimeType: "image/gif",
      byteSize: gifBytes().byteLength,
    });
    assert.equal(prepared.ok, true);
    if (!prepared.ok) return;

    ports.objects.set(
      `${ACTOR}/${prepared.attachmentId}`,
      gifBytes(),
    );

    const confirmed = await repository.confirmUpload({
      actorId: ACTOR,
      attachmentId: prepared.attachmentId,
    });
    assert.equal(confirmed.ok, true);

    const crossUser = await repository.confirmUpload({
      actorId: OTHER,
      attachmentId: prepared.attachmentId,
    });
    assert.equal(crossUser.ok, false);
    if (!crossUser.ok) {
      assert.equal(crossUser.clientError, "not_found");
    }
  });

  it("rejects signature mismatch and cleans up the object", async () => {
    const ports = createMemoryPorts();
    const repository = createChatAttachmentRepository(ports);
    const prepared = await repository.prepareUpload({
      actorId: ACTOR,
      conversationId: CONV,
      filename: "loop.gif",
      mimeType: "image/gif",
      byteSize: pngBytes().byteLength,
    });
    assert.equal(prepared.ok, true);
    if (!prepared.ok) return;

    ports.objects.set(`${ACTOR}/${prepared.attachmentId}`, pngBytes());
    const confirmed = await repository.confirmUpload({
      actorId: ACTOR,
      attachmentId: prepared.attachmentId,
    });
    assert.equal(confirmed.ok, false);
    assert.equal(ports.objects.has(`${ACTOR}/${prepared.attachmentId}`), false);
  });

  it("does not discard a linked transcript attachment", async () => {
    const linked: ChatAttachmentRow = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      conversation_id: CONV,
      message_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      uploader_id: ACTOR,
      storage_bucket: "chat-attachments",
      storage_path: `${ACTOR}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      original_filename: "foto.png",
      mime_type: "image/png",
      byte_size: 12,
      checksum_sha256: null,
      status: "ready",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const ports = createMemoryPorts([linked]);
    ports.objects.set(linked.storage_path, pngBytes());
    const repository = createChatAttachmentRepository(ports);
    const discarded = await repository.discardUnlinkedAttachment({
      actorId: ACTOR,
      attachmentId: linked.id,
    });
    assert.equal(discarded.ok, false);
    assert.equal(ports.objects.has(linked.storage_path), true);
  });

  it("enforces the unlinked quota after cleanup", async () => {
    const now = Date.now();
    const seed: ChatAttachmentRow[] = Array.from({ length: 10 }, (_, index) => ({
      id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa${String(index).padStart(2, "0")}`,
      conversation_id: CONV,
      message_id: null,
      uploader_id: ACTOR,
      storage_bucket: "chat-attachments",
      storage_path: `${ACTOR}/row-${index}`,
      original_filename: `file-${index}.png`,
      mime_type: "image/png",
      byte_size: 12,
      checksum_sha256: null,
      status: "pending",
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    }));
    const ports = createMemoryPorts(seed);
    const repository = createChatAttachmentRepository({
      ...ports,
      nowMs: () => now,
    });
    const prepared = await repository.prepareUpload({
      actorId: ACTOR,
      conversationId: CONV,
      filename: "extra.png",
      mimeType: "image/png",
      byteSize: 12,
    });
    assert.equal(prepared.ok, false);
    if (!prepared.ok) {
      assert.equal(prepared.clientError, "unlinked_quota");
    }
  });
});
