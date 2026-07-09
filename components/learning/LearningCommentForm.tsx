"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLearningCommentAction } from "@/app/learning/actions";
import { LEARNING_COMMENT_MAX_LENGTH } from "@/lib/learning/types";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  articleSlug: string;
};

export default function LearningCommentForm({ articleSlug }: Props) {
  const [state, formAction, isPending] = useActionState(
    createLearningCommentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="articleSlug" value={articleSlug} />
      <textarea
        name="body"
        rows={4}
        maxLength={LEARNING_COMMENT_MAX_LENGTH}
        placeholder="Dela ett lugn perspektiv eller en fråga om artikeln..."
        className="divlab-input w-full resize-none px-3 py-2 text-sm leading-6 placeholder:text-divlab-text-subtle"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-divlab-text-muted">
          Max {LEARNING_COMMENT_MAX_LENGTH} tecken
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="divlab-btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Skickar..." : "Publicera kommentar"}
        </button>
      </div>
      {state.status === "error" && (
        <p className="rounded-xl border divlab-border-neutral divlab-inset px-3 py-2 text-xs leading-5 text-divlab-text-secondary">
          {state.message}
        </p>
      )}
    </form>
  );
}
