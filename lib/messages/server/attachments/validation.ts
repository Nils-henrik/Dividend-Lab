/**
 * Deterministic chat attachment validation helpers.
 * Server-only — magic-byte checks and size/MIME gates.
 */

import {
  CHAT_ATTACHMENT_ALLOWED_MIME_TYPES,
  CHAT_ATTACHMENT_COPY_SV,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_PER_MESSAGE,
  CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  isChatAttachmentMimeExtensionCompatible,
  isChatAttachmentMimeType,
  sanitizeChatAttachmentFilename,
  type ChatAttachmentMimeType,
} from "../../attachments";

export type ChatAttachmentClientError =
  | "unsupported"
  | "too_large"
  | "too_many"
  | "total_too_large"
  | "invalid"
  | "incomplete"
  | "upload_failure"
  | "unlinked_quota"
  | "discard_failure"
  | "forbidden"
  | "not_found";

export type ChatAttachmentValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; clientError: ChatAttachmentClientError };

export function chatAttachmentSafeMessage(
  code: ChatAttachmentClientError,
): string {
  switch (code) {
    case "unsupported":
      return CHAT_ATTACHMENT_COPY_SV.unsupported;
    case "too_large":
      return CHAT_ATTACHMENT_COPY_SV.tooLarge;
    case "too_many":
      return CHAT_ATTACHMENT_COPY_SV.tooMany;
    case "total_too_large":
      return CHAT_ATTACHMENT_COPY_SV.totalTooLarge;
    case "incomplete":
      return CHAT_ATTACHMENT_COPY_SV.incomplete;
    case "upload_failure":
      return CHAT_ATTACHMENT_COPY_SV.uploadFailure;
    case "unlinked_quota":
      return CHAT_ATTACHMENT_COPY_SV.unlinkedQuota;
    case "discard_failure":
      return CHAT_ATTACHMENT_COPY_SV.discardFailure;
    case "forbidden":
      return "Du kan inte skicka meddelanden i den här konversationen just nu.";
    case "not_found":
      return "Bilagan kunde inte hittas.";
    case "invalid":
    default:
      return "Begäran kunde inte tolkas.";
  }
}

export function validateChatAttachmentPrepareInput(input: {
  filename: unknown;
  mimeType: unknown;
  byteSize: unknown;
}): ChatAttachmentValidationResult<{
  filename: string;
  mimeType: ChatAttachmentMimeType;
  byteSize: number;
}> {
  if (typeof input.filename !== "string" || typeof input.mimeType !== "string") {
    return { ok: false, clientError: "invalid" };
  }

  if (
    typeof input.byteSize !== "number" ||
    !Number.isInteger(input.byteSize) ||
    input.byteSize <= 0
  ) {
    return { ok: false, clientError: "invalid" };
  }

  if (input.byteSize > CHAT_ATTACHMENT_MAX_BYTES) {
    return { ok: false, clientError: "too_large" };
  }

  if (!isChatAttachmentMimeType(input.mimeType)) {
    return { ok: false, clientError: "unsupported" };
  }

  const filename = sanitizeChatAttachmentFilename(input.filename);
  if (!isChatAttachmentMimeExtensionCompatible(input.mimeType, filename)) {
    return { ok: false, clientError: "unsupported" };
  }

  return {
    ok: true,
    data: {
      filename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
    },
  };
}

export function validateChatAttachmentBatchLimits(
  sizes: readonly number[],
): ChatAttachmentValidationResult<true> {
  if (sizes.length > CHAT_ATTACHMENT_MAX_PER_MESSAGE) {
    return { ok: false, clientError: "too_many" };
  }
  let total = 0;
  for (const size of sizes) {
    if (!Number.isInteger(size) || size <= 0 || size > CHAT_ATTACHMENT_MAX_BYTES) {
      return { ok: false, clientError: "too_large" };
    }
    total += size;
  }
  if (total > CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE) {
    return { ok: false, clientError: "total_too_large" };
  }
  return { ok: true, data: true };
}

function bytesStartWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[index] === value);
}

/**
 * Sniff common magic bytes. Returns null when content does not match claim.
 * text/plain and text/csv are accepted when UTF-8-decodable and not binary.
 */
export function sniffChatAttachmentMime(
  bytes: Uint8Array,
  claimed: ChatAttachmentMimeType,
): ChatAttachmentMimeType | null {
  if (claimed === "application/pdf") {
    return bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
      ? "application/pdf"
      : null;
  }

  if (claimed === "image/png") {
    return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ? "image/png"
      : null;
  }

  if (claimed === "image/jpeg") {
    return bytesStartWith(bytes, [0xff, 0xd8, 0xff]) ? "image/jpeg" : null;
  }

  if (claimed === "image/webp") {
    if (
      bytes.length >= 12 &&
      bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }
    return null;
  }

  if (claimed === "image/gif") {
    // GIF87a / GIF89a
    if (
      bytesStartWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      bytesStartWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
    ) {
      return "image/gif";
    }
    return null;
  }

  if (claimed === "text/plain" || claimed === "text/csv") {
    if (sniffChatAttachmentMime(bytes, "application/pdf")) return null;
    if (sniffChatAttachmentMime(bytes, "image/png")) return null;
    if (sniffChatAttachmentMime(bytes, "image/jpeg")) return null;
    if (sniffChatAttachmentMime(bytes, "image/webp")) return null;
    if (sniffChatAttachmentMime(bytes, "image/gif")) return null;
    try {
      const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(sample);
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(decoded)) {
        return null;
      }
      return claimed;
    } catch {
      return null;
    }
  }

  return null;
}

export function isAllowedChatAttachmentMime(
  value: string,
): value is ChatAttachmentMimeType {
  return (CHAT_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(
    value,
  );
}
