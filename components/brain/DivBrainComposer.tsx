"use client";

import {
  startTransition,
  useActionState,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { submitDivBrainMessageAction } from "@/app/brain/actions";
import {
  DIVBRAIN_ACTION_STATE_IDLE,
  type DivBrainActionState,
} from "@/lib/divbrain/action-state";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/divbrain/constants";

type Props = {
  conversationId: string;
  onOptimisticSubmit?: (content: string) => void;
  onSubmissionSettled?: (state: DivBrainActionState) => void;
};

const COMPOSER_MAX_HEIGHT_PX = 176;

export default function DivBrainComposer({
  conversationId,
  onOptimisticSubmit,
  onSubmissionSettled,
}: Props) {
  const fieldId = useId();
  const statusId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");

  const [state, formAction, pending] = useActionState<
    DivBrainActionState,
    FormData
  >(async (previous, formData) => {
    const next = await submitDivBrainMessageAction(previous, formData);
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
    textarea.style.height = `${Math.max(nextHeight, 48)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > COMPOSER_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [content]);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !pending;
  const statusMessage = pending ? null : state.safeMessage;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submittedContent = String(formData.get("content") ?? "").trim();
    if (!submittedContent) {
      return;
    }

    onOptimisticSubmit?.(submittedContent);
    setContent("");

    startTransition(() => {
      formAction(formData);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    if (canSubmit) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="sticky bottom-0 z-10 bg-gradient-to-t from-divlab-bg via-divlab-bg/95 to-transparent px-3 pb-4 pt-6 sm:px-5">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-[48rem]"
        aria-busy={pending}
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <div className="rounded-[1.65rem] border divlab-border-neutral bg-divlab-elevated shadow-sm transition focus-within:border-divlab-blue/45 focus-within:shadow-md">
          <label htmlFor={fieldId} className="sr-only">
            Ställ en fråga till DivBrain
          </label>
          <textarea
            ref={textareaRef}
            id={fieldId}
            name="content"
            rows={1}
            required
            maxLength={DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-describedby={statusId}
            placeholder="Fråga DivBrain…"
            className="block min-h-12 w-full resize-none bg-transparent px-5 pb-2 pt-4 text-sm leading-6 text-divlab-text outline-none placeholder:text-divlab-text-muted"
          />
          <div className="flex items-end justify-between gap-3 px-3 pb-3 pl-5">
            <p className="pb-1 text-[11px] leading-4 text-divlab-text-muted">
              Enter skickar · Shift+Enter ger ny rad
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              aria-label={pending ? "DivBrain tänker" : "Skicka meddelande"}
              title={pending ? "DivBrain tänker…" : "Skicka"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-divlab-blue text-lg font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden="true">↑</span>
            </button>
          </div>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className="min-h-5 px-3 pt-2 text-center text-[11px] leading-5 text-divlab-text-muted"
        >
          {statusMessage ??
            (pending
              ? "DivBrain arbetar med svaret…"
              : "DivBrain kan göra misstag. Kontrollera viktig information.")}
        </p>
      </form>
    </div>
  );
}
