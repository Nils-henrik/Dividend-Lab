"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  acceptMessageRequestAction,
  declineMessageRequestAction,
  ignoreMessageRequestAction,
} from "@/app/messages/actions";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { formatMessageTimestamp } from "@/lib/messages/format";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationThread, MessageActionState } from "@/lib/messages/types";
import MessageComposer from "./MessageComposer";
import MessageListAutoScroll from "./MessageListAutoScroll";

const idleState: MessageActionState = {
  status: "idle",
  message: "",
};

type Props = {
  conversation: ConversationThread;
  currentUserId: string;
};

export default function ConversationThreadView({
  conversation,
  currentUserId,
}: Props) {
  const router = useRouter();
  const otherParticipant = conversation.otherParticipant;
  const subject =
    conversation.subject?.trim() ||
    otherParticipant?.name ||
    "Konversation";
  const receivedSenderLabel = otherParticipant?.username
    ? `@${otherParticipant.username.replace(/^@/, "")}`
    : (otherParticipant?.name ?? DIVLAB_MEMBER_LABEL);
  const lastMessageId =
    conversation.messages[conversation.messages.length - 1]?.id ?? "empty";
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptMessageRequestAction,
    idleState,
  );
  const [ignoreState, ignoreAction, ignorePending] = useActionState(
    ignoreMessageRequestAction,
    idleState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineMessageRequestAction,
    idleState,
  );

  useEffect(() => {
    if (acceptState.status === "success") {
      router.refresh();
    }
  }, [acceptState.status, router]);

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
              {otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}
              {otherParticipant?.username ? ` · @${otherParticipant.username}` : ""}
            </p>
          </div>
        </div>

        <Link href="/messages" className="divlab-btn-secondary w-fit shrink-0 px-4 py-2 text-xs">
          Till inkorgen
        </Link>
      </section>

      {conversation.isMessageRequestRecipient && (
        <section className="divlab-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-sm text-divlab-text-secondary">
            Meddelandeförfrågan från {otherParticipant?.name ?? DIVLAB_MEMBER_LABEL}.
            Acceptera för att fortsätta chatta.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={acceptAction}>
              <input type="hidden" name="conversationId" value={conversation.id} />
              <button
                type="submit"
                disabled={acceptPending}
                className="divlab-btn-primary px-4 py-2 text-xs disabled:opacity-60"
              >
                {acceptPending ? "Accepterar..." : "Acceptera"}
              </button>
            </form>
            <form action={ignoreAction}>
              <input type="hidden" name="conversationId" value={conversation.id} />
              <button
                type="submit"
                disabled={ignorePending}
                className="divlab-btn-secondary px-4 py-2 text-xs disabled:opacity-60"
              >
                {ignorePending ? "Ignorerar..." : "Ignorera"}
              </button>
            </form>
            <form action={declineAction}>
              <input type="hidden" name="conversationId" value={conversation.id} />
              <button
                type="submit"
                disabled={declinePending}
                className="divlab-btn-ghost px-4 py-2 text-xs disabled:opacity-60"
              >
                {declinePending ? "Nekar..." : "Neka"}
              </button>
            </form>
          </div>
          {(acceptState.status === "error" ||
            ignoreState.status === "error" ||
            declineState.status === "error") && (
            <p role="status" className="w-full text-xs text-red-300">
              {acceptState.message || ignoreState.message || declineState.message}
            </p>
          )}
        </section>
      )}

      <section className="divlab-card flex min-h-[420px] max-h-[min(72vh,780px)] flex-col overflow-hidden">
        <div className="border-b divlab-border-neutral px-4 py-3 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            {conversation.isMessageRequestRecipient || conversation.isPendingRequestSender
              ? "Meddelandeförfrågan"
              : "Konversation"}
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
          {conversation.canSend ? (
            <MessageComposer conversationId={conversation.id} />
          ) : conversation.isPendingRequestSender ? (
            <p
              role="status"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-divlab-text-secondary"
            >
              Din meddelandeförfrågan har skickats.
            </p>
          ) : conversation.isMessageRequestRecipient ? (
            <p className="text-sm leading-6 text-divlab-text-muted">
              Acceptera förfrågan för att kunna svara.
            </p>
          ) : (
            <p className="text-sm leading-6 text-divlab-text-muted">
              Du kan inte skicka meddelanden i den här konversationen just nu.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
