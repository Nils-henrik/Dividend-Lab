"use client";

import { useActionState, useState } from "react";
import { sendMessageAction } from "@/app/messages/actions";
import { MESSAGE_BODY_MAX_LENGTH } from "@/lib/messages/types";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  conversationId: string;
};

export default function MessageComposer({ conversationId }: Props) {
  const [body, setBody] = useState("");
  const [state, formAction, isPending] = useActionState(
    sendMessageAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label className="block">
        <span className="sr-only">Skriv ett meddelande</span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          rows={4}
          placeholder="Skriv ett meddelande..."
          className="w-full resize-none divlab-input px-4 py-3 text-sm leading-6 text-divlab-text placeholder:text-divlab-text-subtle"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {body.length}/{MESSAGE_BODY_MAX_LENGTH} tecken
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="divlab-btn-primary px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Skickar..." : "Skicka"}
        </button>
      </div>

      {state.status === "error" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
