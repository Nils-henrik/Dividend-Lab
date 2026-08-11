/**
 * Server-owned DivBrain attachment domain types.
 * This module must never be imported by client components.
 */

import type {
  DivBrainAttachmentMimeType,
  DivBrainAttachmentStatus,
} from "../../attachments";

export type DivBrainAttachmentRecord = {
  id: string;
  userId: string;
  conversationId: string;
  messageId: string | null;
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  mimeType: DivBrainAttachmentMimeType;
  byteSize: number;
  checksumSha256: string | null;
  status: DivBrainAttachmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type DivBrainAttachmentRow = {
  id: string;
  user_id: string;
  conversation_id: string;
  message_id: string | null;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  checksum_sha256: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DivBrainAttachmentInsert = {
  id: string;
  user_id: string;
  conversation_id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: DivBrainAttachmentMimeType;
  byte_size: number;
  status: "pending";
};

export type DivBrainPreparedAttachmentPayload = {
  attachmentIds: readonly string[];
  sources: readonly import("../../sources").DivBrainSource[];
  /** Extracted text/csv blocks for user_owned_context (untrusted). */
  extractedTextBlocks: readonly string[];
  /** Binary/PDF/image parts for the current user message. */
  fileParts: readonly import("../providers/types").DivBrainProviderFilePart[];
  /** Shell metadata for linking/display after persist. */
  shellAttachments: readonly import("../../attachments").DivBrainShellAttachment[];
  filenames: readonly string[];
};
