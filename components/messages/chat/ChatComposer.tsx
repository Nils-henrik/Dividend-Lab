"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppIcon from "@/components/layout/AppIcon";
import {
  confirmChatAttachmentUploadAction,
  discardChatUnlinkedAttachmentAction,
  prepareChatAttachmentUploadAction,
} from "@/app/messages/actions";
import {
  insertComposerText,
  shouldRestoreComposerFocusAfterEmojiPickerDismiss,
  shouldSubmitChatComposerKey,
  type ChatEmojiPickerDismissReason,
} from "@/lib/messages/chat-composer";
import {
  CHAT_ATTACHMENT_COPY_SV,
  CHAT_ATTACHMENT_FILE_ACCEPT,
} from "@/lib/messages/attachments";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/messages/types";
import ChatComposerAttachmentList from "./ChatComposerAttachmentList";
import ChatEmojiPicker from "./ChatEmojiPicker";
import {
  revokeComposerPreview,
  toComposerAttachment,
  validateComposerFiles,
  type ChatComposerAttachment,
} from "./chatComposerAttachments";

type Props = {
  conversationId: string;
  disabled?: boolean;
  pending?: boolean;
  errorMessage?: string | null;
  compact?: boolean;
  onSend: (
    conversationId: string,
    body: string,
    attachmentIds: string[],
  ) => Promise<boolean>;
};

