"use client";

import {
  CHAT_ATTACHMENT_COPY_SV,
  chatAttachmentDownloadPath,
  formatChatAttachmentBytes,
  formatChatAttachmentTypeLabel,
  type ConversationMessageAttachment,
} from "@/lib/messages/attachments";

type Props = {
  attachments: ConversationMessageAttachment[];
  compact?: boolean;
};

export default function ChatMessageAttachments({
  attachments,
  compact = false,
}: Props) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className={`space-y-2 ${compact ? "mt-1.5" : "mt-2"}`}>
      {attachments.map((attachment) => {
        if (attachment.kind === "image") {
          return (
            <li key={attachment.id}>
              <a
                href={chatAttachmentDownloadPath(attachment.id)}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {/* Native img so authenticated GIF animation is preserved. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chatAttachmentDownloadPath(attachment.id)}
                  alt={attachment.filename || CHAT_ATTACHMENT_COPY_SV.previewAlt}
                  className="max-h-56 w-full max-w-[16rem] object-contain bg-black/20"
                />
                <span className="sr-only">{CHAT_ATTACHMENT_COPY_SV.openFile}</span>
              </a>
            </li>
          );
        }

        return (
          <li key={attachment.id}>
            <div className="flex max-w-[16rem] items-center gap-3 rounded-xl border divlab-border-neutral bg-divlab-elevated/70 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-divlab-text">
                  {attachment.filename}
                </p>
                <p className="text-[11px] text-divlab-text-muted">
                  {formatChatAttachmentTypeLabel(attachment.mimeType)}
                  {" · "}
                  {formatChatAttachmentBytes(attachment.byteSize)}
                </p>
              </div>
              <a
                href={chatAttachmentDownloadPath(attachment.id)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium text-divlab-blue transition hover:bg-divlab-blue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {CHAT_ATTACHMENT_COPY_SV.openFile}
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
