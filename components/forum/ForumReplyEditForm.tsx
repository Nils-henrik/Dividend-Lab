"use client";

import { useActionState, useEffect, useState } from "react";
import { updateForumReplyAction } from "@/app/forum/actions";
import {
  FORUM_BODY_MAX_LENGTH,
  type ForumActionState,
} from "@/lib/forum/types";

const initialState: ForumActionState = {
  status: "idle",
  message: "",
};

type Props = {
  replyId: string;
  threadSlug: string;
  initialBody: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function ForumReplyEditForm({
  replyId,
  threadSlug,
  initialBody,
  onCancel,
  onSuccess,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [state, formAction, isPending] = useActionState(
    updateForumReplyAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="replyId" value={replyId} />
      <input type="hidden" name="threadSlug" value={threadSlug} />

      <label className="block">
        <span className="sr-only">Redigera svar</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={FORUM_BODY_MAX_LENGTH}
          rows={5}
          className="w-full resize-none divlab-input px-3 py-2 text-sm leading-6 text-divlab-text"
        />
        <span className="mt-1 block text-[11px] text-divlab-text-muted">
          {body.length}/{FORUM_BODY_MAX_LENGTH} tecken
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="divlab-btn-ghost px-3 py-1.5 text-[11px]"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="divlab-btn-ghost px-3 py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sparar..." : "Spara"}
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
