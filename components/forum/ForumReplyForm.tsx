"use client";

import { useActionState, type RefObject } from "react";
import { createForumReplyAction } from "@/app/forum/actions";
import { FORUM_BODY_MAX_LENGTH } from "@/lib/forum/types";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  threadSlug: string;
  body: string;
  onBodyChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onCancel: () => void;
  replyContext?: string | null;
};

export default function ForumReplyForm({
  threadSlug,
  body,
  onBodyChange,
  textareaRef,
  onCancel,
  replyContext = null,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    createForumReplyAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="threadSlug" value={threadSlug} />
      {replyContext && (
        <p className="text-[11px] text-gray-500">{replyContext}</p>
      )}
      <textarea
        ref={textareaRef}
        name="body"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        rows={5}
        maxLength={FORUM_BODY_MAX_LENGTH}
        placeholder="Skriv ett lugnt, användbart svar..."
        className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-3 py-2 text-sm leading-6 text-gray-300 outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/60"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {body.length}/{FORUM_BODY_MAX_LENGTH} tecken
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl border border-[#D4AF37]/40 px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Publicerar..." : "Publicera svar"}
          </button>
        </div>
      </div>
      {state.status === "error" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-gray-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
