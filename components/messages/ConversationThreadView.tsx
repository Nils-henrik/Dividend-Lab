import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { formatMessageTimestamp } from "@/lib/messages/format";
import type { ConversationThread } from "@/lib/messages/types";
import MessageComposer from "./MessageComposer";
import MessageListAutoScroll from "./MessageListAutoScroll";

type Props = {
  conversation: ConversationThread;
  currentUserId: string;
};

export default function ConversationThreadView({
  conversation,
  currentUserId,
}: Props) {
  const otherParticipant = conversation.otherParticipant;
  const subject = conversation.subject?.trim() || "Ingen ämnesrad";
  const receivedSenderLabel = otherParticipant?.username
    ? `@${otherParticipant.username.replace(/^@/, "")}`
    : (otherParticipant?.name ?? "Dividend Lab-medlem");
  const lastMessageId =
    conversation.messages[conversation.messages.length - 1]?.id ?? "empty";

  return (
    <div className="space-y-4">
      <section className="divlab-surface-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ProfileAvatar
            avatarUrl={otherParticipant?.avatarUrl ?? null}
            initials={otherParticipant?.initials ?? "DL"}
            sizeClassName="h-12 w-12"
            textClassName="text-sm"
          />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-[-0.03em] text-divlab-text">
              {subject}
            </h2>
            <p className="mt-1 truncate text-sm text-divlab-text-muted">
              {otherParticipant?.name ?? "Dividend Lab-medlem"}
              {otherParticipant?.username ? ` · @${otherParticipant.username}` : ""}
            </p>
          </div>
        </div>

        <Link href="/messages" className="divlab-btn-secondary w-fit shrink-0 px-4 py-2 text-xs">
          Till inkorgen
        </Link>
      </section>

      <section className="divlab-card flex min-h-[420px] max-h-[min(72vh,780px)] flex-col overflow-hidden">
        <div className="border-b divlab-border-neutral px-4 py-3 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Konversation
          </p>
        </div>

        {conversation.messages.length === 0 ? (
          <div className="flex flex-1 items-center px-5 py-8">
            <p className="text-sm leading-6 text-divlab-text-secondary">
              Inga meddelanden än. Skriv ett lugnt och tydligt första meddelande.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            {conversation.messages.map((message) => {
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
                    className={`max-w-[92%] rounded-2xl border px-4 py-3 md:max-w-[68%] ${
                      isOwnMessage
                        ? "rounded-br-md border-divlab-blue/30 bg-divlab-blue/10 text-divlab-text"
                        : "rounded-bl-md border-divlab-border-neutral bg-divlab-surface text-divlab-text-secondary"
                    }`}
                  >
                    <div
                      className={`mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${
                        isOwnMessage ? "sm:flex-row-reverse" : ""
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

                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.body}
                    </p>
                  </article>
                </div>
              );
            })}
            <MessageListAutoScroll scrollKey={lastMessageId} />
          </div>
        )}

        <div className="border-t divlab-border-neutral bg-divlab-surface px-4 py-4 sm:px-5">
          <MessageComposer conversationId={conversation.id} />
        </div>
      </section>
    </div>
  );
}
