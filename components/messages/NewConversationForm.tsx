"use client";

import { useActionState, useState } from "react";
import { startConversationAction } from "@/app/messages/actions";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import {
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_SUBJECT_MAX_LENGTH,
  type MessageParticipant,
} from "@/lib/messages/types";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  targetParticipant?: MessageParticipant | null;
};

export default function NewConversationForm({ targetParticipant }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [state, formAction, isPending] = useActionState(
    startConversationAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {targetParticipant ? (
        <input type="hidden" name="targetUserId" value={targetParticipant.id} />
      ) : (
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Användarnamn
          </span>
          <input
            name="username"
            type="text"
            placeholder="@anvandare"
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/70"
          />
        </label>
      )}

      {targetParticipant && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ProfileAvatar
            avatarUrl={targetParticipant.avatarUrl}
            initials={targetParticipant.initials}
            sizeClassName="h-11 w-11"
            textClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {targetParticipant.name}
            </p>
            <p className="mt-1 truncate text-xs text-gray-500">
              {targetParticipant.username
                ? `@${targetParticipant.username}`
                : "Dividend Lab-medlem"}
            </p>
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Ämne
        </span>
        <input
          name="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={MESSAGE_SUBJECT_MAX_LENGTH}
          placeholder="Vad handlar meddelandet om?"
          className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/70"
        />
        <span className="mt-2 block text-xs text-gray-500">
          {subject.length}/{MESSAGE_SUBJECT_MAX_LENGTH} tecken
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Meddelande
        </span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          rows={6}
          placeholder="Skriv ett meddelande..."
          className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/70"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {body.length}/{MESSAGE_BODY_MAX_LENGTH} tecken
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.14)] transition hover:bg-[#F9D976] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Startar..." : "Skicka"}
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
