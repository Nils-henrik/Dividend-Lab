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
import { shouldSubmitDivBrainComposerKey } from "@/lib/divbrain/chat-ux";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/divbrain/constants";

type Props = {
  conversationId: string;
  onOptimisticSubmit?: (content: string) => void;
  onSubmissionSettled?: (state: DivBrainActionState) => void;
};

const COMPOSER_MIN_HEIGHT_PX = 42;
const COMPOSER_MAX_HEIGHT_PX = 176;

export default function DivBrainComposer({
  conversationId,
  onOptimisticSubmit,
  onSubmissionSettled,
}: Props) {
  const fieldId = useId();
  const statusId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittedContentRef = useRef<string | null>(null);
  const [content, setContent] = useState("");

  const [state, formAction, pending] = useActionState<
    DivBrainActionState,
    FormData
  >(async (previous, formData) => {
    const next = await submitDivBrainMessageAction(previous, formData);
    const submittedContent = submittedContentRef.current;

    if (!next.persisted && next.status !== "blocked" && submittedContent) {
      setContent((current) => (current.length === 0 ? submittedContent : current));
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

    submittedContentRef.current = submittedContent;
    onOptimisticSubmit?.(submittedContent);
    setContent("");

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
        className="mx-auto max-w-[50rem]"
        aria-busy={pending}
      >
        <input type="hidden" name="conversationId" value={conversationId} />
        <div className="rounded-[1.65rem] border border-divlab-blue/25 bg-divlab-elevated/95 shadow-lg transition focus-within:border-divlab-blue/55 focus-within:shadow-xl">
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
            className="block min-h-10 w-full resize-none bg-transparent px-5 pb-1.5 pt-3.5 text-[15px] leading-6 text-divlab-text outline-none placeholder:text-divlab-text-muted"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3 pl-5">
            <p className="text-[10px] leading-4 text-divlab-text-muted sm:text-[11px]">
              Enter skickar · Shift+Enter ger ny rad
            </p>
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
              : "Privat för ditt konto · Kontrollera viktig information.")}
        </p>
      </form>
    </div>
  );
}
