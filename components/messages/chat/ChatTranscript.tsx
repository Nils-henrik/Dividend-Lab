"use client";

import { formatMessageTimestamp } from "@/lib/messages/format";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationMessage, MessageParticipant } from "@/lib/messages/types";
import MessageListAutoScroll from "../MessageListAutoScroll";

type Props = {
  messages: ConversationMessage[];
  currentUserId: string;
  otherParticipant: MessageParticipant | null;
  compact?: boolean;
};

export default function ChatTranscript({
  messages,
  currentUserId,
  otherParticipant,
  compact = false,
}: Props) {
  const receivedSenderLabel = otherParticipant?.username
    ? `@${otherParticipant.username.replace(/^@/, "")}`
    : (otherParticipant?.name ?? DIVLAB_MEMBER_LABEL);
  const lastMessageId = messages[messages.length - 1]?.id ?? "empty";

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center px-4 py-6">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          Inga meddelanden än. Skriv ett lugnt och tydligt första meddelande.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-0 flex-1 space-y-2 overflow-y-auto ${
        compact ? "px-3 py-3" : "px-4 py-4 sm:px-5"
      }`}
    >
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const senderLabel = isOwnMessage ? "DU" : receivedSenderLabel;

        return (
          <div
            key={message.id}
            className={`flex w-full ${
              isOwnMessage ? "justify-end" : "justify-start"
            }`}
          >
            <article
              className={`max-w-[88%] rounded-2xl border px-3 py-2.5 ${
                isOwnMessage
                  ? "rounded-br-md border-divlab-blue/30 bg-divlab-blue/10 text-divlab-text"
                  : "rounded-bl-md border-divlab-border-neutral bg-divlab-surface text-divlab-text-secondary"
              }`}
            >
              <div
                className={`mb-1 flex items-center justify-between gap-3 ${
                  isOwnMessage ? "flex-row-reverse" : ""
                }`}
              >
                <p
                  className={`truncate text-[10px] font-medium uppercase tracking-[0.16em] ${
                    isOwnMessage ? "text-divlab-blue-muted" : "text-divlab-text-muted"
                  }`}
                >
                  {senderLabel}
                </p>
                <p className="shrink-0 text-[10px] tabular-nums text-divlab-text-muted">
                  {formatMessageTimestamp(message.createdAt)}
                </p>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text">
                {message.body}
              </p>
            </article>
          </div>
        );
      })}
      <MessageListAutoScroll scrollKey={lastMessageId} />
    </div>
  );
}