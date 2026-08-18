/**
 * Server-owned chat attachment domain types.
 * This module must never be imported by client components.
 */

import type {
  ChatAttachmentMimeType,
  ChatAttachmentStatus,
} from "../../attachments";

export type ChatAttachmentRecord = {
  id: string;
  uploaderId: string;
  conversationId: string;
  messageId: string | null;
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  mimeType: ChatAttachmentMimeType;
  byteSize: number;
  checksumSha256: string | null;
  status: ChatAttachmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ChatAttachmentRow = {
  id: string;
  conversation_id: string;
  message_id: string | null;
  uploader_id: string;
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

export type ChatAttachmentInsert = {
  id: string;
  conversation_id: string;
  uploader_id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: ChatAttachmentMimeType;
  byte_size: number;
  status: "pending";
};
