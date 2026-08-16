import {
  CHAT_ATTACHMENT_COPY_SV,
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_MAX_PER_MESSAGE,
  CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  isChatAttachmentMimeType,
  resolveChatAttachmentMimeType,
  sanitizeChatAttachmentFilename,
} from "@/lib/messages/attachments";

export type ChatComposerAttachment = {
  localId: string;
  file: File;
  filename: string;
  mimeType: string;
  byteSize: number;
  previewUrl: string | null;
  attachmentId?: string;
  status: "uploading" | "ready" | "error";
  errorMessage?: string;
};

export function createChatComposerLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function validateComposerFiles(params: {
  current: readonly ChatComposerAttachment[];
  incoming: readonly File[];
}): { files: File[]; error: string | null } {
  if (params.current.length + params.incoming.length > CHAT_ATTACHMENT_MAX_PER_MESSAGE) {
    return { files: [], error: CHAT_ATTACHMENT_COPY_SV.tooMany };
  }

  const currentTotal = params.current.reduce((sum, item) => sum + item.byteSize, 0);
  const accepted: File[] = [];
  let error: string | null = null;

  for (const file of params.incoming) {
    if (params.current.length + accepted.length >= CHAT_ATTACHMENT_MAX_PER_MESSAGE) {
      error = CHAT_ATTACHMENT_COPY_SV.tooMany;
      break;
    }
    if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
      error = CHAT_ATTACHMENT_COPY_SV.tooLarge;
      continue;
    }
    const mimeType = resolveChatAttachmentMimeType({
      mimeType: file.type,
      filename: file.name,
    });
    if (!mimeType) {
      error = CHAT_ATTACHMENT_COPY_SV.unsupported;
      continue;
    }
    if (currentTotal + accepted.reduce((sum, item) => sum + item.size, 0) + file.size >
      CHAT_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE) {
      error = CHAT_ATTACHMENT_COPY_SV.totalTooLarge;
      continue;
    }
    accepted.push(file);
  }

  return { files: accepted, error };
}

export function toComposerAttachment(file: File): ChatComposerAttachment {
  const mimeType =
    resolveChatAttachmentMimeType({
      mimeType: file.type,
      filename: file.name,
    }) ?? file.type;
  const isImage = isChatAttachmentMimeType(mimeType)
    ? mimeType.startsWith("image/")
    : false;

  return {
    localId: createChatComposerLocalId(),
    file,
    filename: sanitizeChatAttachmentFilename(file.name),
    mimeType,
    byteSize: file.size,
    previewUrl: isImage ? URL.createObjectURL(file) : null,
    status: "uploading",
  };
}

export function revokeComposerPreview(item: ChatComposerAttachment) {
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
}
