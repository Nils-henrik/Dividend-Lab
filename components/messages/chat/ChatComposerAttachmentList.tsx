"use client";

import AppIcon from "@/components/layout/AppIcon";
import {
  CHAT_ATTACHMENT_COPY_SV,
  formatChatAttachmentBytes,
} from "@/lib/messages/attachments";
import type { ChatComposerAttachment } from "./chatComposerAttachments";

type Props = {
  attachments: ChatComposerAttachment[];
  discardingLocalIds: ReadonlySet<string>;
  onRemove: (item: ChatComposerAttachment) => void;
  onRetry: (item: ChatComposerAttachment) => void;
};

export default function ChatComposerAttachmentList({
  attachments,
  discardingLocalIds,
  onRemove,
  onRetry,
}: Props) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Bilagor">
      {attachments.map((item) => {
        const discarding = discardingLocalIds.has(item.localId);
        const busy = item.status === "uploading" || discarding;

        return (
          <li
            key={item.localId}
            className="flex max-w-full items-center gap-2 rounded-full border border-divlab-blue/20 bg-divlab-blue/10 px-2.5 py-1 text-[11px] text-divlab-text"
          >
            {item.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.previewUrl}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full object-cover"
              />
            ) : null}
            <span className="max-w-[8rem] truncate" title={item.filename}>
              {item.filename}
            </span>
            <span className="shrink-0 text-divlab-text-muted">
              {item.status === "uploading"
                ? CHAT_ATTACHMENT_COPY_SV.uploading
                : item.status === "error"
                  ? item.errorMessage
                  : formatChatAttachmentBytes(item.byteSize)}
            </span>
            {item.status === "error" ? (
              <button
                type="button"
                onClick={() => onRetry(item)}
                className="shrink-0 text-divlab-blue transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
              >
                {CHAT_ATTACHMENT_COPY_SV.retry}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => onRemove(item)}
              aria-label={CHAT_ATTACHMENT_COPY_SV.remove}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-divlab-text-muted transition hover:bg-white/10 hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AppIcon name="close" className="h-3 w-3" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
