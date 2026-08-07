"use client";

import { useId, useState, useActionState } from "react";
import { submitDivBrainMessageAction } from "@/app/brain/actions";
import {
  DIVBRAIN_ACTION_STATE_IDLE,
  type DivBrainActionState,
} from "@/lib/divbrain/action-state";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "@/lib/divbrain/constants";

type Props = {
  conversationId: string;
};

export default function DivBrainComposer({ conversationId }: Props) {
  const fieldId = useId();
  const statusId = useId();
  const [content, setContent] = useState("");

  const [state, formAction, pending] = useActionState<
    DivBrainActionState,
    FormData
  >(async (previous, formData) => {
    const next = await submitDivBrainMessageAction(previous, formData);
    if (next.clearComposer) {
      setContent("");
    }
    return next;
  }, DIVBRAIN_ACTION_STATE_IDLE);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  return (
    <div className="border-t divlab-border-neutral px-4 py-4 sm:px-5">
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="conversationId" value={conversationId} />
        <label htmlFor={fieldId} className="sr-only">
          Ställ en fråga till DivBrain
        </label>
        <textarea
          id={fieldId}
          name="content"
          rows={3}
          required
          maxLength={DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={pending}
          aria-describedby={statusId}
          placeholder="Skriv din fråga…"
          className="divlab-input min-h-[5.5rem] w-full resize-y"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs leading-5 text-divlab-text-muted">
            Frågan sparas privat i den här konversationen. AI-motorn är ännu
            inte ansluten.
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className="divlab-btn-primary min-h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Skickar…" : "Skicka"}
          </button>
        </div>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className="min-h-5 text-xs leading-5 text-divlab-text-secondary"
        >
          {state.safeMessage}
        </p>
      </form>
    </div>
  );
}