export default function ChatComposer({
  conversationId,
  disabled = false,
  pending = false,
  errorMessage,
  compact = false,
  onSend,
}: Props) {
  const [body, setBody] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachments, setAttachments] = useState<ChatComposerAttachment[]>([]);
  const [discardingLocalIds, setDiscardingLocalIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const attachmentsRef = useRef(attachments);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const uploading = attachments.some((item) => item.status === "uploading");
  const hasErrorChip = attachments.some((item) => item.status === "error");
  const readyIds = attachments
    .filter((item) => item.status === "ready" && item.attachmentId)
    .map((item) => item.attachmentId!);
  const canSend =
    !disabled &&
    !pending &&
    !uploading &&
    !hasErrorChip &&
    (body.trim().length > 0 || readyIds.length > 0);
  const nearLimit = body.length >= MESSAGE_BODY_MAX_LENGTH - 200;
  const statusMessage = localError ?? errorMessage;

  useEffect(() => {
    return () => {
      for (const item of attachmentsRef.current) {
        if (item.attachmentId && item.status !== "uploading") {
          void discardChatUnlinkedAttachmentAction({
            attachmentId: item.attachmentId,
          });
        }
        revokeComposerPreview(item);
      }
    };
  }, []);

  const rememberSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    selectionRef.current = {
      start: textarea.selectionStart ?? textarea.value.length,
      end: textarea.selectionEnd ?? textarea.value.length,
    };
  }, []);

  const closeEmojiPicker = useCallback(
    (reason: Exclude<ChatEmojiPickerDismissReason, "select">) => {
      setEmojiOpen(false);
      if (!shouldRestoreComposerFocusAfterEmojiPickerDismiss(reason)) {
        return;
      }

      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
        const { start, end } = selectionRef.current;
        textareaRef.current?.setSelectionRange(start, end);
      });
    },
    [],
  );

  function insertEmoji(emoji: string) {
    const next = insertComposerText({
      value: body,
      insert: emoji,
      selectionStart: selectionRef.current.start,
      selectionEnd: selectionRef.current.end,
      maxLength: MESSAGE_BODY_MAX_LENGTH,
    });
    setBody(next.value);
    selectionRef.current = { start: next.caret, end: next.caret };
    setEmojiOpen(false);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  }

  async function uploadComposerFile(item: ChatComposerAttachment) {
    try {
      const prepared = await prepareChatAttachmentUploadAction({
        conversationId,
        filename: item.filename,
        mimeType: item.mimeType,
        byteSize: item.byteSize,
      });

      if (prepared.status !== "success" || !prepared.data) {
        setAttachments((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? {
                  ...entry,
                  status: "error",
                  errorMessage: prepared.message,
                }
              : entry,
          ),
        );
        setLocalError(prepared.message);
        return;
      }

      setAttachments((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? { ...entry, attachmentId: prepared.data!.attachmentId }
            : entry,
        ),
      );

      const uploadResponse = await fetch(prepared.data.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": item.mimeType,
          ...(prepared.data.token ? { "x-upsert": "false" } : {}),
        },
        body: item.file,
      });

      if (!uploadResponse.ok) {
        void discardChatUnlinkedAttachmentAction({
          attachmentId: prepared.data.attachmentId,
        });
        setAttachments((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? {
                  ...entry,
                  attachmentId: prepared.data!.attachmentId,
                  status: "error",
                  errorMessage: CHAT_ATTACHMENT_COPY_SV.uploadFailure,
                }
              : entry,
          ),
        );
        setLocalError(CHAT_ATTACHMENT_COPY_SV.uploadFailure);
        return;
      }

      const confirmed = await confirmChatAttachmentUploadAction({
        attachmentId: prepared.data.attachmentId,
      });

      if (confirmed.status !== "success") {
        void discardChatUnlinkedAttachmentAction({
          attachmentId: prepared.data.attachmentId,
        });
        setAttachments((current) =>
          current.map((entry) =>
            entry.localId === item.localId
              ? {
                  ...entry,
                  attachmentId: prepared.data!.attachmentId,
                  status: "error",
                  errorMessage: confirmed.message,
                }
              : entry,
          ),
        );
        setLocalError(confirmed.message);
        return;
      }

      setAttachments((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? {
                ...entry,
                attachmentId: prepared.data!.attachmentId,
                status: "ready",
              }
            : entry,
        ),
      );
    } catch {
      const latest = attachmentsRef.current.find(
        (entry) => entry.localId === item.localId,
      );
      if (latest?.attachmentId) {
        void discardChatUnlinkedAttachmentAction({
          attachmentId: latest.attachmentId,
        });
      }
      setAttachments((current) =>
        current.map((entry) =>
          entry.localId === item.localId
            ? {
                ...entry,
                status: "error",
                errorMessage: CHAT_ATTACHMENT_COPY_SV.uploadFailure,
              }
            : entry,
        ),
      );
      setLocalError(CHAT_ATTACHMENT_COPY_SV.uploadFailure);
    }
  }

  async function enqueueFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) {
      return;
    }

    const validated = validateComposerFiles({
      current: attachments,
      incoming,
    });
    if (validated.error && validated.files.length === 0) {
      setLocalError(validated.error);
      return;
    }
    if (validated.error) {
      setLocalError(validated.error);
    } else {
      setLocalError(null);
    }

    const created = validated.files.map(toComposerAttachment);
    setAttachments((current) => [...current, ...created]);
    for (const item of created) {
      await uploadComposerFile(item);
    }
  }

  async function removeComposerAttachment(item: ChatComposerAttachment) {
    if (item.status === "uploading" || discardingLocalIds.has(item.localId)) {
      return;
    }

    if (!item.attachmentId) {
      revokeComposerPreview(item);
      setAttachments((current) =>
        current.filter((entry) => entry.localId !== item.localId),
      );
      setLocalError(null);
      return;
    }

    setDiscardingLocalIds((current) => {
      const next = new Set(current);
      next.add(item.localId);
      return next;
    });

    try {
      const discarded = await discardChatUnlinkedAttachmentAction({
        attachmentId: item.attachmentId,
      });
      if (discarded.status !== "success") {
        setLocalError(discarded.message);
        return;
      }

      revokeComposerPreview(item);
      setAttachments((current) =>
        current.filter((entry) => entry.localId !== item.localId),
      );
      setLocalError(null);
    } finally {
      setDiscardingLocalIds((current) => {
        const next = new Set(current);
        next.delete(item.localId);
        return next;
      });
    }
  }

  async function retryComposerAttachment(item: ChatComposerAttachment) {
    if (item.attachmentId) {
      await discardChatUnlinkedAttachmentAction({
        attachmentId: item.attachmentId,
      });
    }
    setLocalError(null);
    setAttachments((current) =>
      current.map((entry) =>
        entry.localId === item.localId
          ? { ...entry, attachmentId: undefined, status: "uploading", errorMessage: undefined }
          : entry,
      ),
    );
    await uploadComposerFile({
      ...item,
      attachmentId: undefined,
      status: "uploading",
      errorMessage: undefined,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextBody = body.trim();
    if (disabled || pending || uploading || hasErrorChip) {
      return;
    }
    if (!nextBody && readyIds.length === 0) {
      return;
    }

    const sent = await onSend(conversationId, nextBody, readyIds);
    if (sent) {
      for (const item of attachments) {
        revokeComposerPreview(item);
      }
      setBody("");
      setAttachments([]);
      setLocalError(null);
      selectionRef.current = { start: 0, end: 0 };
      setEmojiOpen(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      shouldSubmitChatComposerKey({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
        keyCode: event.keyCode,
      })
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-2" : "space-y-3"}
    >
      <ChatComposerAttachmentList
        attachments={attachments}
        discardingLocalIds={discardingLocalIds}
        onRemove={(item) => {
          void removeComposerAttachment(item);
        }}
        onRetry={(item) => {
          void retryComposerAttachment(item);
        }}
      />

      <div className="relative flex items-end gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept={CHAT_ATTACHMENT_FILE_ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) {
              void enqueueFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
        <button
          type="button"
          aria-label={CHAT_ATTACHMENT_COPY_SV.attachLabel}
          disabled={disabled || pending}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:opacity-60"
        >
          <AppIcon name="paperclip" className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            data-chat-emoji-trigger="true"
            aria-label="Öppna emoji"
            aria-haspopup="dialog"
            aria-expanded={emojiOpen}
            disabled={disabled || pending}
            onMouseDown={(event) => {
              rememberSelection();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              setEmojiOpen((open) => !open);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:opacity-60"
          >
            <AppIcon name="emoji" className="h-5 w-5" />
          </button>
          <ChatEmojiPicker
            open={emojiOpen}
            onClose={closeEmojiPicker}
            onSelect={insertEmoji}
          />
        </div>

        <label className="min-w-0 flex-1">
          <span className="sr-only">Skriv ett meddelande</span>
          <textarea
            ref={textareaRef}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={rememberSelection}
            onClick={rememberSelection}
            onSelect={rememberSelection}
            onBlur={rememberSelection}
            maxLength={MESSAGE_BODY_MAX_LENGTH}
            rows={compact ? 1 : 2}
            disabled={disabled || pending}
            placeholder="Skriv ett meddelande..."
            className="max-h-24 min-h-9 w-full resize-none rounded-2xl border divlab-border-neutral bg-divlab-input px-3 py-2 text-sm leading-5 text-divlab-text placeholder:text-divlab-text-subtle outline-none transition focus:border-divlab-blue/40 disabled:opacity-60"
          />
        </label>

        <button
          type="submit"
          aria-label="Skicka"
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-divlab-blue text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AppIcon name="send" className="h-4 w-4" />
          <span className="sr-only">{pending ? "Skickar..." : "Skicka"}</span>
        </button>
      </div>

      {nearLimit ? (
        <p className="text-[11px] text-divlab-text-muted">
          {body.length}/{MESSAGE_BODY_MAX_LENGTH}
        </p>
      ) : null}

      {statusMessage ? (
        <p role="status" className="text-xs text-red-300">
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
