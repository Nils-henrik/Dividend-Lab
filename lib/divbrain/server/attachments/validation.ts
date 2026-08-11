/**
 * Deterministic DivBrain attachment validation helpers.
 * Server-only — magic-byte checks and size/MIME gates.
 */

import type { DivBrainResult } from "../../results";
import { divBrainSuccess } from "../../results";
import {
  DIVBRAIN_ATTACHMENT_ALLOWED_MIME_TYPES,
  DIVBRAIN_ATTACHMENT_COPY_SV,
  DIVBRAIN_ATTACHMENT_MAX_BYTES,
  DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE,
  DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  isDivBrainAttachmentMimeExtensionCompatible,
  isDivBrainAttachmentMimeType,
  sanitizeDivBrainAttachmentFilename,
  type DivBrainAttachmentMimeType,
} from "../../attachments";

export type DivBrainAttachmentClientError =
  | "unsupported"
  | "too_large"
  | "too_many"
  | "total_too_large"
  | "invalid"
  | "incomplete"
  | "upload_failure"
  | "processing_failure";

export function divBrainAttachmentSafeMessage(
  code: DivBrainAttachmentClientError,
): string {
  switch (code) {
    case "unsupported":
      return DIVBRAIN_ATTACHMENT_COPY_SV.unsupported;
    case "too_large":
      return DIVBRAIN_ATTACHMENT_COPY_SV.tooLarge;
    case "too_many":
      return DIVBRAIN_ATTACHMENT_COPY_SV.tooMany;
    case "total_too_large":
      return DIVBRAIN_ATTACHMENT_COPY_SV.totalTooLarge;
    case "incomplete":
      return DIVBRAIN_ATTACHMENT_COPY_SV.incomplete;
    case "upload_failure":
      return DIVBRAIN_ATTACHMENT_COPY_SV.uploadFailure;
    case "processing_failure":
      return DIVBRAIN_ATTACHMENT_COPY_SV.processingFailure;
    case "invalid":
    default:
      return "Begäran kunde inte tolkas.";
  }
}

export function validateDivBrainAttachmentPrepareInput(input: {
  filename: unknown;
  mimeType: unknown;
  byteSize: unknown;
}): DivBrainResult<{
  filename: string;
  mimeType: DivBrainAttachmentMimeType;
  byteSize: number;
}> | { ok: false; clientError: DivBrainAttachmentClientError } {
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

  if (input.byteSize > DIVBRAIN_ATTACHMENT_MAX_BYTES) {
    return { ok: false, clientError: "too_large" };
  }

  if (!isDivBrainAttachmentMimeType(input.mimeType)) {
    return { ok: false, clientError: "unsupported" };
  }

  const filename = sanitizeDivBrainAttachmentFilename(input.filename);
  if (!isDivBrainAttachmentMimeExtensionCompatible(input.mimeType, filename)) {
    return { ok: false, clientError: "unsupported" };
  }

  return divBrainSuccess({
    filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
  });
}

export function validateDivBrainAttachmentBatchLimits(
  sizes: readonly number[],
): { ok: true } | { ok: false; clientError: DivBrainAttachmentClientError } {
  if (sizes.length > DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE) {
    return { ok: false, clientError: "too_many" };
  }
  let total = 0;
  for (const size of sizes) {
    if (!Number.isInteger(size) || size <= 0 || size > DIVBRAIN_ATTACHMENT_MAX_BYTES) {
      return { ok: false, clientError: "too_large" };
    }
    total += size;
  }
  if (total > DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE) {
    return { ok: false, clientError: "total_too_large" };
  }
  return { ok: true };
}

/**
 * Sniff common magic bytes. Returns null when content does not match claim.
 * text/plain and text/csv are accepted when UTF-8-decodable and not binary.
 */
export function sniffDivBrainAttachmentMime(
  bytes: Uint8Array,
  claimed: DivBrainAttachmentMimeType,
): DivBrainAttachmentMimeType | null {
  if (claimed === "application/pdf") {
    if (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    ) {
      return "application/pdf";
    }
    return null;
  }

  if (claimed === "image/png") {
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return "image/png";
    }
    return null;
  }

  if (claimed === "image/jpeg") {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
    return null;
  }

  if (claimed === "image/webp") {
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }
    return null;
  }

  if (claimed === "text/plain" || claimed === "text/csv") {
    // Reject obvious binary / PDF / image masquerading as text.
    if (sniffDivBrainAttachmentMime(bytes, "application/pdf")) return null;
    if (sniffDivBrainAttachmentMime(bytes, "image/png")) return null;
    if (sniffDivBrainAttachmentMime(bytes, "image/jpeg")) return null;
    if (sniffDivBrainAttachmentMime(bytes, "image/webp")) return null;
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

export function isAllowedDivBrainAttachmentMime(
  value: string,
): value is DivBrainAttachmentMimeType {
  return (DIVBRAIN_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(
    value,
  );
}
