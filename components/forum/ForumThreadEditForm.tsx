"use client";

import { useActionState, useEffect, useState } from "react";
import { updateForumThreadAction } from "@/app/forum/actions";
import {
  FORUM_BODY_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
  type ForumActionState,
} from "@/lib/forum/types";

const initialState: ForumActionState = {
  status: "idle",
  message: "",
};

type Props = {
  threadId: string;
  threadSlug: string;
  initialTitle: string;
  initialBody: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function ForumThreadEditForm({
  threadId,
  threadSlug,
  initialTitle,
  initialBody,
  onCancel,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [state, formAction, isPending] = useActionState(
    updateForumThreadAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess();
    }
  }, [state.status, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="threadSlug" value={threadSlug} />

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
          Rubrik
        </span>
        <input
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={FORUM_TITLE_MAX_LENGTH}
          className="w-full divlab-input px-3 py-2 text-sm text-divlab-text"
        />
        <span className="mt-1 block text-[11px] text-divlab-text-muted">
          {title.length}/{FORUM_TITLE_MAX_LENGTH} tecken
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-divlab-text-muted">
          Inlägg
        </span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={FORUM_BODY_MAX_LENGTH}
          rows={6}
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
