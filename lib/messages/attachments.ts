/**
 * Chat attachment domain constants and browser-safe metadata.
 * Shared by server and client — no secrets, storage paths, or Node-only APIs.
 */

export const CHAT_ATTACHMENT_BUCKET = "chat-attachments" as const;

/** Max attachments linked to one chat message. */
export const CHAT_ATTACHMENT_MAX_PER_MESSAGE = 3 as const;

/** Max bytes per individual file (10 MiB). */
export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Max total bytes across attachments on one send (20 MiB). */
export const CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE = 20 * 1024 * 1024;

/** Filename length bounds (aligned with DB check). */
export const CHAT_ATTACHMENT_FILENAME_MAX_LENGTH = 200 as const;

/**
 * Abandoned unlinked uploads (`message_id IS NULL`) older than this TTL are
 * eligible for opportunistic Storage-API cleanup before a new prepare.
 */
export const CHAT_ATTACHMENT_ABANDONED_TTL_MS = 24 * 60 * 60 * 1000;

/** Max active unlinked (non-deleted) attachments per uploader after cleanup. */
export const CHAT_ATTACHMENT_MAX_UNLINKED_PER_USER = 10 as const;

/**
 * Bounded scan window for opportunistic unlinked cleanup/quota checks.
 * Must be >= MAX_UNLINKED_PER_USER so quota can be enforced after TTL cleanup.
 */
export const CHAT_ATTACHMENT_UNLINKED_CLEANUP_SCAN_LIMIT = 20 as const;

export const CHAT_ATTACHMENT_SIGNED_DOWNLOAD_SECONDS = 60 as const;

export const CHAT_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
] as const;

export type ChatAttachmentMimeType =
  (typeof CHAT_ATTACHMENT_ALLOWED_MIME_TYPES)[number];

export const CHAT_ATTACHMENT_STATUSES = [
  "pending",
  "uploaded",
  "ready",
  "failed",
  "deleted",
] as const;

export type ChatAttachmentStatus = (typeof CHAT_ATTACHMENT_STATUSES)[number];

export type ChatAttachmentKind = "image" | "file";

/** Browser-safe attachment metadata for transcript/composer chips. */
export type ConversationMessageAttachment = {
  id: string;
  filename: string;
  mimeType: ChatAttachmentMimeType;
  byteSize: number;
  kind: ChatAttachmentKind;
};

export const CHAT_ATTACHMENT_COPY_SV = {
  attachLabel: "Bifoga fil",
  uploading: "Laddar upp…",
  remove: "Ta bort bilaga",
  retry: "Försök igen",
  unsupported: "Filtypen stöds inte",
  tooLarge: "Filen är för stor",
  tooMany: "Du kan bifoga högst 3 filer per meddelande.",
  totalTooLarge: "Bilagorna är för stora tillsammans.",
  uploadFailure: "Det gick inte att ladda upp filen. Försök igen.",
  incomplete: "Vänta tills bilagan är uppladdad.",
  unlinkedQuota:
    "Du har för många bilagor som väntar. Ta bort några och försök igen.",
  discardFailure: "Bilagan kunde inte tas bort. Försök igen.",
  openFile: "Öppna fil",
  previewAlt: "Bifogad bild",
} as const;

/**
 * Stable Postgres raise contract for the atomic unlinked-quota guard.
 * Mapped in the service-role adapter — never shown to clients raw.
 */
export const CHAT_ATTACHMENT_UNLINKED_QUOTA_SQLSTATE = "CHQ20" as const;
export const CHAT_ATTACHMENT_UNLINKED_QUOTA_MESSAGE =
  "chat_attachment_unlinked_quota_exceeded" as const;

const IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSION_TO_MIME: Record<string, ChatAttachmentMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isChatUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function isChatAttachmentMimeType(
  value: unknown,
): value is ChatAttachmentMimeType {
  return (
    typeof value === "string" &&
    (CHAT_ATTACHMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(value)
  );
}

export function chatAttachmentKindForMime(
  mimeType: ChatAttachmentMimeType,
): ChatAttachmentKind {
  return IMAGE_MIME_TYPES.has(mimeType) ? "image" : "file";
}

export function chatAttachmentExtension(filename: string): string | null {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0 || dot === trimmed.length - 1) {
    return null;
  }
  return trimmed.slice(dot + 1).toLowerCase();
}

export function chatAttachmentMimeFromExtension(
  filename: string,
): ChatAttachmentMimeType | null {
  const ext = chatAttachmentExtension(filename);
  if (!ext) {
    return null;
  }
  return EXTENSION_TO_MIME[ext] ?? null;
}

export function resolveChatAttachmentMimeType(input: {
  mimeType: string;
  filename: string;
}): ChatAttachmentMimeType | null {
  if (isChatAttachmentMimeType(input.mimeType)) {
    return input.mimeType;
  }
  return chatAttachmentMimeFromExtension(input.filename);
}

/**
 * Require MIME allowlist + matching extension family.
 * Browser MIME alone is never trusted without this check.
 */
export function isChatAttachmentMimeExtensionCompatible(
  mimeType: ChatAttachmentMimeType,
  filename: string,
): boolean {
  const fromExt = chatAttachmentMimeFromExtension(filename);
  if (!fromExt) {
    return false;
  }
  return mimeType === fromExt;
}

export function sanitizeChatAttachmentFilename(filename: string): string {
  const base = filename
    .normalize("NFC")
    .replace(/[/\\]/g, "_")
    .replace(/[^\p{L}\p{N}._ ()-]+/gu, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) {
    return "fil";
  }

  return base.slice(0, CHAT_ATTACHMENT_FILENAME_MAX_LENGTH);
}

export function formatChatAttachmentBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatChatAttachmentTypeLabel(
  mimeType: ChatAttachmentMimeType,
): string {
  switch (mimeType) {
    case "application/pdf":
      return "PDF";
    case "text/plain":
      return "Text";
    case "text/csv":
      return "CSV";
    case "image/gif":
      return "GIF";
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    default:
      return "Fil";
  }
}

export function formatChatMessagePreview(input: {
  body: string;
  attachments?: readonly ConversationMessageAttachment[];
  hasAttachments?: boolean;
}): string {
  const body = input.body.trim();
  if (body) {
    return body;
  }

  const attachments = input.attachments ?? [];
  if (attachments.length === 1) {
    return `Bilaga: ${attachments[0]!.filename}`;
  }
  if (attachments.length > 1) {
    return `${attachments.length} bilagor`;
  }
  if (input.hasAttachments) {
    return "Bilaga";
  }
  return "";
}

export function toConversationMessageAttachment(input: {
  id: string;
  filename: string;
  mimeType: ChatAttachmentMimeType;
  byteSize: number;
}): ConversationMessageAttachment {
  return {
    id: input.id,
    filename: input.filename,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    kind: chatAttachmentKindForMime(input.mimeType),
  };
}

export function chatAttachmentDownloadPath(attachmentId: string): string {
  return `/messages/attachments/${attachmentId}`;
}

export const CHAT_ATTACHMENT_FILE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".txt",
  ".csv",
].join(",");
