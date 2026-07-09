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
        className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm leading-6 text-gray-300 outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Max {LEARNING_COMMENT_MAX_LENGTH} tecken
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-[#D4AF37]/40 px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Skickar..." : "Publicera kommentar"}
        </button>
      </div>
      {state.status === "error" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-gray-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
