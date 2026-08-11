"use client";

import {
  startTransition,
  useActionState,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  confirmDivBrainAttachmentUploadAction,
  discardDivBrainUnlinkedAttachmentAction,
  prepareDivBrainAttachmentUploadAction,
  submitDivBrainMessageAction,
} from "@/app/brain/actions";
import {
  DIVBRAIN_ACTION_STATE_IDLE,
  type DivBrainActionState,
} from "@/lib/divbrain/action-state";
import {
  DIVBRAIN_ATTACHMENT_COPY_SV,
  DIVBRAIN_ATTACHMENT_MAX_BYTES,
  DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE,
  DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE,
  isDivBrainAttachmentMimeType,
  type DivBrainShellAttachment,
} from "@/lib/divbrain/attachments";
import {
  resolveDivBrainComposerDiscardOutcome,
  shouldSubmitDivBrainComposerKey,
} from "@/lib/divbrain/chat-ux";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/divbrain/constants";

type Props = {
  conversationId: string;
  onOptimisticSubmit?: (content: string) => void;
  onSubmissionSettled?: (state: DivBrainActionState) => void;
};

type ComposerAttachment = {
  localId: string;
  attachmentId?: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  status: "uploading" | "ready" | "error";
  errorMessage?: string;
  shell?: DivBrainShellAttachment;
};

