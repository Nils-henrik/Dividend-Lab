/**
 * DivBrain attachment domain constants and browser-safe metadata.
 * Shared by server and client — no secrets, storage paths, or Node-only APIs.
 */

export const DIVBRAIN_ATTACHMENT_BUCKET = "divbrain-attachments" as const;

/** Max attachments linked to one user message. */
export const DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE = 4 as const;

/** Max bytes per individual file (20 MiB). */
export const DIVBRAIN_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

/** Max total bytes across attachments on one message (40 MiB). */
export const DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE =
  40 * 1024 * 1024;

/**
 * Combined provider-context ceiling for current-turn + reused recent
 * attachments (v1: same 40 MiB as the current-message batch).
 */
export const DIVBRAIN_ATTACHMENT_COMBINED_PROVIDER_MAX_BYTES =
  DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE;

/** Filename length bounds (aligned with DB check). */
export const DIVBRAIN_ATTACHMENT_FILENAME_MAX_LENGTH = 200 as const;

/** Bounded recent-attachment follow-up context. */
export const DIVBRAIN_ATTACHMENT_RECENT_MESSAGE_LIMIT = 2 as const;
export const DIVBRAIN_ATTACHMENT_RECENT_FILE_LIMIT = 4 as const;

/**
 * Abandoned unlinked uploads (`message_id IS NULL`) older than this TTL are
 * eligible for opportunistic Storage-API cleanup before a new prepare.
 */
export const DIVBRAIN_ATTACHMENT_ABANDONED_TTL_MS = 24 * 60 * 60 * 1000;

/** Max active unlinked (non-deleted) attachments per user after cleanup. */
export const DIVBRAIN_ATTACHMENT_MAX_UNLINKED_PER_USER = 20 as const;

/**
 * Bounded scan window for opportunistic unlinked cleanup/quota checks.
 * Must be >= MAX_UNLINKED_PER_USER so quota can be enforced after TTL cleanup.
 */
export const DIVBRAIN_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT = 40 as const;

/** Bounded UTF-8 extraction for text/csv. */
export const DIVBRAIN_ATTACHMENT_MAX_EXTRACTED_TEXT_CHARS = 50_000 as const;

export const DIVBRAIN_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
] as const;

export type DivBrainAttachmentMimeType =
  (typeof DIVBRAIN_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

export const DIVBRAIN_ATTACHMENT_STATUSES = [
  "pending",
  "uploaded",
  "ready",
  "failed",
  "deleted",
] as const;

export type DivBrainAttachmentStatus =
  (typeof DIVBRAIN_ATTACHMENT_STATUSES)[number];

export type DivBrainAttachmentKind = "pdf" | "image" | "text" | "file";

/** Browser-safe attachment metadata for transcript/composer chips. */
export type DivBrainShellAttachment = {
  id: string;
  filename: string;
  mimeType: DivBrainAttachmentMimeType;
  byteSize: number;
  kind: DivBrainAttachmentKind;
};

export const DIVBRAIN_ATTACHMENT_COPY_SV = {
  attachLabel: "Bifoga fil",
  uploading: "Laddar upp…",
  remove: "Ta bort bilaga",
  unsupported: "Filtypen stöds inte av DivBrain.",
  tooLarge: "Filen är för stor.",
  tooMany: "Du kan bifoga högst 4 filer per meddelande.",
  totalTooLarge: "Bilagorna är för stora tillsammans.",
  uploadFailure: "Filen kunde inte laddas upp. Försök igen.",
  processingFailure: "DivBrain kunde inte läsa filen.",
  incomplete: "Vänta tills bilagan är uppladdad.",
  unlinkedQuota:
    "Du har för många bilagor som väntar. Ta bort några och försök igen.",
  discardFailure: "Bilagan kunde inte tas bort. Försök igen.",
} as const;

/**
 * Stable Postgres raise contract for the atomic unlinked-quota guard.
 * Mapped in the Supabase persistence adapter — never shown to clients raw.
 */
export const DIVBRAIN_UNLINKED_QUOTA_SQLSTATE = "DVQ20" as const;
export const DIVBRAIN_UNLINKED_QUOTA_MESSAGE =
  "divbrain_unlinked_quota_exceeded" as const;

const MIME_TO_KIND: Record<DivBrainAttachmentMimeType, DivBrainAttachmentKind> =
  {
    "application/pdf": "pdf",
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "text/plain": "text",
    "text/csv": "text",
  };

const EXTENSION_TO_MIME: Record<string, DivBrainAttachmentMimeType> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain",
  csv: "text/csv",
};

export function isDivBrainAttachmentMimeType(
  value: unknown,
): value is DivBrainAttachmentMimeType {
  return (
    typeof value === "string" &&
    (DIVBRAIN_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(
      value,
    )
  );
}

export function divBrainAttachmentKindForMime(
  mimeType: DivBrainAttachmentMimeType,
): DivBrainAttachmentKind {
  return MIME_TO_KIND[mimeType];
}

export function divBrainAttachmentExtension(filename: string): string | null {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) {
    return null;
  }
  return trimmed.slice(dot + 1).toLowerCase();
}

export function divBrainAttachmentMimeFromExtension(
  filename: string,
): DivBrainAttachmentMimeType | null {
  const ext = divBrainAttachmentExtension(filename);
  if (!ext) {
    return null;
  }
  return EXTENSION_TO_MIME[ext] ?? null;
}

/**
 * Require MIME allowlist + matching extension family.
 * Browser MIME alone is never trusted without this check.
 */
export function isDivBrainAttachmentMimeExtensionCompatible(
  mimeType: DivBrainAttachmentMimeType,
  filename: string,
): boolean {
  const fromExt = divBrainAttachmentMimeFromExtension(filename);
  if (!fromExt) {
    return false;
  }
  if (mimeType === fromExt) {
    return true;
  }
  // jpeg aliases
  if (
    (mimeType === "image/jpeg" && fromExt === "image/jpeg") ||
    (mimeType === "image/png" && fromExt === "image/png")
  ) {
    return true;
  }
  return false;
}

export function sanitizeDivBrainAttachmentFilename(filename: string): string {
  const base = filename
    .normalize("NFC")
    .replace(/[/\\]/g, "_")
    .replace(/[^\p{L}\p{N}._ ()-]+/gu, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) {
    return "fil";
  }

  return base.slice(0, DIVBRAIN_ATTACHMENT_FILENAME_MAX_LENGTH);
}

export function formatDivBrainAttachmentOnlyLabel(
  filenames: readonly string[],
): string {
  if (filenames.length === 1) {
    return `Bifogad fil: ${filenames[0]}`;
  }
  return `Bifogade filer: ${filenames.join(", ")}`;
}

export function toDivBrainShellAttachment(input: {
  id: string;
  filename: string;
  mimeType: DivBrainAttachmentMimeType;
  byteSize: number;
}): DivBrainShellAttachment {
  return {
    id: input.id,
    filename: input.filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    kind: divBrainAttachmentKindForMime(input.mimeType),
  };
}
