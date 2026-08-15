"use client";

import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationThread } from "@/lib/messages/types";

type Props = {
  conversation: ConversationThread;
  pendingAction?: "accept" | "ignore" | "decline" | null;
  errorMessage?: string | null;
  onAccept: (conversationId: string) => void;
  onIgnore: (conversationId: string) => void;
  onDecline: (conversationId: string) => void;
};

export default function ChatRequestBar({
  conversation,
  pendingAction = null,
  errorMessage,
  onAccept,
  onIgnore,
  onDecline,
}: Props) {
  if (conversation.isPendingRequestSender) {
    return (
      <p
        role="status"
        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-divlab-text-secondary"
      >
        Din meddelandeförfrågan har skickats.
      </p>
    );
  }

  if (!conversation.isMessageRequestRecipient) {
    return null;
  }

  const name = conversation.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL;

  return (
    <div className="space-y-2 rounded-xl border divlab-border-neutral bg-white/[0.03] px-3 py-3">
      <p className="text-sm text-divlab-text-secondary">
        Meddelandeförfrågan från {name}. Acceptera för att fortsätta chatta.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => onAccept(conversation.id)}
          className="divlab-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {pendingAction === "accept" ? "Accepterar..." : "Acceptera"}
        </button>
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => onIgnore(conversation.id)}
          className="divlab-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {pendingAction === "ignore" ? "Ignorerar..." : "Ignorera"}
        </button>
        <button
          type="button"
          disabled={pendingAction !== null}
          onClick={() => onDecline(conversation.id)}
          className="divlab-btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {pendingAction === "decline" ? "Nekar..." : "Neka"}
        </button>
      </div>
      {errorMessage ? (
        <p role="status" className="text-xs text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}