const COMPOSER_MIN_HEIGHT_PX = 42;
const COMPOSER_MAX_HEIGHT_PX = 176;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DivBrainComposer({
  conversationId,
  onOptimisticSubmit,
  onSubmissionSettled,
}: Props) {
  const fieldId = useId();
  const statusId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedContentRef = useRef<string | null>(null);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [discardingLocalIds, setDiscardingLocalIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<
    DivBrainActionState,
    FormData
  >(async (previous, formData) => {
    const next = await submitDivBrainMessageAction(previous, formData);
    const submittedContent = submittedContentRef.current;

    if (!next.persisted && next.status !== "blocked" && submittedContent) {
      setContent((current) => (current.length === 0 ? submittedContent : current));
    }

    if (next.persisted || next.status === "blocked") {
      setAttachments([]);
    }

    submittedContentRef.current = null;
    onSubmissionSettled?.(next);
    return next;
  }, DIVBRAIN_ACTION_STATE_IDLE);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, COMPOSER_MAX_HEIGHT_PX);
    textarea.style.height = `${Math.max(nextHeight, COMPOSER_MIN_HEIGHT_PX)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [content]);

  const trimmed = content.trim();
  const readyAttachments = attachments.filter((item) => item.status === "ready");
  const uploading = attachments.some((item) => item.status === "uploading");
  const canSubmit =
    (trimmed.length > 0 || readyAttachments.length > 0) &&
    !pending &&
    !uploading &&
    attachments.every((item) => item.status !== "error");
  const statusMessage = pending ? null : localError ?? state.safeMessage;

  async function enqueueFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setLocalError(null);

    const currentCount = attachments.length;
    if (currentCount + files.length > DIVBRAIN_ATTACHMENT_MAX_PER_MESSAGE) {
      setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.tooMany);
      return;
    }

    const currentTotal = attachments.reduce((sum, item) => sum + item.byteSize, 0);
    const incomingTotal = files.reduce((sum, file) => sum + file.size, 0);
    if (currentTotal + incomingTotal > DIVBRAIN_ATTACHMENT_MAX_TOTAL_BYTES_PER_MESSAGE) {
      setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.totalTooLarge);
      return;
    }

    for (const file of files) {
      if (file.size > DIVBRAIN_ATTACHMENT_MAX_BYTES) {
        setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.tooLarge);
        continue;
      }
      if (!isDivBrainAttachmentMimeType(file.type)) {
        setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.unsupported);
        continue;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setAttachments((current) => [
        ...current,
        {
          localId,
          filename: file.name,
          mimeType: file.type,
          byteSize: file.size,
          status: "uploading",
        },
      ]);

      try {
        const prepared = await prepareDivBrainAttachmentUploadAction({
          conversationId,
          filename: file.name,
          mimeType: file.type,
          byteSize: file.size,
        });

        if (!prepared.ok) {
          setAttachments((current) =>
            current.map((item) =>
              item.localId === localId
                ? {
                    ...item,
                    status: "error",
                    errorMessage: prepared.safeMessage,
                  }
                : item,
            ),
          );
          setLocalError(prepared.safeMessage);
          continue;
        }

        // Retain server attachment id as soon as prepare succeeds (before PUT).
        setAttachments((current) =>
          current.map((item) =>
            item.localId === localId
              ? {
                  ...item,
                  attachmentId: prepared.attachmentId,
                  shell: prepared.shell,
                }
              : item,
          ),
        );

        const uploadResponse = await fetch(prepared.signedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            ...(prepared.token
              ? { "x-upsert": "false" }
              : {}),
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          void discardDivBrainUnlinkedAttachmentAction({
            attachmentId: prepared.attachmentId,
          });
          setAttachments((current) =>
            current.map((item) =>
              item.localId === localId
                ? {
                    ...item,
                    attachmentId: prepared.attachmentId,
                    status: "error",
                    errorMessage: DIVBRAIN_ATTACHMENT_COPY_SV.uploadFailure,
                  }
                : item,
            ),
          );
          setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.uploadFailure);
          continue;
        }

        const confirmed = await confirmDivBrainAttachmentUploadAction({
          attachmentId: prepared.attachmentId,
        });

        if (!confirmed.ok) {
          void discardDivBrainUnlinkedAttachmentAction({
            attachmentId: prepared.attachmentId,
          });
          setAttachments((current) =>
            current.map((item) =>
              item.localId === localId
                ? {
                    ...item,
                    attachmentId: prepared.attachmentId,
                    status: "error",
                    errorMessage: confirmed.safeMessage,
                  }
                : item,
            ),
          );
          setLocalError(confirmed.safeMessage);
          continue;
        }

        setAttachments((current) =>
          current.map((item) =>
            item.localId === localId
              ? {
                  ...item,
                  attachmentId: prepared.attachmentId,
                  status: "ready",
                  shell: confirmed.shell,
                }
              : item,
          ),
        );
      } catch {
        setAttachments((current) => {
          const failed = current.find((item) => item.localId === localId);
          if (failed?.attachmentId) {
            void discardDivBrainUnlinkedAttachmentAction({
              attachmentId: failed.attachmentId,
            });
          }
          return current.map((item) =>
            item.localId === localId
              ? {
                  ...item,
                  status: "error",
                  errorMessage: DIVBRAIN_ATTACHMENT_COPY_SV.uploadFailure,
                }
              : item,
          );
        });
        setLocalError(DIVBRAIN_ATTACHMENT_COPY_SV.uploadFailure);
      }
    }
  }

  async function removeComposerAttachment(item: ComposerAttachment) {
    // Do not allow remove while PUT/confirm is in flight for this chip.
    if (item.status === "uploading" || discardingLocalIds.has(item.localId)) {
      return;
    }

    if (!item.attachmentId) {
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
      const discardResult = await discardDivBrainUnlinkedAttachmentAction({
        attachmentId: item.attachmentId,
      });
      const outcome = resolveDivBrainComposerDiscardOutcome({
        hasServerAttachmentId: true,
        discardResult,
      });

      if (outcome.remove) {
        setAttachments((current) =>
          current.filter((entry) => entry.localId !== item.localId),
        );
        setLocalError(null);
        return;
      }

      // Keep the chip so the user can retry; never leak storage path/id details.
      setLocalError(outcome.safeMessage);
    } finally {
      setDiscardingLocalIds((current) => {
        const next = new Set(current);
        next.delete(item.localId);
        return next;
      });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submittedContent = String(formData.get("content") ?? "").trim();
    const readyIds = attachments
      .filter((item) => item.status === "ready" && item.attachmentId)
      .map((item) => item.attachmentId!);

    if (!submittedContent && readyIds.length === 0) {
      return;
    }

    formData.set("attachmentIds", JSON.stringify(readyIds));

    const optimisticLabel =
      submittedContent ||
      (readyIds.length === 1
        ? `Bifogad fil: ${attachments.find((item) => item.attachmentId === readyIds[0])?.filename ?? "fil"}`
        : `Bifogade filer: ${attachments
            .filter((item) => item.attachmentId && readyIds.includes(item.attachmentId))
            .map((item) => item.filename)
            .join(", ")}`);

    submittedContentRef.current = submittedContent || optimisticLabel;
    onOptimisticSubmit?.(optimisticLabel);
    setContent("");
    setLocalError(null);

    startTransition(() => {
      formAction(formData);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const plainEnter =
      event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing;

    if (plainEnter) {
      event.preventDefault();
    }

    if (
      shouldSubmitDivBrainComposerKey({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
        canSubmit,
      })
    ) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-divlab-bg via-divlab-bg/95 to-transparent px-3 pb-2.5 pt-4 sm:px-5 sm:pb-3.5">
      <form
        onSubmit={handleSubmit}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (event.dataTransfer.files?.length) {
            void enqueueFiles(event.dataTransfer.files);
          }
        }}
        className="mx-auto max-w-[50rem]"
        aria-busy={pending || uploading}
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <div
          className={`rounded-[1.65rem] border bg-divlab-elevated/95 shadow-lg transition focus-within:border-divlab-blue/55 focus-within:shadow-xl ${
            dragActive
              ? "border-divlab-blue/70"
              : "border-divlab-blue/25"
          }`}
        >
          {attachments.length > 0 ? (
            <ul className="flex flex-wrap gap-2 px-4 pt-3" aria-label="Bilagor">
              {attachments.map((item) => (
                <li
                  key={item.localId}
                  className="flex max-w-full items-center gap-2 rounded-full border border-divlab-blue/20 bg-divlab-blue/10 px-3 py-1.5 text-[11px] text-divlab-text"
                >
                  <span className="truncate" title={item.filename}>
                    {item.filename}
                  </span>
                  <span className="shrink-0 text-divlab-text-muted">
                    {item.status === "uploading"
                      ? DIVBRAIN_ATTACHMENT_COPY_SV.uploading
                      : formatBytes(item.byteSize)}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-divlab-text-muted transition hover:text-divlab-text disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={DIVBRAIN_ATTACHMENT_COPY_SV.remove}
                    disabled={
                      item.status === "uploading" ||
                      pending ||
                      discardingLocalIds.has(item.localId)
                    }
                    onClick={() => {
                      void removeComposerAttachment(item);
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <label htmlFor={fieldId} className="sr-only">
            Ställ en fråga till DivBrain
          </label>
          <textarea
            ref={textareaRef}
            id={fieldId}
            name="content"
            rows={1}
            maxLength={DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-describedby={statusId}
            placeholder="Fråga DivBrain…"
            className="block min-h-10 w-full resize-none bg-transparent px-5 pb-1.5 pt-3.5 text-[15px] leading-6 text-divlab-text outline-none placeholder:text-divlab-text-muted"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3 pl-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv"
                multiple
                onChange={(event) => {
                  if (event.target.files?.length) {
                    void enqueueFiles(event.target.files);
                  }
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label={DIVBRAIN_ATTACHMENT_COPY_SV.attachLabel}
                title={DIVBRAIN_ATTACHMENT_COPY_SV.attachLabel}
                disabled={pending || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-divlab-text-muted transition hover:bg-divlab-blue/10 hover:text-divlab-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a1.5 1.5 0 01-2.12-2.12l7.78-7.78"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <p className="hidden text-[10px] leading-4 text-divlab-text-muted sm:block sm:text-[11px]">
                Enter skickar · Shift+Enter ger ny rad
              </p>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              aria-label={pending ? "DivBrain tänker" : "Skicka meddelande"}
              title={pending ? "DivBrain tänker…" : "Skicka"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-divlab-blue text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-divlab-blue disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M12 19V5m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className="min-h-4 px-3 pt-1.5 text-center text-[10px] leading-4 text-divlab-text-muted sm:text-[11px]"
        >
          {statusMessage ??
            (pending
              ? "DivBrain arbetar med svaret…"
              : uploading
                ? DIVBRAIN_ATTACHMENT_COPY_SV.uploading
                : "Privat för ditt konto · Kontrollera viktig information.")}
        </p>
      </form>
    </div>
  );
}
